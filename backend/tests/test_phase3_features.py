"""
Phase 3 Tests for Pink Lantern Platform
- Real Stripe Payment via Stripe Checkout
- Email Verification for escorts
- Cloudflare Turnstile CAPTCHA on registration/login
- Distance-based geolocation search
- Privacy Policy page (/privacy-policy)
- About/Contact page (/about)
"""

import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pink-lantern-mvp.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@pinklantern.com"
ESCORT_EMAIL = "escort1@pinklantern.com"
CLIENT_EMAIL = "client1@pinklantern.com"
PASSWORD = "password123"

# Turnstile test token (always passes with test secret key)
TURNSTILE_TEST_TOKEN = "test_token_for_turnstile"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin auth token"""
    response = api_client.post(f"{API_URL}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin login failed")


@pytest.fixture(scope="module")
def escort_token(api_client):
    """Get escort auth token"""
    response = api_client.post(f"{API_URL}/auth/login", json={
        "email": ESCORT_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Escort login failed")


@pytest.fixture(scope="module")
def client_token(api_client):
    """Get client auth token"""
    response = api_client.post(f"{API_URL}/auth/login", json={
        "email": CLIENT_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Client login failed")


@pytest.fixture(scope="module")
def escort_listing_id(api_client, escort_token):
    """Get an existing listing owned by escort1"""
    response = api_client.get(f"{API_URL}/escort/listings", headers={
        "Authorization": f"Bearer {escort_token}"
    })
    if response.status_code == 200 and response.json().get("listings"):
        return response.json()["listings"][0]["id"]
    pytest.skip("No escort listings found")


class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self, api_client):
        """Test that the API is accessible"""
        response = api_client.get(f"{API_URL}/listings")
        assert response.status_code == 200
        print("API health check passed")


class TestPremiumPackages:
    """Test premium packages endpoint"""
    
    def test_get_premium_packages(self, api_client):
        """GET /api/premium-packages returns all 6 premium packages"""
        response = api_client.get(f"{API_URL}/premium-packages")
        assert response.status_code == 200
        data = response.json()
        assert "packages" in data
        packages = data["packages"]
        
        # Verify all 6 packages exist
        expected_packages = ["featured_7", "featured_30", "featured_90", 
                           "top_featured_7", "top_featured_30", "top_featured_90"]
        for pkg_id in expected_packages:
            assert pkg_id in packages, f"Missing package: {pkg_id}"
            pkg = packages[pkg_id]
            assert "name" in pkg
            assert "premium_type" in pkg
            assert "duration_days" in pkg
            assert "price" in pkg
            assert isinstance(pkg["price"], (int, float))
        print(f"All 6 premium packages found: {list(packages.keys())}")
    
    def test_package_prices_correct(self, api_client):
        """Verify package prices are correct"""
        response = api_client.get(f"{API_URL}/premium-packages")
        packages = response.json()["packages"]
        
        expected_prices = {
            "featured_7": 29.99,
            "featured_30": 79.99,
            "featured_90": 199.99,
            "top_featured_7": 49.99,
            "top_featured_30": 129.99,
            "top_featured_90": 349.99
        }
        
        for pkg_id, expected_price in expected_prices.items():
            assert packages[pkg_id]["price"] == expected_price, f"Price mismatch for {pkg_id}"
        print("All package prices are correct")


class TestStripeCheckout:
    """Test Stripe checkout session creation"""
    
    def test_create_checkout_session(self, api_client, escort_token, escort_listing_id):
        """POST /api/stripe/create-checkout-session creates a Stripe checkout URL"""
        response = api_client.post(f"{API_URL}/stripe/create-checkout-session", 
            headers={"Authorization": f"Bearer {escort_token}"},
            json={
                "package_id": "featured_7",
                "listing_id": escort_listing_id,
                "origin_url": BASE_URL
            })
        
        assert response.status_code == 200
        data = response.json()
        assert "url" in data, "Missing checkout URL"
        assert "session_id" in data, "Missing session_id"
        assert data["url"].startswith("https://checkout.stripe.com/"), f"Invalid Stripe URL: {data['url']}"
        print(f"Stripe checkout session created: {data['session_id'][:20]}...")
        return data["session_id"]
    
    def test_checkout_session_invalid_package(self, api_client, escort_token, escort_listing_id):
        """Create checkout with invalid package returns 400"""
        response = api_client.post(f"{API_URL}/stripe/create-checkout-session",
            headers={"Authorization": f"Bearer {escort_token}"},
            json={
                "package_id": "invalid_package",
                "listing_id": escort_listing_id,
                "origin_url": BASE_URL
            })
        assert response.status_code == 400
        print("Invalid package correctly rejected")
    
    def test_checkout_status_requires_auth(self, api_client):
        """GET checkout status without auth returns 401"""
        response = api_client.get(f"{API_URL}/stripe/checkout-status/fake_session")
        assert response.status_code == 401
        print("Checkout status requires authentication")


class TestEmailVerification:
    """Test email verification flow for escorts"""
    
    def test_register_escort_requires_verification(self, api_client):
        """POST /api/auth/register with role=escort sets email_verified=false"""
        unique_email = f"test_escort_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{API_URL}/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "role": "escort",
            "turnstile_token": TURNSTILE_TEST_TOKEN
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data.get("email_verification_required") == True
        assert data["user"]["email_verified"] == False
        print(f"Escort registration requires email verification: {unique_email}")
    
    def test_register_client_no_verification(self, api_client):
        """POST /api/auth/register with role=client sets email_verified=true"""
        unique_email = f"test_client_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{API_URL}/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "role": "client",
            "turnstile_token": TURNSTILE_TEST_TOKEN
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data.get("email_verification_required", False) == False
        assert data["user"]["email_verified"] == True
        print(f"Client registration does not require email verification: {unique_email}")
    
    def test_verify_email_invalid_token(self, api_client):
        """POST /api/auth/verify-email with invalid token returns 400"""
        response = api_client.post(f"{API_URL}/auth/verify-email?token=invalid_token_12345")
        assert response.status_code == 400
        print("Invalid verification token correctly rejected")
    
    def test_resend_verification_requires_auth(self, api_client):
        """POST /api/auth/resend-verification requires authentication"""
        response = api_client.post(f"{API_URL}/auth/resend-verification")
        assert response.status_code == 401
        print("Resend verification requires authentication")


class TestLoginCaptchaStatus:
    """Test login CAPTCHA status endpoint"""
    
    def test_login_captcha_status(self, api_client):
        """GET /api/auth/login-captcha-status returns captcha_required status"""
        response = api_client.get(f"{API_URL}/auth/login-captcha-status?email={ADMIN_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert "captcha_required" in data
        assert isinstance(data["captcha_required"], bool)
        print(f"Login CAPTCHA status for {ADMIN_EMAIL}: {data['captcha_required']}")


class TestUnverifiedEscortRestrictions:
    """Test that unverified escorts cannot create listings"""
    
    def test_unverified_escort_cannot_create_listing(self, api_client):
        """Unverified escort attempting to create listing gets 403"""
        # Register a new unverified escort
        unique_email = f"test_unverified_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = api_client.post(f"{API_URL}/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "role": "escort",
            "turnstile_token": TURNSTILE_TEST_TOKEN
        })
        assert reg_response.status_code == 201
        token = reg_response.json()["access_token"]
        
        # Try to create a listing
        create_response = api_client.post(f"{API_URL}/listings",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "display_name": "Test Listing",
                "age": 25,
                "city": "Montreal",
                "price_1h": 300,
                "description": "Test description"
            })
        
        assert create_response.status_code == 403
        assert "verify" in create_response.json()["detail"].lower()
        print("Unverified escort correctly blocked from creating listings")


class TestContactForm:
    """Test contact form submission"""
    
    def test_submit_contact_form(self, api_client):
        """POST /api/contact stores contact form submission"""
        response = api_client.post(f"{API_URL}/contact", json={
            "name": "Test User",
            "email": "testcontact@example.com",
            "message": "This is a test message for Phase 3 testing."
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "success" in data["message"].lower()
        print("Contact form submission successful")
    
    def test_contact_form_validation(self, api_client):
        """Contact form with missing fields returns 422"""
        response = api_client.post(f"{API_URL}/contact", json={
            "name": "Test User"
            # Missing email and message
        })
        assert response.status_code == 422
        print("Contact form validation working")


class TestGeoDistanceSearch:
    """Test distance-based geolocation search"""
    
    def test_listings_with_geo_params(self, api_client):
        """GET /api/listings with geo params returns listings with distance_km"""
        # Montreal coordinates
        user_lat = 45.5017
        user_lng = -73.5673
        radius = 100  # km
        
        response = api_client.get(f"{API_URL}/listings", params={
            "user_lat": user_lat,
            "user_lng": user_lng,
            "radius": radius
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
        
        # Check that listings have distance_km field
        if data["listings"]:
            first_listing = data["listings"][0]
            assert "distance_km" in first_listing, "Listings should have distance_km field"
            assert first_listing["distance_km"] is not None
            
            # Verify listings are sorted by distance
            distances = [l["distance_km"] for l in data["listings"]]
            assert distances == sorted(distances), "Listings should be sorted by distance"
            print(f"Found {len(data['listings'])} listings within {radius}km, sorted by distance")
        else:
            print("No listings found within radius (may need to adjust radius)")
    
    def test_listings_without_geo_params(self, api_client):
        """GET /api/listings without geo params works normally"""
        response = api_client.get(f"{API_URL}/listings")
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
        print(f"Regular listings query works: {len(data['listings'])} listings")
    
    def test_geo_search_with_small_radius(self, api_client):
        """Geo search with small radius returns fewer results"""
        # Montreal coordinates
        user_lat = 45.5017
        user_lng = -73.5673
        
        # Large radius
        large_response = api_client.get(f"{API_URL}/listings", params={
            "user_lat": user_lat,
            "user_lng": user_lng,
            "radius": 500
        })
        
        # Small radius
        small_response = api_client.get(f"{API_URL}/listings", params={
            "user_lat": user_lat,
            "user_lng": user_lng,
            "radius": 5
        })
        
        assert large_response.status_code == 200
        assert small_response.status_code == 200
        
        large_count = len(large_response.json()["listings"])
        small_count = len(small_response.json()["listings"])
        
        assert small_count <= large_count, "Small radius should return fewer or equal results"
        print(f"Geo search: 500km radius={large_count}, 5km radius={small_count}")


class TestAdminPayments:
    """Test admin payments endpoint"""
    
    def test_admin_payments_list(self, api_client, admin_token):
        """GET /api/admin/payments returns payment transactions list"""
        response = api_client.get(f"{API_URL}/admin/payments",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200
        data = response.json()
        assert "payments" in data
        assert "total" in data
        assert "page" in data
        print(f"Admin payments endpoint works: {data['total']} transactions")
    
    def test_admin_payments_requires_admin(self, api_client, escort_token):
        """Non-admin cannot access payments"""
        response = api_client.get(f"{API_URL}/admin/payments",
            headers={"Authorization": f"Bearer {escort_token}"})
        assert response.status_code == 403
        print("Admin payments correctly restricted to admins")


class TestTurnstileCaptcha:
    """Test Turnstile CAPTCHA on registration"""
    
    def test_register_without_turnstile_fails(self, api_client):
        """Registration without turnstile_token fails when CAPTCHA is enabled"""
        unique_email = f"test_nocaptcha_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{API_URL}/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "role": "client"
            # No turnstile_token
        })
        
        # Should fail with 400 if CAPTCHA is enabled
        assert response.status_code == 400
        assert "captcha" in response.json()["detail"].lower()
        print("Registration without CAPTCHA token correctly rejected")
    
    def test_register_with_turnstile_succeeds(self, api_client):
        """Registration with turnstile_token succeeds"""
        unique_email = f"test_withcaptcha_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{API_URL}/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "role": "client",
            "turnstile_token": TURNSTILE_TEST_TOKEN
        })
        
        assert response.status_code == 201
        print("Registration with CAPTCHA token succeeded")


class TestEscortStats:
    """Test escort stats includes email_verified"""
    
    def test_escort_stats_has_email_verified(self, api_client, escort_token):
        """GET /api/escort/stats returns email_verified field"""
        response = api_client.get(f"{API_URL}/escort/stats",
            headers={"Authorization": f"Bearer {escort_token}"})
        
        assert response.status_code == 200
        data = response.json()
        assert "email_verified" in data
        print(f"Escort stats includes email_verified: {data['email_verified']}")


class TestAdminStats:
    """Test admin stats includes revenue metrics"""
    
    def test_admin_stats_has_revenue(self, api_client, admin_token):
        """GET /api/admin/stats returns total_revenue and total_payments"""
        response = api_client.get(f"{API_URL}/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"})
        
        assert response.status_code == 200
        data = response.json()
        assert "total_revenue" in data
        assert "total_payments" in data
        print(f"Admin stats: revenue=${data['total_revenue']}, payments={data['total_payments']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
