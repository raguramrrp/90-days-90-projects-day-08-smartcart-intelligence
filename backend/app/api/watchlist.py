from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.product import Product, ProductListing
from backend.app.models.price import PriceObservation
from backend.app.models.alert import Watchlist, WatchlistItem, PriceAlertRule
from backend.app.schemas.alert import WatchlistItemCreate, WatchlistItemResponse, WatchlistResponse
from backend.app.api.deps import get_current_user
from backend.app.api.products import enrich_product_response

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

def get_or_create_user_watchlist(db: Session, user_id: int) -> Watchlist:
    watchlist = db.query(Watchlist).filter(Watchlist.user_id == user_id).first()
    if not watchlist:
        watchlist = Watchlist(user_id=user_id, name="My Tracked Products")
        db.add(watchlist)
        db.commit()
        db.refresh(watchlist)
    return watchlist

@router.get("", response_model=WatchlistResponse)
def get_user_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    watchlist = get_or_create_user_watchlist(db, current_user.id)
    items = db.query(WatchlistItem).filter(WatchlistItem.watchlist_id == watchlist.id).all()

    enriched_items = []
    for item in items:
        prod_resp = enrich_product_response(db, item.product)
        curr_price = prod_resp.current_lowest_price
        target = item.target_price

        price_diff = (curr_price - target) if curr_price and target else None
        target_reached = bool(curr_price and target and curr_price <= target)

        enriched_items.append(WatchlistItemResponse(
            id=item.id,
            watchlist_id=item.watchlist_id,
            product_id=item.product_id,
            product=prod_resp,
            target_price=item.target_price,
            note=item.note,
            needed_by=item.needed_by,
            priority=item.priority,
            created_at=item.created_at,
            current_price=curr_price,
            price_diff_target=price_diff,
            target_reached=target_reached
        ))

    return WatchlistResponse(
        id=watchlist.id,
        user_id=watchlist.user_id,
        name=watchlist.name,
        items=enriched_items,
        created_at=watchlist.created_at
    )

@router.post("", response_model=WatchlistItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    item_in: WatchlistItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    watchlist = get_or_create_user_watchlist(db, current_user.id)

    # Check if already in watchlist
    existing = db.query(WatchlistItem).filter(
        WatchlistItem.watchlist_id == watchlist.id,
        WatchlistItem.product_id == item_in.product_id
    ).first()

    if existing:
        # Update target price if provided
        if item_in.target_price is not None:
            existing.target_price = item_in.target_price
        if item_in.note is not None:
            existing.note = item_in.note
        if item_in.needed_by is not None:
            existing.needed_by = item_in.needed_by
        if item_in.priority is not None:
            existing.priority = item_in.priority
        db.commit()
        db.refresh(existing)
        item = existing
    else:
        item = WatchlistItem(
            watchlist_id=watchlist.id,
            product_id=item_in.product_id,
            target_price=item_in.target_price,
            note=item_in.note,
            needed_by=item_in.needed_by,
            priority=item_in.priority or "MEDIUM"
        )
        db.add(item)
        db.commit()
        db.refresh(item)

        # Automatically create or update a target price alert rule if target_price specified
        if item_in.target_price:
            rule = db.query(PriceAlertRule).filter(
                PriceAlertRule.user_id == current_user.id,
                PriceAlertRule.product_id == item_in.product_id,
                PriceAlertRule.rule_type == "TARGET_PRICE"
            ).first()
            if rule:
                rule.threshold_value = item_in.target_price
                rule.is_active = True
            else:
                rule = PriceAlertRule(
                    user_id=current_user.id,
                    product_id=item_in.product_id,
                    rule_type="TARGET_PRICE",
                    threshold_value=item_in.target_price,
                    is_active=True
                )
                db.add(rule)
            db.commit()

    prod_resp = enrich_product_response(db, item.product)
    curr_price = prod_resp.current_lowest_price
    price_diff = (curr_price - item.target_price) if curr_price and item.target_price else None
    target_reached = bool(curr_price and item.target_price and curr_price <= item.target_price)

    return WatchlistItemResponse(
        id=item.id,
        watchlist_id=item.watchlist_id,
        product_id=item.product_id,
        product=prod_resp,
        target_price=item.target_price,
        note=item.note,
        needed_by=item.needed_by,
        priority=item.priority,
        created_at=item.created_at,
        current_price=curr_price,
        price_diff_target=price_diff,
        target_reached=target_reached
    )

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    watchlist = get_or_create_user_watchlist(db, current_user.id)
    item = db.query(WatchlistItem).filter(
        WatchlistItem.id == item_id,
        WatchlistItem.watchlist_id == watchlist.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")

    db.delete(item)
    db.commit()
    return None
