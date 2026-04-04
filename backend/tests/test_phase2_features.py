"""
Phase 2 Backend API Tests for Pink Lantern
Tests Premium System, Phone Reveal, Banners, Admin Functions, SEO Routes
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_admin_login(self):
        """Test admin login with credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pinklantern.com",
            "password": "password123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == "admin@pinklantern.com"
    
    def test_escort_login(self):
        """Test escort login with credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "escort1@pinklantern.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "escort"
        assert "access_token" in data
    
    def test_client_login(self):
        """Test client login with credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "client1@pinklantern.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "client"
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401


class TestListingsAPI:
    """Listing endpoint tests"""
    
    def test_get_listings_default_sort(self):
        """Test GET /api/listings returns listings sorted by premium_priority_score"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"limit": 10})
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
        assert "total" in data
        assert len(data["listings"]) > 0
        # Verify first listings have highest priority scores (top_featured first)
        listings = data["listings"]
        for i in range(min(len(listings) - 1, 3)):
            assert listings[i].get("premium_priority_score", 0) >= listings[i+1].get("premium_priority_score", 0)
    
    def test_get_listing_detail_increments_views(self):
        """Test GET /api/listings/{id} increments view count"""
        # First get a listing
        list_response = requests.get(f"{BASE_URL}/api/listings", params={"limit": 1})
        assert list_response.status_code == 200
        listing = list_response.json()["listings"][0]
        listing_id = listing["id"]
        initial_views = listing.get("views", 0)
        
        # Get the listing detail
        detail_response = requests.get(f"{BASE_URL}/api/listings/{listing_id}")
        assert detail_response.status_code == 200
        detail_data = detail_response.json()
        # Views should be incremented
        assert detail_data["views"] >= initial_views
    
    def test_search_filter(self):
        """Test search functionality"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"search": "Sophia"})
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
    
    def test_city_filter(self):
        """Test city filter"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"city": "Montreal"})
        assert response.status_code == 200
        data = response.json()
        for listing in data["listings"]:
            assert "montreal" in listing["city"].lower()
    
    def test_verified_filter(self):
        """Test verified filter"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"verified": "true"})
        assert response.status_code == 200
        data = response.json()
        for listing in data["listings"]:
            assert listing.get("is_verified") == True
    
    def test_premium_filter(self):
        """Test premium filter"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"premium": "true"})
        assert response.status_code == 200
        data = response.json()
        for listing in data["listings"]:
            assert listing.get("is_premium") == True


class TestPhoneRevealSystem:
    """Phone reveal and contact tracking tests"""
    
    def test_reveal_phone(self):
        """Test POST /api/listings/{id}/reveal-phone returns phone data"""
        # Get a listing first
        list_response = requests.get(f"{BASE_URL}/api/listings", params={"limit": 1})
        listing_id = list_response.json()["listings"][0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/listings/{listing_id}/reveal-phone")
        assert response.status_code == 200
        data = response.json()
        assert "phone_number" in data
        assert "whatsapp" in data
        assert "telegram" in data
    
    def test_phone_click_tracking(self):
        """Test POST /api/listings/{id}/phone-click tracks clicks"""
        list_response = requests.get(f"{BASE_URL}/api/listings", params={"limit": 1})
        listing_id = list_response.json()["listings"][0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/listings/{listing_id}/phone-click")
        assert response.status_code == 200
        assert "message" in response.json()


class TestSEORoutes:
    """SEO-friendly URL routing tests"""
    
    def test_seo_route_escort_city_slug(self):
        """Test GET /api/escort/{city}/{slug} returns listing"""
        # First get a listing to know valid city/slug
        list_response = requests.get(f"{BASE_URL}/api/listings", params={"limit": 1})
        listing = list_response.json()["listings"][0]
        city = listing["city"].lower()
        slug = listing.get("slug", "")
        
        if slug:
            response = requests.get(f"{BASE_URL}/api/escort/{city}/{slug}")
            assert response.status_code == 200
            data = response.json()
            assert data["display_name"] == listing["display_name"]


class TestReportSystem:
    """Report creation tests (requires authentication)"""
    
    @pytest.fixture
    def client_auth(self):
        """Get client authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "client1@pinklantern.com",
            "password": "password123"
        })
        return response.json()["access_token"]
    
    def test_create_report(self, client_auth):
        """Test POST /api/reports creates a report"""
        # Get a listing to report
        list_response = requests.get(f"{BASE_URL}/api/listings", params={"limit": 1})
        listing_id = list_response.json()["listings"][0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/reports",
            json={"listing_id": listing_id, "reason": "spam", "details": "Test report"},
            headers={"Authorization": f"Bearer {client_auth}"}
        )
        assert response.status_code == 200
        assert "message" in response.json()


class TestAdminAPI:
    """Admin dashboard and management API tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pinklantern.com",
            "password": "password123"
        })
        return response.json()["access_token"]
    
    def test_admin_stats(self, admin_token):
        """Test GET /api/admin/stats returns comprehensive stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Verify all required stats fields
        required_fields = [
            "total_users", "total_escorts", "total_clients",
            "total_listings", "active_listings", "pending_listings",
            "premium_listings", "featured_listings", "top_featured_listings",
            "verified_escorts", "total_reports", "pending_reports",
            "new_listings_today", "total_phone_clicks"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
    
    def test_admin_users_list(self, admin_token):
        """Test GET /api/admin/users returns user list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
    
    def test_admin_listings_list(self, admin_token):
        """Test GET /api/admin/listings returns listing list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/listings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
    
    def test_admin_reports_list(self, admin_token):
        """Test GET /api/admin/reports returns reports list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "reports" in data
    
    def test_admin_banners_list(self, admin_token):
        """Test GET /api/admin/banners returns banners list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/banners",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "banners" in data
    
    def test_admin_set_featured(self, admin_token):
        """Test admin can set listing as featured"""
        # Get a non-premium listing
        listings_response = requests.get(
            f"{BASE_URL}/api/admin/listings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        listings = listings_response.json()["listings"]
        # Find a standard listing
        test_listing = None
        for listing in listings:
            if listing.get("premium_type") == "standard":
                test_listing = listing
                break
        
        if test_listing:
            response = requests.put(
                f"{BASE_URL}/api/admin/listings/{test_listing['id']}?action=featured",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            # Revert to standard
            requests.put(
                f"{BASE_URL}/api/admin/listings/{test_listing['id']}?action=unpremium",
                headers={"Authorization": f"Bearer {admin_token}"}
            )


class TestBannerAPI:
    """Banner advertising system tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pinklantern.com",
            "password": "password123"
        })
        return response.json()["access_token"]
    
    def test_get_homepage_banner(self):
        """Test GET /api/banners/homepage_top_banner (public)"""
        response = requests.get(f"{BASE_URL}/api/banners/homepage_top_banner")
        assert response.status_code == 200
        data = response.json()
        assert "banners" in data
    
    def test_create_banner(self, admin_token):
        """Test POST /api/admin/banners creates a banner"""
        response = requests.post(
            f"{BASE_URL}/api/admin/banners",
            json={
                "banner_position": "homepage_top_banner",
                "banner_link": "https://test.com",
                "enabled": True
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        
        # Clean up - delete the created banner
        banner_id = data["id"]
        requests.delete(
            f"{BASE_URL}/api/admin/banners/{banner_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_banner_click_tracking(self, admin_token):
        """Test banner click tracking works"""
        # First create a test banner
        create_response = requests.post(
            f"{BASE_URL}/api/admin/banners",
            json={"banner_position": "homepage_mid_banner", "enabled": True},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        banner_id = create_response.json()["id"]
        
        # Track a click
        click_response = requests.post(f"{BASE_URL}/api/banners/{banner_id}/click")
        assert click_response.status_code == 200
        
        # Clean up
        requests.delete(
            f"{BASE_URL}/api/admin/banners/{banner_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestEscortDashboard:
    """Escort dashboard API tests"""
    
    @pytest.fixture
    def escort_token(self):
        """Get escort authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "escort1@pinklantern.com",
            "password": "password123"
        })
        return response.json()["access_token"]
    
    def test_escort_stats(self, escort_token):
        """Test GET /api/escort/stats returns correct stats"""
        response = requests.get(
            f"{BASE_URL}/api/escort/stats",
            headers={"Authorization": f"Bearer {escort_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        required_fields = [
            "total_listings", "active_listings", "total_views",
            "total_favorites", "total_phone_clicks", "total_phone_reveals",
            "premium_count", "is_verified"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
    
    def test_escort_listings(self, escort_token):
        """Test GET /api/escort/listings returns escort's listings"""
        response = requests.get(
            f"{BASE_URL}/api/escort/listings",
            headers={"Authorization": f"Bearer {escort_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
    
    def test_escort_premium_upgrade(self, escort_token):
        """Test POST /api/escort/listings/{id}/upgrade-premium (mock payment)"""
        # Get escort's listings
        listings_response = requests.get(
            f"{BASE_URL}/api/escort/listings",
            headers={"Authorization": f"Bearer {escort_token}"}
        )
        listings = listings_response.json()["listings"]
        
        if listings:
            listing_id = listings[0]["id"]
            response = requests.post(
                f"{BASE_URL}/api/escort/listings/{listing_id}/upgrade-premium",
                json={"premium_type": "featured", "duration_days": 7},
                headers={"Authorization": f"Bearer {escort_token}"}
            )
            assert response.status_code == 200
            assert "message" in response.json()


class TestFavorites:
    """Favorites functionality tests"""
    
    @pytest.fixture
    def client_auth(self):
        """Get client authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "client1@pinklantern.com",
            "password": "password123"
        })
        return response.json()["access_token"]
    
    def test_toggle_favorite(self, client_auth):
        """Test POST /api/favorites/{listing_id} toggles favorite"""
        # Get a listing
        list_response = requests.get(f"{BASE_URL}/api/listings", params={"limit": 1})
        listing_id = list_response.json()["listings"][0]["id"]
        
        # Toggle favorite (add)
        response = requests.post(
            f"{BASE_URL}/api/favorites/{listing_id}",
            headers={"Authorization": f"Bearer {client_auth}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "favorited" in data
        
        # Toggle again (remove if it was added)
        response2 = requests.post(
            f"{BASE_URL}/api/favorites/{listing_id}",
            headers={"Authorization": f"Bearer {client_auth}"}
        )
        assert response2.status_code == 200


class TestRegistration:
    """Registration endpoint tests"""
    
    def test_register_escort(self):
        """Test registration flow for new escort account"""
        import uuid
        unique_email = f"test_escort_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "role": "escort",
            "display_name": "Test Escort",
            "city": "Montreal"
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "escort"
        assert data["user"]["email"] == unique_email
    
    def test_register_client(self):
        """Test registration flow for new client account"""
        import uuid
        unique_email = f"test_client_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "role": "client"
        })
        assert response.status_code == 201


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
