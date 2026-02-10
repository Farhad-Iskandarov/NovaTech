# NovaTech Education Center - Technical Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Database Structure](#database-structure)
5. [API Reference](#api-reference)
6. [Admin Panel](#admin-panel)
7. [Content Management](#content-management)
8. [Security Implementation](#security-implementation)
9. [Custom Implementations](#custom-implementations)
10. [Local Setup Instructions](#local-setup-instructions)
11. [Environment Variables](#environment-variables)
12. [GitHub Deployment](#github-deployment)

---

## 1. Project Overview

**NovaTech** is a full-stack multilingual (Azerbaijani, English, Russian) educational center website featuring:
- Public-facing website with courses, blog, contact forms
- Admin dashboard for content management
- Analytics tracking
- Trial lesson registration system
- Vacancies and internships management

### Key Features
- 🌐 **Multilingual Support**: AZ, EN, RU with dynamic content switching
- 📱 **Responsive Design**: Mobile-first approach with Tailwind CSS
- 🔐 **Secure Admin Panel**: JWT authentication with role-based access
- 📊 **Analytics Dashboard**: Page views, device stats, traffic tracking
- 📝 **CMS Features**: Manage courses, blogs, testimonials, teachers, etc.

---

## 2. Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Programming Language |
| FastAPI | 0.110.1 | Web Framework |
| Motor | 3.3.1 | Async MongoDB Driver |
| PyMongo | 4.5.0 | MongoDB Driver |
| Pydantic | 2.6.4+ | Data Validation |
| PyJWT | 2.10.1+ | JWT Token Handling |
| Bcrypt | 4.1.3 | Password Hashing |
| Uvicorn | 0.25.0 | ASGI Server |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0 | UI Framework |
| React Router DOM | 7.5.1 | Client-side Routing |
| Tailwind CSS | 3.4.17 | Styling |
| Radix UI | Various | Component Library |
| Framer Motion | 12.29.2 | Animations |
| Axios | 1.8.4 | HTTP Client |
| Recharts | 3.6.0 | Charts/Analytics |
| Lucide React | 0.507.0 | Icons |
| Sonner | 2.0.3 | Toast Notifications |

### Database
| Technology | Purpose |
|------------|---------|
| MongoDB | NoSQL Database |
| Collections | 10 main collections |

---

## 3. Architecture

```
/app
├── backend/
│   ├── server.py          # Main FastAPI application (1700+ lines)
│   ├── requirements.txt   # Python dependencies
│   ├── .env              # Backend environment variables
│   └── tests/            # Test files
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   │   ├── ui/       # Shadcn/Radix UI components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── HeroCarousel.jsx
│   │   │   ├── LogosMarquee.jsx
│   │   │   └── ...
│   │   ├── pages/        # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── CoursesPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminSettings.jsx
│   │   │   └── ... (20 pages total)
│   │   ├── lib/          # Utilities and contexts
│   │   │   ├── LanguageContext.js
│   │   │   ├── SettingsContext.js
│   │   │   ├── ThemeContext.js
│   │   │   ├── translations.js
│   │   │   └── utils.js
│   │   ├── hooks/        # Custom React hooks
│   │   ├── App.js        # Main application component
│   │   ├── index.js      # Entry point
│   │   └── index.css     # Global styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
│
├── memory/
│   └── PRD.md            # Project requirements document
│
└── test_reports/         # Test results
```

### Data Flow
```
User → React Frontend → Axios HTTP → FastAPI Backend → MongoDB
                ↓                           ↓
           localStorage              JWT Token Auth
           (token, lang)             (bcrypt hashing)
```

---

## 4. Database Structure

### Collections Overview

#### `users` Collection
```javascript
{
  "id": "uuid-string",
  "email": "user@example.com",
  "password_hash": "bcrypt-hash",
  "role": "admin",
  "created_at": "2026-02-06T13:43:05.000Z"
}
```

#### `courses` Collection
```javascript
{
  "id": "uuid-string",
  "title": { "en": "...", "az": "...", "ru": "..." },
  "description": { "en": "...", "az": "...", "ru": "..." },
  "duration": "4 months",
  "format": "Hybrid",
  "level": "Beginner",
  "certificate": true,
  "category": "development",
  "outcomes": [{ "en": "...", "az": "...", "ru": "..." }],
  "curriculum": [{ "en": "...", "az": "...", "ru": "..." }],
  "price": "500 AZN",
  "image_url": "https://...",
  "is_popular": true,
  "is_active": true,
  "created_at": "2026-02-06T..."
}
```

#### `blogs` Collection
```javascript
{
  "id": "uuid-string",
  "title": { "en": "...", "az": "...", "ru": "..." },
  "excerpt": { "en": "...", "az": "...", "ru": "..." },
  "slug": "blog-post-slug",
  "content_blocks": [
    { "type": "image", "image_url": "...", "order": 0 },
    { "type": "text", "text": { "en": "...", "az": "...", "ru": "..." }, "order": 1 }
  ],
  "meta_title": { "en": "...", "az": "...", "ru": "..." },
  "meta_description": { "en": "...", "az": "...", "ru": "..." },
  "is_published": true,
  "show_on_homepage": true,
  "created_at": "...",
  "updated_at": "..."
}
```

#### `testimonials` Collection
```javascript
{
  "id": "uuid-string",
  "name": "Student Name",
  "course": "Course Name",
  "content": { "en": "...", "az": "...", "ru": "..." },
  "rating": 5,
  "image_url": "https://...",
  "is_active": true,
  "created_at": "..."
}
```

#### `teachers` Collection
```javascript
{
  "id": "uuid-string",
  "name": "Teacher Name",
  "role": { "en": "...", "az": "...", "ru": "..." },
  "bio": { "en": "...", "az": "...", "ru": "..." },
  "image_url": "https://...",
  "order": 0,
  "is_active": true,
  "created_at": "..."
}
```

#### `slides` Collection (Hero Carousel)
```javascript
{
  "id": "uuid-string",
  "title": { "en": "...", "az": "...", "ru": "..." },
  "subtitle": { "en": "...", "az": "...", "ru": "..." },
  "badge": { "en": "...", "az": "...", "ru": "..." },
  "background_image": "https://...",
  "cta_text": { "en": "...", "az": "...", "ru": "..." },
  "cta_link": "/courses",
  "order": 0,
  "is_active": true,
  "created_at": "..."
}
```

#### `faqs` Collection
```javascript
{
  "id": "uuid-string",
  "course_id": "course-uuid",
  "question": { "en": "...", "az": "...", "ru": "..." },
  "answer": { "en": "...", "az": "...", "ru": "..." },
  "order": 0
}
```

#### `submissions` Collection (Contact & Applications)
```javascript
{
  "id": "uuid-string",
  "type": "contact" | "application",
  "data": {
    "name": "...",
    "email": "...",
    "phone": "...",
    "message": "..."
  },
  "created_at": "...",
  "is_read": false
}
```

#### `trial_lessons` Collection
```javascript
{
  "id": "uuid-string",
  "full_name": "Student Name",
  "contact": "phone or email",
  "course": "Course Name",
  "created_at": "..."
}
```

#### `settings` Collection (Site Configuration)
```javascript
{
  "id": "uuid-string",
  "whatsapp_number": "+994...",
  "contact": {
    "phones": ["+994..."],
    "email": "info@novatech.az",
    "address": { "en": "...", "az": "...", "ru": "..." },
    "google_map_embed": "https://..."
  },
  "social_media": [
    { "platform": "instagram", "url": "https://...", "is_active": true }
  ],
  "working_hours": { "start": "09:00", "end": "17:00" },
  "admin_security_enabled": true,
  "updated_at": "..."
}
```

#### `analytics` Collection
```javascript
{
  "id": "uuid-string",
  "page_path": "/",
  "page_title": "Home",
  "device_type": "desktop",
  "country": "Unknown",
  "timestamp": "..."
}
```

#### `vacancies` Collection
```javascript
{
  "id": "uuid-string",
  "title": { "en": "...", "az": "...", "ru": "..." },
  "department": { "en": "...", "az": "...", "ru": "..." },
  "location": "Baku",
  "job_type": "Full-time",
  "description": { "en": "...", "az": "...", "ru": "..." },
  "is_active": true,
  "created_at": "..."
}
```

#### `internships` Collection
```javascript
{
  "id": "uuid-string",
  "title": { "en": "...", "az": "...", "ru": "..." },
  "category": "IT",
  "duration": "3 months",
  "description": { "en": "...", "az": "...", "ru": "..." },
  "is_active": true,
  "created_at": "..."
}
```

---

## 5. API Reference

### Base URL
- **Local**: `http://localhost:8001/api`
- **Production**: `https://your-domain.com/api`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Admin login | No |
| POST | `/auth/master-login` | Master password bypass | No |
| GET | `/auth/me` | Get current user | Yes |
| PUT | `/auth/admin2/credentials` | Update Admin 2 credentials | Yes (Admin 2 only) |
| GET | `/auth/admin2/check` | Check if user is Admin 2 | Yes |

### Course Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/courses` | List all courses | No |
| GET | `/courses/{id}` | Get single course | No |
| POST | `/courses` | Create course | Yes |
| PUT | `/courses/{id}` | Update course | Yes |
| DELETE | `/courses/{id}` | Delete course | Yes |

### Blog Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/blogs` | List all blogs | No |
| GET | `/blogs/homepage` | Homepage featured blogs | No |
| GET | `/blogs/{slug}` | Get blog by slug | No |
| POST | `/blogs` | Create blog | Yes |
| PUT | `/blogs/{id}` | Update blog | Yes |
| DELETE | `/blogs/{id}` | Delete blog | Yes |

### Other CRUD Endpoints (Same Pattern)
- `/testimonials` - Manage testimonials
- `/teachers` - Manage teachers
- `/slides` - Manage hero slides
- `/faqs/{course_id}` - Manage course FAQs
- `/vacancies` - Manage job vacancies
- `/internships` - Manage internships
- `/cta-sections` - Manage CTA sections

### Form Submission Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/submissions/contact` | Submit contact form | No |
| POST | `/submissions/application` | Submit course application | No |
| GET | `/submissions` | List all submissions | Yes |
| PUT | `/submissions/{id}/read` | Mark as read | Yes |
| DELETE | `/submissions/{id}` | Delete submission | Yes |

### Trial Lesson Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/trial-lessons` | Request trial lesson | No |
| GET | `/trial-lessons` | List all requests | Yes |
| DELETE | `/trial-lessons/{id}` | Delete request | Yes |
| DELETE | `/trial-lessons` | Delete all requests | Yes |

### Settings & Analytics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/settings` | Get site settings | No |
| PUT | `/settings` | Update settings | Yes |
| POST | `/analytics/pageview` | Track page view | No |
| GET | `/analytics/summary` | Get analytics | Yes |
| POST | `/seed` | Seed database | No |

---

## 6. Admin Panel

### Access URL
```
https://your-domain.com/nova-admin
```

### Admin Credentials

#### Admin 1 (Primary Administrator)
| Field | Value |
|-------|-------|
| Email | `farhad.isgandar@gmail.com` |
| Password | `Nova.?Oba.?1234!` |
| Can Edit Own Credentials | ❌ No |

#### Admin 2 (Secondary Administrator)
| Field | Value |
|-------|-------|
| Email | `novatecheducation@gmail.com` |
| Password | `Lepe.?Doyen.?Baki1!` |
| Can Edit Own Credentials | ✅ Yes (via Settings → My Account) |

### Master Bypass Passwords
For emergency access when password is forgotten:
- **Master Password 1**: `Asif.?Yek.?NZS.?Baku69!`
- **Master Password 2**: `Farhad.?Yek.?NZS.?Polsa69!`

### Admin Panel Features

| Section | Features |
|---------|----------|
| **Dashboard** | Analytics overview, device stats, traffic charts, top pages |
| **Hero Slides** | Manage homepage carousel slides |
| **Courses** | CRUD operations for courses with multilingual content |
| **Blog Posts** | Create/edit blog posts with content blocks |
| **Testimonials** | Manage student testimonials |
| **Teachers** | Manage teacher profiles |
| **Vacancies** | Job postings management |
| **Internships** | Internship program management |
| **Submissions** | View contact forms and applications |
| **Trial Lessons** | View trial lesson requests |
| **Site Settings** | WhatsApp, contact info, social media, security |

### Admin 2 Special Feature
Admin 2 has a **"My Account"** tab in Site Settings where they can:
- Change their email address
- Change their password
- All changes require current password verification

### Admin 1 Master Privilege
Admin 1 has a **"Manage Admins"** tab in Site Settings with:
- View Admin 2 account info and status
- Reset Admin 2 password **without** requiring Admin 2's current password
- Full recovery access for Admin 2 credentials

---

## 7. Content Management

### Multilingual Content Structure
All content supports three languages using this structure:
```javascript
{
  "en": "English text",
  "az": "Azərbaycan dilində mətn",
  "ru": "Текст на русском"
}
```

### Course Management
1. Navigate to **Admin → Courses**
2. Click **Add Course** or edit existing
3. Fill in multilingual fields:
   - Title (EN/AZ/RU)
   - Description (EN/AZ/RU)
   - Duration, Format, Level
   - Category (dropdown)
   - Learning Outcomes (list)
   - Curriculum (list)
   - Price, Image URL
   - Popular/Active toggles

### Blog Management
1. Navigate to **Admin → Blog Posts**
2. Create blog with:
   - Multilingual title and excerpt
   - URL slug
   - Content blocks (mix of text and images)
   - Meta title/description for SEO
   - Published/Homepage toggles

### Hero Carousel
1. Navigate to **Admin → Hero Slides**
2. Add slides with:
   - Title, Subtitle, Badge (multilingual)
   - Background image URL
   - CTA button text and link
   - Order and active status

---

## 8. Security Implementation

### Authentication
- **JWT Tokens**: 8-hour expiration
- **Password Hashing**: bcrypt with 12 rounds
- **Password Requirements**: 8+ chars, uppercase, lowercase, number, special char

### Rate Limiting
| Action | Limit | Window |
|--------|-------|--------|
| General requests | 100 | 1 minute |
| Login attempts | 10 | 1 minute |
| Master login attempts | 5 | 1 minute |
| Contact form | 5 | 1 minute |
| Course application | 3 | 1 minute |

### IP Blacklisting
- After 5 failed login attempts, IP is blocked for 1 hour
- Automatic reset after successful login

### Input Sanitization
- XSS protection via HTML escaping
- SQL injection prevention (MongoDB)
- URL validation for image fields
- Content length limits

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'...
```

---

## 9. Custom Implementations

### 1. Partner Logos Carousel
**Location**: `/frontend/src/components/LogosMarquee.jsx`
- Infinite smooth scroll animation
- 4x logo duplication for seamless loop
- Logos: Google, Microsoft, Meta, Amazon, GitHub
- Size: h-14 (larger than default)

### 2. Trial Lesson Form
**Location**: `/frontend/src/pages/HomePage.jsx` → `TrialLessonSection`
- Text input for course name (not dropdown)
- Placeholder: "Kurs adını yazın"
- Submits to `/api/trial-lessons`

### 3. Admin 2 Credential Management
**Location**: 
- Backend: `/backend/server.py` → `update_admin2_credentials`
- Frontend: `/frontend/src/pages/AdminSettings.jsx` → "My Account" tab

Features:
- Only visible to Admin 2
- Email change with validation
- Password change with strength requirements
- Current password verification required

### 4. Language Context System
**Location**: `/frontend/src/lib/LanguageContext.js`
- Stores language preference in localStorage
- Provides `t()` function for translations
- Provides `getContent()` for multilingual objects

### 5. Settings Context
**Location**: `/frontend/src/lib/SettingsContext.js`
- Fetches site settings from API
- Provides WhatsApp URL generator
- Auto-refreshes on changes

---

## 10. Local Setup Instructions

### Prerequisites
| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| MongoDB | 6.0+ | https://mongodb.com |
| Yarn | 1.22+ | `npm install -g yarn` |
| Git | Latest | https://git-scm.com |

### Step-by-Step Setup

#### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/NovaTech.git
cd NovaTech
```

#### 2. Setup MongoDB
```bash
# Start MongoDB service
# On macOS:
brew services start mongodb-community

# On Ubuntu:
sudo systemctl start mongod

# On Windows:
net start MongoDB
```

#### 3. Setup Backend
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=novatech_db
JWT_SECRET=your-secret-key-here-change-in-production
MASTER_PASSWORD_1=Asif.?Yek.?NZS.?Baku69!
MASTER_PASSWORD_2=Farhad.?Yek.?NZS.?Polsa69!
EOF

# Start backend server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

#### 4. Setup Frontend
```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
yarn install

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Start frontend development server
yarn start
```

#### 5. Seed Database
```bash
# In a new terminal or browser
curl -X POST http://localhost:8001/api/seed
```

#### 6. Access Application
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/nova-admin
- **API Docs**: http://localhost:8001/docs (if enabled)

### Quick Start Script
Create `start-local.sh`:
```bash
#!/bin/bash

# Start MongoDB (if not running)
mongod --fork --logpath /var/log/mongodb.log

# Start Backend
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload &

# Start Frontend
cd ../frontend
yarn start &

# Seed database
sleep 5
curl -X POST http://localhost:8001/api/seed

echo "NovaTech is running!"
echo "Frontend: http://localhost:3000"
echo "Admin: http://localhost:3000/nova-admin"
```

---

## 11. Environment Variables

### Backend (`/backend/.env`)
```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=novatech_db

# Security (CHANGE IN PRODUCTION!)
JWT_SECRET=your-random-secret-key-at-least-32-characters
MASTER_PASSWORD_1=Asif.?Yek.?NZS.?Baku69!
MASTER_PASSWORD_2=Farhad.?Yek.?NZS.?Polsa69!

# Optional
CORS_ORIGINS=*
```

### Frontend (`/frontend/.env`)
```env
# API URL - Change for production
REACT_APP_BACKEND_URL=http://localhost:8001

# Optional (for development)
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

### Production Environment Variables
For deployment, ensure these are set securely:
1. `JWT_SECRET` - Generate with `openssl rand -hex 32`
2. `MONGO_URL` - Your MongoDB Atlas or production DB URL
3. `REACT_APP_BACKEND_URL` - Your production API URL

---

## 12. GitHub Deployment

### Pre-Push Checklist
✅ All environment variables use `process.env` / `os.environ`
✅ No hardcoded credentials in code
✅ `.env` files are in `.gitignore`
✅ MongoDB connection string is configurable
✅ CORS settings allow production domain

### Files to Exclude (already in .gitignore)
```gitignore
# Environment
.env
.env.local
.env.production

# Dependencies
node_modules/
venv/
__pycache__/

# Build
build/
dist/

# IDE
.vscode/
.idea/

# Logs
*.log
```

### Deployment Options

#### Option 1: Traditional VPS
1. Push to GitHub
2. SSH into server
3. Clone repository
4. Setup MongoDB
5. Create `.env` files
6. Install dependencies
7. Use PM2/Supervisor for process management
8. Configure Nginx as reverse proxy

#### Option 2: Docker (Recommended)
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongo:27017
      - DB_NAME=novatech_db
    depends_on:
      - mongo
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://backend:8001
  
  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

#### Option 3: Vercel + MongoDB Atlas
1. Deploy frontend to Vercel
2. Deploy backend to Railway/Render
3. Use MongoDB Atlas for database
4. Configure environment variables in each platform

### GitHub Actions CI/CD (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest
```

---

## 📞 Support Information

### Project Contacts
- **Primary Admin**: farhad.isgandar@gmail.com
- **Secondary Admin**: novatecheducation@gmail.com

### Technical Notes
- Backend runs on port **8001**
- Frontend runs on port **3000**
- Admin panel path: `/nova-admin`
- All API routes prefixed with `/api`

### Common Issues

**Issue**: "Cannot connect to MongoDB"
**Solution**: Ensure MongoDB is running: `mongod` or `brew services start mongodb-community`

**Issue**: "CORS error"
**Solution**: Check `REACT_APP_BACKEND_URL` matches actual backend URL

**Issue**: "JWT token expired"
**Solution**: Tokens expire after 8 hours. Re-login to get new token.

---

*Documentation last updated: February 6, 2026*
*Project Version: 1.0.0*
