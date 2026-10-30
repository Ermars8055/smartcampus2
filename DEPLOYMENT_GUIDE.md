# All-in-One VPS Docker Deployment Guide

This guide walks you through deploying the complete **SmartCampus / FacilityFlow** platform (PostgreSQL Database, FastAPI Backend, React Web Frontend, and mobile API connectivity) onto a single Linux VPS (Ubuntu 22.04 / 24.04 LTS) using Docker & Docker Compose.

---

## 🏗 System Architecture

```
[ Internet / Mobile App / Web Browser ]
                   │
                   ▼ (Ports 80 / 443 - HTTPS)
┌────────────────────────────────────────────────────────┐
│ Host VPS (Reverse Proxy: Nginx + Let's Encrypt SSL)     │
└──────────────────┬─────────────────────────────────────┘
                   │ Proxy to 127.0.0.1:8080
                   ▼
┌────────────────────────────────────────────────────────┐
│ Docker Compose Network                                 │
│                                                        │
│  ┌────────────────────────┐   ┌─────────────────────┐ │
│  │   frontend (Nginx)     │──▶│   backend (FastAPI) │ │
│  │   Port 8080 (Web SPA)  │   │   Port 8000 (Python)│ │
│  └────────────────────────┘   └──────────┬──────────┘ │
│                                          │             │
│                               ┌──────────▼──────────┐ │
│                               │      db (Postgres)  │ │
│                               │      Port 5432      │ │
│                               └─────────────────────┘ │
│                                                        │
│  Persistent Volumes:                                   │
│   • pgdata (Database tables & records)                 │
│   • uploads_data (Complaint photos & signed reports)  │
└────────────────────────────────────────────────────────┘
```

---

## 🖥 1. Recommended VPS Specifications

* **Operating System:** Ubuntu 22.04 LTS or 24.04 LTS (64-bit)
* **CPU:** 2 vCPU cores (minimum)
* **RAM:** 4 GB RAM (or 2 GB RAM + 2 GB Swap file)
* **Disk:** 40 GB+ SSD
* **Providers:** Hetzner, DigitalOcean, Linode, AWS EC2 (t3.medium), Contabo, etc.
* **Domain Name:** An active domain or subdomain pointing to your VPS IP address (e.g., `smartcampus.yourhospital.com`).

---

## 🚀 Step-by-Step Deployment

### Step 1: Server Hardening & Swap Setup

SSH into your fresh VPS as `root`:
```bash
ssh root@YOUR_SERVER_IP
```

Update packages:
```bash
apt update && apt upgrade -y
apt install -y git curl ufw unattended-upgrades fail2ban
```

#### Set up a 2GB Swap File (Crucial for stability on 2GB–4GB VPS):
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

#### Configure Basic Firewall (UFW):
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

---

### Step 2: Install Docker Engine & Docker Compose

Run Docker's official automated installation script:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

Verify installation:
```bash
docker --version
docker compose version
```

Enable Docker service on boot:
```bash
systemctl enable --now docker
```

---

### Step 3: Clone Codebase & Configure Environment

Create an application directory and clone your repository:
```bash
mkdir -p /opt/facilityflow
cd /opt/facilityflow

# Clone your repository (replace with your git URL)
git clone <YOUR_GIT_REPO_URL> .
```

#### Create the Production `.env` File:
```bash
cp .env.example .env
nano .env
```

Generate secure secrets for your `.env` using OpenSSL:
```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate secure Postgres password
openssl rand -hex 16
```

Fill in your `.env` file:
```ini
# Database Configuration
POSTGRES_DB=smartcampus_prod
POSTGRES_USER=smartcampus_user
POSTGRES_PASSWORD=USE_GENERATED_PASSWORD_HERE

# Backend Configuration
SECRET_KEY=USE_GENERATED_OPENSSL_SECRET_HERE
SUPERADMIN_PASSWORD=SetAStrongMasterAdminPassword123!
FRONTEND_URL=https://smartcampus.yourhospital.com
CORS_ORIGINS=https://smartcampus.yourhospital.com

# Frontend Configuration (blank for relative proxy)
VITE_API_URL=
```
Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

---

### Step 4: Build & Launch Containers

Run Docker Compose to build and start the database, backend, and frontend containers:
```bash
cd /opt/facilityflow
docker compose up -d --build
```

#### Check Container Status:
```bash
docker compose ps
```
You should see all 3 containers with status `Up` (and healthy):
* `facilityflow-db-1` (healthy)
* `facilityflow-backend-1` (healthy)
* `facilityflow-frontend-1` (running on `0.0.0.0:8080->80/tcp`)

#### Inspect Logs:
```bash
docker compose logs -f backend
```

---

### Step 5: Configure Domain & Free SSL (Nginx + Certbot)

Install Nginx and Certbot on the host VPS:
```bash
apt install -y nginx certbot python3-certbot-nginx
```

#### Create Nginx Reverse Proxy Config:
```bash
nano /etc/nginx/sites-available/smartcampus
```

Paste the following configuration (replace `smartcampus.yourhospital.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name smartcampus.yourhospital.com;

    # Maximum upload size for photos and PDFs (50MB)
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site and verify:
```bash
ln -s /etc/nginx/sites-available/smartcampus /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

#### Obtain Free SSL Certificate (Let's Encrypt):
```bash
certbot --nginx -d smartcampus.yourhospital.com
```
* Follow the on-screen prompts. Certbot will automatically configure HTTPS redirect and SSL certificates with auto-renewal.

Now open `https://smartcampus.yourhospital.com` in your browser. The web application is live with valid SSL!

---

### Step 6: Initial Database Seed / Migrations

Run database initialization / migrations inside the running backend container:
```bash
docker compose exec backend python -c "from app.database import engine, Base; from app import models; Base.metadata.create_all(bind=engine)"
```

Seed initial master data or superadmin (if applicable):
```bash
docker compose exec backend python -m app.scripts.seed_data
```

---

### Step 7: Connect the Flutter Mobile App (FacilityFlow APK)

To connect the mobile app to your newly deployed VPS server:

1. In your local repository, edit `smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow/.env`:
   ```ini
   API_URL=https://smartcampus.yourhospital.com
   ```

2. Build the production release APK:
   ```bash
   cd smartcampusAPP/52409c58-88e7-42ca-ab6e-6e2f5bbbf035/facilityflow
   flutter build apk --release
   ```

3. The generated APK file will be located at:
   `build/app/outputs/flutter-apk/app-release.apk`
   Install this APK on technicians' Android phones.

---

## 🛠 Daily Operations & Maintenance Commands

### 1. View Live Logs:
```bash
# All containers
docker compose logs -f

# Backend only
docker compose logs -f backend

# Database only
docker compose logs -f db
```

### 2. Update Application When Code Changes:
```bash
cd /opt/facilityflow
git pull origin main
docker compose up -d --build
```

### 3. Automated Daily Database Backup:
Create a backup directory:
```bash
mkdir -p /opt/backups
```

Run a backup test:
```bash
docker compose exec -T db pg_dump -U smartcampus_user smartcampus_prod | gzip > /opt/backups/backup_$(date +%F).sql.gz
```

Set up a daily cron job at 2:00 AM:
```bash
crontab -e
```
Add line:
```cron
0 2 * * * cd /opt/facilityflow && docker compose exec -T db pg_dump -U smartcampus_user smartcampus_prod | gzip > /opt/backups/backup_$(date +\%F).sql.gz && find /opt/backups -type f -mtime +14 -delete
```
*(This automatically creates a compressed daily backup and removes backups older than 14 days).*

### 4. Restarting Services:
```bash
# Restart everything
docker compose restart

# Restart backend alone
docker compose restart backend
```
