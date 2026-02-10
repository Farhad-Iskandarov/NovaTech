from fastapi import FastAPI, APIRouter, HTTPException, Depends, Body, status, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import re
from collections import defaultdict
import time
import html
import shutil

ROOT_DIR = Path(__file__).parent
UPLOADS_DIR = ROOT_DIR / "uploads" / "images"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration - Use environment variable or generate secure random key
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 8  # Reduced from 24 to 8 hours for better security

# Rate Limiting Configuration
rate_limit_store = defaultdict(list)
login_attempt_store = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # 1 minute
RATE_LIMIT_MAX_REQUESTS = 100  # Increased for better UX
LOGIN_ATTEMPT_WINDOW = 900  # 15 minutes
LOGIN_MAX_ATTEMPTS = 5  # Max 5 failed login attempts per 15 minutes

# IP Blacklist for brute force protection
ip_blacklist = defaultdict(lambda: {"blocked_until": 0, "attempts": 0})
BLACKLIST_DURATION = 3600  # 1 hour block

# Create the main app with security settings
app = FastAPI(
    title="Novatech Education Center API",
    docs_url=None,  # Disable Swagger UI in production
    redoc_url=None,  # Disable ReDoc in production
    openapi_url=None  # Disable OpenAPI schema in production
)
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== SECURITY HELPER FUNCTIONS ====================

def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS attacks"""
    if not text:
        return text
    # Escape HTML entities
    return html.escape(str(text).strip())

def sanitize_html_content(text: str) -> str:
    """Allow some HTML but escape dangerous tags"""
    if not text:
        return text
    # Remove script tags and event handlers
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',
        r'on\w+\s*=',
        r'javascript:',
        r'vbscript:',
        r'data:text/html',
    ]
    result = text
    for pattern in dangerous_patterns:
        result = re.sub(pattern, '', result, flags=re.IGNORECASE | re.DOTALL)
    return result

def validate_password_strength(password: str) -> bool:
    """Check password meets security requirements"""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    return True

def is_ip_blacklisted(ip: str) -> bool:
    """Check if IP is currently blacklisted"""
    if ip in ip_blacklist:
        if time.time() < ip_blacklist[ip]["blocked_until"]:
            return True
        else:
            # Reset after block expires
            del ip_blacklist[ip]
    return False

def record_failed_login(ip: str):
    """Record failed login attempt and potentially blacklist IP"""
    current_time = time.time()
    ip_blacklist[ip]["attempts"] += 1
    
    if ip_blacklist[ip]["attempts"] >= LOGIN_MAX_ATTEMPTS:
        ip_blacklist[ip]["blocked_until"] = current_time + BLACKLIST_DURATION
        logger.warning(f"IP {ip} has been blacklisted for brute force attempt")

def reset_login_attempts(ip: str):
    """Reset login attempts on successful login"""
    if ip in ip_blacklist:
        del ip_blacklist[ip]

def get_client_ip(request: Request) -> str:
    """Get real client IP considering proxy headers"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

# ==================== MODELS WITH VALIDATION ====================

class LocalizedContent(BaseModel):
    en: str = ""
    az: str = ""
    ru: str = ""
    
    @field_validator('en', 'az', 'ru', mode='before')
    @classmethod
    def sanitize_content(cls, v):
        if v:
            return sanitize_html_content(str(v)[:10000])  # Limit content length
        return v

class LocalizedContentOptional(BaseModel):
    en: Optional[str] = None
    az: Optional[str] = None
    ru: Optional[str] = None

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if not validate_password_strength(v):
            raise ValueError('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
    @field_validator('email', mode='before')
    @classmethod
    def lowercase_email(cls, v):
        return v.lower().strip() if v else v

class MasterBypassLogin(BaseModel):
    email: EmailStr
    master_password_1: str
    master_password_2: str
    
    @field_validator('email', mode='before')
    @classmethod
    def lowercase_email(cls, v):
        return v.lower().strip() if v else v

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    role: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Course Models with validation
class CourseCreate(BaseModel):
    title: LocalizedContent
    description: LocalizedContent
    duration: str
    format: str
    level: str
    certificate: bool = True
    category: str
    outcomes: List[LocalizedContent] = []
    curriculum: List[LocalizedContent] = []
    price: Optional[str] = None
    image_url: Optional[str] = None
    is_popular: bool = False
    is_active: bool = True
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None
    
    @field_validator('duration', 'format', 'level', 'category', mode='before')
    @classmethod
    def sanitize_fields(cls, v):
        return sanitize_input(v) if v else v
    
    @field_validator('image_url', mode='before')
    @classmethod
    def validate_url(cls, v):
        if v:
            v = str(v).strip()
            if not v.startswith(('http://', 'https://')):
                raise ValueError('Invalid URL format')
            # Block javascript: and data: URLs
            if v.lower().startswith(('javascript:', 'data:')):
                raise ValueError('Invalid URL')
        return v

class CourseUpdate(BaseModel):
    title: Optional[LocalizedContent] = None
    description: Optional[LocalizedContent] = None
    duration: Optional[str] = None
    format: Optional[str] = None
    level: Optional[str] = None
    certificate: Optional[bool] = None
    category: Optional[str] = None
    outcomes: Optional[List[LocalizedContent]] = None
    curriculum: Optional[List[LocalizedContent]] = None
    price: Optional[str] = None
    image_url: Optional[str] = None
    is_popular: Optional[bool] = None
    is_active: Optional[bool] = None
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None

class CourseResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: LocalizedContent
    description: LocalizedContent
    duration: str
    format: str
    level: str
    certificate: bool
    category: str
    outcomes: List[LocalizedContent]
    curriculum: List[LocalizedContent]
    price: Optional[str]
    image_url: Optional[str]
    is_popular: bool
    is_active: bool
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None
    created_at: datetime

# FAQ Models
class FAQCreate(BaseModel):
    course_id: str
    question: LocalizedContent
    answer: LocalizedContent
    order: int = 0

class FAQResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    course_id: str
    question: LocalizedContent
    answer: LocalizedContent
    order: int

# Blog Models
class ContentBlock(BaseModel):
    type: str  # "image" or "text"
    image_url: Optional[str] = None
    text: Optional[LocalizedContent] = None
    order: int = 0

class BlogCreate(BaseModel):
    title: LocalizedContent
    excerpt: LocalizedContent
    slug: str
    content_blocks: List[ContentBlock] = []
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None
    is_published: bool = False
    show_on_homepage: bool = False
    
    @field_validator('slug', mode='before')
    @classmethod
    def validate_slug(cls, v):
        if v:
            # Only allow alphanumeric, hyphens, and underscores
            v = re.sub(r'[^a-zA-Z0-9\-_]', '', str(v).lower().strip())
            if len(v) < 3:
                raise ValueError('Slug must be at least 3 characters')
        return v

class BlogUpdate(BaseModel):
    title: Optional[LocalizedContent] = None
    excerpt: Optional[LocalizedContent] = None
    slug: Optional[str] = None
    content_blocks: Optional[List[ContentBlock]] = None
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None
    is_published: Optional[bool] = None
    show_on_homepage: Optional[bool] = None

class BlogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: LocalizedContent
    excerpt: LocalizedContent
    slug: str
    content_blocks: List[ContentBlock] = []
    meta_title: Optional[LocalizedContent]
    meta_description: Optional[LocalizedContent]
    is_published: bool
    show_on_homepage: bool = False
    created_at: datetime
    updated_at: Optional[datetime]

# Testimonial Models
class TestimonialCreate(BaseModel):
    name: str
    course: str
    content: LocalizedContent
    rating: int = 5
    image_url: Optional[str] = None
    is_active: bool = True
    
    @field_validator('name', 'course', mode='before')
    @classmethod
    def sanitize_text(cls, v):
        return sanitize_input(v)[:200] if v else v
    
    @field_validator('rating', mode='before')
    @classmethod
    def validate_rating(cls, v):
        v = int(v) if v else 5
        return max(1, min(5, v))  # Clamp between 1-5

class TestimonialResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    course: str
    content: LocalizedContent
    rating: int
    image_url: Optional[str]
    is_active: bool
    created_at: datetime

# Teacher Models
class TeacherCreate(BaseModel):
    name: str
    role: LocalizedContent
    bio: Optional[LocalizedContent] = None
    image_url: Optional[str] = None
    order: int = 0
    is_active: bool = True
    
    @field_validator('name', mode='before')
    @classmethod
    def sanitize_name(cls, v):
        return sanitize_input(v)[:100] if v else v

class TeacherResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    role: LocalizedContent
    bio: Optional[LocalizedContent]
    image_url: Optional[str]
    order: int
    is_active: bool
    created_at: datetime

# Form Submission Models with validation
class ContactSubmission(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    
    @field_validator('name', mode='before')
    @classmethod
    def sanitize_name(cls, v):
        return sanitize_input(v)[:100] if v else v
    
    @field_validator('message', mode='before')
    @classmethod
    def sanitize_message(cls, v):
        return sanitize_input(v)[:5000] if v else v
    
    @field_validator('phone', mode='before')
    @classmethod
    def validate_phone(cls, v):
        if v:
            # Remove all non-numeric characters except +
            v = re.sub(r'[^\d+]', '', str(v))
            if len(v) < 7 or len(v) > 20:
                raise ValueError('Invalid phone number')
        return v

class CourseApplicationSubmission(BaseModel):
    name: str
    email: EmailStr
    phone: str
    course_id: str
    course_name: str
    message: Optional[str] = None
    
    @field_validator('name', 'course_name', mode='before')
    @classmethod
    def sanitize_text(cls, v):
        return sanitize_input(v)[:200] if v else v

class SubmissionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    type: str
    data: Dict[str, Any]
    created_at: datetime
    is_read: bool

# Analytics Models
class PageViewEvent(BaseModel):
    page_path: str
    page_title: str
    device_type: str
    country: Optional[str] = "Unknown"
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    
    @field_validator('page_path', 'page_title', 'device_type', mode='before')
    @classmethod
    def sanitize_analytics(cls, v):
        return sanitize_input(v)[:500] if v else v

# Trial Lesson Models
class TrialLessonCreate(BaseModel):
    full_name: str
    contact: str  # Phone or email
    course: str
    
    @field_validator('full_name', mode='before')
    @classmethod
    def sanitize_name(cls, v):
        return sanitize_input(v)[:100] if v else v
    
    @field_validator('contact', mode='before')
    @classmethod
    def sanitize_contact(cls, v):
        return sanitize_input(v)[:200] if v else v
    
    @field_validator('course', mode='before')
    @classmethod
    def sanitize_course(cls, v):
        return sanitize_input(v)[:200] if v else v

class TrialLessonResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    full_name: str
    contact: str
    course: str
    created_at: datetime

class AnalyticsSummary(BaseModel):
    total_visits: int
    visits_today: int
    visits_this_week: int
    visits_this_month: int
    avg_time_on_site: float
    device_breakdown: Dict[str, int]
    country_breakdown: Dict[str, int]
    top_pages: List[Dict[str, Any]]

# ==================== HERO SLIDE MODELS ====================

class HeroSlideCreate(BaseModel):
    title: LocalizedContent
    subtitle: LocalizedContent
    badge: Optional[LocalizedContent] = None
    background_image: str
    cta_text: LocalizedContent
    cta_link: str
    order: int = 0
    is_active: bool = True

class HeroSlideUpdate(BaseModel):
    title: Optional[LocalizedContent] = None
    subtitle: Optional[LocalizedContent] = None
    badge: Optional[LocalizedContent] = None
    background_image: Optional[str] = None
    cta_text: Optional[LocalizedContent] = None
    cta_link: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class HeroSlideResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: LocalizedContent
    subtitle: LocalizedContent
    badge: Optional[LocalizedContent]
    background_image: str
    cta_text: LocalizedContent
    cta_link: str
    order: int
    is_active: bool
    created_at: datetime

# ==================== SITE SETTINGS MODELS ====================

class WorkingHours(BaseModel):
    start: str = "09:00"
    end: str = "17:00"

class SocialMediaLink(BaseModel):
    platform: str  # instagram, facebook, linkedin, tiktok, youtube
    url: str
    is_active: bool = True

class ContactSettings(BaseModel):
    phones: List[str] = []
    email: str = ""
    address: LocalizedContent = LocalizedContent()
    google_map_embed: Optional[str] = None

class SiteSettingsCreate(BaseModel):
    whatsapp_number: str
    contact: ContactSettings
    social_media: List[SocialMediaLink] = []
    working_hours: Optional[WorkingHours] = WorkingHours()
    admin_security_enabled: bool = True  # Enable/disable admin login security

class SiteSettingsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    whatsapp_number: str
    contact: ContactSettings
    social_media: List[SocialMediaLink]
    working_hours: WorkingHours = WorkingHours()
    admin_security_enabled: bool = True
    updated_at: datetime

# ==================== CTA SECTION MODELS ====================

class CTASectionCreate(BaseModel):
    section_key: str  # e.g., "home_cta", "footer_cta"
    title: LocalizedContent
    subtitle: LocalizedContent
    button_text: LocalizedContent
    button_link: str
    is_active: bool = True

class CTASectionUpdate(BaseModel):
    title: Optional[LocalizedContent] = None
    subtitle: Optional[LocalizedContent] = None
    button_text: Optional[LocalizedContent] = None
    button_link: Optional[str] = None
    is_active: Optional[bool] = None

class CTASectionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    section_key: str
    title: LocalizedContent
    subtitle: LocalizedContent
    button_text: LocalizedContent
    button_link: str
    is_active: bool
    updated_at: datetime

# ==================== VACANCY MODELS ====================

class VacancyCreate(BaseModel):
    title: LocalizedContent
    department: LocalizedContent
    location: str
    job_type: str  # "Full-time", "Part-time", "Remote"
    description: LocalizedContent
    is_active: bool = True
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None

class VacancyUpdate(BaseModel):
    title: Optional[LocalizedContent] = None
    department: Optional[LocalizedContent] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    description: Optional[LocalizedContent] = None
    is_active: Optional[bool] = None
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None

class VacancyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: LocalizedContent
    department: LocalizedContent
    location: str
    job_type: str
    description: LocalizedContent
    is_active: bool
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None
    created_at: datetime

# ==================== INTERNSHIP MODELS ====================

class InternshipCreate(BaseModel):
    title: LocalizedContent
    category: str  # "IT", "Finance", "Business", "Marketing", etc.
    duration: str
    description: LocalizedContent
    is_active: bool = True
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None

class InternshipUpdate(BaseModel):
    title: Optional[LocalizedContent] = None
    category: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[LocalizedContent] = None
    is_active: Optional[bool] = None
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None

class InternshipResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: LocalizedContent
    category: str
    duration: str
    description: LocalizedContent
    is_active: bool
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None
    created_at: datetime

# ==================== PAGE SEO MODELS ====================

class PageSEOCreate(BaseModel):
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None

class PageSEOResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    page_key: str
    meta_title: Optional[LocalizedContent] = None
    meta_description: Optional[LocalizedContent] = None
    updated_at: Optional[datetime] = None

# ==================== CORE HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    # Use stronger bcrypt rounds
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": datetime.now(timezone.utc),  # Issued at
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "jti": str(uuid.uuid4())  # JWT ID for token revocation
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def check_rate_limit(client_ip: str, limit: int = RATE_LIMIT_MAX_REQUESTS) -> bool:
    current_time = time.time()
    rate_limit_store[client_ip] = [t for t in rate_limit_store[client_ip] if current_time - t < RATE_LIMIT_WINDOW]
    if len(rate_limit_store[client_ip]) >= limit:
        return False
    rate_limit_store[client_ip].append(current_time)
    return True

# ==================== SECURITY MIDDLEWARE ====================

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' https:;"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = get_client_ip(request)
    
    # Check if IP is blacklisted
    if is_ip_blacklisted(client_ip):
        raise HTTPException(
            status_code=429, 
            detail="Too many requests. Please try again later."
        )
    
    # Apply rate limiting
    if not check_rate_limit(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=429, 
            detail="Too many requests. Please slow down."
        )
    
    return await call_next(request)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin, request: Request):
    client_ip = get_client_ip(request)
    
    # Check if IP is blacklisted
    if is_ip_blacklisted(client_ip):
        logger.warning(f"Blocked login attempt from blacklisted IP: {client_ip}")
        raise HTTPException(
            status_code=429, 
            detail="Too many failed attempts. Please try again later."
        )
    
    # Stricter rate limit for login attempts
    if not check_rate_limit(f"login_{client_ip}", limit=10):
        raise HTTPException(status_code=429, detail="Too many login attempts")
    
    user = await db.users.find_one({"email": user_data.email.lower()}, {"_id": 0})
    
    if not user or not verify_password(user_data.password, user["password_hash"]):
        record_failed_login(client_ip)
        logger.warning(f"Failed login attempt for email: {user_data.email} from IP: {client_ip}")
        # Use generic error to prevent user enumeration
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Successful login - reset failed attempts
    reset_login_attempts(client_ip)
    logger.info(f"Successful login for user: {user_data.email}")
    
    token = create_token(user["id"], user["email"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            role=user["role"],
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
        )
    )

# Master passwords for recovery bypass - stored securely
MASTER_PASSWORD_1 = os.environ.get('MASTER_PASSWORD_1', 'Asif.?Yek.?NZS.?Baku69!')
MASTER_PASSWORD_2 = os.environ.get('MASTER_PASSWORD_2', 'Farhad.?Yek.?NZS.?Polsa69!')

@api_router.post("/auth/master-login", response_model=TokenResponse)
async def master_bypass_login(login_data: MasterBypassLogin, request: Request):
    """Login using master passwords - bypasses regular password check"""
    client_ip = get_client_ip(request)
    
    # Check if IP is blacklisted
    if is_ip_blacklisted(client_ip):
        logger.warning(f"Blocked master login attempt from blacklisted IP: {client_ip}")
        raise HTTPException(
            status_code=429, 
            detail="Too many failed attempts. Please try again later."
        )
    
    # Rate limit for master login attempts (stricter)
    if not check_rate_limit(f"master_login_{client_ip}", limit=5):
        raise HTTPException(status_code=429, detail="Too many master login attempts")
    
    # Verify master passwords
    if login_data.master_password_1 != MASTER_PASSWORD_1 or login_data.master_password_2 != MASTER_PASSWORD_2:
        record_failed_login(client_ip)
        logger.warning(f"Failed master login attempt from IP: {client_ip}")
        raise HTTPException(status_code=401, detail="Invalid master passwords")
    
    # Master passwords are correct - find user by email only
    user = await db.users.find_one({"email": login_data.email.lower()}, {"_id": 0})
    
    if not user:
        logger.warning(f"Master login: User not found for email: {login_data.email}")
        raise HTTPException(status_code=404, detail="User with this email not found")
    
    # Master passwords verified and user exists - grant access
    reset_login_attempts(client_ip)
    logger.info(f"Successful master bypass login for user: {login_data.email}")
    
    token = create_token(user["id"], user["email"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            role=user["role"],
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        role=current_user["role"],
        created_at=datetime.fromisoformat(current_user["created_at"]) if isinstance(current_user["created_at"], str) else current_user["created_at"]
    )

# Admin 2 Credentials Update Model
class Admin2CredentialsUpdate(BaseModel):
    new_email: Optional[EmailStr] = None
    new_password: Optional[str] = None
    current_password: str  # Required for verification
    
    @field_validator('new_password', mode='before')
    @classmethod
    def validate_new_password(cls, v):
        if v and not validate_password_strength(v):
            raise ValueError('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
        return v

# Admin 2 email constant - only this admin can edit their credentials
ADMIN2_EMAIL = "novatecheducation@gmail.com"
ADMIN1_EMAIL = "farhad.isgandar@gmail.com"

# Model for Admin 1 to reset Admin 2 credentials
class Admin1ResetAdmin2(BaseModel):
    new_password: str
    
    @field_validator('new_password', mode='before')
    @classmethod
    def validate_new_password(cls, v):
        if not validate_password_strength(v):
            raise ValueError('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
        return v

@api_router.put("/auth/admin2/credentials")
async def update_admin2_credentials(
    data: Admin2CredentialsUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update Admin 2 credentials - only Admin 2 can access this"""
    
    # Verify current user is Admin 2
    if current_user["email"].lower() != ADMIN2_EMAIL.lower():
        raise HTTPException(
            status_code=403, 
            detail="Only Admin 2 (novatecheducation@gmail.com) can update these credentials"
        )
    
    # Verify current password
    user = await db.users.find_one({"email": current_user["email"].lower()}, {"_id": 0})
    if not user or not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Build update data
    update_data = {}
    
    if data.new_email:
        # Check if email already exists (excluding current user)
        existing = await db.users.find_one({
            "email": data.new_email.lower(),
            "id": {"$ne": current_user["id"]}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = data.new_email.lower()
    
    if data.new_password:
        update_data["password_hash"] = hash_password(data.new_password)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No changes provided")
    
    # Update in database
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    logger.info(f"Admin 2 credentials updated by: {current_user['email']}")
    
    # Return new token if email changed
    new_email = update_data.get("email", current_user["email"])
    token = create_token(current_user["id"], new_email, current_user["role"])
    
    return {
        "message": "Credentials updated successfully",
        "access_token": token,
        "email": new_email
    }

@api_router.get("/auth/admin2/check")
async def check_admin2_access(current_user: dict = Depends(get_current_user)):
    """Check if current user is Admin 2 or Admin 1 (master)"""
    is_admin2 = current_user["email"].lower() == ADMIN2_EMAIL.lower()
    is_admin1 = current_user["email"].lower() == ADMIN1_EMAIL.lower()
    return {
        "is_admin2": is_admin2, 
        "is_admin1": is_admin1,
        "email": current_user["email"]
    }

@api_router.put("/auth/admin1/reset-admin2")
async def admin1_reset_admin2_password(
    data: Admin1ResetAdmin2,
    current_user: dict = Depends(get_current_user)
):
    """Admin 1 master privilege: Reset Admin 2 password without current password"""
    
    # Verify current user is Admin 1
    if current_user["email"].lower() != ADMIN1_EMAIL.lower():
        raise HTTPException(
            status_code=403,
            detail="Only Admin 1 (farhad.isgandar@gmail.com) has master privilege to reset Admin 2 credentials"
        )
    
    # Find Admin 2
    admin2 = await db.users.find_one({"email": ADMIN2_EMAIL.lower()}, {"_id": 0})
    if not admin2:
        raise HTTPException(status_code=404, detail="Admin 2 account not found")
    
    # Update Admin 2 password
    await db.users.update_one(
        {"email": ADMIN2_EMAIL.lower()},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    
    logger.info(f"Admin 1 ({current_user['email']}) reset Admin 2 password via master privilege")
    
    return {
        "message": "Admin 2 password has been reset successfully",
        "admin2_email": ADMIN2_EMAIL
    }

@api_router.get("/auth/admin2/info")
async def get_admin2_info(current_user: dict = Depends(get_current_user)):
    """Get Admin 2 info - only accessible by Admin 1"""
    
    # Verify current user is Admin 1
    if current_user["email"].lower() != ADMIN1_EMAIL.lower():
        raise HTTPException(status_code=403, detail="Only Admin 1 can access this")
    
    admin2 = await db.users.find_one({"email": ADMIN2_EMAIL.lower()}, {"_id": 0, "password_hash": 0})
    if not admin2:
        return {"exists": False, "email": ADMIN2_EMAIL}
    
    return {
        "exists": True,
        "email": admin2.get("email"),
        "role": admin2.get("role"),
        "created_at": admin2.get("created_at")
    }

# ==================== COURSE ROUTES ====================

@api_router.post("/courses", response_model=CourseResponse)
async def create_course(course_data: CourseCreate, current_user: dict = Depends(get_current_user)):
    course_id = str(uuid.uuid4())
    course_doc = {
        "id": course_id,
        **course_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.courses.insert_one(course_doc)
    logger.info(f"Course created: {course_id} by user: {current_user['email']}")
    return CourseResponse(**{**course_doc, "created_at": datetime.now(timezone.utc)})

@api_router.get("/courses", response_model=List[CourseResponse])
async def get_courses(category: Optional[str] = None, active_only: bool = True):
    query = {}
    if category:
        query["category"] = sanitize_input(category)
    if active_only:
        query["is_active"] = True
    
    courses = await db.courses.find(query, {"_id": 0}).to_list(100)
    result = []
    for c in courses:
        if isinstance(c.get("created_at"), str):
            c["created_at"] = datetime.fromisoformat(c["created_at"])
        result.append(CourseResponse(**c))
    return result

@api_router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str):
    # Validate UUID format
    try:
        uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course ID format")
    
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if isinstance(course.get("created_at"), str):
        course["created_at"] = datetime.fromisoformat(course["created_at"])
    return CourseResponse(**course)

@api_router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(course_id: str, course_data: CourseUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in course_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.courses.update_one({"id": course_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    
    logger.info(f"Course updated: {course_id} by user: {current_user['email']}")
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if isinstance(course.get("created_at"), str):
        course["created_at"] = datetime.fromisoformat(course["created_at"])
    return CourseResponse(**course)

@api_router.delete("/courses/{course_id}")
async def delete_course(course_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.faqs.delete_many({"course_id": course_id})
    logger.info(f"Course deleted: {course_id} by user: {current_user['email']}")
    return {"message": "Course deleted successfully"}

# ==================== FAQ ROUTES ====================

@api_router.post("/faqs", response_model=FAQResponse)
async def create_faq(faq_data: FAQCreate, current_user: dict = Depends(get_current_user)):
    faq_id = str(uuid.uuid4())
    faq_doc = {"id": faq_id, **faq_data.model_dump()}
    await db.faqs.insert_one(faq_doc)
    return FAQResponse(**faq_doc)

@api_router.get("/faqs/{course_id}", response_model=List[FAQResponse])
async def get_faqs(course_id: str):
    faqs = await db.faqs.find({"course_id": course_id}, {"_id": 0}).sort("order", 1).to_list(50)
    return [FAQResponse(**f) for f in faqs]

@api_router.put("/faqs/{faq_id}", response_model=FAQResponse)
async def update_faq(faq_id: str, faq_data: FAQCreate, current_user: dict = Depends(get_current_user)):
    result = await db.faqs.update_one({"id": faq_id}, {"$set": faq_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    faq = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    return FAQResponse(**faq)

@api_router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted successfully"}

# ==================== BLOG ROUTES ====================

@api_router.post("/blogs", response_model=BlogResponse)
async def create_blog(blog_data: BlogCreate, current_user: dict = Depends(get_current_user)):
    # Check for duplicate slug
    existing = await db.blogs.find_one({"slug": blog_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    blog_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    blog_doc = {
        "id": blog_id,
        **blog_data.model_dump(),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    await db.blogs.insert_one(blog_doc)
    logger.info(f"Blog created: {blog_id} by user: {current_user['email']}")
    return BlogResponse(**{**blog_doc, "created_at": now, "updated_at": now})

@api_router.get("/blogs/homepage", response_model=List[BlogResponse])
async def get_homepage_blogs():
    """Get blogs marked for homepage carousel"""
    query = {"is_published": True, "show_on_homepage": True}
    blogs = await db.blogs.find(query, {"_id": 0}).sort("created_at", -1).to_list(20)
    result = []
    for b in blogs:
        if isinstance(b.get("created_at"), str):
            b["created_at"] = datetime.fromisoformat(b["created_at"])
        if isinstance(b.get("updated_at"), str):
            b["updated_at"] = datetime.fromisoformat(b["updated_at"])
        result.append(BlogResponse(**b))
    return result

@api_router.get("/blogs", response_model=List[BlogResponse])
async def get_blogs(published_only: bool = True):
    query = {"is_published": True} if published_only else {}
    blogs = await db.blogs.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    result = []
    for b in blogs:
        if isinstance(b.get("created_at"), str):
            b["created_at"] = datetime.fromisoformat(b["created_at"])
        if isinstance(b.get("updated_at"), str):
            b["updated_at"] = datetime.fromisoformat(b["updated_at"])
        result.append(BlogResponse(**b))
    return result
    return result

@api_router.get("/blogs/{slug}", response_model=BlogResponse)
async def get_blog(slug: str):
    # Sanitize slug input
    slug = re.sub(r'[^a-zA-Z0-9\-_]', '', slug.lower())
    blog = await db.blogs.find_one({"slug": slug}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if isinstance(blog.get("created_at"), str):
        blog["created_at"] = datetime.fromisoformat(blog["created_at"])
    if isinstance(blog.get("updated_at"), str):
        blog["updated_at"] = datetime.fromisoformat(blog["updated_at"])
    return BlogResponse(**blog)

@api_router.put("/blogs/{blog_id}", response_model=BlogResponse)
async def update_blog(blog_id: str, blog_data: BlogUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in blog_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.blogs.update_one({"id": blog_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    logger.info(f"Blog updated: {blog_id} by user: {current_user['email']}")
    blog = await db.blogs.find_one({"id": blog_id}, {"_id": 0})
    if isinstance(blog.get("created_at"), str):
        blog["created_at"] = datetime.fromisoformat(blog["created_at"])
    if isinstance(blog.get("updated_at"), str):
        blog["updated_at"] = datetime.fromisoformat(blog["updated_at"])
    return BlogResponse(**blog)

@api_router.delete("/blogs/{blog_id}")
async def delete_blog(blog_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.blogs.delete_one({"id": blog_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    logger.info(f"Blog deleted: {blog_id} by user: {current_user['email']}")
    return {"message": "Blog deleted successfully"}

# ==================== TESTIMONIAL ROUTES ====================

@api_router.post("/testimonials", response_model=TestimonialResponse)
async def create_testimonial(data: TestimonialCreate, current_user: dict = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    doc = {"id": item_id, **data.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.testimonials.insert_one(doc)
    return TestimonialResponse(**{**doc, "created_at": datetime.now(timezone.utc)})

@api_router.get("/testimonials", response_model=List[TestimonialResponse])
async def get_testimonials(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    items = await db.testimonials.find(query, {"_id": 0}).to_list(50)
    result = []
    for t in items:
        if isinstance(t.get("created_at"), str):
            t["created_at"] = datetime.fromisoformat(t["created_at"])
        result.append(TestimonialResponse(**t))
    return result

@api_router.put("/testimonials/{item_id}", response_model=TestimonialResponse)
async def update_testimonial(item_id: str, data: TestimonialCreate, current_user: dict = Depends(get_current_user)):
    result = await db.testimonials.update_one({"id": item_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    item = await db.testimonials.find_one({"id": item_id}, {"_id": 0})
    if isinstance(item.get("created_at"), str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    return TestimonialResponse(**item)

@api_router.delete("/testimonials/{item_id}")
async def delete_testimonial(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.testimonials.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Testimonial deleted successfully"}

# ==================== TEACHER ROUTES ====================

@api_router.post("/teachers", response_model=TeacherResponse)
async def create_teacher(data: TeacherCreate, current_user: dict = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    doc = {"id": item_id, **data.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.teachers.insert_one(doc)
    return TeacherResponse(**{**doc, "created_at": datetime.now(timezone.utc)})

@api_router.get("/teachers", response_model=List[TeacherResponse])
async def get_teachers(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    items = await db.teachers.find(query, {"_id": 0}).sort("order", 1).to_list(50)
    result = []
    for t in items:
        if isinstance(t.get("created_at"), str):
            t["created_at"] = datetime.fromisoformat(t["created_at"])
        result.append(TeacherResponse(**t))
    return result

@api_router.put("/teachers/{item_id}", response_model=TeacherResponse)
async def update_teacher(item_id: str, data: TeacherCreate, current_user: dict = Depends(get_current_user)):
    result = await db.teachers.update_one({"id": item_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    item = await db.teachers.find_one({"id": item_id}, {"_id": 0})
    if isinstance(item.get("created_at"), str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    return TeacherResponse(**item)

@api_router.delete("/teachers/{item_id}")
async def delete_teacher(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.teachers.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"message": "Teacher deleted successfully"}

# ==================== SUBMISSION ROUTES ====================

@api_router.post("/submissions/contact")
async def submit_contact(data: ContactSubmission, request: Request):
    client_ip = get_client_ip(request)
    
    # Rate limit contact form submissions
    if not check_rate_limit(f"contact_{client_ip}", limit=5):
        raise HTTPException(status_code=429, detail="Too many submissions. Please try again later.")
    
    item_id = str(uuid.uuid4())
    doc = {
        "id": item_id,
        "type": "contact",
        "data": data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_read": False,
        "ip_address": hashlib.sha256(client_ip.encode()).hexdigest()[:16]  # Store hashed IP for abuse detection
    }
    await db.submissions.insert_one(doc)
    logger.info(f"Contact form submitted: {item_id}")
    return {"message": "Message sent successfully", "id": item_id}

@api_router.post("/submissions/application")
async def submit_application(data: CourseApplicationSubmission, request: Request):
    client_ip = get_client_ip(request)
    
    # Rate limit application submissions
    if not check_rate_limit(f"application_{client_ip}", limit=3):
        raise HTTPException(status_code=429, detail="Too many applications. Please try again later.")
    
    item_id = str(uuid.uuid4())
    doc = {
        "id": item_id,
        "type": "application",
        "data": data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_read": False,
        "ip_address": hashlib.sha256(client_ip.encode()).hexdigest()[:16]
    }
    await db.submissions.insert_one(doc)
    logger.info(f"Course application submitted: {item_id}")
    return {"message": "Application submitted successfully", "id": item_id}

@api_router.get("/submissions", response_model=List[SubmissionResponse])
async def get_submissions(type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"type": type} if type else {}
    items = await db.submissions.find(query, {"_id": 0, "ip_address": 0}).sort("created_at", -1).to_list(200)
    result = []
    for s in items:
        if isinstance(s.get("created_at"), str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
        result.append(SubmissionResponse(**s))
    return result

@api_router.put("/submissions/{item_id}/read")
async def mark_submission_read(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.submissions.update_one({"id": item_id}, {"$set": {"is_read": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Marked as read"}

@api_router.delete("/submissions/{item_id}")
async def delete_submission(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.submissions.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Submission deleted successfully"}

# ==================== TRIAL LESSON ROUTES ====================

@api_router.post("/trial-lessons", response_model=TrialLessonResponse)
async def create_trial_lesson(data: TrialLessonCreate, request: Request):
    """Submit a trial lesson request (public endpoint)"""
    client_ip = get_client_ip(request)
    
    # Rate limit submissions
    if not check_rate_limit(f"trial_{client_ip}", limit=5):
        raise HTTPException(status_code=429, detail="Too many requests")
    
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": now.isoformat()
    }
    await db.trial_lessons.insert_one(doc)
    logger.info(f"Trial lesson request from {data.full_name}")
    return TrialLessonResponse(**{**doc, "created_at": now})

@api_router.get("/trial-lessons", response_model=List[TrialLessonResponse])
async def get_trial_lessons(current_user: dict = Depends(get_current_user)):
    """Get all trial lesson requests (admin only)"""
    lessons = await db.trial_lessons.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    result = []
    for lesson in lessons:
        if isinstance(lesson.get("created_at"), str):
            lesson["created_at"] = datetime.fromisoformat(lesson["created_at"])
        result.append(TrialLessonResponse(**lesson))
    return result

@api_router.delete("/trial-lessons/{item_id}")
async def delete_trial_lesson(item_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a single trial lesson request (admin only)"""
    result = await db.trial_lessons.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trial lesson not found")
    return {"message": "Trial lesson deleted successfully"}

@api_router.delete("/trial-lessons")
async def delete_all_trial_lessons(current_user: dict = Depends(get_current_user)):
    """Delete all trial lesson requests (admin only)"""
    result = await db.trial_lessons.delete_many({})
    return {"message": f"Deleted {result.deleted_count} trial lesson requests"}

# ==================== ANALYTICS ROUTES ====================

@api_router.post("/analytics/pageview")
async def track_pageview(data: PageViewEvent, request: Request):
    client_ip = get_client_ip(request)
    
    # Rate limit analytics
    if not check_rate_limit(f"analytics_{client_ip}", limit=60):
        return {"message": "Rate limited"}
    
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.analytics.insert_one(doc)
    return {"message": "Tracked"}

@api_router.get("/analytics/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)
    
    all_events = await db.analytics.find({}, {"_id": 0}).to_list(10000)
    
    total_visits = len(all_events)
    visits_today = 0
    visits_week = 0
    visits_month = 0
    device_breakdown = defaultdict(int)
    country_breakdown = defaultdict(int)
    page_views = defaultdict(int)
    
    for event in all_events:
        ts = event.get("timestamp")
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
        
        if ts >= today_start:
            visits_today += 1
        if ts >= week_start:
            visits_week += 1
        if ts >= month_start:
            visits_month += 1
        
        device_breakdown[event.get("device_type", "unknown")] += 1
        country_breakdown[event.get("country", "Unknown")] += 1
        page_views[event.get("page_path", "/")] += 1
    
    top_pages = sorted([{"path": k, "views": v} for k, v in page_views.items()], key=lambda x: x["views"], reverse=True)[:10]
    
    return AnalyticsSummary(
        total_visits=total_visits,
        visits_today=visits_today,
        visits_this_week=visits_week,
        visits_this_month=visits_month,
        avg_time_on_site=0,
        device_breakdown=dict(device_breakdown),
        country_breakdown=dict(country_breakdown),
        top_pages=top_pages
    )

# ==================== HERO SLIDES ROUTES ====================

@api_router.post("/slides", response_model=HeroSlideResponse)
async def create_slide(data: HeroSlideCreate, current_user: dict = Depends(get_current_user)):
    slide_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = {"id": slide_id, **data.model_dump(), "created_at": now.isoformat()}
    await db.slides.insert_one(doc)
    logger.info(f"Slide created: {slide_id} by user: {current_user['email']}")
    return HeroSlideResponse(**{**doc, "created_at": now})

@api_router.get("/slides", response_model=List[HeroSlideResponse])
async def get_slides(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    items = await db.slides.find(query, {"_id": 0}).sort("order", 1).to_list(20)
    result = []
    for s in items:
        if isinstance(s.get("created_at"), str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
        result.append(HeroSlideResponse(**s))
    return result

@api_router.put("/slides/{slide_id}", response_model=HeroSlideResponse)
async def update_slide(slide_id: str, data: HeroSlideUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    result = await db.slides.update_one({"id": slide_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Slide not found")
    logger.info(f"Slide updated: {slide_id} by user: {current_user['email']}")
    item = await db.slides.find_one({"id": slide_id}, {"_id": 0})
    if isinstance(item.get("created_at"), str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    return HeroSlideResponse(**item)

@api_router.delete("/slides/{slide_id}")
async def delete_slide(slide_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.slides.delete_one({"id": slide_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slide not found")
    logger.info(f"Slide deleted: {slide_id} by user: {current_user['email']}")
    return {"message": "Slide deleted successfully"}

# ==================== SITE SETTINGS ROUTES ====================

@api_router.get("/settings", response_model=SiteSettingsResponse)
async def get_settings():
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        # Return default settings if none exist
        default = {
            "id": str(uuid.uuid4()),
            "whatsapp_number": "+123456789",
            "contact": {
                "phones": ["+123456789"],
                "email": "info@novatech.az",
                "address": {"en": "Sumgayit, Markaz Plaza, Azerbaijan", "az": "Sumqayıt, Markaz Plaza, Azərbaycan", "ru": "Сумгаит, Markaz Plaza, Азербайджан"},
                "google_map_embed": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3047.9947858825374!2d49.6619!3d40.5898!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSumgayit%2C%20Azerbaijan!5e0!3m2!1sen!2s!4v1629789123456!5m2!1sen!2s"
            },
            "social_media": [
                {"platform": "instagram", "url": "https://instagram.com/novatech", "is_active": True},
                {"platform": "facebook", "url": "https://facebook.com/novatech", "is_active": True}
            ],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.settings.insert_one(default)
        settings = default
    if isinstance(settings.get("updated_at"), str):
        settings["updated_at"] = datetime.fromisoformat(settings["updated_at"])
    return SiteSettingsResponse(**settings)

@api_router.put("/settings", response_model=SiteSettingsResponse)
async def update_settings(data: SiteSettingsCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    settings = await db.settings.find_one({}, {"_id": 0})
    
    update_doc = {
        **data.model_dump(),
        "updated_at": now.isoformat()
    }
    
    if settings:
        await db.settings.update_one({"id": settings["id"]}, {"$set": update_doc})
        update_doc["id"] = settings["id"]
    else:
        update_doc["id"] = str(uuid.uuid4())
        await db.settings.insert_one(update_doc)
    
    logger.info(f"Site settings updated by user: {current_user['email']}")
    return SiteSettingsResponse(**{**update_doc, "updated_at": now})

# ==================== CTA SECTIONS ROUTES ====================

@api_router.post("/cta-sections", response_model=CTASectionResponse)
async def create_cta_section(data: CTASectionCreate, current_user: dict = Depends(get_current_user)):
    # Check for duplicate section_key
    existing = await db.cta_sections.find_one({"section_key": data.section_key})
    if existing:
        raise HTTPException(status_code=400, detail="Section key already exists")
    
    section_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = {"id": section_id, **data.model_dump(), "updated_at": now.isoformat()}
    await db.cta_sections.insert_one(doc)
    logger.info(f"CTA section created: {section_id} by user: {current_user['email']}")
    return CTASectionResponse(**{**doc, "updated_at": now})

@api_router.get("/cta-sections", response_model=List[CTASectionResponse])
async def get_cta_sections(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    items = await db.cta_sections.find(query, {"_id": 0}).to_list(50)
    result = []
    for s in items:
        if isinstance(s.get("updated_at"), str):
            s["updated_at"] = datetime.fromisoformat(s["updated_at"])
        result.append(CTASectionResponse(**s))
    return result

@api_router.get("/cta-sections/{section_key}", response_model=CTASectionResponse)
async def get_cta_section(section_key: str):
    item = await db.cta_sections.find_one({"section_key": section_key}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="CTA section not found")
    if isinstance(item.get("updated_at"), str):
        item["updated_at"] = datetime.fromisoformat(item["updated_at"])
    return CTASectionResponse(**item)

@api_router.put("/cta-sections/{section_id}", response_model=CTASectionResponse)
async def update_cta_section(section_id: str, data: CTASectionUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.cta_sections.update_one({"id": section_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="CTA section not found")
    
    logger.info(f"CTA section updated: {section_id} by user: {current_user['email']}")
    item = await db.cta_sections.find_one({"id": section_id}, {"_id": 0})
    if isinstance(item.get("updated_at"), str):
        item["updated_at"] = datetime.fromisoformat(item["updated_at"])
    return CTASectionResponse(**item)

@api_router.delete("/cta-sections/{section_id}")
async def delete_cta_section(section_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.cta_sections.delete_one({"id": section_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="CTA section not found")
    logger.info(f"CTA section deleted: {section_id} by user: {current_user['email']}")
    return {"message": "CTA section deleted successfully"}

# ==================== VACANCY ROUTES ====================

@api_router.post("/vacancies", response_model=VacancyResponse)
async def create_vacancy(data: VacancyCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": now.isoformat()
    }
    await db.vacancies.insert_one(doc)
    logger.info(f"Vacancy created by user: {current_user['email']}")
    return VacancyResponse(**{**doc, "created_at": now})

@api_router.get("/vacancies", response_model=List[VacancyResponse])
async def get_vacancies(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    items = await db.vacancies.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    result = []
    for item in items:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
        result.append(VacancyResponse(**item))
    return result

@api_router.get("/vacancies/{vacancy_id}", response_model=VacancyResponse)
async def get_vacancy(vacancy_id: str):
    item = await db.vacancies.find_one({"id": vacancy_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    if isinstance(item.get("created_at"), str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    return VacancyResponse(**item)

@api_router.put("/vacancies/{vacancy_id}", response_model=VacancyResponse)
async def update_vacancy(vacancy_id: str, data: VacancyUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.vacancies.update_one({"id": vacancy_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    
    item = await db.vacancies.find_one({"id": vacancy_id}, {"_id": 0})
    if isinstance(item.get("created_at"), str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    return VacancyResponse(**item)

@api_router.delete("/vacancies/{vacancy_id}")
async def delete_vacancy(vacancy_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.vacancies.delete_one({"id": vacancy_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return {"message": "Vacancy deleted successfully"}

# ==================== INTERNSHIP ROUTES ====================

@api_router.post("/internships", response_model=InternshipResponse)
async def create_internship(data: InternshipCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": now.isoformat()
    }
    await db.internships.insert_one(doc)
    logger.info(f"Internship created by user: {current_user['email']}")
    return InternshipResponse(**{**doc, "created_at": now})

@api_router.get("/internships", response_model=List[InternshipResponse])
async def get_internships(active_only: bool = True, category: Optional[str] = None):
    query = {}
    if active_only:
        query["is_active"] = True
    if category:
        query["category"] = category
    
    items = await db.internships.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    result = []
    for item in items:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
        result.append(InternshipResponse(**item))
    return result

@api_router.get("/internships/{internship_id}", response_model=InternshipResponse)
async def get_internship(internship_id: str):
    item = await db.internships.find_one({"id": internship_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Internship not found")
    if isinstance(item.get("created_at"), str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    return InternshipResponse(**item)

@api_router.put("/internships/{internship_id}", response_model=InternshipResponse)
async def update_internship(internship_id: str, data: InternshipUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.internships.update_one({"id": internship_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Internship not found")
    
    item = await db.internships.find_one({"id": internship_id}, {"_id": 0})
    if isinstance(item.get("created_at"), str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    return InternshipResponse(**item)

@api_router.delete("/internships/{internship_id}")
async def delete_internship(internship_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.internships.delete_one({"id": internship_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Internship not found")
    return {"message": "Internship deleted successfully"}

# ==================== PAGE SEO ROUTES ====================

@api_router.get("/page-seo", response_model=List[PageSEOResponse])
async def get_all_page_seo(current_user: dict = Depends(get_current_user)):
    valid_pages = ["home", "about", "courses", "careers", "blog", "contact"]
    items = await db.page_seo.find({}, {"_id": 0}).to_list(100)
    
    # Build a map of existing entries
    existing = {item["page_key"]: item for item in items}
    
    result = []
    for page_key in valid_pages:
        if page_key in existing:
            item = existing[page_key]
            if isinstance(item.get("updated_at"), str):
                item["updated_at"] = datetime.fromisoformat(item["updated_at"])
            result.append(PageSEOResponse(**item))
        else:
            result.append(PageSEOResponse(page_key=page_key))
    return result

@api_router.get("/page-seo/{page_key}", response_model=PageSEOResponse)
async def get_page_seo(page_key: str):
    item = await db.page_seo.find_one({"page_key": page_key}, {"_id": 0})
    if not item:
        return PageSEOResponse(page_key=page_key)
    if isinstance(item.get("updated_at"), str):
        item["updated_at"] = datetime.fromisoformat(item["updated_at"])
    return PageSEOResponse(**item)

@api_router.put("/page-seo/{page_key}", response_model=PageSEOResponse)
async def update_page_seo(page_key: str, data: PageSEOCreate, current_user: dict = Depends(get_current_user)):
    valid_pages = ["home", "about", "courses", "careers", "blog", "contact"]
    if page_key not in valid_pages:
        raise HTTPException(status_code=400, detail=f"Invalid page key. Must be one of: {', '.join(valid_pages)}")
    
    now = datetime.now(timezone.utc)
    update_data = data.model_dump()
    update_data["page_key"] = page_key
    update_data["updated_at"] = now.isoformat()
    
    await db.page_seo.update_one(
        {"page_key": page_key},
        {"$set": update_data},
        upsert=True
    )
    
    logger.info(f"Page SEO updated for '{page_key}' by user: {current_user['email']}")
    return PageSEOResponse(**{**update_data, "updated_at": now})

# ==================== SEED DATA ROUTE ====================

# ==================== IMAGE UPLOAD ====================

# Allowed image types and max size
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

@api_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload an image file and return the public URL"""
    
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: jpg, jpeg, png, webp"
        )
    
    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is 5MB"
        )
    
    # Generate unique filename
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if file_ext not in ["jpg", "jpeg", "png", "webp"]:
        file_ext = "jpg"
    
    unique_filename = f"{uuid.uuid4().hex}_{int(time.time())}.{file_ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Image uploaded: {unique_filename} by {current_user['email']}")
        
        # Return the public URL path
        return {
            "success": True,
            "filename": unique_filename,
            "url": f"/api/uploads/images/{unique_filename}",
            "size": len(content)
        }
    except Exception as e:
        logger.error(f"Failed to save uploaded image: {e}")
        raise HTTPException(status_code=500, detail="Failed to save image")

@api_router.get("/uploads/images/{filename}")
async def get_uploaded_image(filename: str):
    """Serve uploaded images"""
    from fastapi.responses import FileResponse
    
    # Sanitize filename to prevent directory traversal
    safe_filename = Path(filename).name
    file_path = UPLOADS_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Determine content type
    ext = safe_filename.split(".")[-1].lower()
    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp"
    }
    content_type = content_types.get(ext, "image/jpeg")
    
    return FileResponse(
        file_path,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000"}  # Cache for 1 year
    )

@api_router.delete("/upload/image/{filename}")
async def delete_uploaded_image(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an uploaded image"""
    
    # Sanitize filename
    safe_filename = Path(filename).name
    file_path = UPLOADS_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        os.remove(file_path)
        logger.info(f"Image deleted: {safe_filename} by {current_user['email']}")
        return {"success": True, "message": "Image deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete image: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete image")

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed database with initial data"""
    
    # Admin 1: farhad.isgandar@gmail.com
    admin1 = await db.users.find_one({"email": "farhad.isgandar@gmail.com"})
    if not admin1:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": "farhad.isgandar@gmail.com",
            "password_hash": hash_password("Nova.?Oba.?1234!"),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
    
    # Admin 2: novatecheducation@gmail.com
    admin2 = await db.users.find_one({"email": "novatecheducation@gmail.com"})
    if not admin2:
        admin_doc2 = {
            "id": str(uuid.uuid4()),
            "email": "novatecheducation@gmail.com",
            "password_hash": hash_password("Lepe.?Doyen.?Baki1!"),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc2)
    
    # Check if courses exist
    courses_count = await db.courses.count_documents({})
    if courses_count == 0:
        courses = [
            {
                "id": str(uuid.uuid4()),
                "title": {"en": "Front-end Development", "az": "Front-end Proqramlaşdırma", "ru": "Фронтенд Разработка"},
                "description": {"en": "Learn HTML, CSS, JavaScript, React and modern web development", "az": "HTML, CSS, JavaScript, React və müasir veb inkişafını öyrənin", "ru": "Изучите HTML, CSS, JavaScript, React и современную веб-разработку"},
                "duration": "4 months",
                "format": "Hybrid",
                "level": "Beginner",
                "certificate": True,
                "category": "development",
                "outcomes": [
                    {"en": "Build responsive websites", "az": "Responsiv veb saytlar yaradın", "ru": "Создавайте адаптивные сайты"},
                    {"en": "Create React applications", "az": "React proqramları yaradın", "ru": "Создавайте React приложения"}
                ],
                "curriculum": [
                    {"en": "HTML & CSS Fundamentals", "az": "HTML & CSS əsasları", "ru": "Основы HTML и CSS"},
                    {"en": "JavaScript Programming", "az": "JavaScript Proqramlaşdırma", "ru": "Программирование на JavaScript"},
                    {"en": "React Framework", "az": "React Framework", "ru": "Фреймворк React"}
                ],
                "price": "500 AZN",
                "image_url": "https://images.unsplash.com/photo-1551402991-6e4b5fc0b01c?w=800",
                "is_popular": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": {"en": "Back-end Development", "az": "Back-end Proqramlaşdırma", "ru": "Бэкенд Разработка"},
                "description": {"en": "Master Python, Node.js, databases and API development", "az": "Python, Node.js, verilənlər bazası və API inkişafını öyrənin", "ru": "Освойте Python, Node.js, базы данных и разработку API"},
                "duration": "5 months",
                "format": "Hybrid",
                "level": "Intermediate",
                "certificate": True,
                "category": "development",
                "outcomes": [
                    {"en": "Build REST APIs", "az": "REST API-lər yaradın", "ru": "Создавайте REST API"},
                    {"en": "Work with databases", "az": "Verilənlər bazası ilə işləyin", "ru": "Работайте с базами данных"}
                ],
                "curriculum": [
                    {"en": "Python Programming", "az": "Python Proqramlaşdırma", "ru": "Программирование на Python"},
                    {"en": "Database Design", "az": "Verilənlər bazası dizaynı", "ru": "Проектирование баз данных"},
                    {"en": "API Development", "az": "API inkişafı", "ru": "Разработка API"}
                ],
                "price": "600 AZN",
                "image_url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
                "is_popular": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": {"en": "Graphic Design", "az": "Qrafik Dizayn", "ru": "Графический Дизайн"},
                "description": {"en": "Learn Adobe Creative Suite, UI/UX design principles", "az": "Adobe Creative Suite, UI/UX dizayn prinsiplərini öyrənin", "ru": "Изучите Adobe Creative Suite, принципы UI/UX дизайна"},
                "duration": "3 months",
                "format": "On-site",
                "level": "Beginner",
                "certificate": True,
                "category": "design",
                "outcomes": [
                    {"en": "Create professional designs", "az": "Peşəkar dizaynlar yaradın", "ru": "Создавайте профессиональные дизайны"},
                    {"en": "Master Adobe tools", "az": "Adobe alətlərini öyrənin", "ru": "Освойте инструменты Adobe"}
                ],
                "curriculum": [
                    {"en": "Design Fundamentals", "az": "Dizayn əsasları", "ru": "Основы дизайна"},
                    {"en": "Adobe Photoshop", "az": "Adobe Photoshop", "ru": "Adobe Photoshop"},
                    {"en": "Adobe Illustrator", "az": "Adobe Illustrator", "ru": "Adobe Illustrator"}
                ],
                "price": "400 AZN",
                "image_url": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800",
                "is_popular": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": {"en": "SMM (Social Media Marketing)", "az": "SMM (Sosial Media Marketinqi)", "ru": "SMM (Маркетинг в соцсетях)"},
                "description": {"en": "Master social media marketing, content strategy and analytics", "az": "Sosial media marketinqi, kontent strategiyası və analitikanı öyrənin", "ru": "Освойте маркетинг в соцсетях, контент-стратегию и аналитику"},
                "duration": "2 months",
                "format": "Online",
                "level": "Beginner",
                "certificate": True,
                "category": "marketing",
                "outcomes": [
                    {"en": "Create effective campaigns", "az": "Effektiv kampaniyalar yaradın", "ru": "Создавайте эффективные кампании"},
                    {"en": "Analyze social metrics", "az": "Sosial metrikləri təhlil edin", "ru": "Анализируйте метрики"}
                ],
                "curriculum": [
                    {"en": "Social Media Strategy", "az": "Sosial Media Strategiyası", "ru": "Стратегия соцсетей"},
                    {"en": "Content Creation", "az": "Kontent yaradılması", "ru": "Создание контента"},
                    {"en": "Analytics & Reporting", "az": "Analitika və Hesabat", "ru": "Аналитика и отчетность"}
                ],
                "price": "300 AZN",
                "image_url": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800",
                "is_popular": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": {"en": "Microsoft Office", "az": "Microsoft Office", "ru": "Microsoft Office"},
                "description": {"en": "Comprehensive training on Word, Excel, PowerPoint and more", "az": "Word, Excel, PowerPoint və daha çox üzrə əhatəli təlim", "ru": "Комплексное обучение Word, Excel, PowerPoint и др."},
                "duration": "1.5 months",
                "format": "Hybrid",
                "level": "Beginner",
                "certificate": True,
                "category": "office",
                "outcomes": [
                    {"en": "Master Office applications", "az": "Office proqramlarını öyrənin", "ru": "Освойте приложения Office"},
                    {"en": "Boost productivity", "az": "Məhsuldarlığı artırın", "ru": "Повысьте продуктивность"}
                ],
                "curriculum": [
                    {"en": "Microsoft Word", "az": "Microsoft Word", "ru": "Microsoft Word"},
                    {"en": "Microsoft Excel", "az": "Microsoft Excel", "ru": "Microsoft Excel"},
                    {"en": "Microsoft PowerPoint", "az": "Microsoft PowerPoint", "ru": "Microsoft PowerPoint"}
                ],
                "price": "200 AZN",
                "image_url": "https://images.unsplash.com/photo-1537498425277-c283d32ef9db?w=800",
                "is_popular": False,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": {"en": "IT for Kids", "az": "Uşaqlar üçün IT", "ru": "IT для детей"},
                "description": {"en": "Fun and engaging programming courses for children ages 8-14", "az": "8-14 yaş uşaqlar üçün maraqlı proqramlaşdırma kursları", "ru": "Увлекательные курсы программирования для детей 8-14 лет"},
                "duration": "3 months",
                "format": "On-site",
                "level": "Beginner",
                "certificate": True,
                "category": "kids",
                "outcomes": [
                    {"en": "Learn coding basics", "az": "Kodlaşdırma əsaslarını öyrənin", "ru": "Изучите основы кодирования"},
                    {"en": "Create simple games", "az": "Sadə oyunlar yaradın", "ru": "Создавайте простые игры"}
                ],
                "curriculum": [
                    {"en": "Scratch Programming", "az": "Scratch Proqramlaşdırma", "ru": "Программирование на Scratch"},
                    {"en": "Basic Logic", "az": "Əsas Məntiq", "ru": "Основы логики"},
                    {"en": "Game Development", "az": "Oyun inkişafı", "ru": "Разработка игр"}
                ],
                "price": "250 AZN",
                "image_url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
                "is_popular": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.courses.insert_many(courses)
        
        # Add FAQs for courses
        for course in courses:
            faqs = [
                {"id": str(uuid.uuid4()), "course_id": course["id"], "question": {"en": "Do I need prior knowledge?", "az": "Əvvəlki bilik lazımdır?", "ru": "Нужны ли предварительные знания?"}, "answer": {"en": "No, our courses are designed for beginners. We start from the basics.", "az": "Xeyr, kurslarımız yeni başlayanlar üçün nəzərdə tutulub. Əsaslardan başlayırıq.", "ru": "Нет, наши курсы предназначены для начинающих. Мы начинаем с основ."}, "order": 1},
                {"id": str(uuid.uuid4()), "course_id": course["id"], "question": {"en": "Will I receive a certificate?", "az": "Sertifikat alacağam?", "ru": "Получу ли я сертификат?"}, "answer": {"en": "Yes, upon successful completion of the course, you will receive an official Novatech certificate.", "az": "Bəli, kursu uğurla başa vurduqdan sonra rəsmi Novatech sertifikatı alacaqsınız.", "ru": "Да, после успешного завершения курса вы получите официальный сертификат Novatech."}, "order": 2},
                {"id": str(uuid.uuid4()), "course_id": course["id"], "question": {"en": "Are classes online?", "az": "Dərslər onlayndır?", "ru": "Занятия онлайн?"}, "answer": {"en": "We offer both online and on-site classes. Check the course format for details.", "az": "Biz həm onlayn, həm də əyani dərslər təklif edirik. Ətraflı məlumat üçün kurs formatına baxın.", "ru": "Мы предлагаем как онлайн, так и очные занятия. Подробности см. в формате курса."}, "order": 3},
                {"id": str(uuid.uuid4()), "course_id": course["id"], "question": {"en": "Is installment payment available?", "az": "Hissə-hissə ödəmə mümkündür?", "ru": "Доступна ли рассрочка?"}, "answer": {"en": "Yes, we offer flexible payment options including monthly installments.", "az": "Bəli, aylıq hissələrlə ödəmə daxil olmaqla çevik ödəniş seçimləri təklif edirik.", "ru": "Да, мы предлагаем гибкие варианты оплаты, включая ежемесячную рассрочку."}, "order": 4}
            ]
            await db.faqs.insert_many(faqs)
    
    # Seed testimonials
    testimonials_count = await db.testimonials.count_documents({})
    if testimonials_count == 0:
        testimonials = [
            {
                "id": str(uuid.uuid4()),
                "name": "Elvin Mammadov",
                "course": "Front-end Development",
                "content": {"en": "Novatech changed my career. The instructors are amazing and the practical approach helped me land my dream job.", "az": "Novatech karyeramı dəyişdi. Müəllimlər əladır və praktik yanaşma arzuladığım işi tapmağıma kömək etdi.", "ru": "Novatech изменил мою карьеру. Преподаватели потрясающие, а практический подход помог мне найти работу мечты."},
                "rating": 5,
                "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Aysel Huseynova",
                "course": "Graphic Design",
                "content": {"en": "The best design course in Sumgayit! I learned everything from basics to advanced techniques. Highly recommend!", "az": "Sumqayıtda ən yaxşı dizayn kursu! Əsaslardan qabaqcıl texnikalara qədər hər şeyi öyrəndim. Tövsiyə edirəm!", "ru": "Лучший курс дизайна в Сумгайыте! Я изучила все от основ до продвинутых техник. Очень рекомендую!"},
                "rating": 5,
                "image_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Murad Aliyev",
                "course": "Back-end Development",
                "content": {"en": "Excellent teaching methodology. The hands-on projects really prepared me for real-world development.", "az": "Əla tədris metodologiyası. Praktik layihələr məni real inkişafa hazırladı.", "ru": "Отличная методика преподавания. Практические проекты действительно подготовили меня к реальной разработке."},
                "rating": 5,
                "image_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.testimonials.insert_many(testimonials)
    
    # Seed teachers
    teachers_count = await db.teachers.count_documents({})
    if teachers_count == 0:
        teachers = [
            {
                "id": str(uuid.uuid4()),
                "name": "Farhad Isgandarov",
                "role": {"en": "Founder & Lead Instructor", "az": "Təsisçi & Baş Müəllim", "ru": "Основатель и главный преподаватель"},
                "bio": {"en": "10+ years experience in software development and education.", "az": "Proqram təminatı və təhsil sahəsində 10+ il təcrübə.", "ru": "10+ лет опыта в разработке ПО и образовании."},
                "image_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
                "order": 1,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Leyla Ahmadova",
                "role": {"en": "Graphic Design Instructor", "az": "Qrafik Dizayn Müəllimi", "ru": "Преподаватель графического дизайна"},
                "bio": {"en": "Award-winning designer with expertise in branding and UI/UX.", "az": "Brendinq və UI/UX üzrə təcrübəli mükafatlı dizayner.", "ru": "Отмеченный наградами дизайнер с опытом в брендинге и UI/UX."},
                "image_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
                "order": 2,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Rashad Mammadov",
                "role": {"en": "Back-end Development Instructor", "az": "Back-end Proqramlaşdırma Müəllimi", "ru": "Преподаватель бэкенд-разработки"},
                "bio": {"en": "Senior software engineer with passion for teaching.", "az": "Tədrisə həvəsli baş proqram mühəndisi.", "ru": "Старший инженер-программист с страстью к преподаванию."},
                "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
                "order": 3,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.teachers.insert_many(teachers)
    
    # Seed hero slides
    slides_count = await db.slides.count_documents({})
    if slides_count == 0:
        slides = [
            {
                "id": str(uuid.uuid4()),
                "title": {"en": "Novatech Education Center", "az": "Novatech Təhsil Mərkəzi", "ru": "Образовательный центр Novatech"},
                "subtitle": {"en": "Professional technical education in Sumgayit", "az": "Sumqayıtda peşəkar texniki təhsil", "ru": "Профессиональное техническое образование в Сумгаите"},
                "badge": {"en": "Professional IT Education", "az": "Peşəkar IT Təhsili", "ru": "Профессиональное IT образование"},
                "background_image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920",
                "cta_text": {"en": "Free Consultation", "az": "Pulsuz Məsləhət", "ru": "Бесплатная консультация"},
                "cta_link": "whatsapp",
                "order": 1,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": {"en": "Learn Programming", "az": "Proqramlaşdırma Öyrənin", "ru": "Изучите программирование"},
                "subtitle": {"en": "Start your career in tech with our expert-led courses", "az": "Ekspert rəhbərliyi ilə texnologiyada karyeranıza başlayın", "ru": "Начните карьеру в IT с нашими курсами"},
                "badge": {"en": "New Courses Available", "az": "Yeni Kurslar Mövcuddur", "ru": "Доступны новые курсы"},
                "background_image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920",
                "cta_text": {"en": "View Courses", "az": "Kurslara Bax", "ru": "Смотреть курсы"},
                "cta_link": "/courses",
                "order": 2,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": {"en": "Design Your Future", "az": "Gələcəyini Dizayn Et", "ru": "Создайте своё будущее"},
                "subtitle": {"en": "Master graphic design and UI/UX with industry professionals", "az": "Sənaye mütəxəssisləri ilə qrafik dizayn və UI/UX öyrənin", "ru": "Освойте графический дизайн и UI/UX с профессионалами"},
                "badge": {"en": "Creative Courses", "az": "Kreativ Kurslar", "ru": "Творческие курсы"},
                "background_image": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1920",
                "cta_text": {"en": "Learn More", "az": "Ətraflı", "ru": "Подробнее"},
                "cta_link": "/courses",
                "order": 3,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.slides.insert_many(slides)
    
    # Seed CTA sections
    cta_count = await db.cta_sections.count_documents({})
    if cta_count == 0:
        cta_sections = [
            {
                "id": str(uuid.uuid4()),
                "section_key": "home_cta",
                "title": {"en": "Start Your Learning Journey Today", "az": "Bu Gün Təlim Səyahətinizə Başlayın", "ru": "Начните обучение сегодня"},
                "subtitle": {"en": "Join thousands of successful graduates who transformed their careers with Novatech", "az": "Novatech ilə karyeralarını dəyişdirən minlərlə uğurlu məzuna qoşulun", "ru": "Присоединяйтесь к тысячам успешных выпускников, изменивших карьеру с Novatech"},
                "button_text": {"en": "Contact Us on WhatsApp", "az": "WhatsApp ilə Əlaqə", "ru": "Связаться в WhatsApp"},
                "button_link": "whatsapp",
                "is_active": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.cta_sections.insert_many(cta_sections)
    
    # Seed site settings
    settings_count = await db.settings.count_documents({})
    if settings_count == 0:
        settings = {
            "id": str(uuid.uuid4()),
            "whatsapp_number": "+123456789",
            "contact": {
                "phones": ["+123456789"],
                "email": "info@novatech.az",
                "address": {"en": "Sumgayit, Markaz Plaza, Azerbaijan", "az": "Sumqayıt, Markaz Plaza, Azərbaycan", "ru": "Сумгаит, Markaz Plaza, Азербайджан"},
                "google_map_embed": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3047.9947858825374!2d49.6619!3d40.5898!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSumgayit%2C%20Azerbaijan!5e0!3m2!1sen!2s!4v1629789123456!5m2!1sen!2s"
            },
            "social_media": [
                {"platform": "instagram", "url": "https://instagram.com/novatech", "is_active": True},
                {"platform": "facebook", "url": "https://facebook.com/novatech", "is_active": True},
                {"platform": "linkedin", "url": "https://linkedin.com/company/novatech", "is_active": True},
                {"platform": "youtube", "url": "https://youtube.com/@novatech", "is_active": False},
                {"platform": "tiktok", "url": "https://tiktok.com/@novatech", "is_active": False}
            ],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.settings.insert_one(settings)
    
    return {"message": "Database seeded successfully"}

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Novatech Education Center API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

# CORS middleware with stricter settings
allowed_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,  # Cache preflight for 10 minutes
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
