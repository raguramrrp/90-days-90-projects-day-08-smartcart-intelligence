# SmartCart Intelligence — Testing Strategy & Test Execution Report

## 1. Testing Philosophy & Architecture

SmartCart Intelligence adopts an automated testing approach across both backend services and frontend components.

- **Backend:** Tested using `pytest`, `httpx`, and FastAPI's `TestClient` over an in-memory transactional database.
- **Frontend:** Type-checked and compiled via TypeScript 5.8 (`tsc -b`) and Vite 8.3 (`vite build`), ensuring zero type mismatches or unhandled interface states.
- **Windows Sandboxing:** Tests run cleanly on Windows workstations without requiring external network dependencies or external database daemons.

---

## 2. Test Suite Matrix (19 Verified Tests)

### Module: `test_auth.py`
| Test Name | Target Behavior | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| `test_user_registration` | Register a new user with valid email & password | HTTP 200, JWT token returned | **PASSED** |
| `test_duplicate_email_registration_fails` | Register with an already existing email address | HTTP 400 with duplicate email error | **PASSED** |
| `test_user_login_success` | Login with correct email and password | HTTP 200, valid bearer token | **PASSED** |
| `test_user_login_invalid_password` | Login attempt with wrong password | HTTP 401 Unauthorized | **PASSED** |
| `test_get_profile_authenticated` | Fetch `/auth/me` with valid bearer token | HTTP 200 with user profile info | **PASSED** |
| `test_get_profile_unauthorized` | Fetch `/auth/me` without Authorization header | HTTP 401 Unauthorized | **PASSED** |

---

### Module: `test_deal_scoring.py`
| Test Name | Target Behavior | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| `test_deal_score_insufficient_data` | Evaluate listing with 0 observations | Score: 0, Confidence: LOW, Guidance: INSUFFICIENT DATA | **PASSED** |
| `test_deal_score_excellent_deal` | Item price 20% below avg and equal to all-time low | Score $\ge 80$, Guidance: BUY NOW | **PASSED** |
| `test_deal_score_compare_first_guidance` | Price near average with cheaper competitor | Guidance: COMPARE FIRST | **PASSED** |
| `test_deal_score_out_of_stock_triggers_wait` | Item marked `in_stock = False` | Score penalized, Guidance: WAIT | **PASSED** |

---

### Module: `test_products.py`
| Test Name | Target Behavior | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| `test_get_products_list` | Query `/products` catalog endpoint | HTTP 200, returns seeded product list | **PASSED** |
| `test_filter_products_by_category` | Query `/products?category=Electronics` | Returns only items matching category | **PASSED** |
| `test_product_detail_and_stats` | Query `/products/{id}` detail endpoint | Returns product, listings, min/max stats | **PASSED** |

---

### Module: `test_tracker_and_alerts.py`
| Test Name | Target Behavior | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| `test_add_and_remove_watchlist_item` | Add item to user watchlist, then delete it | HTTP 200 on add, item appears in watchlist, HTTP 200 on delete | **PASSED** |
| `test_alert_rule_evaluation_and_mock_email` | Create `TARGET_MET` rule, simulate price drop | Rule triggers, creates in-app notification & mock email delivery | **PASSED** |

---

### Module: `test_planner.py`
| Test Name | Target Behavior | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| `test_shopping_list_workflow` | Create shopping list, add item, toggle checked | HTTP 200, item marked purchased, total updated | **PASSED** |
| `test_budget_planning` | Create monthly budget, calculate usage % | HTTP 200, category budget tracked | **PASSED** |
| `test_recurring_replenishment` | Configure consumable cycle (30 days) | HTTP 200, next replenishment date computed | **PASSED** |
| `test_purchase_record_and_realized_savings` | Record verified invoice with purchase price | HTTP 200, computes savings vs MRP and vs 90d max | **PASSED** |

---

## 3. Test Execution Verification Log

```text
============================= test session starts =============================
platform win32 -- Python 3.14.7, pytest-9.1.1, pluggy-1.7.0
rootdir: D:\90 days\90-days-90-projects-day-08-smartcart-intelligence
plugins: anyio-4.15.1
collected 19 items

backend/tests/test_auth.py::test_user_registration PASSED                [  5%]
backend/tests/test_auth.py::test_duplicate_email_registration_fails PASSED [ 10%]
backend/tests/test_auth.py::test_user_login_success PASSED               [ 15%]
backend/tests/test_auth.py::test_user_login_invalid_password PASSED      [ 21%]
backend/tests/test_auth.py::test_get_profile_authenticated PASSED        [ 26%]
backend/tests/test_auth.py::test_get_profile_unauthorized PASSED         [ 31%]
backend/tests/test_deal_scoring.py::test_deal_score_insufficient_data PASSED [ 36%]
backend/tests/test_deal_scoring.py::test_deal_score_excellent_deal PASSED [ 42%]
backend/tests/test_deal_scoring.py::test_deal_score_compare_first_guidance PASSED [ 47%]
backend/tests/test_deal_scoring.py::test_deal_score_out_of_stock_triggers_wait PASSED [ 52%]
backend/tests/test_planner.py::test_shopping_list_workflow PASSED        [ 57%]
backend/tests/test_planner.py::test_budget_planning PASSED               [ 63%]
backend/tests/test_planner.py::test_recurring_replenishment PASSED       [ 68%]
backend/tests/test_planner.py::test_purchase_record_and_realized_savings PASSED [ 73%]
backend/tests/test_products.py::test_get_products_list PASSED            [ 78%]
backend/tests/test_products.py::test_filter_products_by_category PASSED  [ 84%]
backend/tests/test_products.py::test_product_detail_and_stats PASSED     [ 89%]
backend/tests/test_tracker_and_alerts.py::test_add_and_remove_watchlist_item PASSED [ 94%]
backend/tests/test_tracker_and_alerts.py::test_alert_rule_evaluation_and_mock_email PASSED [100%]

======================= 19 passed, 17 warnings in 0.77s =======================

Frontend TypeScript Typecheck & Production Build:
vite v8.3.5 building client environment for production...
transforming...
✓ 2581 modules transformed.
rendering chunks...
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-DKWoSfCJ.css   43.82 kB │ gzip:   7.77 kB
dist/assets/index-DSPLaNJj.js   771.46 kB │ gzip: 220.15 kB
✓ built in 737ms
```

---

## 4. How to Execute Tests Locally

Run the automated test runner batch file:
```cmd
test.bat
```

Or execute directly from the command line:
```cmd
# Run backend tests
cd "D:\90 days\90-days-90-projects-day-08-smartcart-intelligence"
call .venv\Scripts\activate.bat
set PYTHONPATH=%cd%
python -m pytest backend/tests -v

# Run frontend build
cd frontend
npm run build
```
