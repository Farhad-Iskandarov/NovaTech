"""
Test suite for Hero Carousel and Site Settings APIs
Tests the new admin features for managing hero slides, site settings, and social media
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "farhad.isgandar@gmail.com"
ADMIN_PASSWORD = "Nova1234?"


class TestAuthentication:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Test successful admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
    
    def test_admin_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed")


@pytest.fixture
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestHeroSlidesAPI:
    """Test Hero Slides CRUD operations"""
    
    def test_get_slides_public(self):
        """Test getting slides without auth (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/slides")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify slide structure
        if len(data) > 0:
            slide = data[0]
            assert "id" in slide
            assert "title" in slide
            assert "subtitle" in slide
            assert "background_image" in slide
            assert "cta_text" in slide
            assert "cta_link" in slide
            assert "is_active" in slide
            # Verify localized content structure
            assert "en" in slide["title"]
            assert "az" in slide["title"]
            assert "ru" in slide["title"]
    
    def test_get_slides_all_with_auth(self, auth_headers):
        """Test getting all slides including inactive ones"""
        response = requests.get(f"{BASE_URL}/api/slides?active_only=false", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_slide(self, auth_headers):
        """Test creating a new slide"""
        slide_data = {
            "title": {"en": "TEST Slide", "az": "TEST Slayd", "ru": "ТЕСТ Слайд"},
            "subtitle": {"en": "Test subtitle", "az": "Test alt başlıq", "ru": "Тест подзаголовок"},
            "badge": {"en": "Test Badge", "az": "Test Nişan", "ru": "Тест Значок"},
            "background_image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920",
            "cta_text": {"en": "Test CTA", "az": "Test CTA", "ru": "Тест CTA"},
            "cta_link": "/test",
            "order": 99,
            "is_active": False
        }
        response = requests.post(f"{BASE_URL}/api/slides", json=slide_data, headers=auth_headers)
        assert response.status_code == 200, f"Create slide failed: {response.text}"
        data = response.json()
        assert data["title"]["en"] == "TEST Slide"
        assert data["is_active"] == False
        return data["id"]
    
    def test_update_slide(self, auth_headers):
        """Test updating a slide"""
        # First create a slide
        slide_data = {
            "title": {"en": "TEST Update Slide", "az": "TEST Yenilə Slayd", "ru": "ТЕСТ Обновить Слайд"},
            "subtitle": {"en": "Original subtitle", "az": "Orijinal alt başlıq", "ru": "Оригинальный подзаголовок"},
            "background_image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920",
            "cta_text": {"en": "Original CTA", "az": "Orijinal CTA", "ru": "Оригинальный CTA"},
            "cta_link": "/original",
            "order": 98,
            "is_active": False
        }
        create_response = requests.post(f"{BASE_URL}/api/slides", json=slide_data, headers=auth_headers)
        assert create_response.status_code == 200
        slide_id = create_response.json()["id"]
        
        # Update the slide
        update_data = {
            "title": {"en": "TEST Updated Slide", "az": "TEST Yenilənmiş Slayd", "ru": "ТЕСТ Обновленный Слайд"},
            "is_active": True
        }
        update_response = requests.put(f"{BASE_URL}/api/slides/{slide_id}", json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["title"]["en"] == "TEST Updated Slide"
        assert updated["is_active"] == True
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/slides/{slide_id}", headers=auth_headers)
    
    def test_delete_slide(self, auth_headers):
        """Test deleting a slide"""
        # First create a slide
        slide_data = {
            "title": {"en": "TEST Delete Slide", "az": "TEST Sil Slayd", "ru": "ТЕСТ Удалить Слайд"},
            "subtitle": {"en": "To be deleted", "az": "Silinəcək", "ru": "Будет удален"},
            "background_image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920",
            "cta_text": {"en": "Delete CTA", "az": "Sil CTA", "ru": "Удалить CTA"},
            "cta_link": "/delete",
            "order": 97,
            "is_active": False
        }
        create_response = requests.post(f"{BASE_URL}/api/slides", json=slide_data, headers=auth_headers)
        assert create_response.status_code == 200
        slide_id = create_response.json()["id"]
        
        # Delete the slide
        delete_response = requests.delete(f"{BASE_URL}/api/slides/{slide_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify deletion - should not appear in list
        get_response = requests.get(f"{BASE_URL}/api/slides?active_only=false", headers=auth_headers)
        slides = get_response.json()
        slide_ids = [s["id"] for s in slides]
        assert slide_id not in slide_ids


class TestSiteSettingsAPI:
    """Test Site Settings API"""
    
    def test_get_settings_public(self):
        """Test getting settings without auth (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "whatsapp_number" in data
        assert "contact" in data
        assert "social_media" in data
        # Verify contact structure
        assert "phones" in data["contact"]
        assert "email" in data["contact"]
        assert "address" in data["contact"]
        # Verify address is localized
        assert "en" in data["contact"]["address"]
        assert "az" in data["contact"]["address"]
        assert "ru" in data["contact"]["address"]
    
    def test_update_settings(self, auth_headers):
        """Test updating site settings"""
        # First get current settings
        get_response = requests.get(f"{BASE_URL}/api/settings")
        original_settings = get_response.json()
        
        # Update settings
        update_data = {
            "whatsapp_number": "+994501234567",
            "contact": {
                "phones": ["+994501234567", "+994701234567"],
                "email": "test@novatech.az",
                "address": {
                    "en": "Test Address EN",
                    "az": "Test Ünvan AZ",
                    "ru": "Тест Адрес RU"
                },
                "google_map_embed": "https://www.google.com/maps/embed?pb=test"
            },
            "social_media": [
                {"platform": "instagram", "url": "https://instagram.com/test", "is_active": True},
                {"platform": "facebook", "url": "https://facebook.com/test", "is_active": True},
                {"platform": "linkedin", "url": "https://linkedin.com/test", "is_active": False}
            ]
        }
        
        update_response = requests.put(f"{BASE_URL}/api/settings", json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["whatsapp_number"] == "+994501234567"
        assert len(updated["contact"]["phones"]) == 2
        assert updated["contact"]["email"] == "test@novatech.az"
        
        # Verify GET returns updated data
        verify_response = requests.get(f"{BASE_URL}/api/settings")
        verified = verify_response.json()
        assert verified["whatsapp_number"] == "+994501234567"
        
        # Restore original settings
        restore_data = {
            "whatsapp_number": original_settings["whatsapp_number"],
            "contact": original_settings["contact"],
            "social_media": original_settings["social_media"]
        }
        requests.put(f"{BASE_URL}/api/settings", json=restore_data, headers=auth_headers)
    
    def test_social_media_toggle(self, auth_headers):
        """Test toggling social media platforms"""
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/settings")
        original = get_response.json()
        
        # Update with toggled social media
        social_media = original.get("social_media", [])
        # Toggle instagram
        for sm in social_media:
            if sm["platform"] == "instagram":
                sm["is_active"] = not sm["is_active"]
        
        update_data = {
            "whatsapp_number": original["whatsapp_number"],
            "contact": original["contact"],
            "social_media": social_media
        }
        
        update_response = requests.put(f"{BASE_URL}/api/settings", json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        
        # Restore original
        restore_data = {
            "whatsapp_number": original["whatsapp_number"],
            "contact": original["contact"],
            "social_media": original["social_media"]
        }
        requests.put(f"{BASE_URL}/api/settings", json=restore_data, headers=auth_headers)


class TestPublicEndpoints:
    """Test public endpoints that use slides and settings"""
    
    def test_courses_endpoint(self):
        """Test courses endpoint"""
        response = requests.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_testimonials_endpoint(self):
        """Test testimonials endpoint"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_teachers_endpoint(self):
        """Test teachers endpoint"""
        response = requests.get(f"{BASE_URL}/api/teachers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_blogs_endpoint(self):
        """Test blogs endpoint"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_slides(self, auth_headers):
        """Remove any TEST_ prefixed slides"""
        response = requests.get(f"{BASE_URL}/api/slides?active_only=false", headers=auth_headers)
        if response.status_code == 200:
            slides = response.json()
            for slide in slides:
                if slide.get("title", {}).get("en", "").startswith("TEST"):
                    requests.delete(f"{BASE_URL}/api/slides/{slide['id']}", headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
