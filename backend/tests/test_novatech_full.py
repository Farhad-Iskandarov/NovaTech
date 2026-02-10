"""
Comprehensive Backend API Tests for Novatech Education Center
Tests: Authentication, Slides, Settings, Courses, Testimonials, Teachers, Submissions
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN1_EMAIL = "farhad.isgandar@gmail.com"
ADMIN1_PASSWORD = "Nova1234?"
ADMIN2_EMAIL = "asif.aghayev@novatech.az"
ADMIN2_PASSWORD = "Admin.Lord.B@ku12!"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_admin1_login_success(self):
        """Test login with first admin account"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN1_EMAIL,
            "password": ADMIN1_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN1_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"SUCCESS: Admin1 login - {ADMIN1_EMAIL}")
    
    def test_admin2_login_success(self):
        """Test login with second admin account"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN2_EMAIL,
            "password": ADMIN2_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN2_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"SUCCESS: Admin2 login - {ADMIN2_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("SUCCESS: Invalid credentials rejected")
    
    def test_auth_me_with_valid_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN1_EMAIL,
            "password": ADMIN1_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Test /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN1_EMAIL
        print("SUCCESS: /auth/me returns correct user")


class TestHeroSlides:
    """Hero Slides CRUD tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN1_EMAIL,
            "password": ADMIN1_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_slides_public(self):
        """Test getting slides without authentication (public)"""
        response = requests.get(f"{BASE_URL}/api/slides")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: GET /slides returned {len(data)} slides")
    
    def test_get_slides_all(self, auth_token):
        """Test getting all slides including inactive"""
        response = requests.get(f"{BASE_URL}/api/slides?active_only=false", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: GET /slides?active_only=false returned {len(data)} slides")
    
    def test_slides_have_localized_content(self):
        """Test that slides have localized content structure"""
        response = requests.get(f"{BASE_URL}/api/slides")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            slide = data[0]
            assert "title" in slide
            assert "en" in slide["title"] or "az" in slide["title"]
            print("SUCCESS: Slides have localized content structure")
        else:
            pytest.skip("No slides to test")


class TestSiteSettings:
    """Site Settings tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN1_EMAIL,
            "password": ADMIN1_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_settings_public(self):
        """Test getting settings without authentication"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "whatsapp_number" in data
        assert "contact" in data
        assert "social_media" in data
        print("SUCCESS: GET /settings returns settings with all fields")
    
    def test_settings_contact_structure(self):
        """Test settings contact info structure"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        contact = data["contact"]
        assert "phones" in contact
        assert "email" in contact
        assert "address" in contact
        print("SUCCESS: Settings contact has correct structure")
    
    def test_settings_social_media_structure(self):
        """Test settings social media structure"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        data = response.json()
        social_media = data["social_media"]
        assert isinstance(social_media, list)
        
        if len(social_media) > 0:
            social = social_media[0]
            assert "platform" in social
            assert "url" in social
            assert "is_active" in social
        print(f"SUCCESS: Settings has {len(social_media)} social media entries")


class TestCourses:
    """Courses CRUD tests"""
    
    def test_get_courses_public(self):
        """Test getting courses without authentication"""
        response = requests.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: GET /courses returned {len(data)} courses")
    
    def test_courses_have_required_fields(self):
        """Test that courses have required fields"""
        response = requests.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            course = data[0]
            required_fields = ["id", "title", "description", "duration", "level", "category"]
            for field in required_fields:
                assert field in course, f"Missing field: {field}"
            print("SUCCESS: Courses have all required fields")
        else:
            pytest.skip("No courses to test")
    
    def test_get_course_by_id(self):
        """Test getting a specific course by ID"""
        # First get list of courses
        list_response = requests.get(f"{BASE_URL}/api/courses")
        courses = list_response.json()
        
        if len(courses) > 0:
            course_id = courses[0]["id"]
            response = requests.get(f"{BASE_URL}/api/courses/{course_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert data["id"] == course_id
            print(f"SUCCESS: GET /courses/{course_id} returns correct course")
        else:
            pytest.skip("No courses to test")


class TestTestimonials:
    """Testimonials tests"""
    
    def test_get_testimonials_public(self):
        """Test getting testimonials without authentication"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: GET /testimonials returned {len(data)} testimonials")
    
    def test_testimonials_have_required_fields(self):
        """Test that testimonials have required fields"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            testimonial = data[0]
            required_fields = ["id", "name", "course", "content", "rating"]
            for field in required_fields:
                assert field in testimonial, f"Missing field: {field}"
            print("SUCCESS: Testimonials have all required fields")
        else:
            pytest.skip("No testimonials to test")


class TestTeachers:
    """Teachers tests"""
    
    def test_get_teachers_public(self):
        """Test getting teachers without authentication"""
        response = requests.get(f"{BASE_URL}/api/teachers")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: GET /teachers returned {len(data)} teachers")
    
    def test_teachers_have_required_fields(self):
        """Test that teachers have required fields"""
        response = requests.get(f"{BASE_URL}/api/teachers")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            teacher = data[0]
            required_fields = ["id", "name", "role"]
            for field in required_fields:
                assert field in teacher, f"Missing field: {field}"
            print("SUCCESS: Teachers have all required fields")
        else:
            pytest.skip("No teachers to test")


class TestCTASections:
    """CTA Sections tests"""
    
    def test_get_cta_sections_public(self):
        """Test getting CTA sections without authentication"""
        response = requests.get(f"{BASE_URL}/api/cta-sections")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: GET /cta-sections returned {len(data)} sections")


class TestAnalytics:
    """Analytics tests"""
    
    def test_track_pageview(self):
        """Test tracking a pageview"""
        response = requests.post(f"{BASE_URL}/api/analytics/pageview", json={
            "page_path": "/test",
            "page_title": "Test Page",
            "device_type": "desktop",
            "country": "Test"
        })
        assert response.status_code == 200
        print("SUCCESS: POST /analytics/pageview works")
    
    def test_get_analytics_summary_requires_auth(self):
        """Test that analytics summary requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics/summary")
        # Should return 403 or 401 without auth
        assert response.status_code in [401, 403]
        print("SUCCESS: GET /analytics/summary requires authentication")


class TestSeedEndpoint:
    """Seed endpoint tests"""
    
    def test_seed_endpoint(self):
        """Test seed endpoint creates initial data"""
        response = requests.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        print("SUCCESS: POST /seed works")


class TestSubmissions:
    """Submissions tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN1_EMAIL,
            "password": ADMIN1_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_submit_contact_form(self):
        """Test submitting contact form"""
        response = requests.post(f"{BASE_URL}/api/submissions/contact", json={
            "name": "TEST_User",
            "email": "test@example.com",
            "phone": "+994501234567",
            "message": "This is a test message"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        print("SUCCESS: POST /submissions/contact works")
    
    def test_get_submissions_requires_auth(self):
        """Test that getting submissions requires authentication"""
        response = requests.get(f"{BASE_URL}/api/submissions")
        assert response.status_code in [401, 403]
        print("SUCCESS: GET /submissions requires authentication")
    
    def test_get_submissions_with_auth(self, auth_token):
        """Test getting submissions with authentication"""
        response = requests.get(f"{BASE_URL}/api/submissions", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: GET /submissions returned {len(data)} submissions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
