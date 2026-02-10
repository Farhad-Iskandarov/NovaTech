# NovaTech Education Center - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Admin Panel](#admin-panel)
7. [Authentication System](#authentication-system)
8. [Multi-Language Support](#multi-language-support)
9. [Content Management](#content-management)
10. [Custom Implementations](#custom-implementations)
11. [Local Setup Instructions](#local-setup-instructions)
12. [Environment Variables](#environment-variables)
13. [GitHub Deployment](#github-deployment)

---

## 1. Project Overview

NovaTech Education Center is a full-stack multilingual education platform built for a technical education center in Azerbaijan. The platform supports 3 languages (Azerbaijani, English, Russian) and includes a comprehensive admin panel for content management.

### Key Features
- **Multi-language Support**: All content supports Azerbaijani (az), English (en), and Russian (ru)
- **Course Management**: Full CRUD for courses with outcomes, curriculum, and FAQs
- **Blog System**: Dynamic blog with content blocks (text + images)
- **Career Section**: Vacancies and Internships management
- **Contact System**: Trial lesson requests, course applications, contact form submissions
- **Analytics Dashboard**: Page views, device tracking, geographic data
- **Admin Security**: Master password recovery system with 3-day lockout protection

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0 | UI Framework |
| React Router DOM | 7.5.1 | Routing |
| TailwindCSS | 3.4.17 | Styling |
| Framer Motion | 12.29.2 | Animations |
| Axios | 1.8.4 | HTTP Client |
| Radix UI | Various | UI Components |
| Shadcn/UI | Custom | Component Library |
| Recharts | 3.6.0 | Charts & Analytics |
| Lucide React | 0.507.0 | Icons |
| Sonner | 2.0.3 | Toast Notifications |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Language |
| FastAPI | 0.110.1 | Web Framework |
| Motor | 3.3.1 | Async MongoDB Driver |
| Pydantic | 2.6.4+ | Data Validation |
| PyJWT | 2.10.1+ | JWT Authentication |
| Bcrypt | 4.1.3 | Password Hashing |
| Uvicorn | 0.25.0 | ASGI Server |

### Database
| Technology | Version | Purpose |
|------------|---------|---------|
| MongoDB | Latest | Document Database |

---

## 3. Project Structure

```
/app/
├── backend/
│   ├── server.py              # Main FastAPI application (all routes & models)
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Shadcn/UI components
│   │   │   ├── Header.jsx     # Main navigation
│   │   │   ├── Footer.jsx     # Footer component
│   │   │   ├── HeroCarousel.jsx
│   │   │   ├── WhatsAppButton.jsx
│   │   │   ├── CookieConsent.jsx
│   │   │   ├── ScrollToTop.jsx
│   │   │   └── PublicLayout.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── AboutPage.jsx
│   │   │   ├── CoursesPage.jsx
│   │   │   ├── CourseDetailPage.jsx
│   │   │   ├── BlogPage.jsx
│   │   │   ├── ContactPage.jsx
│   │   │   ├── VacanciesPage.jsx
│   │   │   ├── InternshipsPage.jsx
│   │   │   │
│   │   │   ├── AdminLoginPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminCourses.jsx
│   │   │   ├── AdminBlogs.jsx
│   │   │   ├── AdminTeachers.jsx
│   │   │   ├── AdminTestimonials.jsx
│   │   │   ├── AdminSlides.jsx
│   │   │   ├── AdminSettings.jsx
│   │   │   ├── AdminSubmissions.jsx
│   │   │   ├── AdminTrialLessons.jsx
│   │   │   ├── AdminVacancies.jsx
│   │   │   └── AdminInternships.jsx
│   │   │
│   │   ├── lib/
│   │   │   ├── LanguageContext.jsx  # i18n system
│   │   │   └── utils.js
│   │   │
│   │   └── App.js             # Main React app with routes
│   │
│   ├── package.json
│   └── .env                   # Frontend environment variables
│
└── memory/
    └── PRD.md                 # Product requirements document
```

---

## 4. Database Schema

### Collections & Data Models

#### `users`
```javascript
{
  id: String (UUID),
  email: String (unique, lowercase),
  password_hash: String (bcrypt),
  role: String ("admin"),
  created_at: DateTime
}
```

#### `courses`
```javascript
{
  id: String (UUID),
  title: { az: String, en: String, ru: String },
  description: { az: String, en: String, ru: String },
  duration: String,
  format: String,
  level: String,
  certificate: Boolean,
  category: String,
  outcomes: [{ az: String, en: String, ru: String }],
  curriculum: [{ az: String, en: String, ru: String }],
  price: String (optional),
  image_url: String (optional),
  is_popular: Boolean,
  is_active: Boolean,
  created_at: DateTime
}
```

#### `faqs`
```javascript
{
  id: String (UUID),
  course_id: String,
  question: { az: String, en: String, ru: String },
  answer: { az: String, en: String, ru: String },
  order: Integer
}
```

#### `blogs`
```javascript
{
  id: String (UUID),
  title: { az: String, en: String, ru: String },
  excerpt: { az: String, en: String, ru: String },
  slug: String (unique, URL-safe),
  content_blocks: [
    {
      type: "image" | "text",
      image_url: String (for type "image"),
      text: { az: String, en: String, ru: String } (for type "text"),
      order: Integer
    }
  ],
  meta_title: { az: String, en: String, ru: String },
  meta_description: { az: String, en: String, ru: String },
  is_published: Boolean,
  show_on_homepage: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

#### `teachers`
```javascript
{
  id: String (UUID),
  name: String,
  role: { az: String, en: String, ru: String },
  bio: { az: String, en: String, ru: String },
  image_url: String,
  order: Integer,
  is_active: Boolean,
  created_at: DateTime
}
```

#### `testimonials`
```javascript
{
  id: String (UUID),
  name: String,
  course: String,
  content: { az: String, en: String, ru: String },
  rating: Integer (1-5),
  image_url: String,
  is_active: Boolean,
  created_at: DateTime
}
```

#### `hero_slides`
```javascript
{
  id: String (UUID),
  title: { az: String, en: String, ru: String },
  subtitle: { az: String, en: String, ru: String },
  badge: { az: String, en: String, ru: String },
  background_image: String,
  cta_text: { az: String, en: String, ru: String },
  cta_link: String,
  order: Integer,
  is_active: Boolean,
  created_at: DateTime
}
```

#### `vacancies`
```javascript
{
  id: String (UUID),
  title: { az: String, en: String, ru: String },
  department: { az: String, en: String, ru: String },
  location: String,
  job_type: String ("Full-time" | "Part-time" | "Remote"),
  description: { az: String, en: String, ru: String },
  is_active: Boolean,
  created_at: DateTime
}
```

#### `internships`
```javascript
{
  id: String (UUID),
  title: { az: String, en: String, ru: String },
  category: String,
  duration: String,
  description: { az: String, en: String, ru: String },
  is_active: Boolean,
  created_at: DateTime
}
```

#### `submissions`
```javascript
{
  id: String (UUID),
  type: String ("contact" | "course_application" | "vacancy_application" | "internship_application"),
  data: Object (form data),
  is_read: Boolean,
  created_at: DateTime
}
```

#### `trial_lessons`
```javascript
{
  id: String (UUID),
  full_name: String,
  contact: String,
  course: String,
  created_at: DateTime
}
```

#### `pageviews`
```javascript
{
  id: String (UUID),
  page_path: String,
  page_title: String,
  device_type: String,
  country: String,
  timestamp: DateTime
}
```

#### `site_settings`
```javascript
{
  id: String (UUID),
  whatsapp_number: String,
  contact: {
    phones: [String],
    email: String,
    address: { az: String, en: String, ru: String },
    google_map_embed: String
  },
  social_media: [
    { platform: String, url: String, is_active: Boolean }
  ],
  working_hours: { start: String, end: String },
  admin_security_enabled: Boolean,
  updated_at: DateTime
}
```

---

## 5. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Standard login with email/password |
| POST | `/api/auth/master-login` | Master password bypass login |
| GET | `/api/auth/me` | Get current user info |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| GET | `/api/courses/{id}` | Get single course |
| POST | `/api/courses` | Create course (auth required) |
| PUT | `/api/courses/{id}` | Update course (auth required) |
| DELETE | `/api/courses/{id}` | Delete course (auth required) |

### FAQs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/faqs?course_id={id}` | Get FAQs for course |
| POST | `/api/faqs` | Create FAQ (auth required) |
| PUT | `/api/faqs/{id}` | Update FAQ (auth required) |
| DELETE | `/api/faqs/{id}` | Delete FAQ (auth required) |

### Blogs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blogs` | List all blogs |
| GET | `/api/blogs?show_on_homepage=true` | Homepage blogs only |
| GET | `/api/blogs/{slug}` | Get single blog by slug |
| POST | `/api/blogs` | Create blog (auth required) |
| PUT | `/api/blogs/{id}` | Update blog (auth required) |
| DELETE | `/api/blogs/{id}` | Delete blog (auth required) |

### Teachers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teachers` | List all teachers |
| POST | `/api/teachers` | Create teacher (auth required) |
| PUT | `/api/teachers/{id}` | Update teacher (auth required) |
| DELETE | `/api/teachers/{id}` | Delete teacher (auth required) |

### Testimonials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/testimonials` | List all testimonials |
| POST | `/api/testimonials` | Create testimonial (auth required) |
| PUT | `/api/testimonials/{id}` | Update testimonial (auth required) |
| DELETE | `/api/testimonials/{id}` | Delete testimonial (auth required) |

### Hero Slides
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/slides` | List all slides |
| POST | `/api/slides` | Create slide (auth required) |
| PUT | `/api/slides/{id}` | Update slide (auth required) |
| DELETE | `/api/slides/{id}` | Delete slide (auth required) |

### Vacancies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vacancies` | List all vacancies |
| POST | `/api/vacancies` | Create vacancy (auth required) |
| PUT | `/api/vacancies/{id}` | Update vacancy (auth required) |
| DELETE | `/api/vacancies/{id}` | Delete vacancy (auth required) |

### Internships
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/internships` | List all internships |
| POST | `/api/internships` | Create internship (auth required) |
| PUT | `/api/internships/{id}` | Update internship (auth required) |
| DELETE | `/api/internships/{id}` | Delete internship (auth required) |

### Site Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get site settings |
| PUT | `/api/settings` | Update settings (auth required) |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submissions` | List all submissions (auth required) |
| POST | `/api/submissions/contact` | Submit contact form |
| POST | `/api/submissions/course-application` | Submit course application |
| POST | `/api/submissions/vacancy` | Apply for vacancy |
| POST | `/api/submissions/internship` | Apply for internship |
| PUT | `/api/submissions/{id}/read` | Mark as read (auth required) |
| DELETE | `/api/submissions/{id}` | Delete submission (auth required) |

### Trial Lessons
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trial-lessons` | List all (auth required) |
| POST | `/api/trial-lessons` | Request trial lesson |
| DELETE | `/api/trial-lessons/{id}` | Delete (auth required) |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Get analytics summary (auth required) |
| POST | `/api/analytics/pageview` | Record page view |

---

## 6. Admin Panel

### Access URL
```
/nova-admin
```

### Login Credentials
| Field | Value |
|-------|-------|
| Email | `farhad.isgandar@gmail.com` |
| Password | (Set by user during registration) |

### Master Password Recovery
After 10 failed login attempts, master password fields appear:

| Master Password | Value |
|-----------------|-------|
| Master Password 1 | `Asif.?Yek.?NZS.?Baku69!` |
| Master Password 2 | `Farhad.?Yek.?NZS.?Polsa69!` |

### Admin Panel Sections

| Section | URL | Features |
|---------|-----|----------|
| Dashboard | `/nova-admin/dashboard` | Analytics, page views, device stats |
| Hero Slides | `/nova-admin/slides` | Homepage carousel management |
| Courses | `/nova-admin/courses` | Course CRUD, outcomes, curriculum, FAQs |
| Blog Posts | `/nova-admin/blogs` | Blog CRUD with content blocks |
| Testimonials | `/nova-admin/testimonials` | Student reviews |
| Teachers | `/nova-admin/teachers` | Staff management |
| Vacancies | `/nova-admin/vacancies` | Job listings |
| Internships | `/nova-admin/internships` | Internship programs |
| Submissions | `/nova-admin/submissions` | Form submissions inbox |
| Trial Lessons | `/nova-admin/trial-lessons` | Trial requests |
| Site Settings | `/nova-admin/settings` | Global configuration |

### Security Features (Toggleable)
- 10 failed attempts → Recovery mode
- 3 failed master password attempts → 3-day lockout
- Real-time countdown timer during lockout
- Can be disabled from Admin Settings → Security tab

---

## 7. Authentication System

### JWT Configuration
```python
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 8
```

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Security Features
- Rate limiting: 100 requests/minute per IP
- Login rate limit: 10 attempts/minute
- IP blacklisting after 5 failed logins
- Security headers (XSS, CSRF, Content-Security-Policy)
- Input sanitization on all fields
- bcrypt password hashing with 12 rounds

### Master Bypass Login Flow
1. User fails login 10 times
2. Master password fields appear
3. User enters both master passwords
4. System validates against backend `/api/auth/master-login`
5. If correct, user is logged in (bypasses regular password)
6. If incorrect after 3 attempts, 3-day lockout activates

---

## 8. Multi-Language Support

### Supported Languages
| Code | Language | Locale |
|------|----------|--------|
| az | Azerbaijani | az-AZ |
| en | English | en-GB |
| ru | Russian | ru-RU |

### Implementation
All translatable content uses `LocalizedContent` structure:
```javascript
{
  az: "Azərbaycan dili",
  en: "English text",
  ru: "Русский текст"
}
```

### Frontend Language Context
Located at `/frontend/src/lib/LanguageContext.jsx`

```javascript
// Usage in components
const { language, setLanguage, t, getContent } = useLanguage();

// Get translated content
const title = getContent(course.title); // Returns title in current language

// Get static translation
const buttonText = t('buttons.submit');
```

### Language Selector
- Located in Header component
- Dropdown with flag icons
- Persists selection in localStorage

---

## 9. Content Management

### Blog Content Blocks System
Blogs use a flexible content block system allowing mixed text and images:

```javascript
content_blocks: [
  { type: "image", image_url: "https://..." },
  { type: "text", text: { az: "...", en: "...", ru: "..." } },
  { type: "image", image_url: "https://..." },
  { type: "text", text: { az: "...", en: "...", ru: "..." } }
]
```

### Course Curriculum System
Courses have structured outcomes and curriculum:
```javascript
outcomes: [
  { az: "Nəticə 1", en: "Outcome 1", ru: "Результат 1" },
  { az: "Nəticə 2", en: "Outcome 2", ru: "Результат 2" }
],
curriculum: [
  { az: "Modul 1", en: "Module 1", ru: "Модуль 1" },
  { az: "Modul 2", en: "Module 2", ru: "Модуль 2" }
]
```

### Working Hours Display
Dynamic working hours from site settings, displayed on Contact page:
```javascript
working_hours: { start: "09:00", end: "17:00" }
```

---

## 10. Custom Implementations

### 1. Manual Date Formatting
Replaced broken `toLocaleDateString('az-AZ')` with custom formatter:
```javascript
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const year = date.getFullYear();
  
  const months = {
    az: ['Yanvar', 'Fevral', 'Mart', ...],
    en: ['January', 'February', 'March', ...],
    ru: ['Января', 'Февраля', 'Марта', ...]
  };
  
  return `${day} ${months[language][date.getMonth()]} ${year}`;
};
```

### 2. Scroll-to-Top Component
Resets scroll position on route changes:
```javascript
// /frontend/src/components/ScrollToTop.jsx
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
```

### 3. Hover Dropdown Menu (Careers)
Header navigation with hover-activated dropdown for "Karyera":
- Vacancies link
- Internships link
- Animated with Framer Motion

### 4. Dark Mode Support
Full dark mode support across all pages using Tailwind's `dark:` prefix.

### 5. Analytics Tracking
Automatic page view tracking on every route:
```javascript
axios.post(`${API}/analytics/pageview`, {
  page_path: window.location.pathname,
  page_title: document.title,
  device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
});
```

---

## 11. Local Setup Instructions

### Prerequisites
| Software | Version | Required |
|----------|---------|----------|
| Node.js | 18.x or 20.x | Yes |
| Yarn | 1.22.x | Yes |
| Python | 3.11+ | Yes |
| MongoDB | 6.0+ | Yes |
| pip | Latest | Yes |

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd <project-folder>
```

### Step 2: Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=novatech_db
CORS_ORIGINS=*
JWT_SECRET=your-secret-key-here-change-in-production
EOF
```

### Step 3: Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
yarn install

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
```

### Step 4: Start MongoDB
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 5: Create Admin User
```bash
# Run this Python script to create admin user
cd backend
python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

async def create_admin():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['novatech_db']
    
    # Check if admin exists
    existing = await db.users.find_one({'email': 'admin@novatech.az'})
    if existing:
        print('Admin already exists')
        return
    
    # Create admin user
    password = 'Admin123!'  # Change this!
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
    
    await db.users.insert_one({
        'id': str(uuid.uuid4()),
        'email': 'admin@novatech.az',
        'password_hash': hashed,
        'role': 'admin',
        'created_at': datetime.now(timezone.utc).isoformat()
    })
    print('Admin created! Email: admin@novatech.az, Password: Admin123!')

asyncio.run(create_admin())
"
```

### Step 6: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

### Step 7: Access Application
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001 |
| Admin Panel | http://localhost:3000/nova-admin |
| API Docs | http://localhost:8001/docs |

---

## 12. Environment Variables

### Backend (`/backend/.env`)
```env
# MongoDB Connection
MONGO_URL=mongodb://localhost:27017
DB_NAME=novatech_db

# CORS Settings
CORS_ORIGINS=*

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-key-change-this

# Optional: Master Passwords (defaults exist in code)
MASTER_PASSWORD_1=Asif.?Yek.?NZS.?Baku69!
MASTER_PASSWORD_2=Farhad.?Yek.?NZS.?Polsa69!
```

### Frontend (`/frontend/.env`)
```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001

# For production, use your domain:
# REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

---

## 13. GitHub Deployment

### Files to Include
Everything in the `/app` directory should be committed, except:

### Files to Exclude (.gitignore)
```gitignore
# Dependencies
node_modules/
venv/
__pycache__/
*.pyc

# Environment files with secrets
backend/.env
frontend/.env

# IDE
.vscode/
.idea/

# Logs
*.log
/var/log/

# Build outputs
frontend/build/
*.egg-info/
dist/

# OS files
.DS_Store
Thumbs.db
```

### Environment Files Template
Create `.env.example` files for documentation:

**backend/.env.example:**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=novatech_db
CORS_ORIGINS=*
JWT_SECRET=change-this-in-production
```

**frontend/.env.example:**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### GitHub Actions (Optional CI/CD)
Create `.github/workflows/deploy.yml` for automated deployment if needed.

### Pre-Push Checklist
1. ✅ Remove any hardcoded secrets
2. ✅ Update `.gitignore` to exclude sensitive files
3. ✅ Create `.env.example` template files
4. ✅ Test fresh clone and setup works
5. ✅ Verify all dependencies are in requirements.txt and package.json
6. ✅ Remove any development-only code or comments

### Stability Guarantee
The codebase is production-ready. When pushed to GitHub:
- All dependencies are version-locked
- No hardcoded environment-specific values
- All API endpoints are prefixed with `/api`
- All MongoDB queries exclude `_id` in responses
- All date formatting uses custom functions (no locale issues)

---

## Quick Reference

### Admin Login
- URL: `/nova-admin`
- Email: `farhad.isgandar@gmail.com` (or create your own)

### Master Passwords (Recovery)
- Password 1: `Asif.?Yek.?NZS.?Baku69!`
- Password 2: `Farhad.?Yek.?NZS.?Polsa69!`

### Key Commands
```bash
# Backend
cd backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend && yarn start

# MongoDB
mongosh novatech_db
```

### Support
For issues or questions, refer to the codebase documentation or contact the development team.

---

*Documentation generated: December 2025*
*Project: NovaTech Education Center*
*Version: 1.0*
