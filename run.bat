@echo off
setlocal

echo =====================================================================
echo  SmartCart Intelligence - Launching Services
echo  Day 8: 90 Days - 90 Projects Challenge
echo =====================================================================

cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found. Please run setup.bat first!
    pause
    exit /b 1
)

echo Starting FastAPI Backend on port 8000...
start "SmartCart Backend - FastAPI (Port 8000)" cmd /k "cd /d "%~dp0" && set PYTHONPATH=%~dp0 && call .venv\Scripts\activate.bat && uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite React Frontend on port 5173...
start "SmartCart Frontend - Vite (Port 5173)" cmd /k "cd /d "%~dp0\frontend" && npm run dev"

echo.
echo =====================================================================
echo  Services launched successfully in dedicated windows!
echo.
echo  Web Application:   http://localhost:5173
echo  FastAPI Swagger:   http://127.0.0.1:8000/docs
echo  FastAPI Health:    http://127.0.0.1:8000/health
echo.
echo  Demo Credentials:
echo    Email:    demo@smartcart.ai
echo    Password: SmartCart123!
echo.
echo  To shut down services, close the respective terminal windows.
echo =====================================================================
