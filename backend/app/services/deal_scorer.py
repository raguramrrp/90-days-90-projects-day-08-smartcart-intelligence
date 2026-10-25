from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

def calculate_deal_score(
    current_price: float,
    original_mrp: Optional[float],
    historical_min: Optional[float],
    historical_avg: Optional[float],
    competitor_prices: List[float],
    observations_count: int,
    data_freshness_hours: float,
    in_stock: bool = True,
    target_price: Optional[float] = None
) -> Dict[str, Any]:
    """
    Transparent 0-100 Deal Scoring Algorithm
    
    Weights:
    1. Historical Average Baseline (35 pts): How much cheaper than the product's 30/90-day recorded average.
    2. Proximity to All-Time Low (25 pts): Is it at or close to the lowest price ever observed?
    3. Multi-Retailer Competitiveness (20 pts): How does this offer rank against other verified stores?
    4. Verified MRP Discount (10 pts): Real drop relative to documented manufacturer retail price.
    5. Data Freshness & History Sufficiency (10 pts): Penalize stale or sparse observation histories.
    """
    factors = []
    
    # 0. Check data sufficiency
    if observations_count < 3 or current_price <= 0:
        return {
            "deal_score": 0,
            "deal_label": "INSUFFICIENT_DATA",
            "guidance": "INSUFFICIENT DATA",
            "confidence": "INSUFFICIENT_DATA",
            "explanation": "Not enough historical observations to compute a trustworthy deal score (minimum 3 observations required).",
            "factors": [
                {"name": "History Sufficiency", "score_impact": 0.0, "description": f"Only {observations_count} observations recorded."}
            ],
            "data_freshness_hours": data_freshness_hours
        }

    total_score = 0.0

    # Factor 1: Historical Average Comparison (35 pts max)
    if historical_avg and historical_avg > 0:
        pct_below_avg = (historical_avg - current_price) / historical_avg
        if pct_below_avg >= 0.20: # 20%+ cheaper than average
            impact = 35.0
            desc = f"Price is {pct_below_avg*100:.1f}% below the historical average of ₹{historical_avg:,.2f}."
        elif pct_below_avg > 0:
            impact = round(pct_below_avg / 0.20 * 35.0, 1)
            desc = f"Price is {pct_below_avg*100:.1f}% below the historical average."
        elif pct_below_avg >= -0.05:
            impact = 15.0
            desc = "Price is right around the historical average."
        else:
            impact = max(0.0, round(15.0 + (pct_below_avg * 50.0), 1))
            desc = f"Price is {abs(pct_below_avg)*100:.1f}% above historical average."
        total_score += impact
        factors.append({"name": "Historical Average Baseline", "score_impact": impact, "description": desc})

    # Factor 2: Proximity to All-Time Low (25 pts max)
    if historical_min and historical_min > 0:
        ratio = current_price / historical_min
        if ratio <= 1.01: # At or within 1% of all-time low
            impact = 25.0
            desc = f"Matches or is within 1% of the recorded all-time low of ₹{historical_min:,.2f}."
        elif ratio <= 1.05:
            impact = 20.0
            desc = "Within 5% of recorded all-time low."
        elif ratio <= 1.15:
            impact = 12.0
            desc = "Within 15% of recorded all-time low."
        else:
            impact = max(0.0, 5.0)
            desc = f"Significantly higher than recorded all-time low (₹{historical_min:,.2f})."
        total_score += impact
        factors.append({"name": "All-Time Low Proximity", "score_impact": impact, "description": desc})

    # Factor 3: Multi-Retailer Competitiveness (20 pts max)
    if competitor_prices and len(competitor_prices) > 0:
        lowest_comp = min(competitor_prices)
        if current_price < lowest_comp:
            impact = 20.0
            desc = f"Lowest available offer across all {len(competitor_prices) + 1} verified retailers."
        elif current_price == lowest_comp:
            impact = 17.0
            desc = "Tied for the lowest price across verified stores."
        else:
            diff_pct = (current_price - lowest_comp) / lowest_comp
            if diff_pct <= 0.02:
                impact = 12.0
                desc = "Very competitive; within 2% of the cheapest alternative."
            else:
                impact = max(0.0, round(10.0 - (diff_pct * 30), 1))
                desc = f"A competitor offer is cheaper by {diff_pct*100:.1f}% (₹{lowest_comp:,.2f})."
        total_score += impact
        factors.append({"name": "Cross-Store Market Comparison", "score_impact": impact, "description": desc})
    else:
        # Neutral 12 pts if single retailer observation
        total_score += 12.0
        factors.append({"name": "Cross-Store Market Comparison", "score_impact": 12.0, "description": "Single verified retailer available for this product."})

    # Factor 4: MRP Verified Discount (10 pts max)
    if original_mrp and original_mrp > current_price:
        mrp_discount = (original_mrp - current_price) / original_mrp
        impact = min(10.0, round(mrp_discount * 20.0, 1))
        total_score += impact
        factors.append({"name": "MRP Discount Baseline", "score_impact": impact, "description": f"{mrp_discount*100:.1f}% discount against manufacturer MRP (₹{original_mrp:,.2f})."})
    else:
        factors.append({"name": "MRP Discount Baseline", "score_impact": 0.0, "description": "No documented manufacturer MRP discount detected."})

    # Factor 5: Data Freshness & Stock Penalties (10 pts max)
    freshness_pts = 10.0
    if not in_stock:
        freshness_pts = 0.0
        factors.append({"name": "Availability & Freshness", "score_impact": 0.0, "description": "Item is currently out of stock."})
    elif data_freshness_hours > 48:
        freshness_pts = 2.0
        factors.append({"name": "Availability & Freshness", "score_impact": 2.0, "description": f"Price data is stale ({data_freshness_hours:.1f} hours old)."})
    elif data_freshness_hours > 24:
        freshness_pts = 6.0
        factors.append({"name": "Availability & Freshness", "score_impact": 6.0, "description": f"Price data is moderately fresh ({data_freshness_hours:.1f} hours old)."})
    else:
        freshness_pts = 10.0
        factors.append({"name": "Availability & Freshness", "score_impact": 10.0, "description": "Price data is fresh (verified within last 24h)."})
    total_score += freshness_pts

    # Normalize score between 0 and 100
    deal_score = max(0, min(100, int(round(total_score))))

    # Determine Label
    if deal_score >= 85:
        deal_label = "EXCELLENT_DEAL"
    elif deal_score >= 70:
        deal_label = "GOOD_PRICE"
    elif deal_score >= 45:
        deal_label = "FAIR"
    else:
        deal_label = "OVERPRICED"

    # Determine Guidance
    if not in_stock:
        guidance = "WAIT"
        explanation = "Item is currently out of stock. We recommend waiting for stock replenishment or setting a back-in-stock alert."
    elif competitor_prices and current_price > min(competitor_prices) * 1.03:
        guidance = "COMPARE FIRST"
        cheapest = min(competitor_prices)
        explanation = f"A verified competitor offer is cheaper at ₹{cheapest:,.2f}. Review multi-store comparisons before purchasing."
    elif target_price and current_price <= target_price:
        guidance = "BUY NOW"
        explanation = f"Current price (₹{current_price:,.2f}) meets or beats your configured target of ₹{target_price:,.2f}."
    elif deal_score >= 80:
        guidance = "BUY NOW"
        explanation = "This price is at or near its all-time recorded low with strong historical evidence. Excellent buying opportunity."
    elif deal_score >= 60:
        guidance = "BUY NOW" if (target_price and current_price <= target_price * 1.05) else "WAIT"
        explanation = "Price is fair but may drop further based on historical promotional cycles."
    else:
        guidance = "WAIT"
        explanation = "Current price is above historical averages. Historical data suggests better discounts occur regularly."

    # Confidence rating
    if observations_count >= 15 and data_freshness_hours <= 12:
        confidence = "HIGH"
    elif observations_count >= 6:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    return {
        "deal_score": deal_score,
        "deal_label": deal_label,
        "guidance": guidance,
        "confidence": confidence,
        "explanation": explanation,
        "factors": factors,
        "data_freshness_hours": round(data_freshness_hours, 1)
    }
