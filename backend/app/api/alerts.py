from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.product import Product
from backend.app.models.alert import PriceAlertRule, Notification, NotificationDelivery
from backend.app.schemas.alert import (
    PriceAlertRuleCreate, PriceAlertRuleResponse,
    NotificationResponse, NotificationDeliveryResponse
)
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])

@router.get("/rules", response_model=List[PriceAlertRuleResponse])
def get_user_alert_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rules = db.query(PriceAlertRule).filter(PriceAlertRule.user_id == current_user.id).all()
    results = []
    for r in rules:
        results.append(PriceAlertRuleResponse(
            id=r.id,
            user_id=r.user_id,
            product_id=r.product_id,
            product_title=r.product.title if r.product else "Unknown Product",
            rule_type=r.rule_type,
            threshold_value=r.threshold_value,
            is_active=r.is_active,
            created_at=r.created_at,
            last_triggered_at=r.last_triggered_at
        ))
    return results

@router.post("/rules", response_model=PriceAlertRuleResponse, status_code=status.HTTP_201_CREATED)
def create_alert_rule(
    rule_in: PriceAlertRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == rule_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_rule = PriceAlertRule(
        user_id=current_user.id,
        product_id=rule_in.product_id,
        rule_type=rule_in.rule_type,
        threshold_value=rule_in.threshold_value,
        is_active=True
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)

    return PriceAlertRuleResponse(
        id=new_rule.id,
        user_id=new_rule.user_id,
        product_id=new_rule.product_id,
        product_title=product.title,
        rule_type=new_rule.rule_type,
        threshold_value=new_rule.threshold_value,
        is_active=new_rule.is_active,
        created_at=new_rule.created_at,
        last_triggered_at=new_rule.last_triggered_at
    )

@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(PriceAlertRule).filter(
        PriceAlertRule.id == rule_id,
        PriceAlertRule.user_id == current_user.id
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")

    db.delete(rule)
    db.commit()
    return None

@router.get("/notifications", response_model=List[NotificationResponse])
def get_user_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(limit).all()

    results = []
    for n in notifs:
        deliveries = db.query(NotificationDelivery).filter(
            NotificationDelivery.notification_id == n.id
        ).all()

        results.append(NotificationResponse(
            id=n.id,
            user_id=n.user_id,
            product_id=n.product_id,
            product_title=n.product.title if n.product else "Product Alert",
            product_image=n.product.image_url if n.product else None,
            rule_id=n.rule_id,
            title=n.title,
            message=n.message,
            previous_price=n.previous_price,
            new_price=n.new_price,
            channel=n.channel,
            status=n.status,
            created_at=n.created_at,
            deliveries=[
                NotificationDeliveryResponse(
                    id=d.id,
                    channel=d.channel,
                    delivery_mode=d.delivery_mode,
                    recipient=d.recipient,
                    status=d.status,
                    preview_body=d.preview_body,
                    sent_at=d.sent_at
                ) for d in deliveries
            ]
        ))
    return results

@router.put("/notifications/{notif_id}/read", response_model=dict)
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.status = "READ"
    db.commit()
    return {"status": "success", "message": "Notification marked as read"}

@router.put("/notifications/read-all", response_model=dict)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.status == "UNREAD"
    ).update({"status": "READ"})
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
