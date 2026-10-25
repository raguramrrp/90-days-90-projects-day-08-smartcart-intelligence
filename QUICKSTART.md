# SmartCart Intelligence — 2-Minute Quickstart (Windows)

Get the full-stack **SmartCart Intelligence** platform up and running in under 2 minutes.

---

## 1. Prerequisites Check

Ensure you have the following installed on your Windows machine:
1. **Python 3.10+** (Run `python --version` to check)
2. **Node.js 18+** & **npm** (Run `node --version` and `npm --version` to check)

---

## 2. One-Click Automated Setup

Open Command Prompt or PowerShell in the project root directory and run:

```cmd
setup.bat
```

**What `setup.bat` does automatically:**
- Creates a Python virtual environment (`.venv`) if not present.
- Installs backend dependencies (`fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `pytest`, `apscheduler`, etc.).
- Initializes local configuration (`.env`).
- Applies database schema migrations (`alembic upgrade head`).
- Seeds 5 retailers, 9 Indian market products, 14 chronological price points per listing, demo account, watchlists, and alerts.
- Installs frontend packages (`npm install`).

---

## 3. Launch Application

Start both the backend server and frontend development server with one command:

```cmd
run.bat
```

This launches:
- **FastAPI Backend Server:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Vite React Frontend:** `http://localhost:5173`

---

## 4. Sign In with Demo Account

Open `http://localhost:5173` in your browser and use the pre-loaded credentials:
- **Email:** `demo@smartcart.ai`
- **Password:** `SmartCart123!`
*(Or click "Fill Demo Account" on the login modal to populate instantly).*

---

## 5. Run Verification Tests

Run the full automated test suite anytime with:

```cmd
test.bat
```

Executes all **19 Pytest tests** and the **TypeScript production build**.
