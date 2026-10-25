# SmartCart Intelligence — Development Notes & Engineering Decisions

## 1. Architectural Trade-offs & Engineering Decisions

### 1.1 Dual Database Architecture (SQLite + PostgreSQL)
- **Challenge:** Requiring PostgreSQL locally can block evaluators, interviewers, and developers on Windows machines where local PostgreSQL services may not be running, or where admin privileges to install databases are unavailable.
- **Solution:** Configured SQLAlchemy 2.0 with a polymorphic connection string pattern. By default, `smartcart.db` (SQLite) is used with zero configuration. By changing `DATABASE_URL` in `.env` to `postgresql://user:pass@host:5432/dbname`, the application immediately switches to PostgreSQL.
- **Alembic Portability:** Database migrations are written without SQLite-incompatible vendor types (e.g. using generic `String`, `Integer`, `Float`, `DateTime`, `Boolean`) so migrations apply identically across SQLite and PostgreSQL.

---

### 1.2 Design System & Tailwind CSS v4
- **Challenge:** The application required a cohesive, futuristic aesthetic without sacrificing usability or creating bulky CSS overhead.
- **Solution:** Implemented Tailwind CSS v4 with `@tailwindcss/vite`.
- **Palette Architecture:**
  - Deep Midnight Base: `#070d18`
  - Navy Surface Cards: `#0c1527`
  - Subtle Borders: `#1b2a47`
  - Electric Cyan Accents: `#06b6d4` / `#22d3ee`
  - Emerald Green Deals: `#10b981`
  - Amber Warnings: `#f59e0b`
- **Component Consistency:** Reusable card styles, badge components, modal overlays, and status indicators are defined with strict semantic HTML and accessible ARIA attributes.

---

## 2. Deal Scoring & Guidance Mathematics

Rather than relying on unexplainable machine learning weights or arbitrary rules, the SmartCart Deal Scorer uses a transparent, auditable **5-factor linear model** capped at 100 points:

### Mathematical Formulation
$$\text{Score} = S_{\text{avg}} + S_{\text{low}} + S_{\text{spread}} + S_{\text{mrp}} + S_{\text{stock}}$$

#### 1. Historical Average Deviation ($S_{\text{avg}} \in [0, 35]$)
Measures the percentage difference between the current price $P_c$ and the 30-day moving average $\bar{P}_{30}$:
$$\Delta_{\text{avg}} = \frac{\bar{P}_{30} - P_c}{\bar{P}_{30}}$$
$$S_{\text{avg}} = \begin{cases} 
35 & \text{if } \Delta_{\text{avg}} \ge 0.15 \\
35 \times \frac{\Delta_{\text{avg}}}{0.15} & \text{if } 0 < \Delta_{\text{avg}} < 0.15 \\
0 & \text{if } \Delta_{\text{avg}} \le 0
\end{cases}$$

#### 2. All-Time Low Proximity ($S_{\text{low}} \in [0, 25]$)
Evaluates proximity to the lowest historical recorded price $P_{\min}$:
$$\Delta_{\text{low}} = \frac{P_c - P_{\min}}{P_{\min}}$$
$$S_{\text{low}} = \begin{cases} 
25 & \text{if } P_c \le P_{\min} \\
\max\left(0, 25 \times (1 - 10 \times \Delta_{\text{low}})\right) & \text{otherwise}
\end{cases}$$

#### 3. Cross-Retailer Price Spread ($S_{\text{spread}} \in [0, 20]$)
Compares $P_c$ against the lowest active competitor price $P_{\text{comp\_min}}$:
$$S_{\text{spread}} = \begin{cases} 
20 & \text{if } P_c \le P_{\text{comp\_min}} \\
\max\left(0, 20 \times \left(1 - \frac{P_c - P_{\text{comp\_min}}}{P_{\text{comp\_min}}}\right)\right) & \text{otherwise}
\end{cases}$$

#### 4. MRP Discount Depth ($S_{\text{mrp}} \in [0, 10]$)
Evaluates discount percentage against retail MRP:
$$\Delta_{\text{mrp}} = \frac{P_{\text{mrp}} - P_c}{P_{\text{mrp}}}$$
$$S_{\text{mrp}} = \min(10, \max(0, 10 \times \frac{\Delta_{\text{mrp}}}{0.30}))$$

#### 5. Stock & Freshness ($S_{\text{stock}} \in [0, 10]$)
- In Stock: $+5$ points
- Data Freshness $< 60$ minutes: $+5$ points (interpolated to 0 as age reaches 24 hours).

---

## 3. Predictive Price Trend Modeling (Linear Regression)

The predictive forecasting engine evaluates time-series observations $(t_i, P_i)$ where $t_i$ represents the elapsed day index:

### Ordinary Least Squares Regression
$$\hat{\beta} = \frac{\sum_{i=1}^n (t_i - \bar{t})(P_i - \bar{P})}{\sum_{i=1}^n (t_i - \bar{t})^2}, \quad \hat{\alpha} = \bar{P} - \hat{\beta}\bar{t}$$

### Residual Standard Error & 95% Confidence Bounds
$$\text{SE}_{\text{res}} = \sqrt{\frac{1}{n-2}\sum_{i=1}^n (P_i - \hat{P}_i)^2}$$
For a future day $t_f \in \{7, 14, 30\}$:
$$\hat{P}_f = \hat{\alpha} + \hat{\beta} t_f$$
$$\text{CI}_{95\%} = \left[ \hat{P}_f - 1.96 \cdot \text{SE}_{\text{res}}, \; \hat{P}_f + 1.96 \cdot \text{SE}_{\text{res}} \right]$$

- **Cold Start Protection:** If $n < 5$, the model flags `"INSUFFICIENT_HISTORY"` rather than generating unreliable projections.

---

## 4. Indian E-Commerce Integration Realities & Ethical Compliance

A key tenet of SmartCart Intelligence is adherence to legal, ethical, and retailer terms of service:
1. **Amazon India (PA-API 5.0):**
   - Access requires an approved Amazon Associates account with 3 qualifying referred sales within 180 days.
   - Requires cryptographic request signing (HMAC-SHA256) and strict rate limit controls (1 req/sec).
2. **Flipkart (Affiliate API):**
   - Requires programmatic affiliate approval and token authentication.
3. **Croma, Reliance Digital & Tata CLiQ:**
   - Offer private enterprise B2B partner APIs; public API keys are not freely available.
4. **Scraping & Bot Protection:**
   - Retailers use Cloudflare, PerimeterX, and Akamai to protect their consumer web portals.
   - SmartCart Intelligence adheres to strict ethics: **it never scrapes consumer pages, bypasses CAPTCHAs, or spoofs headers.**
   - Instead, the platform implements an extensible `ProviderAdapter` architecture. When commercial keys are absent, adapters fall back to certified historical sample feeds clearly marked with the immutable `SAMPLE` provenance badge.

---

## 5. Mock Dev Outbox Pattern for Email Notifications

To enable end-to-end testing of email alert workflows without requiring active SMTP credentials:
- When `EMAIL_DELIVERY_MODE="MOCK"` is set in `.env`, the email service formats the complete transactional HTML email (including product thumbnail, price drop details, direct retailer link, and timestamp).
- It writes the payload to the `notification_deliveries` database table and optionally persists it to disk.
- Users can view and inspect the fully rendered HTML email alert directly inside the application under **Alerts & Notifications -> View Mock Outbox**.
