@echo off
setlocal

echo =====================================================================
echo  SmartCart Intelligence - Automated Test Runner
echo  Day 8: 90 Days - 90 Projects Challenge
echo =====================================================================

cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found. Please run setup.bat first!
    exit /b 1
)

call .venv\Scripts\activate.bat
set PYTHONPATH=%~dp0

echo.
echo [1/2] Running Backend Pytest Suite...
echo ---------------------------------------------------------------------
python -m pytest backend/tests -v --disable-warnings
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FAIL] Backend tests failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Running Frontend TypeScript Typecheck and Production Build...
echo ---------------------------------------------------------------------
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FAIL] Frontend build failed!
    cd ..
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo =====================================================================
echo  [ALL TESTS PASSED] Full stack verified and build ready!
echo =====================================================================
