#!/bin/bash

# NovaTech Local Setup Script
# Run this script to set up the project locally

set -e

echo "🚀 NovaTech Local Setup"
echo "========================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        return 1
    fi
}

MISSING=0
check_command "node" || MISSING=1
check_command "python3" || MISSING=1
check_command "mongod" || MISSING=1
check_command "yarn" || MISSING=1

if [ $MISSING -eq 1 ]; then
    echo ""
    echo -e "${RED}Please install missing prerequisites before continuing.${NC}"
    exit 1
fi

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet

if [ ! -f ".env" ]; then
    echo "Creating backend .env file..."
    cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=novatech_db
JWT_SECRET=$(openssl rand -hex 32)
MASTER_PASSWORD_1=Asif.?Yek.?NZS.?Baku69!
MASTER_PASSWORD_2=Farhad.?Yek.?NZS.?Polsa69!
EOF
    echo -e "${GREEN}✓${NC} Backend .env created"
else
    echo -e "${YELLOW}!${NC} Backend .env already exists, skipping..."
fi

cd ..

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd frontend

echo "Installing Node dependencies..."
yarn install --silent

if [ ! -f ".env" ]; then
    echo "Creating frontend .env file..."
    cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
    echo -e "${GREEN}✓${NC} Frontend .env created"
else
    echo -e "${YELLOW}!${NC} Frontend .env already exists, skipping..."
fi

cd ..

# Done
echo ""
echo "========================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "To start the application:"
echo ""
echo "1. Start MongoDB:"
echo "   ${YELLOW}mongod${NC}"
echo ""
echo "2. Start Backend (new terminal):"
echo "   ${YELLOW}cd backend && source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload${NC}"
echo ""
echo "3. Start Frontend (new terminal):"
echo "   ${YELLOW}cd frontend && yarn start${NC}"
echo ""
echo "4. Seed database (once):"
echo "   ${YELLOW}curl -X POST http://localhost:8001/api/seed${NC}"
echo ""
echo "Access:"
echo "  - Website: http://localhost:3000"
echo "  - Admin:   http://localhost:3000/nova-admin"
echo ""
echo "Admin Credentials:"
echo "  - Admin 1: farhad.isgandar@gmail.com / Nova.?Oba.?1234!"
echo "  - Admin 2: novatecheducation@gmail.com / Lepe.?Doyen.?Baki1!"
