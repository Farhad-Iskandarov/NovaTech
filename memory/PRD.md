# NovaTech Education Center - Project Requirements Document

## Project Status: ✅ Complete

**Last Updated**: February 6, 2026

---

## Original Problem Statement
Clone the NovaTech project from GitHub (https://github.com/Farhad-Iskandarov/NovaTech) as an exact duplicate without any modifications, then implement requested changes.

---

## What's Been Implemented

### Phase 1: Project Clone (Complete)
- ✅ Exact duplicate of source repository
- ✅ All 20 pages preserved
- ✅ All 11 components preserved
- ✅ Complete backend API
- ✅ Database seeded with initial data
- ✅ Multilingual support (AZ, EN, RU)

### Phase 2: Requested Changes (Complete)

#### Change 1: Partner Logos Carousel
- ✅ Increased logo size from h-8 to h-14 (75% larger)
- ✅ Continuous smooth loop without page refresh
- ✅ 4x logo duplication for seamless infinite scroll

#### Change 2: Trial Lesson Form
- ✅ Replaced dropdown with text input
- ✅ Placeholder: "Kurs adını yazın"
- ✅ Users manually type course name

#### Change 3: Admin Account Updates
- ✅ Removed old admin credentials
- ✅ Created Admin 1: farhad.isgandar@gmail.com / Nova.?Oba.?1234!
- ✅ Created Admin 2: novatecheducation@gmail.com / Lepe.?Doyen.?Baki1!

#### Change 4: Admin 2 Credential Management
- ✅ Added "My Account" tab in Settings (Admin 2 only)
- ✅ Email change capability
- ✅ Password change capability
- ✅ Current password verification required
- ✅ Admin 1 cannot access this feature

---

## User Personas

### Public Users
- Prospective students browsing courses
- Parents researching education options
- Job seekers viewing vacancies/internships

### Admin 1 (Primary Administrator)
- Full access to all admin features
- Cannot edit own credentials via UI
- Email: farhad.isgandar@gmail.com

### Admin 2 (Secondary Administrator)
- Full access to all admin features
- CAN edit own credentials via Settings → My Account
- Email: novatecheducation@gmail.com

---

## Core Requirements

### Functional Requirements
| ID | Requirement | Status |
|----|-------------|--------|
| FR-1 | Multilingual support (AZ/EN/RU) | ✅ |
| FR-2 | Course catalog with details | ✅ |
| FR-3 | Blog/News section | ✅ |
| FR-4 | Contact form | ✅ |
| FR-5 | Trial lesson registration | ✅ |
| FR-6 | Admin authentication | ✅ |
| FR-7 | Content management system | ✅ |
| FR-8 | Analytics tracking | ✅ |
| FR-9 | Vacancies management | ✅ |
| FR-10 | Internships management | ✅ |

### Non-Functional Requirements
| ID | Requirement | Status |
|----|-------------|--------|
| NFR-1 | Responsive design | ✅ |
| NFR-2 | JWT authentication | ✅ |
| NFR-3 | Rate limiting | ✅ |
| NFR-4 | Input sanitization | ✅ |
| NFR-5 | Password security (bcrypt) | ✅ |

---

## Tech Stack

### Backend
- Python 3.11+
- FastAPI 0.110.1
- MongoDB (Motor/PyMongo)
- JWT Authentication
- Bcrypt Password Hashing

### Frontend
- React 19.0.0
- Tailwind CSS 3.4.17
- Radix UI Components
- Framer Motion
- React Router DOM 7.5.1

---

## API Endpoints Summary

| Category | Endpoints |
|----------|-----------|
| Authentication | 5 endpoints |
| Courses | 5 endpoints |
| Blogs | 6 endpoints |
| Testimonials | 4 endpoints |
| Teachers | 4 endpoints |
| Slides | 4 endpoints |
| FAQs | 4 endpoints |
| Submissions | 5 endpoints |
| Trial Lessons | 4 endpoints |
| Settings | 2 endpoints |
| Analytics | 2 endpoints |
| Vacancies | 5 endpoints |
| Internships | 5 endpoints |
| CTA Sections | 5 endpoints |

**Total**: ~60 API endpoints

---

## Database Collections

| Collection | Documents | Purpose |
|------------|-----------|---------|
| users | 2 | Admin accounts |
| courses | 6 | Course catalog |
| blogs | 0 | Blog posts |
| testimonials | 3 | Student reviews |
| teachers | 3 | Teacher profiles |
| slides | 3 | Hero carousel |
| faqs | 24 | Course FAQs |
| submissions | 0 | Contact forms |
| trial_lessons | 1 | Trial requests |
| analytics | 34+ | Page views |
| settings | 1 | Site config |
| vacancies | 0 | Job postings |
| internships | 0 | Internship programs |
| cta_sections | 1 | CTA content |

---

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Project clone
- [x] Admin credential updates
- [x] Logo carousel improvements
- [x] Trial form text input

### P1 (High) - DONE
- [x] Admin 2 credential management
- [x] Technical documentation

### P2 (Medium) - Future
- [ ] Email notifications for submissions
- [ ] Google Analytics integration
- [ ] SEO meta tags management
- [ ] Image upload to cloud storage

### P3 (Low) - Future
- [ ] Student portal/login
- [ ] Online course payments
- [ ] Certificate generation
- [ ] Mobile app

---

## Documentation Files

| File | Purpose |
|------|---------|
| `/app/README.md` | Quick start guide |
| `/app/TECHNICAL_DOCUMENTATION.md` | Complete technical docs |
| `/app/setup-local.sh` | Local setup script |
| `/app/memory/PRD.md` | This file |

---

## Next Tasks

1. **Testing**: Comprehensive end-to-end testing
2. **Deployment**: Deploy to production environment
3. **Monitoring**: Set up error tracking (Sentry)
4. **Backups**: Configure automated MongoDB backups
5. **SSL**: Ensure HTTPS in production

---

## Change Log

### February 6, 2026 - Admin 1 Master Privilege

**New Feature**: Admin 1 can now reset Admin 2 password directly

**Backend APIs Added**:
- `PUT /api/auth/admin1/reset-admin2` - Reset Admin 2 password
- `GET /api/auth/admin2/info` - Get Admin 2 account info

**Frontend Changes**:
- Added "Manage Admins" tab in Settings (Admin 1 only)
- Shows Admin 2 account info
- Password reset form without requiring Admin 2's current password

**Access Control**:
- Admin 1: Has "Manage Admins" tab
- Admin 2: Has "My Account" tab  
- Neither can see the other's special tab

### February 8, 2026 - Bug Fixes

**1. Blog Images Fix**
- Updated image resolution logic to check `image_url` field first, then `content_blocks`
- Applied to: BlogPage, BlogDetailPage (related posts), HomePage (blog carousel)

**2. Course Filter Fix**
- Fixed case-sensitive category matching
- Filter now properly resets when selecting "All"

**3. Blog Page Layout**
- Centered title and subtitle properly
- Added more spacing and better typography

**4. Mobile Header Dropdown Fix**
- Redesigned Career (Karyera) submenu for mobile
- Added proper indentation with bullet points
- Improved spacing and visual hierarchy
- Clean vertical mobile menu pattern
