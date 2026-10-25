# SmartCart Intelligence — Troubleshooting & FAQs

This guide addresses common issues encountered when setting up, testing, and running SmartCart Intelligence on Windows workstations.

---

## 1. Python Environment & Path Issues

### Issue: `'python' is not recognized as an internal or external command`
- **Cause:** Python is not added to your system `PATH` variable.
- **Solution:**
  1. Open Windows Search and type **"Environment Variables"**.
  2. Click **"Edit the system environment variables"** -> **"Environment Variables"**.
  3. Under **User variables**, select `Path` and click **Edit**.
  4. Ensure your Python installation directory (e.g. `C:\Users\<User>\AppData\Local\Programs\Python\Python314`) and its `Scripts` folder are included.

### Issue: `Activate.ps1 cannot be loaded because running scripts is disabled`
- **Cause:** Windows PowerShell execution policy restricts script execution by default.
- **Solution:**
  Run the command below in your PowerShell window:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
  Alternatively, use the command prompt `call .venv\Scripts\activate.bat`.

---

## 2. Port Collisions (Ports 8000 & 5173)

### Issue: `[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)`
- **Cause:** Another instance of Uvicorn or another service is already using port 8000.
- **Solution:**
  1. Find the process using port 8000:
     ```cmd
     netstat -ano | findstr :8000
     ```
  2. Note the process ID (PID in the rightmost column) and kill it:
     ```cmd
     taskkill /PID <PID> /F
     ```
  3. Alternatively, launch Uvicorn on another port:
     ```cmd
     uvicorn backend.app.main:app --port 8001
     ```

### Issue: Vite selects port 5174 instead of 5173
- **Cause:** Port 5173 is occupied by a previous Vite instance.
- **Solution:** Terminate the node process using `taskkill /IM node.exe /F` or allow Vite to use port 5174.

---

## 3. Database Operations & SQLite Locks

### Issue: `sqlite3.OperationalError: database is locked`
- **Cause:** Another process or background worker holds an exclusive write lock on `smartcart.db`.
- **Solution:**
  1. Ensure no rogue Python processes are running:
     ```cmd
     taskkill /IM python.exe /F
     ```
  2. Re-run your operation.

### How to completely reset and re-seed the database:
If you want to clear all data and start with a fresh seed:
```cmd
cd /d "D:\90 days\90-days-90-projects-day-08-smartcart-intelligence"
del smartcart.db
call .venv\Scripts\activate.bat
set PYTHONPATH=%cd%
cd backend
python -m alembic upgrade head
cd ..
python -m backend.app.seed_data
```

---

## 4. Frontend Compilation & Vite Warnings

### Issue: `(!) Some chunks are larger than 500 kB after minification`
- **Explanation:** This is a standard Vite warning during production build because Lucide Icons and Recharts are bundled together. It does not affect functionality, performance, or deployment.

---

## 5. Network & Windows Firewall Prompts

### Issue: Windows Defender Firewall prompt appears on first launch
- **Explanation:** When Uvicorn binds to `127.0.0.1:8000`, Windows may ask for permission to open local network sockets.
- **Action:** Check **"Private networks"** and click **"Allow access"**. The application only binds to loopback (`127.0.0.1`) and does not expose external ports.
