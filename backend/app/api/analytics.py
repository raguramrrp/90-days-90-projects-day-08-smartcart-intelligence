from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.product import Product, ProductListing
from backend.app.models.price import PriceObservation
from backend.app.models.alert import Watchlist, WatchlistItem
from backend.app.models.planner import PurchaseRecord
from backend.app.schemas.planner import SavingsSummaryResponse
from backend.app.schemas.system import DealScoreResponse, DealScoreFactor
from backend.app.services.deal_scorer import calculate_deal_score
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Intelligence"])

@router.get("/savings-summary", response_model=SavingsSummaryResponse)
def get_savings_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Realized savings from user's logged purchases
    purchases = db.query(PurchaseRecord).filter(PurchaseRecord.user_id == current_user.id).all()
    realized_savings = 0.0
    for p in purchases:
        if p.original_baseline_price and p.original_baseline_price > p.purchase_price:
            realized_savings += (p.original_baseline_price - p.purchase_price)

    # 2. Potential savings from user's watchlist products (diff between MRP and current lowest price)
    watchlist = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).first()
    potential_savings = 0.0
    active_tracked_deals = 0
    discount_percentages = []

    if watchlist:
        items = db.query(WatchlistItem).filter(WatchlistItem.watchlist_id == watchlist.id).all()
        for it in items:
            listings = db.query(ProductListing).filter(ProductListing.product_id == it.product_id).all()
            l_prices = []
            mrp = None
            for l in listings:
                latest_obs = db.query(PriceObservation).filter(
                    PriceObservation.product_listing_id == l.id
                ).order_by(desc(PriceObservation.observed_at)).first()
                if latest_obs:
                    l_prices.append(latest_obs.price)
                    if not mrp and latest_obs.original_price:
                        mrp = latest_obs.original_price

            if l_prices:
                lowest = min(l_prices)
                if mrp and mrp > lowest:
                    diff = mrp - lowest
                    potential_savings += diff
                    discount_pct = (diff / mrp) * 100
                    discount_percentages.append(discount_pct)
                    if discount_pct >= 10:
                        active_tracked_deals += 1

    avg_discount = (sum(discount_percentages) / len(discount_percentages)) if discount_percentages else 0.0

    return SavingsSummaryResponse(
        total_potential_savings=round(potential_savings, 2),
        total_realized_savings=round(realized_savings, 2),
        confirmed_purchases_count=len(purchases),
        active_tracked_deals_count=active_tracked_deals,
        average_discount_percentage=round(avg_discount, 1),
        currency="INR"
    )

@router.get("/deal-intelligence/{product_id}", response_model=DealScoreResponse)
def get_deal_intelligence(
    product_id: int,
    target_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    listings = db.query(ProductListing).filter(ProductListing.product_id == product_id).all()
    if not listings:
        raise HTTPException(status_code=400, detail="No retailer listings configured for this product")

    listing_ids = [l.id for l in listings]
    
    # Latest prices per listing
    latest_prices = []
    original_mrp = None
    in_stock = False
    provenance = "LIVE"

    for lid in listing_ids:
        latest_obs = db.query(PriceObservation).filter(
            PriceObservation.product_listing_id == lid
        ).order_by(desc(PriceObservation.observed_at)).first()
        if latest_obs:
            latest_prices.append(latest_obs.price)
            if not original_mrp and latest_obs.original_price:
                original_mrp = latest_obs.original_price
            if latest_obs.in_stock:
                in_stock = True
            provenance = latest_obs.provenance

    # All historical observations
    all_obs = db.query(PriceObservation).filter(
        PriceObservation.product_listing_id.in_(listing_ids)
    ).all()
    all_prices = [o.price for o in all_obs] if all_obs else []

    current_price = min(latest_prices) if latest_prices else 0.0
    hist_min = min(all_prices) if all_prices else current_price
    hist_avg = (sum(all_prices) / len(all_prices)) if all_prices else current_price

    competitors = [p for p in latest_prices if p != current_price]

    score_result = calculate_deal_score(
        current_price=current_price,
        original_mrp=original_mrp,
        historical_min=hist_min,
        historical_avg=hist_avg,
        competitor_prices=competitors,
        observations_count=len(all_prices),
        data_freshness_hours=1.2,
        in_stock=in_stock,
        target_price=target_price
    )

    factors_out = [
        DealScoreFactor(name=f["name"], score_impact=f["score_impact"], description=f["description"])
        for f in score_result["factors"]
    ]

    return DealScoreResponse(
        product_id=product.id,
        product_title=product.title,
        deal_score=score_result["deal_score"],
        deal_label=score_result["deal_label"],
        guidance=score_result["guidance"],
        confidence=score_result["confidence"],
        explanation=score_result["explanation"],
        factors=factors_out,
        data_freshness_hours=score_result["data_freshness_hours"],
        provenance=provenance
    )
