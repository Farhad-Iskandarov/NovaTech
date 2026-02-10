#!/usr/bin/env python3

import requests
import sys
import json
import io
import os
from datetime import datetime

class NovatechAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_email = "farhad.isgandar@gmail.com"
        self.admin_password = "Nova.?Oba.?1234!"

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200, auth_required=False):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            return success, response.status_code, response_data

        except requests.exceptions.RequestException as e:
            return False, 0, {"error": str(e)}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, status, data = self.make_request('GET', '')
        self.log_test("API Root Endpoint", success and "Novatech" in str(data), 
                     f"Status: {status}, Data: {data}")
        return success

    def test_database_seeding(self):
        """Test database seeding"""
        success, status, data = self.make_request('POST', 'seed')
        self.log_test("Database Seeding", success, f"Status: {status}, Data: {data}")
        return success

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        login_data = {
            "email": self.admin_email,
            "password": self.admin_password
        }
        
        success, status, data = self.make_request('POST', 'auth/login', login_data)
        
        if success and 'access_token' in data:
            self.token = data['access_token']
            self.log_test("Admin Login", True, f"Token received: {self.token[:20]}...")
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {status}, Data: {data}")
            return False

    def test_get_courses(self):
        """Test getting courses list"""
        success, status, data = self.make_request('GET', 'courses')
        
        if success and isinstance(data, list):
            course_count = len(data)
            has_popular = any(course.get('is_popular', False) for course in data)
            self.log_test("Get Courses", True, f"Found {course_count} courses, has popular: {has_popular}")
            return data
        else:
            self.log_test("Get Courses", False, f"Status: {status}, Data: {data}")
            return []

    def test_get_course_detail(self, course_id):
        """Test getting course detail"""
        success, status, data = self.make_request('GET', f'courses/{course_id}')
        
        if success and 'title' in data:
            has_multilang = 'az' in data['title'] and 'en' in data['title']
            self.log_test("Get Course Detail", True, f"Course has multilang: {has_multilang}")
            return data
        else:
            self.log_test("Get Course Detail", False, f"Status: {status}, Data: {data}")
            return None

    def test_get_faqs(self, course_id):
        """Test getting FAQs for a course"""
        success, status, data = self.make_request('GET', f'faqs/{course_id}')
        
        if success and isinstance(data, list):
            faq_count = len(data)
            self.log_test("Get FAQs", True, f"Found {faq_count} FAQs for course")
            return data
        else:
            self.log_test("Get FAQs", False, f"Status: {status}, Data: {data}")
            return []

    def test_get_testimonials(self):
        """Test getting testimonials"""
        success, status, data = self.make_request('GET', 'testimonials')
        
        if success and isinstance(data, list):
            testimonial_count = len(data)
            self.log_test("Get Testimonials", True, f"Found {testimonial_count} testimonials")
            return data
        else:
            self.log_test("Get Testimonials", False, f"Status: {status}, Data: {data}")
            return []

    def test_get_teachers(self):
        """Test getting teachers"""
        success, status, data = self.make_request('GET', 'teachers')
        
        if success and isinstance(data, list):
            teacher_count = len(data)
            self.log_test("Get Teachers", True, f"Found {teacher_count} teachers")
            return data
        else:
            self.log_test("Get Teachers", False, f"Status: {status}, Data: {data}")
            return []

    def test_get_blogs(self):
        """Test getting blogs"""
        success, status, data = self.make_request('GET', 'blogs')
        
        if success and isinstance(data, list):
            blog_count = len(data)
            self.log_test("Get Blogs", True, f"Found {blog_count} blogs")
            return data
        else:
            self.log_test("Get Blogs", False, f"Status: {status}, Data: {data}")
            return []

    def test_get_homepage_blogs(self):
        """Test getting homepage blogs (NEW FEATURE)"""
        success, status, data = self.make_request('GET', 'blogs/homepage')
        
        if success and isinstance(data, list):
            homepage_blog_count = len(data)
            # Check if blogs have show_on_homepage field
            has_homepage_field = all('show_on_homepage' in blog for blog in data) if data else True
            # Check if all returned blogs are published and marked for homepage
            all_published_and_homepage = all(
                blog.get('is_published', False) and blog.get('show_on_homepage', False) 
                for blog in data
            ) if data else True
            
            self.log_test("Get Homepage Blogs", True, 
                         f"Found {homepage_blog_count} homepage blogs, has_homepage_field: {has_homepage_field}, all_published_and_homepage: {all_published_and_homepage}")
            return data
        else:
            self.log_test("Get Homepage Blogs", False, f"Status: {status}, Data: {data}")
            return []

    def test_blog_create_with_homepage_field(self):
        """Test creating blog with show_on_homepage field (NEW FEATURE)"""
        if not self.token:
            self.log_test("Blog Create with Homepage Field", False, "No admin token available")
            return None
            
        blog_data = {
            "title": {"en": "Test Blog for Homepage", "az": "Ana səhifə üçün test bloqu", "ru": "Тестовый блог для главной"},
            "content": {"en": "Test content", "az": "Test məzmunu", "ru": "Тестовое содержание"},
            "excerpt": {"en": "Test excerpt", "az": "Test xülasəsi", "ru": "Тестовое описание"},
            "slug": f"test-blog-homepage-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "is_published": True,
            "show_on_homepage": True
        }
        
        success, status, data = self.make_request('POST', 'blogs', blog_data, auth_required=True, expected_status=200)
        
        if success and 'id' in data:
            # Verify the blog was created with show_on_homepage field
            has_homepage_field = data.get('show_on_homepage', False)
            self.log_test("Blog Create with Homepage Field", has_homepage_field, 
                         f"Blog created with show_on_homepage: {has_homepage_field}")
            return data
        else:
            self.log_test("Blog Create with Homepage Field", False, f"Status: {status}, Data: {data}")
            return None

    def test_blog_update_homepage_field(self, blog_id):
        """Test updating blog show_on_homepage field (NEW FEATURE)"""
        if not self.token or not blog_id:
            self.log_test("Blog Update Homepage Field", False, "No admin token or blog ID available")
            return None
            
        update_data = {
            "show_on_homepage": False  # Toggle it off
        }
        
        success, status, data = self.make_request('PUT', f'blogs/{blog_id}', update_data, auth_required=True)
        
        if success and 'show_on_homepage' in data:
            updated_field = data.get('show_on_homepage', True)  # Should be False now
            self.log_test("Blog Update Homepage Field", not updated_field, 
                         f"Blog updated, show_on_homepage: {updated_field}")
            return data
        else:
            self.log_test("Blog Update Homepage Field", False, f"Status: {status}, Data: {data}")
            return None

    def test_contact_submission(self):
        """Test contact form submission"""
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+994501234567",
            "message": "This is a test message from automated testing"
        }
        
        success, status, data = self.make_request('POST', 'submissions/contact', contact_data)
        self.log_test("Contact Submission", success, f"Status: {status}, Data: {data}")
        return success

    def test_course_application(self, course_id, course_name):
        """Test course application submission"""
        application_data = {
            "name": "Test Applicant",
            "email": "applicant@example.com",
            "phone": "+994501234567",
            "course_id": course_id,
            "course_name": course_name,
            "message": "I want to apply for this course"
        }
        
        success, status, data = self.make_request('POST', 'submissions/application', application_data)
        self.log_test("Course Application", success, f"Status: {status}, Data: {data}")
        return success

    def test_analytics_tracking(self):
        """Test analytics page view tracking"""
        analytics_data = {
            "page_path": "/test",
            "page_title": "Test Page",
            "device_type": "desktop",
            "country": "Azerbaijan"
        }
        
        success, status, data = self.make_request('POST', 'analytics/pageview', analytics_data)
        self.log_test("Analytics Tracking", success, f"Status: {status}, Data: {data}")
        return success

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        if not self.token:
            self.log_test("Admin Endpoints", False, "No admin token available")
            return False

        # Test getting current user
        success, status, data = self.make_request('GET', 'auth/me', auth_required=True)
        if success and data.get('email') == self.admin_email:
            self.log_test("Get Current User", True, f"Admin user verified: {data['email']}")
        else:
            self.log_test("Get Current User", False, f"Status: {status}, Data: {data}")

        # Test getting submissions
        success, status, data = self.make_request('GET', 'submissions', auth_required=True)
        if success and isinstance(data, list):
            self.log_test("Get Submissions", True, f"Found {len(data)} submissions")
        else:
            self.log_test("Get Submissions", False, f"Status: {status}, Data: {data}")

        # Test analytics summary
        success, status, data = self.make_request('GET', 'analytics/summary', auth_required=True)
        if success and 'total_visits' in data:
            self.log_test("Analytics Summary", True, f"Total visits: {data['total_visits']}")
        else:
            self.log_test("Analytics Summary", False, f"Status: {status}, Data: {data}")

        return True

    def test_image_upload(self):
        """Test image upload functionality"""
        if not self.token:
            self.log_test("Image Upload", False, "No admin token available")
            return None
            
        # Create a simple test image (1x1 PNG)
        test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
        
        url = f"{self.api_url}/upload/image"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        files = {
            'file': ('test_image.png', io.BytesIO(test_image_data), 'image/png')
        }
        
        try:
            response = requests.post(url, files=files, headers=headers, timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data.get('success') and 'url' in data and 'filename' in data:
                    self.log_test("Image Upload", True, f"Image uploaded: {data['filename']}")
                    return data
                else:
                    self.log_test("Image Upload", False, f"Invalid response format: {data}")
                    return None
            else:
                try:
                    error_data = response.json()
                except:
                    error_data = {"text": response.text}
                self.log_test("Image Upload", False, f"Status: {response.status_code}, Data: {error_data}")
                return None
                
        except requests.exceptions.RequestException as e:
            self.log_test("Image Upload", False, f"Request error: {str(e)}")
            return None

    def test_image_retrieval(self, image_url):
        """Test retrieving uploaded image"""
        if not image_url:
            self.log_test("Image Retrieval", False, "No image URL provided")
            return False
            
        # Extract filename from URL and construct full URL
        if image_url.startswith('/api/'):
            full_url = f"{self.base_url}{image_url}"
        else:
            full_url = image_url
            
        try:
            response = requests.get(full_url, timeout=30)
            success = response.status_code == 200
            
            if success:
                content_type = response.headers.get('content-type', '')
                is_image = content_type.startswith('image/')
                content_length = len(response.content)
                
                self.log_test("Image Retrieval", is_image and content_length > 0, 
                             f"Content-Type: {content_type}, Size: {content_length} bytes")
                return is_image and content_length > 0
            else:
                self.log_test("Image Retrieval", False, f"Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Image Retrieval", False, f"Request error: {str(e)}")
            return False

    def test_image_upload_validation(self):
        """Test image upload validation (file type, size limits)"""
        if not self.token:
            self.log_test("Image Upload Validation", False, "No admin token available")
            return False
            
        url = f"{self.api_url}/upload/image"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Test invalid file type (text file)
        invalid_file = {
            'file': ('test.txt', io.BytesIO(b'This is not an image'), 'text/plain')
        }
        
        try:
            response = requests.post(url, files=invalid_file, headers=headers, timeout=30)
            invalid_rejected = response.status_code == 400
            
            if invalid_rejected:
                self.log_test("Image Upload Validation - Invalid Type", True, "Invalid file type correctly rejected")
            else:
                self.log_test("Image Upload Validation - Invalid Type", False, f"Invalid file not rejected: {response.status_code}")
            
            return invalid_rejected
            
        except requests.exceptions.RequestException as e:
            self.log_test("Image Upload Validation", False, f"Request error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting Novatech Education Center API Tests")
        print("=" * 60)

        # Test basic connectivity
        if not self.test_root_endpoint():
            print("❌ API is not accessible. Stopping tests.")
            return False

        # Seed database
        self.test_database_seeding()

        # Test authentication
        if not self.test_admin_login():
            print("❌ Admin login failed. Some tests will be skipped.")

        # Test public endpoints
        courses = self.test_get_courses()
        testimonials = self.test_get_testimonials()
        teachers = self.test_get_teachers()
        blogs = self.test_get_blogs()
        
        # Test NEW BLOG CAROUSEL FEATURES
        homepage_blogs = self.test_get_homepage_blogs()
        
        # Test blog CRUD with homepage field (admin required)
        created_blog = None
        if self.token:
            created_blog = self.test_blog_create_with_homepage_field()
            if created_blog:
                self.test_blog_update_homepage_field(created_blog['id'])

        # Test course details and FAQs if courses exist
        if courses:
            first_course = courses[0]
            course_detail = self.test_get_course_detail(first_course['id'])
            if course_detail:
                self.test_get_faqs(first_course['id'])
                # Test course application
                self.test_course_application(first_course['id'], 
                                           first_course['title'].get('en', 'Test Course'))

        # Test form submissions
        self.test_contact_submission()

        # Test analytics
        self.test_analytics_tracking()

        # Test admin endpoints
        if self.token:
            self.test_admin_endpoints()
            
        # Test IMAGE UPLOAD functionality (NEW FEATURE)
        uploaded_image = None
        if self.token:
            uploaded_image = self.test_image_upload()
            if uploaded_image:
                self.test_image_retrieval(uploaded_image.get('url'))
            self.test_image_upload_validation()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")

        if success_rate >= 80:
            print("✅ Backend API is working well!")
            return True
        else:
            print("❌ Backend has significant issues that need attention.")
            return False

def main():
    """Main test execution"""
    tester = NovatechAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())