# 🚀 Smart Campus - Run Instructions

This document provides step-by-step instructions to run the Smart Campus backend API and frontend application locally, along with test credentials.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Python 3.10+**
- **Node.js 20+**
- **PostgreSQL 15+**

---

## 1. Start the Backend API (FastAPI)

The backend runs on Python using FastAPI and PostgreSQL. You should run these commands in a new terminal window.

```bash
# 1. Navigate to the backend folder
cd /home/ngadmin/smartcampus/backend

# 2. Activate the virtual environment
source venv/bin/activate

# 3. Install requirements (first time only)
pip install -r requirements.txt

# 4. Start the FastAPI server (Listens on all network interfaces)
uvicorn app.main:app --host 0.0.0.0 --port 8007 --reload
```
✅ **Backend API will run on:** `http://localhost:8007` (and your network IP)
📄 **Interactive API Docs (Swagger):** `http://localhost:8007/docs`

### 🔄 Applying Migrations / Updating Code
When pulling the latest code onto a server or existing environment, migrations run automatically on backend startup. To manually run all schema migrations and sync dynamic menus:

**Local Environment:**
```bash
cd backend
source venv/bin/activate
python scripts/run_migrations.py
```

**Docker Environment:**
```bash
docker compose exec backend python scripts/run_migrations.py
```

### 🔄 Optional: Resetting the Database
If you ever need to wipe the database clean and re-seed it with the default test data, you can run the reset script while the virtual environment is active:
```bash
cd /home/ngadmin/smartcampus/backend
source venv/bin/activate
python reset_db.py
```

---

## 2. Start the Frontend App (React + Vite)

The frontend is a React application built with Vite. Open a **second terminal window** for these commands.

```bash
# 1. Navigate to the frontend folder
cd /home/ngadmin/smartcampus/frontend

# 2. Install Node.js dependencies (first time only)
npm install

# 3. Start the Vite development server
npm run dev
```
✅ **Frontend Application will run on:** `http://localhost:5173/`

---

## 🔐 Login Credentials for Testing

When the database is reset and seeded, it generates multiple users across two different "Tenants" (organizations) with role-based access. You can use the following credentials to log in and test the platform:

### 👑 Super Admin (Platform Level)
Has overarching access to the entire platform. *(Click "Platform Admin Login" at the bottom of the login page - no Workspace ID required)*
- **Username:** `superadmin`
- **Password:** `admin123`

### 🏢 Tenant 1: East Point Trust
**Workspace ID:** `east-point`
- **Admin (Full Access):** `admin` | Password: `admin123`
- **Purchase Manager:** `purchase_mgr` | Password: `pass123`
- **Store Keeper:** `storekeeper` | Password: `pass123`
- **Site Engineer:** `engineer1` | Password: `pass123`
- **Security / Gate:** `security` | Password: `pass123`

### 🏥 Tenant 2: City Medical Campus Trust
**Workspace ID:** `cmc-trust`
- **Admin (Full Access):** `cmc_admin` | Password: `admin123`

You can use any of these emails along with their respective passwords on the login page to explore the application from different perspectives and roles!

---

## 🌐 Accessing the Application from Another Device

To access the application from a different computer or mobile device on the same local network:

1. Ensure both the **Backend** and **Frontend** are running.
2. Find the IP address of the machine running the application (e.g., `192.168.0.2`).
3. On your other device, open a web browser and navigate to:
   `http://192.168.0.2:5173/` *(Replace with your actual IP address)*

The frontend is dynamically configured to route API requests to the exact same IP address on port `8007`!
