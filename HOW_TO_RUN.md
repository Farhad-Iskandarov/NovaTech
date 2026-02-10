# 🚀 How to Run NovaTech Education Center Locally

A step-by-step guide to run the full-stack NovaTech application on your local machine.

---

## Prerequisites

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ (comes with Node) | `npm --version` |
| **Python** | 3.11+ | `python --version` |
| **MongoDB** | 6.0+ | `mongod --version` |

> [!NOTE]
> The project's `package.json` specifies Yarn, but **npm works fine** as an alternative.

---

## 1. Clone & Navigate

```bash
git clone https://github.com/YOUR_USERNAME/NovaTech.git
cd NovaTech
```

---

## 2. Backend Setup

### 2.1 Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```


### 2.2 Create Backend `.env`

Create a file `backend/.env` with:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=novatech_db
JWT_SECRET=your-secret-key-change-this
```

---

## 3. Frontend Setup

### 3.1 Install Node Dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

> [!IMPORTANT]
> The `--legacy-peer-deps` flag is required because some dependencies (e.g., `react-scripts 5.0.1`) have peer dependency conflicts with React 19.

### 3.2 Fix `ajv` Module Error (Node.js 22+)

If you see `Cannot find module 'ajv/dist/compile/codegen'`, run:

```bash
npm install ajv@8.17.1 --legacy-peer-deps
```

### 3.3 Create Frontend `.env`

Create a file `frontend/.env` with:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## 4. Start the Application

You need **three terminals** running simultaneously:

### Terminal 1 — MongoDB

```bash
mongod
```

### Terminal 2 — Backend (FastAPI)

```bash
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Terminal 3 — Frontend (React)

```bash
cd frontend
npm start
```

> [!TIP]
> On Windows with Node.js 22+, if `npm start` fails, try: `npx craco start`

---

## 5. Seed the Database (First Run Only)

After both servers are running, seed the database with initial data (admin users, sample courses, etc.):

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:8001/api/seed" -Method POST
```

**Bash / curl:**
```bash
curl -X POST http://localhost:8001/api/seed
```

---

## 6. Access the Application

| Page | URL |
|------|-----|
| 🌐 **Website** | http://localhost:3000 |
| 🔧 **Admin Panel** | http://localhost:3000/nova-admin |
| ⚡ **Backend API** | http://localhost:8001/api |

---

## 🔐 Admin Panel Login

### Default Admin Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin 1 | `farhad.isgandar@gmail.com` | `Nova.?Oba.?1234!` |
| Admin 2 | `novatecheducation@gmail.com` | `Lepe.?Doyen.?Baki1!` |

> [!CAUTION]
> You **must seed the database** (Step 5) before these credentials will work.

### Master Bypass Login (Password Recovery)

If you're locked out or forgot a password, you can use the master bypass login at `/api/auth/master-login` with:

| Field | Value |
|-------|-------|
| Master Password 1 | `Asif.?Yek.?NZS.?Baku69!` |
| Master Password 2 | `Farhad.?Yek.?NZS.?Polsa69!` |

This bypasses the regular password check — you only need to provide the admin email + both master passwords.

---

## 🛠 Troubleshooting

| Problem | Solution |
|---------|----------|

| npm peer dependency errors | Use `npm install --legacy-peer-deps` |
| `Cannot find module 'ajv/dist/compile/codegen'` | Run `npm install ajv@8.17.1 --legacy-peer-deps` |
| Frontend won't start on Node 22+ | Use `npx craco start` instead of `npm start` |
| Admin login returns "Invalid credentials" | Seed the database first: `POST /api/seed` |
| MongoDB connection refused | Make sure `mongod` is running on port 27017 |
