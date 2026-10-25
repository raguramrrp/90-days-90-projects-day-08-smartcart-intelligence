# SmartCart Intelligence — User Guide & Screen Walkthrough

Welcome to the **SmartCart Intelligence** user guide. This document provides step-by-step instructions for exploring every feature and screen across the platform.

---

## 1. Quick Access & Demo Credentials

SmartCart Intelligence is seeded with realistic Indian e-commerce data and a pre-configured demo user account.

- **Frontend URL:** `http://localhost:5173`
- **FastAPI OpenAPI Docs:** `http://localhost:8000/docs`
- **Demo User:**
  - **Email:** `demo@smartcart.ai`
  - **Password:** `SmartCart123!`

*(You can also register a new account at any time using the "Sign Up" tab in the login dialog).*

---

## 2. Navigating the 11 Core Dashboard Screens

### Screen 1: Overview
The centralized command center for your shopping intelligence.
- **Key Metrics:** View total products in catalog (9+), items on your personal watchlist, active alert rules, and total potential savings.
- **Top Deals Widget:** Displays products currently sporting high Deal Scores ($\ge 75$) with direct links to deal analysis.
- **Retailer Feed Status:** Live indicator showing connectivity and provenance status across Amazon India, Flipkart, Croma, Reliance Digital, and Tata CLiQ.
- **Quick Actions:** Instant buttons to search the catalog, create an alert rule, or log a verified purchase.

---

### Screen 2: Discover Products
Search and browse through normalized Indian e-commerce catalog items.
- **Search & Filters:** Search by product title, brand, or model. Filter by category (Electronics, Computers, Audio, Home & Kitchen, Groceries, Books).
- **Product Cards:** Each card displays verified brand, category, starting price across retailers, discount percentage vs. MRP, and data provenance badge.
- **Track Price Action:** Click **"Track Price"** on any product to open a modal where you can specify your personal target price and priority, adding it to your watchlist in one click.

---

### Screen 3: My Watchlist
Your personalized dashboard for monitoring target prices and price drops.
- **Target Price Progress Meter:** Visual progress bar showing how close the current market price is to your target price.
- **Retailer Availability:** Displays the cheapest store currently carrying the item.
- **Quick Links:** Open the original retailer listing in a new browser tab.
- **Delete / Untrack:** Remove products from your watchlist at any time without deleting historical records belonging to other users.

---

### Screen 4: Compare Prices
Direct cross-retailer comparison matrix for identical Indian products.
- **Product Selector:** Choose any catalog item to see side-by-side pricing.
- **Multi-Store Matrix:** Displays prices across Amazon India, Flipkart, Croma, Reliance Digital, and Tata CLiQ with:
  - Base listed price
  - Delivery / shipping fee
  - Total checkout cost
  - Stock availability status
  - Provenance badge (`SAMPLE`, `CACHED`, or `LIVE`)
- **Best Price Indicator:** Automatically highlights the lowest total cost in glowing electric cyan.

---

### Screen 5: Deal Intelligence
Transparent, objective deal evaluation powered by the 5-factor scoring model.
- **0–100 Deal Score Gauge:** Color-coded score indicator (Green $\ge 80$, Emerald $60-79$, Amber $40-59$, Red $<40$).
- **Actionable Buying Guidance:**
  - `BUY NOW`: Substantial price drop near all-time low.
  - `GOOD DEAL`: Below 30-day average price.
  - `COMPARE FIRST`: Moderate price; check competitor shipping or bank offers.
  - `WAIT`: Price is inflated or trending downward.
- **Factor Breakdown:** Detailed point-by-point breakdown showing exactly how the score was calculated (Historical Avg, Low Proximity, Competitor Spread, MRP Discount, Stock/Freshness).

---

### Screen 6: Shopping Planner
Organize your household and personal purchasing workflow.
- **Shopping Checklists:** Create named shopping lists (e.g., "Diwali Tech Upgrades", "Monthly Groceries"). Add items, check off completed purchases, and see running estimated totals.
- **Category Budget Planner:** Set monthly expenditure limits per category (e.g., Electronics: ₹30,000; Groceries: ₹10,000). Dynamic progress bars turn amber at 80% and red at 100% capacity.
- **Recurring Replenishment Cycles:** Set recurring cycles for consumables (e.g., Tata Tea Gold every 30 days). Displays last purchase date and automated countdown to the next recommended restock.

---

### Screen 7: Price History & ML Forecast
In-depth time-series visual analytics and predictive price trend modeling.
- **Interactive Price Chart:** Powered by Recharts. Displays 90-day chronological price movements across all retailers with reference lines for:
  - 30-Day Moving Average
  - All-Time Lowest Recorded Price
- **ML Price Trend Forecast:** Linear regression trend projection displaying expected price trajectories for 7, 14, and 30 days into the future, bounded by a 95% confidence interval band.
- **Observation Audit Table:** Complete chronological table of all price checks, including timestamp, store, price, and provenance badge.

---

### Screen 8: Alerts & Notifications
Stay informed when prices reach your budget targets.
- **Alert Rules Manager:** Define custom trigger conditions:
  - *Target Met:* When price drops below your exact specified amount.
  - *Price Drop:* Any price reduction compared to previous check.
  - *Percentage Drop:* Price drops by at least $X\%$.
  - *Back In Stock:* When an out-of-stock item becomes available.
- **Trigger Test Scan:** Click **"Run Manual Price Scan"** to simulate an immediate check of all tracked items.
- **Notification Inbox:** Review in-app alerts with read/unread statuses.
- **Mock Dev Email Outbox:** Click **"View Mock Outbox"** to open rendered, fully formatted HTML notification emails directly inside the web browser.

---

### Screen 9: Savings Analytics
Track your financial wins with empirical proof.
- **Potential vs. Realized Savings:** Compares theoretical discount potential against actual money saved on completed transactions.
- **Log Verified Purchase:** Record an actual purchase receipt with invoice date, retailer, price paid, and order reference.
- **Realized Savings Calculation:** Automatically computes savings against both retail MRP and the 90-day historical maximum price.
- **Purchases Audit Log:** Complete historical list of all verified purchases.

---

### Screen 10: Data Sources & System Health
Inspect the health and transparency of background integrations.
- **Retailer Integration Health:** View API latency, status, and required credentials for Amazon India (PA-API 5.0), Flipkart (Affiliate API), Croma, Reliance Digital, and Tata CLiQ.
- **Refresh Job Audit:** Chronological log of automated scheduler runs, items scanned, duration, and error counts.
- **Data Provenance Policy Guide:** Complete reference table explaining the criteria for `LIVE`, `CACHED`, `HISTORICAL`, `SAMPLE`, and `UNAVAILABLE` badges.

---

### Screen 11: Account Settings
Personalize your SmartCart Intelligence experience.
- **Profile Information:** View and update your display name and email address.
- **Localization:** Configure display currency (`INR (₹)` default, `USD ($)`, `EUR (€)`, `GBP (£)`).
- **Notification Preferences:** Toggle in-app notifications, email notifications, and price summary digests.
- **Commercial Retailer API Keys:** Enter your own Amazon Associates or Flipkart API credentials to switch from sample fallback mode to live API queries.
