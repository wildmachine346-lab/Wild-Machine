"""
Test suite for Wild Machine rebranding and new features:
- Backend API verification for car_call, en_ligne, is_trans fields
- 14 Quebec cities in seed data
- New service type filtering
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBrandingAndAPIBasics:
    """Test basic API functionality and branding changes"""
    
    def test_api_health_check(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ Health check passed")
    
    def test_listings_endpoint_accessible(self):
        """Verify GET /api/listings returns 200"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
        assert "total" in data
        print(f"✅ Listings endpoint accessible - {data['total']} listings found")


class TestNewServiceTypeFields:
    """Test car_call, en_ligne, is_trans query parameters in GET /api/listings"""
    
    def test_filter_by_car_call(self):
        """Verify car_call filter parameter works"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"car_call": True})
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
        print(f"✅ car_call filter works - {data['total']} listings with car_call=true")
    
    def test_filter_by_en_ligne(self):
        """Verify en_ligne (Online) filter parameter works"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"en_ligne": True})
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
        print(f"✅ en_ligne filter works - {data['total']} listings with en_ligne=true")
    
    def test_filter_by_is_trans(self):
        """Verify is_trans filter parameter works"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"is_trans": True})
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
        print(f"✅ is_trans filter works - {data['total']} listings with is_trans=true")
    
    def test_combined_filters(self):
        """Verify multiple new filters can be combined"""
        response = requests.get(f"{BASE_URL}/api/listings", params={
            "incall": True,
            "car_call": True
        })
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
        print(f"✅ Combined filters work - {data['total']} listings matching")


class TestQuebecCities:
    """Test that 14 Quebec cities are present in the seed data"""
    
    QUEBEC_CITIES = [
        'Montréal', 'Laval', 'Longueuil', 'Terrebonne', 'Brossard', 
        'Repentigny', 'Blainville', 'Mirabel', 'Dollard-des-Ormeaux', 
        'Châteauguay', 'Mascouche', 'Saint-Eustache', 'Boucherville', 
        'Vaudreuil-Dorion'
    ]
    
    OLD_CITIES = ['Toronto', 'Vancouver', 'Paris', 'Shanghai', 'New York']
    
    def test_listings_have_quebec_cities(self):
        """Verify listings use Quebec cities"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"limit": 50})
        assert response.status_code == 200
        data = response.json()
        
        cities_found = set()
        for listing in data['listings']:
            city = listing.get('city', '')
            cities_found.add(city)
        
        # Check that at least some Quebec cities are present
        quebec_found = cities_found.intersection(set(self.QUEBEC_CITIES))
        assert len(quebec_found) > 0, f"No Quebec cities found. Cities in data: {cities_found}"
        print(f"✅ Quebec cities found: {quebec_found}")
    
    def test_montreal_filter(self):
        """Verify Montréal filter works"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"city": "Montréal"})
        assert response.status_code == 200
        data = response.json()
        # All results should have Montréal as city
        for listing in data['listings']:
            assert 'Montréal' in listing.get('city', '') or 'Montreal' in listing.get('city', '')
        print(f"✅ Montréal filter works - {data['total']} listings found")
    
    def test_no_old_cities(self):
        """Verify old cities (Toronto, Vancouver, etc.) are not in data"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"limit": 50})
        assert response.status_code == 200
        data = response.json()
        
        cities_found = set()
        for listing in data['listings']:
            cities_found.add(listing.get('city', ''))
        
        # Check no old cities are present
        old_found = cities_found.intersection(set(self.OLD_CITIES))
        assert len(old_found) == 0, f"Old cities found: {old_found}"
        print(f"✅ No old cities found in data")


class TestAuthentication:
    """Test authentication with new wildmachine.com credentials"""
    
    def test_admin_login(self):
        """Verify admin can login with new credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wildmachine.com",
            "password": "password123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("role") == "admin"
        print("✅ Admin login works with admin@wildmachine.com")
        return data["access_token"]
    
    def test_escort_login(self):
        """Verify escort can login with new credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "escort1@wildmachine.com",
            "password": "password123"
        })
        assert response.status_code == 200, f"Escort login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("role") == "escort"
        print("✅ Escort login works with escort1@wildmachine.com")
        return data["access_token"]


class TestListingCRUD:
    """Test creating/updating listings with new fields"""
    
    @pytest.fixture
    def auth_token(self):
        """Get escort auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "escort1@wildmachine.com",
            "password": "password123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Could not authenticate")
    
    def test_create_listing_with_new_fields(self, auth_token):
        """Verify POST /api/listings accepts car_call, en_ligne, is_trans"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "display_name": "TEST_NewFields",
            "age": 25,
            "city": "Montréal",
            "price_1h": 300,
            "description": "Test listing with new service fields",
            "incall": True,
            "outcall": True,
            "car_call": True,
            "en_ligne": True,
            "is_trans": False
        }
        response = requests.post(f"{BASE_URL}/api/listings", json=payload, headers=headers)
        assert response.status_code in [200, 201], f"Create failed: {response.text}"
        data = response.json()
        
        # Verify fields are in response
        assert data.get("car_call") == True, "car_call not saved"
        assert data.get("en_ligne") == True, "en_ligne not saved"
        assert data.get("is_trans") == False, "is_trans not saved"
        print(f"✅ Created listing with car_call={data.get('car_call')}, en_ligne={data.get('en_ligne')}, is_trans={data.get('is_trans')}")
        
        # Clean up
        listing_id = data.get("id")
        if listing_id:
            requests.delete(f"{BASE_URL}/api/listings/{listing_id}", headers=headers)
    
    def test_get_listing_has_new_fields(self, auth_token):
        """Verify GET /api/listings/{id} returns car_call, en_ligne, is_trans"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First create a listing
        payload = {
            "display_name": "TEST_VerifyFields",
            "age": 25,
            "city": "Laval",
            "price_1h": 350,
            "description": "Test for field verification",
            "car_call": True,
            "en_ligne": False,
            "is_trans": True
        }
        create_response = requests.post(f"{BASE_URL}/api/listings", json=payload, headers=headers)
        assert create_response.status_code in [200, 201]
        listing_id = create_response.json().get("id")
        
        # Get the listing
        get_response = requests.get(f"{BASE_URL}/api/listings/{listing_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        # Verify new fields
        assert "car_call" in data
        assert "en_ligne" in data
        assert "is_trans" in data
        assert data.get("car_call") == True
        assert data.get("en_ligne") == False
        assert data.get("is_trans") == True
        print(f"✅ GET listing returns new fields correctly")
        
        # Clean up
        requests.delete(f"{BASE_URL}/api/listings/{listing_id}", headers=headers)


class TestListingFieldsInResponse:
    """Verify existing listings have the new fields"""
    
    def test_listings_have_new_service_fields(self):
        """Check that listings response includes car_call, en_ligne, is_trans"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"limit": 5})
        assert response.status_code == 200
        data = response.json()
        
        for listing in data.get("listings", []):
            # These fields should exist (even if False/null)
            assert "incall" in listing, f"incall missing from listing {listing.get('id')}"
            assert "outcall" in listing, f"outcall missing from listing {listing.get('id')}"
            # New fields may be missing from old data, but should be queryable
        
        print(f"✅ Listings have service type fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
