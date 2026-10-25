from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timezone

from backend.app.database import get_db
from backend.app.models.product import Product, ProductListing, Retailer
from backend.app.models.price import PriceObservation

router = APIRouter(prefix="/compare", tags=["Multi-Store Comparison"])

@router.get("/{product_id}", response_model=dict)
def compare_product_across_stores(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    listings = db.query(ProductListing).filter(ProductListing.product_id == product_id).all()
    if not listings:
        return {
            "product_id": product.id,
            "product_title": product.title,
            "brand": product.brand,
            "model_number": product.model_number,
            "offers": [],
            "lowest_verified_offer": None,
            "price_spread": 0.0,
            "max_savings_potential": 0.0
        }

    offers = []
    for l in listings:
        latest_obs = db.query(PriceObservation).filter(
            PriceObservation.product_listing_id == l.id
        ).order_by(desc(PriceObservation.observed_at)).first()

        if latest_obs:
            now = datetime.now(timezone.utc)
            obs_time = latest_obs.observed_at.replace(tzinfo=timezone.utc) if latest_obs.observed_at.tzinfo is None else latest_obs.observed_at
            age_hours = round((now - obs_time).total_seconds() / 3600.0, 1)

            offers.append({
                "listing_id": l.id,
                "retailer_id": l.retailer_id,
                "retailer_name": l.retailer.name,
                "retailer_code": l.retailer.code,
                "retailer_logo": l.retailer.logo_url,
                "listing_url": l.listing_url,
                "price": latest_obs.price,
                "original_price": latest_obs.original_price,
                "currency": latest_obs.currency,
                "in_stock": latest_obs.in_stock,
                "shipping_cost": latest_obs.shipping_cost,
                "taxes_and_fees": latest_obs.taxes_and_fees,
                "estimated_total": latest_obs.estimated_total,
                "provenance": latest_obs.provenance,
                "observed_at": latest_obs.observed_at,
                "data_age_hours": age_hours,
                "is_verified": l.is_verified,
                "uncertainty_note": "Free delivery included" if latest_obs.shipping_cost == 0 else f"Standard shipping ₹{latest_obs.shipping_cost:.2f}"
            })

    # Sort offers by estimated total cost
    offers.sort(key=lambda o: (not o["in_stock"], o["estimated_total"]))

    lowest_offer = offers[0] if offers else None
    highest_offer = max(offers, key=lambda o: o["estimated_total"]) if offers else None
    
    price_spread = (highest_offer["estimated_total"] - lowest_offer["estimated_total"]) if (lowest_offer and highest_offer) else 0.0
    max_savings_potential = price_spread

    return {
        "product_id": product.id,
        "product_title": product.title,
        "brand": product.brand,
        "model_number": product.model_number,
        "category": product.category,
        "image_url": product.image_url,
        "offers_count": len(offers),
        "offers": offers,
        "lowest_verified_offer": lowest_offer,
        "price_spread": round(price_spread, 2),
        "max_savings_potential": round(max_savings_potential, 2)
    }
