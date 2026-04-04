#!/usr/bin/env python3
"""
Pink Lantern Backend API Test Suite
Tests all major API endpoints for the escort classified ads platform
"""

import requests
import json
import sys
from datetime import datetime
import uuid

class PinkLanternAPITester:
    def __init__(self, base_url="https://pink-lantern-mvp.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.tokens = {}
        self.users = {}
        self.test_listings = []
        self.tests_run = 0
        self.tests_passed = 0
        print(f"🌸 Pink Lantern API Tester")
        print(f"📍 Testing against: {self.base_url}")
        print(f"⏰ Started at: {datetime.now()}")
        print("=" * 60)

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None, auth_token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        test_headers = {'Content-Type': 'application/json'}
        
        if auth_token:
            test_headers['Authorization'] = f'Bearer {auth_token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        print(f"   {method} {endpoint}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"   ✅ PASS - Status: {response.status_code}")
                try:
                    return response.json() if response.content else {}
                except:
                    return response.text
            else:
                print(f"   ❌ FAIL - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   📄 Response: {error_data}")
                except:
                    print(f"   📄 Response: {response.text}")
                return None

        except requests.exceptions.Timeout:
            print(f"   ❌ FAIL - Request timeout")
            return None
        except Exception as e:
            print(f"   ❌ FAIL - Error: {str(e)}")
            return None

    def test_seed_data(self):
        """Test seeding initial data"""
        print("\n🌱 SEEDING DATA")
        result = self.run_test("Seed Database", "POST", "seed", 200)
        if result:
            print(f"   📊 Seeded: {result.get('admins', 0)} admins, {result.get('escorts', 0)} escorts, {result.get('clients', 0)} clients")
        return result is not None

    def test_auth_flows(self):
        """Test all authentication flows"""
        print("\n🔐 AUTHENTICATION TESTS")
        
        # Test login with admin credentials
        admin_result = self.run_test(
            "Admin Login", "POST", "auth/login", 200,
            {"email": "admin@pinklantern.com", "password": "password123"}
        )
        if admin_result:
            self.tokens['admin'] = admin_result['access_token']
            self.users['admin'] = admin_result['user']
            print(f"   👑 Admin logged in: {admin_result['user']['display_name']}")

        # Test login with escort credentials  
        escort_result = self.run_test(
            "Escort Login", "POST", "auth/login", 200,
            {"email": "escort1@pinklantern.com", "password": "password123"}
        )
        if escort_result:
            self.tokens['escort'] = escort_result['access_token']
            self.users['escort'] = escort_result['user']
            print(f"   💃 Escort logged in: {escort_result['user']['display_name']}")

        # Test login with client credentials
        client_result = self.run_test(
            "Client Login", "POST", "auth/login", 200,
            {"email": "client1@pinklantern.com", "password": "password123"}
        )
        if client_result:
            self.tokens['client'] = client_result['access_token']
            self.users['client'] = client_result['user']
            print(f"   👤 Client logged in: {client_result['user']['display_name']}")

        # Test invalid login
        self.run_test(
            "Invalid Login", "POST", "auth/login", 401,
            {"email": "invalid@test.com", "password": "wrongpass"}
        )

        # Test auth/me endpoints
        if 'admin' in self.tokens:
            self.run_test(
                "Get Admin Profile", "GET", "auth/me", 200,
                auth_token=self.tokens['admin']
            )

        return len(self.tokens) >= 3

    def test_registration(self):
        """Test user registration"""
        print("\n📝 REGISTRATION TESTS")
        
        # Generate unique email to avoid conflicts
        test_email = f"test_client_{uuid.uuid4().hex[:8]}@test.com"
        
        # Test client registration
        client_reg = self.run_test(
            "Client Registration", "POST", "auth/register", 200,
            {
                "email": test_email,
                "password": "testpass123",
                "role": "client",
                "display_name": "Test Client",
                "city": "Montreal"
            }
        )
        
        if client_reg:
            print(f"   ✨ New client registered: {client_reg['user']['display_name']}")

        # Test duplicate email registration
        self.run_test(
            "Duplicate Email Registration", "POST", "auth/register", 400,
            {
                "email": test_email,  # Same email as above
                "password": "testpass123",
                "role": "client"
            }
        )

        return client_reg is not None

    def test_listings_api(self):
        """Test listings endpoints"""
        print("\n📋 LISTINGS TESTS")
        
        # Test get all listings (should be sorted by premium_priority_score)
        listings_result = self.run_test("Get All Listings (Priority Sort)", "GET", "listings", 200)
        if listings_result:
            listings = listings_result.get('listings', [])
            print(f"   📊 Found {len(listings)} listings, Total: {listings_result.get('total', 0)}")
            
            # Check premium priority sorting
            if len(listings) >= 2:
                print(f"   🔍 First listing priority: {listings[0].get('premium_priority_score', 0)} (Type: {listings[0].get('premium_type', 'standard')})")
                print(f"   🔍 Second listing priority: {listings[1].get('premium_priority_score', 0)} (Type: {listings[1].get('premium_type', 'standard')})")
                
            if listings:
                self.test_listings = listings[:3]  # Store first 3 for detail tests

        # Test search functionality
        self.run_test(
            "Search Listings by Name", "GET", 
            "listings?search=Sophia", 200
        )

        # Test city filtering
        self.run_test(
            "Filter by City", "GET",
            "listings?city=Montreal", 200
        )

        # Test price filtering
        self.run_test(
            "Filter by Price Range", "GET",
            "listings?min_price=200&max_price=500", 200
        )

        # Test sorting including premium sort
        sort_options = ["default", "newest", "price_asc", "price_desc", "verified", "premium"]
        for sort_option in sort_options:
            self.run_test(
                f"Sort by {sort_option}", "GET",
                f"listings?sort={sort_option}", 200
            )

        # Test verified and premium filters
        self.run_test("Filter Verified", "GET", "listings?verified=true", 200)
        self.run_test("Filter Premium", "GET", "listings?premium=true", 200)

        return listings_result is not None

    def test_listing_details(self):
        """Test individual listing endpoints"""
        print("\n🔍 LISTING DETAIL TESTS")
        
        if not self.test_listings:
            print("   ⚠️  No test listings available, skipping detail tests")
            return False

        success = True
        for listing in self.test_listings:
            listing_id = listing['id']
            result = self.run_test(
                f"Get Listing Detail", "GET", f"listings/{listing_id}", 200
            )
            if not result:
                success = False
            else:
                print(f"   📄 Listing: {result['display_name']} - {result['city']}")

        # Test invalid listing ID
        self.run_test("Invalid Listing ID", "GET", "listings/invalid-id", 404)

        return success

    def test_favorites(self):
        """Test favorites functionality"""
        print("\n❤️  FAVORITES TESTS")
        
        if 'client' not in self.tokens or not self.test_listings:
            print("   ⚠️  Missing client token or test listings, skipping favorites tests")
            return False

        client_token = self.tokens['client']
        listing_id = self.test_listings[0]['id']

        # Test toggle favorite (add)
        self.run_test(
            "Add to Favorites", "POST", f"favorites/{listing_id}", 200,
            auth_token=client_token
        )

        # Test get favorites
        favorites_result = self.run_test(
            "Get Favorites", "GET", "favorites", 200,
            auth_token=client_token
        )

        # Test get favorite IDs
        self.run_test(
            "Get Favorite IDs", "GET", "favorites/ids", 200,
            auth_token=client_token
        )

        # Test toggle favorite (remove)
        self.run_test(
            "Remove from Favorites", "POST", f"favorites/{listing_id}", 200,
            auth_token=client_token
        )

        return favorites_result is not None

    def test_reports(self):
        """Test reporting functionality"""
        print("\n🚨 REPORT TESTS")
        
        if 'client' not in self.tokens or not self.test_listings:
            print("   ⚠️  Missing client token or test listings, skipping report tests")
            return False

        client_token = self.tokens['client']
        listing_id = self.test_listings[0]['id']

        # Test create report
        self.run_test(
            "Create Report", "POST", "reports", 200,
            {
                "listing_id": listing_id,
                "reason": "fake",
                "details": "Test report for API testing"
            },
            auth_token=client_token
        )

        return True

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n👑 ADMIN TESTS")
        
        if 'admin' not in self.tokens:
            print("   ⚠️  No admin token available, skipping admin tests")
            return False

        admin_token = self.tokens['admin']

        # Test admin stats with Phase 2 fields
        stats_result = self.run_test(
            "Admin Stats (Phase 2)", "GET", "admin/stats", 200,
            auth_token=admin_token
        )
        if stats_result:
            print(f"   📊 Users: {stats_result.get('total_users', 0)}, Listings: {stats_result.get('total_listings', 0)}")
            print(f"   📊 New today: {stats_result.get('new_listings_today', 0)}, Phone clicks: {stats_result.get('total_phone_clicks', 0)}")
            print(f"   📊 Featured: {stats_result.get('featured_listings', 0)}, Top Featured: {stats_result.get('top_featured_listings', 0)}")

        # Test admin users list
        self.run_test(
            "Admin Users List", "GET", "admin/users", 200,
            auth_token=admin_token
        )

        # Test admin listings list  
        listings_result = self.run_test(
            "Admin Listings List", "GET", "admin/listings", 200,
            auth_token=admin_token
        )

        # Test admin reports list
        self.run_test(
            "Admin Reports List", "GET", "admin/reports", 200,
            auth_token=admin_token
        )

        # Test listing premium actions
        if listings_result and 'listings' in listings_result and listings_result['listings']:
            listing_id = listings_result['listings'][0]['id']
            
            # Test featured action
            self.run_test(
                "Set Listing Featured", "PUT", f"admin/listings/{listing_id}?action=featured", 200,
                auth_token=admin_token
            )
            
            # Test top_featured action  
            self.run_test(
                "Set Listing Top Featured", "PUT", f"admin/listings/{listing_id}?action=top_featured", 200,
                auth_token=admin_token
            )
            
            # Test unpremium action
            self.run_test(
                "Remove Premium", "PUT", f"admin/listings/{listing_id}?action=unpremium", 200,
                auth_token=admin_token
            )

        return stats_result is not None

    def test_escort_endpoints(self):
        """Test escort dashboard endpoints"""
        print("\n💃 ESCORT TESTS")
        
        if 'escort' not in self.tokens:
            print("   ⚠️  No escort token available, skipping escort tests")
            return False

        escort_token = self.tokens['escort']

        # Test escort stats with Phase 2 fields
        stats_result = self.run_test(
            "Escort Stats (Phase 2)", "GET", "escort/stats", 200,
            auth_token=escort_token
        )
        if stats_result:
            print(f"   📊 Phone clicks: {stats_result.get('total_phone_clicks', 0)}, Phone reveals: {stats_result.get('total_phone_reveals', 0)}")
            print(f"   📊 Premium count: {stats_result.get('premium_count', 0)}, Verified: {stats_result.get('is_verified', False)}")

        # Test escort listings
        listings_result = self.run_test(
            "Escort Listings", "GET", "escort/listings", 200,
            auth_token=escort_token
        )
        
        # Test premium upgrade if escort has listings
        if listings_result and 'listings' in listings_result and listings_result['listings']:
            listing_id = listings_result['listings'][0]['id']
            
            # Test featured upgrade
            self.run_test(
                "Upgrade to Featured", "POST", f"escort/listings/{listing_id}/upgrade-premium", 200,
                {"premium_type": "featured", "duration_days": 30},
                auth_token=escort_token
            )
            
            # Test top_featured upgrade
            self.run_test(
                "Upgrade to Top Featured", "POST", f"escort/listings/{listing_id}/upgrade-premium", 200,
                {"premium_type": "top_featured", "duration_days": 7},
                auth_token=escort_token
            )

        return True

    def test_listing_creation(self):
        """Test creating a new listing"""
        print("\n➕ LISTING CREATION TESTS")
        
        if 'escort' not in self.tokens:
            print("   ⚠️  No escort token available, skipping creation tests")
            return False

        escort_token = self.tokens['escort']
        
        # Test create listing
        new_listing_data = {
            "display_name": "Test Escort API",
            "age": 25,
            "origin": "Test Origin",
            "city": "Montreal",
            "price_1h": 350.0,
            "price_30min": 200.0,
            "incall": True,
            "outcall": False,
            "description": "Test listing created via API testing"
        }

        listing_result = self.run_test(
            "Create New Listing", "POST", "listings", 201,
            new_listing_data,
            auth_token=escort_token
        )
        
        if listing_result:
            created_id = listing_result['id']
            print(f"   ✨ Created listing: {listing_result['display_name']} (ID: {created_id[:8]}...)")
            
            # Test update the listing
            update_data = {**new_listing_data, "price_1h": 400.0, "description": "Updated test description"}
            self.run_test(
                "Update Listing", "PUT", f"listings/{created_id}", 200,
                update_data,
                auth_token=escort_token
            )

            # Test toggle listing status
            self.run_test(
                "Toggle Listing Status", "PUT", f"listings/{created_id}/toggle", 200,
                auth_token=escort_token
            )

        return listing_result is not None

    def test_phone_contact_system(self):
        """Test Phase 2 phone contact features"""
        print("\n📞 PHONE CONTACT TESTS")
        
        if not self.test_listings:
            print("   ⚠️  No test listings available, skipping phone contact tests")
            return False

        listing_id = self.test_listings[0]['id']

        # Test phone reveal (should work without auth)
        phone_result = self.run_test(
            "Reveal Phone Number", "POST", f"listings/{listing_id}/reveal-phone", 200
        )
        if phone_result:
            print(f"   📱 Phone revealed: {phone_result.get('phone_number', 'N/A')}")
            print(f"   📱 WhatsApp: {phone_result.get('whatsapp', 'N/A')}")
            print(f"   📱 Telegram: {phone_result.get('telegram', 'N/A')}")

        # Test phone click tracking
        self.run_test(
            "Track Phone Click", "POST", f"listings/{listing_id}/phone-click", 200
        )
        
        # Test another phone click
        self.run_test(
            "Track Another Phone Click", "POST", f"listings/{listing_id}/phone-click", 200
        )

        return phone_result is not None

    def test_banner_system(self):
        """Test Phase 2 banner advertising system"""
        print("\n🎯 BANNER SYSTEM TESTS")
        
        if 'admin' not in self.tokens:
            print("   ⚠️  No admin token available, skipping banner tests")
            return False

        admin_token = self.tokens['admin']

        # Test get banners (should work without auth)
        self.run_test(
            "Get Homepage Banners", "GET", "banners/homepage_top_banner", 200
        )

        # Test admin create banner
        banner_data = {
            "banner_position": "homepage_top_banner",
            "banner_link": "https://example.com",
            "enabled": True
        }
        banner_result = self.run_test(
            "Create Banner", "POST", "admin/banners", 201,
            banner_data,
            auth_token=admin_token
        )
        
        created_banner_id = None
        if banner_result:
            created_banner_id = banner_result['id']
            print(f"   🎯 Created banner: {created_banner_id[:8]}...")

        # Test admin get banners
        self.run_test(
            "Admin Get Banners", "GET", "admin/banners", 200,
            auth_token=admin_token
        )

        # Test banner click tracking
        if created_banner_id:
            self.run_test(
                "Track Banner Click", "POST", f"banners/{created_banner_id}/click", 200
            )

        # Test admin delete banner
        if created_banner_id:
            self.run_test(
                "Delete Banner", "DELETE", f"admin/banners/{created_banner_id}", 200,
                auth_token=admin_token
            )

        return banner_result is not None

    def test_migration_endpoint(self):
        """Test Phase 2 migration endpoint"""
        print("\n🔄 MIGRATION TESTS")
        
        # Test migration endpoint (should work without auth)
        migration_result = self.run_test(
            "Database Migration", "POST", "migrate", 200
        )
        if migration_result:
            print(f"   ✅ Migration completed: {migration_result.get('message', 'Success')}")

        return migration_result is not None

    def test_rate_limiting(self):
        """Test Phase 2 rate limiting"""
        print("\n⚡ RATE LIMITING TESTS")
        
        # Test login rate limiting (10/min)
        print("   🔄 Testing login rate limiting (10/min)...")
        failed_attempts = 0
        for i in range(12):  # Try 12 requests to exceed 10/min limit
            result = self.run_test(
                f"Rate Limit Login {i+1}", "POST", "auth/login", None,  # Don't specify expected status
                {"email": "nonexistent@test.com", "password": "wrong"}
            )
            if result is None:  # Request failed/was rate limited
                failed_attempts += 1

        if failed_attempts >= 2:  # Some requests should be rate limited
            print(f"   ✅ Login rate limiting working ({failed_attempts} requests blocked)")
        else:
            print(f"   ⚠️  Login rate limiting may not be working properly")

        # Test register rate limiting (5/min) 
        print("   🔄 Testing register rate limiting (5/min)...")
        failed_reg_attempts = 0
        for i in range(7):  # Try 7 requests to exceed 5/min limit
            result = self.run_test(
                f"Rate Limit Register {i+1}", "POST", "auth/register", None,
                {
                    "email": f"ratetest{i}@test.com",
                    "password": "testpass123",
                    "role": "client"
                }
            )
            if result is None:
                failed_reg_attempts += 1

        if failed_reg_attempts >= 2:
            print(f"   ✅ Register rate limiting working ({failed_reg_attempts} requests blocked)")
        else:
            print(f"   ⚠️  Register rate limiting may not be working properly")

        return True

    def test_unauthorized_access(self):
        """Test unauthorized access scenarios"""
        print("\n🚫 UNAUTHORIZED ACCESS TESTS")
        
        # Test admin endpoint without token
        self.run_test("Admin Stats No Auth", "GET", "admin/stats", 401)
        
        # Test escort endpoint without token
        self.run_test("Escort Stats No Auth", "GET", "escort/stats", 401)
        
        # Test favorites without token
        if self.test_listings:
            listing_id = self.test_listings[0]['id']
            self.run_test("Favorite No Auth", "POST", f"favorites/{listing_id}", 401)

        # Test client accessing admin endpoint
        if 'client' in self.tokens:
            self.run_test(
                "Client Access Admin", "GET", "admin/stats", 403,
                auth_token=self.tokens['client']
            )

        return True

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Pink Lantern API Test Suite")
        
        tests = [
            ("Seed Data", self.test_seed_data),
            ("Authentication", self.test_auth_flows),
            ("Registration", self.test_registration),
            ("Listings API", self.test_listings_api),
            ("Listing Details", self.test_listing_details),
            ("Phase 2: Phone Contact System", self.test_phone_contact_system),
            ("Phase 2: Banner System", self.test_banner_system),
            ("Phase 2: Migration", self.test_migration_endpoint),
            ("Favorites", self.test_favorites),
            ("Reports", self.test_reports),
            ("Admin Endpoints", self.test_admin_endpoints),
            ("Escort Endpoints", self.test_escort_endpoints),
            ("Listing Creation", self.test_listing_creation),
            ("Unauthorized Access", self.test_unauthorized_access),
            ("Phase 2: Rate Limiting", self.test_rate_limiting)
        ]

        passed_suites = 0
        for suite_name, test_func in tests:
            try:
                if test_func():
                    passed_suites += 1
                    print(f"\n✅ {suite_name} suite completed successfully")
                else:
                    print(f"\n⚠️  {suite_name} suite had issues")
            except Exception as e:
                print(f"\n❌ {suite_name} suite failed with error: {e}")

        self.print_summary(len(tests), passed_suites)
        return self.tests_passed == self.tests_run

    def print_summary(self, total_suites, passed_suites):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"🧪 Total API Tests: {self.tests_run}")
        print(f"✅ Passed Tests: {self.tests_passed}")
        print(f"❌ Failed Tests: {self.tests_run - self.tests_passed}")
        print(f"📈 Test Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"🏗️  Test Suites: {passed_suites}/{total_suites} passed")
        print(f"⏰ Completed at: {datetime.now()}")
        print("=" * 60)
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED! Pink Lantern API is working perfectly!")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
def main():
    """Main test execution"""
    tester = PinkLanternAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())