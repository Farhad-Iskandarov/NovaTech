# NovaTech Education Center

A full-stack multilingual (AZ/EN/RU) educational center website with admin dashboard.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB 6.0+
- Yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Farhad-Iskandarov/NovaTech
cd NovaTech

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create backend .env
echo 'MONGO_URL=mongodb://localhost:27017
DB_NAME=novatech_db
JWT_SECRET=your-secret-key-change-this' > .env

# Frontend setup
cd ../frontend
yarn install

# Create frontend .env
echo 'REACT_APP_BACKEND_URL=http://localhost:8001' > .env
```

### Running Locally

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend && source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 3: Start Frontend
cd frontend && yarn start

# Seed database (once)
curl -X POST http://localhost:8001/api/seed
```

### Access
- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/nova-admin

## 🔐 Admin Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin 1 | farhad.isgandar@gmail.com | Nova.?Oba.?1234! |
| Admin 2 | novatecheducation@gmail.com | Lepe.?Doyen.?Baki1! |

## 📁 Project Structure

```
/app
├── backend/           # FastAPI Python backend
│   ├── server.py     # Main application
│   └── requirements.txt
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
└── TECHNICAL_DOCUMENTATION.md
```

## 🛠 Tech Stack

- **Backend**: FastAPI, MongoDB, PyJWT, Bcrypt
- **Frontend**: React 19, Tailwind CSS, Radix UI, Framer Motion
- **Database**: MongoDB

## 📖 Documentation

See [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) for complete technical details.

## 📄 License

Private - All rights reserved.
