import pytest
from datetime import datetime, timezone
from backend.app.models.product import Product, Retailer, ProductListing
from backend.app.models.price import PriceObservation
from backend.app.models.alert import PriceAlertRule, Notification, NotificationDelivery
from backend.app.services.tracker_engine import evaluate_alerts_for_product

@pytest.fixture
def alert_product(db_session):
    retailer = Retailer(
        code="croma",
        name="Croma",
        website_url="https://croma.com",
        is_active=True
    )
    db_session.add(retailer)
    db_session.flush()

    product = Product(
        title="4K Smart LED TV",
        brand="TechView",
        category="Electronics",
        is_active=True
    )
    db_session.add(product)
    db_session.flush()

    listing = ProductListing(
        product_id=product.id,
        retailer_id=retailer.id,
        listing_url="https://croma.com/p/tv4k",
        is_verified=True
    )
    db_session.add(listing)
    db_session.commit()
    return product, listing

def test_add_and_remove_watchlist_item(client, auth_headers, alert_product):
    product, listing = alert_product
    # Add to watchlist
    response = client.post(
        "/api/v1/watchlist",
        headers=auth_headers,
        json={
            "product_id": product.id,
            "target_price": 25000.0,
            "priority": "HIGH",
            "note": "Black Friday target"
        }
    )
    assert response.status_code == 201
    item = response.json()
    assert item["target_price"] == 25000.0
    item_id = item["id"]

    # Verify in list
    list_resp = client.get("/api/v1/watchlist", headers=auth_headers)
    assert list_resp.status_code == 200
    assert any(i["id"] == item_id for i in list_resp.json()["items"])

    # Remove from watchlist
    del_resp = client.delete(f"/api/v1/watchlist/{item_id}", headers=auth_headers)
    assert del_resp.status_code == 204

def test_alert_rule_evaluation_and_mock_email(client, db_session, test_user, alert_product):
    product, listing = alert_product

    # Create target price alert rule for 30000.0
    rule = PriceAlertRule(
        user_id=test_user.id,
        product_id=product.id,
        rule_type="TARGET_PRICE",
        threshold_value=30000.0,
        is_active=True
    )
    db_session.add(rule)
    db_session.commit()

    # Old price 35000
    old_obs = PriceObservation(
        product_listing_id=listing.id,
        price=35000.0,
        currency="INR",
        in_stock=True,
        estimated_total=35000.0,
        provenance="HISTORICAL",
        observed_at=datetime.now(timezone.utc)
    )
    # New price drops to 28990 (below 30000 target!)
    new_obs = PriceObservation(
        product_listing_id=listing.id,
        price=28990.0,
        currency="INR",
        in_stock=True,
        estimated_total=28990.0,
        provenance="LIVE",
        observed_at=datetime.now(timezone.utc)
    )
    db_session.add_all([old_obs, new_obs])
    db_session.commit()

    # Trigger alert evaluation
    evaluate_alerts_for_product(db_session, product.id, new_obs, old_obs)

    # Check notification in database
    notif = db_session.query(Notification).filter(Notification.user_id == test_user.id).first()
    assert notif is not None
    assert "Target Price Reached" in notif.title
    assert notif.new_price == 28990.0
    assert notif.status == "UNREAD"

    # Check mock delivery
    delivery = db_session.query(NotificationDelivery).filter(NotificationDelivery.notification_id == notif.id).first()
    assert delivery is not None
    assert delivery.channel == "EMAIL"
    assert delivery.delivery_mode == "MOCK_DEV"
    assert delivery.status == "PREVIEWED"
    assert "SmartCart Price Alert" in delivery.preview_body
    assert "28,990.00" in delivery.preview_body
