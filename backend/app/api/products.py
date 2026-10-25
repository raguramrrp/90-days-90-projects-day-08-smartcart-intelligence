from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
from typing import List, Optional
from datetime import datetime, timezone

from backend.app.database import get_db
from backend.app.models.product import Product, ProductListing, Retailer
from backend.app.models.price import PriceObservation
from backend.app.schemas.product import (
    ProductResponse, RetailerResponse, ProductListingResponse,
    PriceObservationResponse, PriceHistoryResponse, PriceHistoryPoint
)
from backend.app.services.tracker_engine import get_product_price_stats
from backend.app.services.deal_scorer import calculate_deal_score
from backend.app.services.forecast_engine import forecast_price_trend

router = APIRouter(prefix="/products", tags=["Products & Catalog"])

def enrich_product_response(db: Session, product: Product) -> ProductResponse:
    """Compute lowest current price, all-time low, deal score, and retailer count."""
    listings = db.query(ProductListing).filter(ProductListing.product_id == product.id).all()
    listing_ids = [l.id for l in listings]
    
    current_lowest = None
    all_time_lowest = None
    original_mrp = None
    provenance = "LIVE"
    in_stock_any = False
    
    all_prices = []
    latest_prices = []

    if listing_ids:
        # Get latest observation for each listing
        for lid in listing_ids:
            latest_obs = db.query(PriceObservation).filter(
                PriceObservation.product_listing_id == lid
            ).order_by(desc(PriceObservation.observed_at)).first()
            if latest_obs:
                latest_prices.append(latest_obs.price)
                if not original_mrp and latest_obs.original_price:
                    original_mrp = latest_obs.original_price
                if latest_obs.in_stock:
                    in_stock_any = True
                provenance = latest_obs.provenance
        
        # All historical observations
        all_obs = db.query(PriceObservation).filter(
            PriceObservation.product_listing_id.in_(listing_ids)
        ).all()
        if all_obs:
            all_prices = [o.price for o in all_obs]
            all_time_lowest = min(all_prices)

    if latest_prices:
        current_lowest = min(latest_prices)

    # Compute fast deal score for card
    hist_avg = (sum(all_prices) / len(all_prices)) if all_prices else current_lowest
    deal_info = calculate_deal_score(
        current_price=current_lowest or 0.0,
        original_mrp=original_mrp,
        historical_min=all_time_lowest,
        historical_avg=hist_avg,
        competitor_prices=[p for p in latest_prices if p != current_lowest],
        observations_count=len(all_prices),
        data_freshness_hours=1.5,
        in_stock=in_stock_any
    )

    return ProductResponse(
        id=product.id,
        title=product.title,
        brand=product.brand,
        model_number=product.model_number,
        gtin_upc=product.gtin_upc,
        category=product.category,
        subcategory=product.subcategory,
        image_url=product.image_url,
        description=product.description,
        tags=product.tags,
        is_active=product.is_active,
        created_at=product.created_at,
        current_lowest_price=current_lowest,
        all_time_lowest_price=all_time_lowest,
        original_mrp=original_mrp,
        retailer_count=len(listings),
        in_stock_any=in_stock_any,
        deal_score=deal_info["deal_score"],
        deal_label=deal_info["deal_label"],
        provenance=provenance
    )

@router.get("", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = Query(None, description="Search by title, brand, or model"),
    category: Optional[str] = Query(None, description="Filter by category"),
    sort_by: Optional[str] = Query("deal_score_desc", description="Sort criteria: price_asc, price_desc, deal_score_desc, newest"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Product.title.ilike(search_filter)) |
            (Product.brand.ilike(search_filter)) |
            (Product.model_number.ilike(search_filter))
        )

    if category and category.lower() != "all":
        query = query.filter(Product.category == category)

    products = query.all()
    enriched = [enrich_product_response(db, p) for p in products]

    # In-memory sorting based on computed metrics
    if sort_by == "price_asc":
        enriched.sort(key=lambda x: (x.current_lowest_price is None, x.current_lowest_price or 0))
    elif sort_by == "price_desc":
        enriched.sort(key=lambda x: (x.current_lowest_price or 0), reverse=True)
    elif sort_by == "deal_score_desc":
        enriched.sort(key=lambda x: (x.deal_score or 0), reverse=True)
    elif sort_by == "newest":
        enriched.sort(key=lambda x: x.created_at, reverse=True)

    return enriched[offset : offset + limit]

@router.get("/categories", response_model=List[dict])
def get_categories(db: Session = Depends(get_db)):
    results = db.query(
        Product.category,
        func.count(Product.id).label("count")
    ).filter(Product.is_active == True).group_by(Product.category).all()

    return [{"category": r[0], "count": r[1]} for r in results]

@router.get("/retailers", response_model=List[RetailerResponse])
def get_retailers(db: Session = Depends(get_db)):
    retailers = db.query(Retailer).filter(Retailer.is_active == True).all()
    return retailers

@router.get("/{product_id}", response_model=dict)
def get_product_detail(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    base_product = enrich_product_response(db, product)
    
    # Fetch all listings with latest prices
    listings_data = []
    listings = db.query(ProductListing).filter(ProductListing.product_id == product.id).all()
    
    for l in listings:
        latest_obs = db.query(PriceObservation).filter(
            PriceObservation.product_listing_id == l.id
        ).order_by(desc(PriceObservation.observed_at)).first()

        listings_data.append({
            "id": l.id,
            "product_id": l.product_id,
            "retailer_id": l.retailer_id,
            "retailer": {
                "id": l.retailer.id,
                "code": l.retailer.code,
                "name": l.retailer.name,
                "website_url": l.retailer.website_url,
                "logo_url": l.retailer.logo_url,
                "freshness_ttl_minutes": l.retailer.freshness_ttl_minutes
            },
            "external_sku": l.external_sku,
            "listing_url": l.listing_url,
            "is_verified": l.is_verified,
            "latest_price": {
                "id": latest_obs.id,
                "price": latest_obs.price,
                "original_price": latest_obs.original_price,
                "currency": latest_obs.currency,
                "in_stock": latest_obs.in_stock,
                "shipping_cost": latest_obs.shipping_cost,
                "taxes_and_fees": latest_obs.taxes_and_fees,
                "estimated_total": latest_obs.estimated_total,
                "provenance": latest_obs.provenance,
                "observed_at": latest_obs.observed_at,
                "retrieved_at": latest_obs.retrieved_at
            } if latest_obs else None
        })

    # Historical stats
    stats = get_product_price_stats(db, product.id)

    return {
        "product": base_product,
        "listings": listings_data,
        "stats": stats
    }

@router.get("/{product_id}/history", response_model=PriceHistoryResponse)
def get_product_history(
    product_id: int,
    timeframe: Optional[str] = Query("90d", description="7d, 30d, 90d, all"),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    stats = get_product_price_stats(db, product_id)

    # Fetch chronological observations across all retailers
    obs_query = db.query(
        PriceObservation, Retailer.name, Retailer.code
    ).join(
        ProductListing, PriceObservation.product_listing_id == ProductListing.id
    ).join(
        Retailer, ProductListing.retailer_id == Retailer.id
    ).filter(
        ProductListing.product_id == product_id
    ).order_by(PriceObservation.observed_at.asc()).all()

    history_points = []
    obs_for_forecast = []

    for obs, ret_name, ret_code in obs_query:
        point = PriceHistoryPoint(
            date=obs.observed_at.strftime("%Y-%m-%d"),
            observed_at=obs.observed_at,
            price=obs.price,
            retailer=ret_name,
            retailer_code=ret_code,
            provenance=obs.provenance,
            in_stock=obs.in_stock
        )
        history_points.append(point)
        obs_for_forecast.append({
            "observed_at": obs.observed_at,
            "price": obs.price
        })

    # Optional forecast computation
    forecast_data = forecast_price_trend(obs_for_forecast, horizon_days=30)

    return PriceHistoryResponse(
        product_id=product.id,
        product_title=product.title,
        stats=stats,
        history=history_points,
        forecast=forecast_data.get("forecast_points", [])
    )
