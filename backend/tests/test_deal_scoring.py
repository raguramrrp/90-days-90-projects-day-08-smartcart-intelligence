import pytest
from backend.app.services.deal_scorer import calculate_deal_score

def test_deal_score_insufficient_data():
    res = calculate_deal_score(
        current_price=1000.0,
        original_mrp=1500.0,
        historical_min=1000.0,
        historical_avg=1200.0,
        competitor_prices=[],
        observations_count=2, # less than 3
        data_freshness_hours=1.0
    )
    assert res["deal_score"] == 0
    assert res["deal_label"] == "INSUFFICIENT_DATA"
    assert res["guidance"] == "INSUFFICIENT DATA"
    assert res["confidence"] == "INSUFFICIENT_DATA"

def test_deal_score_excellent_deal():
    res = calculate_deal_score(
        current_price=8000.0,
        original_mrp=12000.0,
        historical_min=8000.0,
        historical_avg=10500.0, # 23.8% below average
        competitor_prices=[8500.0, 8900.0],
        observations_count=20,
        data_freshness_hours=2.0,
        in_stock=True
    )
    assert res["deal_score"] >= 80
    assert res["deal_label"] in ["EXCELLENT_DEAL", "GOOD_PRICE"]
    assert res["guidance"] == "BUY NOW"
    assert res["confidence"] == "HIGH"
    assert len(res["factors"]) >= 4

def test_deal_score_compare_first_guidance():
    # Competitor is cheaper by more than 3%
    res = calculate_deal_score(
        current_price=10000.0,
        original_mrp=12000.0,
        historical_min=9000.0,
        historical_avg=10500.0,
        competitor_prices=[9400.0], # competitor is 6% cheaper!
        observations_count=10,
        data_freshness_hours=1.0,
        in_stock=True
    )
    assert res["guidance"] == "COMPARE FIRST"
    assert "competitor offer is cheaper" in res["explanation"].lower()

def test_deal_score_out_of_stock_triggers_wait():
    res = calculate_deal_score(
        current_price=8000.0,
        original_mrp=12000.0,
        historical_min=8000.0,
        historical_avg=10000.0,
        competitor_prices=[],
        observations_count=10,
        data_freshness_hours=1.0,
        in_stock=False # Out of stock!
    )
    assert res["guidance"] == "WAIT"
    assert "out of stock" in res["explanation"].lower()
