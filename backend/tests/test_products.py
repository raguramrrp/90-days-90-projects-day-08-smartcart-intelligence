import pytest
from datetime import datetime, timedelta, timezone
from backend.app.models.product import Product, Retailer, ProductListing
from backend.app.models.price import PriceObservation

@pytest.fixture
def sample_product_with_history(db_session):
    retailer = Retailer(
        code="amazon_in",
        name="Amazon India",
        website_url="https://amazon.in",
        is_active=True
    )
    db_session.add(retailer)
    db_session.flush()

    product = Product(
        title="Test Noise Cancelling Headphones",
        brand="TestBrand",
        model_number="TB-NC100",
        category="Electronics",
        subcategory="Audio",
        is_active=True
    )
    db_session.add(product)
    db_session.flush()

    listing = ProductListing(
        product_id=product.id,
        retailer_id=retailer.id,
        listing_url="https://amazon.in/dp/TB-NC100",
        is_verified=True
    )
    db_session.add(listing)
    db_session.flush()

    now = datetime.now(timezone.utc)
    # Add observations: 30 days ago at 10000, 15 days ago at 9500, today at 8999
    obs1 = PriceObservation(
        product_listing_id=listing.id,
        price=10000.0,
        original_price=12000.0,
        currency="INR",
        in_stock=True,
        shipping_cost=0.0,
        taxes_and_fees=0.0,
        estimated_total=10000.0,
        provenance="HISTORICAL",
        observed_at=now - timedelta(days=30),
        retrieved_at=now - timedelta(days=30)
    )
    obs2 = PriceObservation(
        product_listing_id=listing.id,
        price=9500.0,
        original_price=12000.0,
        currency="INR",
        in_stock=True,
        shipping_cost=0.0,
        taxes_and_fees=0.0,
        estimated_total=9500.0,
        provenance="HISTORICAL",
        observed_at=now - timedelta(days=15),
        retrieved_at=now - timedelta(days=15)
    )
    obs3 = PriceObservation(
        product_listing_id=listing.id,
        price=8999.0,
        original_price=12000.0,
        currency="INR",
        in_stock=True,
        shipping_cost=0.0,
        taxes_and_fees=0.0,
        estimated_total=8999.0,
        provenance="LIVE",
        observed_at=now,
        retrieved_at=now
    )
    db_session.add_all([obs1, obs2, obs3])
    db_session.commit()
    return product

def test_get_products_list(client, sample_product_with_history):
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    item = next(p for p in data if p["id"] == sample_product_with_history.id)
    assert item["title"] == "Test Noise Cancelling Headphones"
    assert item["current_lowest_price"] == 8999.0
    assert item["all_time_lowest_price"] == 8999.0

def test_filter_products_by_category(client, sample_product_with_history):
    response = client.get("/api/v1/products?category=Electronics")
    assert response.status_code == 200
    assert any(p["id"] == sample_product_with_history.id for p in response.json())

    empty_resp = client.get("/api/v1/products?category=Groceries")
    assert empty_resp.status_code == 200
    assert not any(p["id"] == sample_product_with_history.id for p in empty_resp.json())

def test_product_detail_and_stats(client, sample_product_with_history):
    response = client.get(f"/api/v1/products/{sample_product_with_history.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["product"]["title"] == "Test Noise Cancelling Headphones"
    assert len(data["listings"]) == 1
    stats = data["stats"]
    assert stats["current_price"] == 8999.0
    assert stats["all_time_low"] == 8999.0
    assert stats["all_time_high"] == 10000.0
    # 30-day drop from 10000 to 8999 is -1001.0 (-10.01%)
    assert stats["absolute_change_30d"] == -1001.0
    assert stats["percent_change_30d"] == -10.01
