@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo  SmartCart Intelligence - Automated Environment Setup
echo  Day 8: 90 Days - 90 Projects Challenge
echo =====================================================================

cd /d "%~dp0"

echo [1/6] Checking Python and Node.js prerequisites...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.10+ and add to PATH.
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not found in PATH. Please install Node.js 18+ and add to PATH.
    pause
    exit /b 1
)

echo [2/6] Verifying Python virtual environment (.venv)...
if not exist ".venv\Scripts\activate.bat" (
    echo Creating virtual environment in .venv...
    python -m venv .venv
)

call .venv\Scripts\activate.bat

echo [3/6] Installing backend dependencies...
python -m pip install -r backend\requirements.txt --quiet

echo [4/6] Initializing local configuration (.env)...
if not exist ".env" (
    echo Creating .env from .env.example...
    copy .env.example .env >nul
)

set PYTHONPATH=%~dp0

echo [5/6] Running database migrations and seeding initial data...
cd backend
python -m alembic upgrade head
cd ..
python -m backend.app.seed_data

echo [6/6] Installing frontend packages...
cd frontend
call npm install --quiet
cd ..

echo =====================================================================
echo  [SUCCESS] SmartCart Intelligence environment is ready!
echo  
echo  Next steps:
echo    1. Start the platform:   run.bat
echo    2. Execute tests:        test.bat
echo    3. Open in browser:      http://localhost:5173
echo    4. API Swagger Docs:     http://localhost:8000/docs
echo =====================================================================

pause
