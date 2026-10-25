# SmartCart Intelligence — Project Overview

## 1. Executive Summary

**SmartCart Intelligence** is an enterprise-grade e-commerce price monitoring, comparison, and shopping intelligence platform specifically architected for the Indian retail ecosystem. Developed as **Day 8 of the 90 Days – 90 Projects Challenge**, it bridges the gap between chaotic e-commerce pricing fluctuations and smart, evidence-based consumer purchasing decisions.

Rather than acting as a static dashboard or simple price scraper, SmartCart Intelligence unites three essential capabilities into a single, cohesive full-stack web application:
1. **Personal Price Tracker:** Monitors products across retailers, tracks historical pricing chronologically, allows customizable watchlists with target prices, and dispatches automated threshold alerts.
2. **Smart Shopping Assistant:** Compares identical items across major Indian retailers (Amazon India, Flipkart, Croma, Reliance Digital, and Tata CLiQ), computes an explainable 0–100 Deal Score, and provides unambiguous buying advice (*BUY NOW*, *WAIT*, *COMPARE FIRST*, or *INSUFFICIENT DATA*).
3. **Everyday Purchase Intelligence:** Empowers consumers to manage shopping lists, set monthly category budgets with live threshold meters, manage recurring replenishment cycles, and record verified purchases to calculate genuine realized savings.

---

## 2. Problem Statement & Market Context

Indian e-commerce platforms employ dynamic pricing algorithms that adjust prices based on supply, demand, user location, festival seasons, and competitor actions. For consumers:
- **Price Volatility:** Prices fluctuate multiple times within a single week, making it difficult to determine whether a "sale" is genuinely discounted or an inflated MRP illusion.
- **Retailer Fragmentation:** Electronics, home appliances, and groceries are spread across multiple stores (Amazon, Flipkart, Croma, Reliance Digital, Tata CLiQ) with differing shipping charges, platform fees, and return policies.
- **Fake Discounts & Lack of Provenance:** Many shopping platforms aggregate stale data or display misleading "70% OFF" tags without verifiable historical pricing records.
- **Budget Leakage:** Without organized tracking, impulse purchases and unmonitored replenishment cycles lead to monthly grocery and tech budget overruns.

---

## 3. The SmartCart Intelligence Solution

SmartCart Intelligence solves these challenges through:
- **Immutable Data Provenance:** Every price carries an auditable provenance badge (`LIVE`, `CACHED`, `HISTORICAL`, `SAMPLE`, or `UNAVAILABLE`) accompanied by a transparent observation timestamp. No fabricated prices or artificial discounts are ever presented to the user.
- **Normalized Multi-Retailer Architecture:** An extensible `ProviderAdapter` architecture models product listings with exact SKU/model numbers, color, storage, and pack size disambiguation.
- **Multi-Factor Deal Scoring Engine:** A transparent 5-factor scoring model that evaluates:
  1. Historical Average Deviation (35 points)
  2. Proximity to All-Time Low (25 points)
  3. Cross-Retailer Price Spread (20 points)
  4. MRP Discount Depth (10 points)
  5. Stock Availability & Data Freshness (10 points)
- **Predictive ML Price Forecasting:** Linear trend regression with rolling standard error calculation providing 95% confidence intervals and 7/14/30-day price trend projections.
- **Complete Purchase Lifecycle:** Moving beyond pre-purchase tracking into post-purchase verification, allowing users to record actual invoices and track **Realized Savings** against historical maximums and retail MRPs.

---

## 4. Key Target Audiences

- **Tech Enthusiasts & Gadget Buyers:** Tracking flagship smartphones, laptops, and audio gear across Amazon, Croma, and Reliance Digital to buy at genuine price dips.
- **Households & Grocery Planners:** Planning recurring monthly staples (tea, rice, detergents) with automated 30-day replenishment alerts.
- **Budget-Conscious Students & Shoppers:** Setting strict monthly category budgets and receiving visual alerts before exceeding spending limits.
- **Hiring Managers & Technical Recruiters:** Evaluating clean full-stack software engineering, REST API design, background scheduling, predictive modeling, and UI design systems.

---

## 5. Technical Specifications At A Glance

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite | Ultra-fast HMR, type safety, modular component architecture. |
| **Styling & Theme** | Tailwind CSS v4 | Futuristic midnight/navy interface (`#070d18`, `#0c1527`), electric cyan accents. |
| **Charting Library** | Recharts | Interactive time-series price graphs, reference lines, and forecast projections. |
| **Backend Framework** | Python 3.10+ FastAPI | High-throughput asynchronous endpoints, auto-generated OpenAPI / Swagger specs. |
| **ORM & Migrations** | SQLAlchemy 2.0 + Alembic | Declarative relational modeling, robust migrations, cross-database compatibility. |
| **Database Support** | Dual Engine: SQLite & PostgreSQL | Frictionless local Windows development (SQLite) + production-ready PostgreSQL. |
| **Authentication** | PBKDF2-HMAC-SHA256 + JWT | Stateless multi-user security with strict user-level data isolation. |
| **Background Worker** | APScheduler | Automated background price scans and freshness health checks. |
| **Notification Engine**| Mock Dev Outbox + SMTP Adapter | Full HTML email rendering viewable in-app without needing third-party API keys. |
