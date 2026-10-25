from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.app.models.product import Product, ProductListing, Retailer
from backend.app.models.price import PriceObservation
from backend.app.models.alert import PriceAlertRule, Notification, NotificationDelivery, WatchlistItem
from backend.app.models.system import RefreshJob
from backend.app.providers.registry import registry
from backend.app.services.email_adapter import send_email_alert, render_price_alert_email_html

def refresh_listing_price(db: Session, listing: ProductListing, triggered_by: str = "SYSTEM") -> Optional[PriceObservation]:
    """Fetch latest price from retailer adapter and record observation if valid."""
    adapter = registry.get_adapter(listing.retailer.code)
    if not adapter:
        return None

    # Get latest known price as baseline if available
    latest_obs = db.query(PriceObservation).filter(
        PriceObservation.product_listing_id == listing.id
    ).order_by(desc(PriceObservation.observed_at)).first()
    
    baseline_price = latest_obs.price if latest_obs else 1999.0

    result = adapter.fetch_price(
        sku=listing.external_sku or str(listing.id),
        listing_url=listing.listing_url,
        baseline_price=baseline_price
    )

    new_obs = PriceObservation(
        product_listing_id=listing.id,
        price=result.price,
        original_price=latest_obs.original_price if latest_obs else result.price * 1.15,
        currency=result.currency,
        in_stock=result.in_stock,
        shipping_cost=result.shipping_cost,
        taxes_and_fees=result.taxes_and_fees,
        estimated_total=result.estimated_total,
        provenance=result.provenance,
        observed_at=result.observed_at,
        retrieved_at=result.retrieved_at,
        raw_metadata=result.raw_metadata
    )
    db.add(new_obs)
    db.commit()
    db.refresh(new_obs)

    # Evaluate alerts
    evaluate_alerts_for_product(db, listing.product_id, new_obs, latest_obs)

    return new_obs

def evaluate_alerts_for_product(
    db: Session,
    product_id: int,
    new_obs: PriceObservation,
    previous_obs: Optional[PriceObservation]
):
    """Check all active alert rules for this product and trigger notifications."""
    rules = db.query(PriceAlertRule).filter(
        PriceAlertRule.product_id == product_id,
        PriceAlertRule.is_active == True
    ).all()

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return

    current_price = new_obs.price
    prev_price = previous_obs.price if previous_obs else current_price

    for rule in rules:
        triggered = False
        title = ""
        message = ""

        if rule.rule_type == "TARGET_PRICE" and rule.threshold_value:
            if current_price <= rule.threshold_value:
                triggered = True
                title = f"Target Price Reached for {product.title}"
                message = f"The price dropped to ₹{current_price:,.2f}, meeting your target of ₹{rule.threshold_value:,.2f}!"

        elif rule.rule_type == "PERCENT_DROP" and rule.threshold_value and prev_price > 0:
            drop_pct = (prev_price - current_price) / prev_price * 100
            if drop_pct >= rule.threshold_value:
                triggered = True
                title = f"{drop_pct:.1f}% Price Drop on {product.title}"
                message = f"Price dropped from ₹{prev_price:,.2f} to ₹{current_price:,.2f} (a {drop_pct:.1f}% reduction)."

        elif rule.rule_type == "PRICE_INCREASE" and rule.threshold_value and prev_price > 0:
            inc_pct = (current_price - prev_price) / prev_price * 100
            if inc_pct >= rule.threshold_value:
                triggered = True
                title = f"Price Increase Alert on {product.title}"
                message = f"Price increased from ₹{prev_price:,.2f} to ₹{current_price:,.2f} ({inc_pct:.1f}% increase)."

        elif rule.rule_type == "BACK_IN_STOCK":
            if new_obs.in_stock and (previous_obs and not previous_obs.in_stock):
                triggered = True
                title = f"{product.title} is Back in Stock!"
                message = f"The item is back in stock at ₹{current_price:,.2f}."

        if triggered:
            # Prevent duplicate notifications if triggered within the last 6 hours
            if rule.last_triggered_at and (datetime.now(timezone.utc) - rule.last_triggered_at.replace(tzinfo=timezone.utc)).total_seconds() < 21600:
                continue

            rule.last_triggered_at = datetime.now(timezone.utc)
            
            # Create in-app notification
            notif = Notification(
                user_id=rule.user_id,
                product_id=product_id,
                rule_id=rule.id,
                title=title,
                message=message,
                previous_price=prev_price,
                new_price=current_price,
                channel="BOTH",
                status="UNREAD"
            )
            db.add(notif)
            db.flush()

            # Create mock/real email delivery
            user = rule.user
            if user and user.email_notifications_enabled:
                listing = db.query(ProductListing).filter(ProductListing.id == new_obs.product_listing_id).first()
                retailer_name = listing.retailer.name if listing and listing.retailer else "Retailer"
                listing_url = listing.listing_url if listing else "#"

                email_html = render_price_alert_email_html(
                    product_title=product.title,
                    previous_price=prev_price,
                    new_price=current_price,
                    currency="₹",
                    target_price=rule.threshold_value,
                    retailer_name=retailer_name,
                    listing_url=listing_url
                )
                
                delivery_res = send_email_alert(
                    recipient=user.email,
                    subject=f"Price Alert: {product.title}",
                    html_content=email_html
                )

                delivery = NotificationDelivery(
                    notification_id=notif.id,
                    channel="EMAIL",
                    delivery_mode=delivery_res.mode,
                    recipient=user.email,
                    status=delivery_res.status,
                    preview_body=delivery_res.preview_body,
                    error_message=delivery_res.error_message
                )
                db.add(delivery)

    db.commit()

def run_price_refresh_job(db: Session, triggered_by: str = "SCHEDULER") -> RefreshJob:
    """Execute batch refresh for all active product listings."""
    job = RefreshJob(
        job_type="PRICE_REFRESH_JOB",
        triggered_by=triggered_by,
        status="RUNNING",
        started_at=datetime.now(timezone.utc)
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        listings = db.query(ProductListing).join(Product).filter(Product.is_active == True).all()
        processed = 0
        updated = 0

        for listing in listings:
            obs = refresh_listing_price(db, listing, triggered_by=triggered_by)
            processed += 1
            if obs:
                updated += 1

        job.status = "COMPLETED"
        job.items_processed = processed
        job.items_updated = updated
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(job)
        return job
    except Exception as e:
        job.status = "FAILED"
        job.error_log = str(e)
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(job)
        return job

def get_product_price_stats(db: Session, product_id: int) -> Dict[str, Any]:
    """Calculate min, max, average, and 30-day percentage changes."""
    obs_query = db.query(PriceObservation).join(ProductListing).filter(
        ProductListing.product_id == product_id
    ).order_by(PriceObservation.observed_at.asc()).all()

    if not obs_query:
        return {
            "current_price": 0.0,
            "all_time_low": 0.0,
            "all_time_high": 0.0,
            "historical_avg": 0.0,
            "median_price": 0.0,
            "absolute_change_30d": 0.0,
            "percent_change_30d": 0.0,
            "data_points_count": 0,
            "currency": "INR"
        }

    prices = [o.price for o in obs_query]
    current_price = obs_query[-1].price
    all_time_low = min(prices)
    all_time_high = max(prices)
    historical_avg = round(sum(prices) / len(prices), 2)
    sorted_prices = sorted(prices)
    median_price = sorted_prices[len(sorted_prices) // 2]

    # Calculate 30-day change
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    baseline_30d_obs = [o for o in obs_query if o.observed_at.replace(tzinfo=timezone.utc) <= thirty_days_ago]
    baseline_30d = baseline_30d_obs[-1].price if baseline_30d_obs else obs_query[0].price

    absolute_change = round(current_price - baseline_30d, 2)
    percent_change = round((absolute_change / baseline_30d * 100), 2) if baseline_30d > 0 else 0.0

    return {
        "current_price": current_price,
        "all_time_low": all_time_low,
        "all_time_high": all_time_high,
        "historical_avg": historical_avg,
        "median_price": median_price,
        "absolute_change_30d": absolute_change,
        "percent_change_30d": percent_change,
        "data_points_count": len(prices),
        "currency": obs_query[-1].currency
    }
