from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.product import Product, ProductListing, Retailer
from backend.app.models.planner import ShoppingList, ShoppingListItem, Budget, RecurringPurchase, PurchaseRecord
from backend.app.schemas.planner import (
    ShoppingListCreate, ShoppingListResponse,
    ShoppingListItemCreate, ShoppingListItemUpdate, ShoppingListItemResponse,
    BudgetCreate, BudgetResponse,
    RecurringPurchaseCreate, RecurringPurchaseResponse,
    PurchaseRecordCreate, PurchaseRecordResponse
)
from backend.app.api.deps import get_current_user
from backend.app.api.products import enrich_product_response

router = APIRouter(prefix="/planner", tags=["Shopping Planner"])

# --- Shopping Lists ---

@router.get("/lists", response_model=List[ShoppingListResponse])
def get_shopping_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lists = db.query(ShoppingList).filter(ShoppingList.user_id == current_user.id).all()
    results = []
    for l in lists:
        items = db.query(ShoppingListItem).filter(ShoppingListItem.shopping_list_id == l.id).all()
        enriched_items = []
        total_cost = 0.0
        completed_count = 0

        for it in items:
            prod_resp = enrich_product_response(db, it.product) if it.product else None
            unit_price = it.estimated_unit_price or (prod_resp.current_lowest_price if prod_resp else 0.0)
            total_cost += unit_price * it.desired_quantity
            if it.is_purchased:
                completed_count += 1

            enriched_items.append(ShoppingListItemResponse(
                id=it.id,
                shopping_list_id=it.shopping_list_id,
                product_id=it.product_id,
                product=prod_resp,
                item_title=it.item_title,
                desired_quantity=it.desired_quantity,
                estimated_unit_price=unit_price,
                is_purchased=it.is_purchased,
                priority=it.priority,
                needed_by=it.needed_by,
                created_at=it.created_at
            ))

        results.append(ShoppingListResponse(
            id=l.id,
            user_id=l.user_id,
            title=l.title,
            description=l.description,
            color=l.color,
            items=enriched_items,
            total_estimated_cost=round(total_cost, 2),
            completed_items_count=completed_count,
            total_items_count=len(items),
            created_at=l.created_at
        ))
    return results

@router.post("/lists", response_model=ShoppingListResponse, status_code=status.HTTP_201_CREATED)
def create_shopping_list(
    list_in: ShoppingListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_list = ShoppingList(
        user_id=current_user.id,
        title=list_in.title,
        description=list_in.description,
        color=list_in.color or "cyan"
    )
    db.add(new_list)
    db.commit()
    db.refresh(new_list)

    return ShoppingListResponse(
        id=new_list.id,
        user_id=new_list.user_id,
        title=new_list.title,
        description=new_list.description,
        color=new_list.color,
        items=[],
        total_estimated_cost=0.0,
        completed_items_count=0,
        total_items_count=0,
        created_at=new_list.created_at
    )

@router.delete("/lists/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sh_list = db.query(ShoppingList).filter(
        ShoppingList.id == list_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not sh_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")

    db.delete(sh_list)
    db.commit()
    return None

@router.post("/lists/{list_id}/items", response_model=ShoppingListItemResponse, status_code=status.HTTP_201_CREATED)
def add_item_to_shopping_list(
    list_id: int,
    item_in: ShoppingListItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sh_list = db.query(ShoppingList).filter(
        ShoppingList.id == list_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not sh_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")

    # If linked to a product, auto-fill current lowest price if unit_price is 0
    estimated_price = item_in.estimated_unit_price or 0.0
    product = None
    if item_in.product_id:
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if product and estimated_price == 0.0:
            prod_resp = enrich_product_response(db, product)
            estimated_price = prod_resp.current_lowest_price or 0.0

    new_item = ShoppingListItem(
        shopping_list_id=list_id,
        product_id=item_in.product_id,
        item_title=item_in.item_title,
        desired_quantity=item_in.desired_quantity or 1,
        estimated_unit_price=estimated_price,
        is_purchased=False,
        priority=item_in.priority or "MEDIUM",
        needed_by=item_in.needed_by
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    prod_resp = enrich_product_response(db, product) if product else None
    return ShoppingListItemResponse(
        id=new_item.id,
        shopping_list_id=new_item.shopping_list_id,
        product_id=new_item.product_id,
        product=prod_resp,
        item_title=new_item.item_title,
        desired_quantity=new_item.desired_quantity,
        estimated_unit_price=new_item.estimated_unit_price,
        is_purchased=new_item.is_purchased,
        priority=new_item.priority,
        needed_by=new_item.needed_by,
        created_at=new_item.created_at
    )

@router.put("/lists/items/{item_id}", response_model=ShoppingListItemResponse)
def update_shopping_list_item(
    item_id: int,
    item_update: ShoppingListItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ShoppingListItem).join(ShoppingList).filter(
        ShoppingListItem.id == item_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Shopping list item not found")

    if item_update.desired_quantity is not None:
        item.desired_quantity = item_update.desired_quantity
    if item_update.estimated_unit_price is not None:
        item.estimated_unit_price = item_update.estimated_unit_price
    if item_update.is_purchased is not None:
        item.is_purchased = item_update.is_purchased
    if item_update.priority is not None:
        item.priority = item_update.priority
    if item_update.needed_by is not None:
        item.needed_by = item_update.needed_by

    db.commit()
    db.refresh(item)

    prod_resp = enrich_product_response(db, item.product) if item.product else None
    return ShoppingListItemResponse(
        id=item.id,
        shopping_list_id=item.shopping_list_id,
        product_id=item.product_id,
        product=prod_resp,
        item_title=item.item_title,
        desired_quantity=item.desired_quantity,
        estimated_unit_price=item.estimated_unit_price,
        is_purchased=item.is_purchased,
        priority=item.priority,
        needed_by=item.needed_by,
        created_at=item.created_at
    )

@router.delete("/lists/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_list_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ShoppingListItem).join(ShoppingList).filter(
        ShoppingListItem.id == item_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Shopping list item not found")

    db.delete(item)
    db.commit()
    return None

# --- Budgets ---

@router.get("/budgets", response_model=List[BudgetResponse])
def get_user_budgets(
    month_year: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_my = month_year or datetime.now(timezone.utc).strftime("%Y-%m")
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month_year == current_my
    ).all()

    # Calculate actual spend from purchases in this month
    purchases = db.query(PurchaseRecord).filter(
        PurchaseRecord.user_id == current_user.id
    ).all()
    spent_by_category = {}
    for p in purchases:
        p_my = p.purchase_date.strftime("%Y-%m")
        if p_my == current_my:
            cat = p.product.category if p.product else "All Categories"
            spent_by_category[cat] = spent_by_category.get(cat, 0.0) + p.purchase_price
            spent_by_category["All Categories"] = spent_by_category.get("All Categories", 0.0) + p.purchase_price

    results = []
    for b in budgets:
        spent = spent_by_category.get(b.category, 0.0)
        remaining = max(0.0, b.budget_limit - spent)
        utilization = round((spent / b.budget_limit * 100), 1) if b.budget_limit > 0 else 0.0
        is_exceeded = spent > b.budget_limit

        results.append(BudgetResponse(
            id=b.id,
            user_id=b.user_id,
            month_year=b.month_year,
            category=b.category,
            budget_limit=b.budget_limit,
            spent_amount=round(spent, 2),
            planned_amount=round(spent, 2),
            remaining_amount=round(remaining, 2),
            utilization_percentage=utilization,
            is_exceeded=is_exceeded,
            created_at=b.created_at
        ))
    return results

@router.post("/budgets", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def set_or_update_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month_year == budget_in.month_year,
        Budget.category == budget_in.category
    ).first()

    if existing:
        existing.budget_limit = budget_in.budget_limit
        db.commit()
        db.refresh(existing)
        b = existing
    else:
        b = Budget(
            user_id=current_user.id,
            month_year=budget_in.month_year,
            category=budget_in.category or "All Categories",
            budget_limit=budget_in.budget_limit
        )
        db.add(b)
        db.commit()
        db.refresh(b)

    return BudgetResponse(
        id=b.id,
        user_id=b.user_id,
        month_year=b.month_year,
        category=b.category,
        budget_limit=b.budget_limit,
        spent_amount=0.0,
        planned_amount=0.0,
        remaining_amount=b.budget_limit,
        utilization_percentage=0.0,
        is_exceeded=False,
        created_at=b.created_at
    )

# --- Recurring Purchases ---

@router.get("/recurring", response_model=List[RecurringPurchaseResponse])
def get_recurring_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recurs = db.query(RecurringPurchase).filter(
        RecurringPurchase.user_id == current_user.id,
        RecurringPurchase.is_active == True
    ).all()

    now = datetime.now(timezone.utc)
    results = []
    for r in recurs:
        review_at = r.next_review_at.replace(tzinfo=timezone.utc) if r.next_review_at.tzinfo is None else r.next_review_at
        days_until = round((review_at - now).total_seconds() / 86400.0)
        needs_soon = days_until <= 3

        prod_resp = enrich_product_response(db, r.product) if r.product else None

        results.append(RecurringPurchaseResponse(
            id=r.id,
            user_id=r.user_id,
            product_id=r.product_id,
            product=prod_resp,
            custom_title=r.custom_title,
            replenishment_interval_days=r.replenishment_interval_days,
            last_replenished_at=r.last_replenished_at,
            next_review_at=r.next_review_at,
            days_until_next_review=int(days_until),
            needs_replenishment_soon=needs_soon,
            is_active=r.is_active,
            created_at=r.created_at
        ))
    return results

@router.post("/recurring", response_model=RecurringPurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_purchase(
    rec_in: RecurringPurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    last_rep = rec_in.last_replenished_at or datetime.now(timezone.utc)
    interval = rec_in.replenishment_interval_days or 30
    next_review = last_rep + timedelta(days=interval)

    r = RecurringPurchase(
        user_id=current_user.id,
        product_id=rec_in.product_id,
        custom_title=rec_in.custom_title,
        replenishment_interval_days=interval,
        last_replenished_at=last_rep,
        next_review_at=next_review,
        is_active=True
    )
    db.add(r)
    db.commit()
    db.refresh(r)

    prod_resp = enrich_product_response(db, r.product) if r.product else None
    return RecurringPurchaseResponse(
        id=r.id,
        user_id=r.user_id,
        product_id=r.product_id,
        product=prod_resp,
        custom_title=r.custom_title,
        replenishment_interval_days=r.replenishment_interval_days,
        last_replenished_at=r.last_replenished_at,
        next_review_at=r.next_review_at,
        days_until_next_review=interval,
        needs_replenishment_soon=False,
        is_active=r.is_active,
        created_at=r.created_at
    )

@router.post("/recurring/{rec_id}/replenish", response_model=RecurringPurchaseResponse)
def mark_recurring_replenished(
    rec_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(RecurringPurchase).filter(
        RecurringPurchase.id == rec_id,
        RecurringPurchase.user_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recurring item not found")

    now = datetime.now(timezone.utc)
    r.last_replenished_at = now
    r.next_review_at = now + timedelta(days=r.replenishment_interval_days)
    db.commit()
    db.refresh(r)

    prod_resp = enrich_product_response(db, r.product) if r.product else None
    return RecurringPurchaseResponse(
        id=r.id,
        user_id=r.user_id,
        product_id=r.product_id,
        product=prod_resp,
        custom_title=r.custom_title,
        replenishment_interval_days=r.replenishment_interval_days,
        last_replenished_at=r.last_replenished_at,
        next_review_at=r.next_review_at,
        days_until_next_review=r.replenishment_interval_days,
        needs_replenishment_soon=False,
        is_active=r.is_active,
        created_at=r.created_at
    )

# --- Purchase Records & Realized Savings ---

@router.get("/purchases", response_model=List[PurchaseRecordResponse])
def get_user_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    purchases = db.query(PurchaseRecord).filter(
        PurchaseRecord.user_id == current_user.id
    ).order_by(desc(PurchaseRecord.purchase_date)).all()

    results = []
    for p in purchases:
        savings = (p.original_baseline_price - p.purchase_price) if p.original_baseline_price and p.original_baseline_price > p.purchase_price else 0.0

        results.append(PurchaseRecordResponse(
            id=p.id,
            user_id=p.user_id,
            product_id=p.product_id,
            retailer_id=p.retailer_id,
            product_title=p.product.title if p.product else "Logged Item",
            retailer_name=p.retailer.name if p.retailer else "Verified Store",
            purchase_price=p.purchase_price,
            original_baseline_price=p.original_baseline_price,
            realized_savings=round(savings, 2),
            purchase_date=p.purchase_date,
            notes=p.notes
        ))
    return results

@router.post("/purchases", response_model=PurchaseRecordResponse, status_code=status.HTTP_201_CREATED)
def log_purchase(
    p_in: PurchaseRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If no baseline provided, lookup original MRP or historical avg
    baseline = p_in.original_baseline_price
    if not baseline and p_in.product_id:
        product = db.query(Product).filter(Product.id == p_in.product_id).first()
        if product:
            prod_resp = enrich_product_response(db, product)
            baseline = prod_resp.original_mrp or (prod_resp.current_lowest_price * 1.15 if prod_resp.current_lowest_price else p_in.purchase_price)

    new_p = PurchaseRecord(
        user_id=current_user.id,
        product_id=p_in.product_id,
        retailer_id=p_in.retailer_id,
        purchase_price=p_in.purchase_price,
        original_baseline_price=baseline,
        purchase_date=datetime.now(timezone.utc),
        notes=p_in.notes
    )
    db.add(new_p)
    db.commit()
    db.refresh(new_p)

    savings = (new_p.original_baseline_price - new_p.purchase_price) if new_p.original_baseline_price and new_p.original_baseline_price > new_p.purchase_price else 0.0

    return PurchaseRecordResponse(
        id=new_p.id,
        user_id=new_p.user_id,
        product_id=new_p.product_id,
        retailer_id=new_p.retailer_id,
        product_title=new_p.product.title if new_p.product else "Logged Item",
        retailer_name=new_p.retailer.name if new_p.retailer else "Verified Store",
        purchase_price=new_p.purchase_price,
        original_baseline_price=new_p.original_baseline_price,
        realized_savings=round(savings, 2),
        purchase_date=new_p.purchase_date,
        notes=new_p.notes
    )
