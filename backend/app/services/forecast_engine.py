import math
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone

def forecast_price_trend(
    observations: List[Dict[str, Any]],
    horizon_days: int = 30
) -> Dict[str, Any]:
    """
    Time-Series Price Forecasting Module
    
    Uses chronological observations to compute:
    1. Linear regression slope (trend velocity)
    2. Rolling standard error (historical volatility)
    3. Projected point estimates for 7, 14, and 30 days
    4. Upper and lower 95% confidence intervals
    """
    if not observations or len(observations) < 5:
        return {
            "status": "INSUFFICIENT_HISTORY",
            "message": "At least 5 chronological price observations are required to compute a statistical price forecast.",
            "disclaimer": "Predictions are statistical estimates based on historical patterns and are not guarantees of future retailer pricing.",
            "forecast_points": []
        }

    # Sort chronologically by observed_at
    sorted_obs = sorted(observations, key=lambda x: x["observed_at"])
    
    # Extract timestamps in days relative to first point and prices
    base_time = sorted_obs[0]["observed_at"]
    x_days = []
    y_prices = []

    for obs in sorted_obs:
        delta_days = (obs["observed_at"] - base_time).total_seconds() / 86400.0
        x_days.append(delta_days)
        y_prices.append(obs["price"])

    n = len(x_days)
    current_price = y_prices[-1]
    last_day = x_days[-1]

    # Calculate linear regression slope (m) and intercept (c)
    mean_x = sum(x_days) / n
    mean_y = sum(y_prices) / n

    numerator = sum((x_days[i] - mean_x) * (y_prices[i] - mean_y) for i in range(n))
    denominator = sum((x_days[i] - mean_x) ** 2 for i in range(n))

    if denominator == 0:
        slope = 0.0
        intercept = mean_y
    else:
        slope = numerator / denominator
        intercept = mean_y - slope * mean_x

    # Calculate residuals and standard error
    residuals = [(y_prices[i] - (slope * x_days[i] + intercept)) for i in range(n)]
    variance = sum(r ** 2 for r in residuals) / max(1, n - 2)
    std_err = math.sqrt(variance)

    # Determine trend classification
    annualized_trend = slope * 30
    if annualized_trend < -0.02 * current_price:
        trend = "DECREASING"
    elif annualized_trend > 0.02 * current_price:
        trend = "INCREASING"
    else:
        trend = "STABLE"

    # Compute forecast checkpoints (7, 14, 30 days ahead)
    forecast_points = []
    latest_date = sorted_obs[-1]["observed_at"]

    checkpoints = [7, 14, 21, 30]
    preds = {}

    for day_offset in checkpoints:
        future_x = last_day + day_offset
        predicted_val = round(max(0.1, slope * future_x + intercept), 2)
        # Expanding uncertainty band over time
        uncertainty = std_err * math.sqrt(1 + 1/n + ((future_x - mean_x)**2) / (denominator if denominator > 0 else 1))
        lower_bound = round(max(0.0, predicted_val - 1.96 * uncertainty), 2)
        upper_bound = round(predicted_val + 1.96 * uncertainty, 2)
        
        future_date = latest_date + timedelta(days=day_offset)
        preds[day_offset] = predicted_val

        forecast_points.append({
            "day_offset": day_offset,
            "target_date": future_date.strftime("%Y-%m-%d"),
            "predicted_price": predicted_val,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound
        })

    return {
        "status": "PREDICTED",
        "horizon_days": horizon_days,
        "current_price": current_price,
        "predicted_trend": trend,
        "predicted_price_7d": preds.get(7),
        "predicted_price_14d": preds.get(14),
        "predicted_price_30d": preds.get(30),
        "confidence_interval_lower": forecast_points[-1]["lower_bound"] if forecast_points else None,
        "confidence_interval_upper": forecast_points[-1]["upper_bound"] if forecast_points else None,
        "disclaimer": "Predictions are statistical estimates derived from historical price observations and are not guaranteed future prices.",
        "forecast_points": forecast_points
    }
