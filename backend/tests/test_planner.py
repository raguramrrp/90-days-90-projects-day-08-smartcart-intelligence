import pytest

def test_shopping_list_workflow(client, auth_headers):
    # 1. Create list
    list_resp = client.post(
        "/api/v1/planner/lists",
        headers=auth_headers,
        json={"title": "Weekly Groceries", "color": "emerald"}
    )
    assert list_resp.status_code == 201
    list_data = list_resp.json()
    list_id = list_data["id"]

    # 2. Add items
    item_resp = client.post(
        f"/api/v1/planner/lists/{list_id}/items",
        headers=auth_headers,
        json={
            "item_title": "Organic Rolled Oats 1kg",
            "desired_quantity": 2,
            "estimated_unit_price": 250.0,
            "priority": "HIGH"
        }
    )
    assert item_resp.status_code == 201
    item_data = item_resp.json()
    item_id = item_data["id"]

    # 3. Mark as purchased
    update_resp = client.put(
        f"/api/v1/planner/lists/items/{item_id}",
        headers=auth_headers,
        json={"is_purchased": True}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["is_purchased"] is True

    # 4. Check list totals
    get_lists = client.get("/api/v1/planner/lists", headers=auth_headers)
    assert get_lists.status_code == 200
    user_list = next(l for l in get_lists.json() if l["id"] == list_id)
    assert user_list["total_estimated_cost"] == 500.0 # 2 * 250
    assert user_list["completed_items_count"] == 1

def test_budget_planning(client, auth_headers):
    # Set monthly budget for 2026-10
    b_resp = client.post(
        "/api/v1/planner/budgets",
        headers=auth_headers,
        json={"month_year": "2026-10", "category": "Electronics", "budget_limit": 50000.0}
    )
    assert b_resp.status_code == 201
    assert b_resp.json()["budget_limit"] == 50000.0

    # Retrieve budgets
    get_b = client.get("/api/v1/planner/budgets?month_year=2026-10", headers=auth_headers)
    assert get_b.status_code == 200
    b_item = next(b for b in get_b.json() if b["category"] == "Electronics")
    assert b_item["remaining_amount"] == 50000.0
    assert b_item["is_exceeded"] is False

def test_recurring_replenishment(client, auth_headers):
    # Create recurring item
    rec_resp = client.post(
        "/api/v1/planner/recurring",
        headers=auth_headers,
        json={
            "custom_title": "Water Filter Cartridge",
            "replenishment_interval_days": 60
        }
    )
    assert rec_resp.status_code == 201
    rec_id = rec_resp.json()["id"]

    # Replenish
    rep_resp = client.post(f"/api/v1/planner/recurring/{rec_id}/replenish", headers=auth_headers)
    assert rep_resp.status_code == 200
    assert rep_resp.json()["days_until_next_review"] == 60

def test_purchase_record_and_realized_savings(client, auth_headers):
    # Log purchase: bought at 4000, baseline MRP was 6000 -> realized savings = 2000
    p_resp = client.post(
        "/api/v1/planner/purchases",
        headers=auth_headers,
        json={
            "purchase_price": 4000.0,
            "original_baseline_price": 6000.0,
            "notes": "Verified deal purchase"
        }
    )
    assert p_resp.status_code == 201
    data = p_resp.json()
    assert data["purchase_price"] == 4000.0
    assert data["realized_savings"] == 2000.0

    # Check analytics savings summary
    summary_resp = client.get("/api/v1/analytics/savings-summary", headers=auth_headers)
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert summary["total_realized_savings"] >= 2000.0
    assert summary["confirmed_purchases_count"] >= 1
