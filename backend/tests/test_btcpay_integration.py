"""
BTCPay Server Integration Tests - Wild Machine
Testing Stripe to BTCPay replacement, CAD pricing, webhook handling
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPremiumPackages:
    """Test GET /api/premium-packages returns 6 packages with CAD currency"""
    
    def test_premium_packages_endpoint_returns_200(self):
        response = requests.get(f"{BASE_URL}/api/premium-packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASSED: GET /api/premium-packages returns 200")
    
    def test_premium_packages_returns_6_packages(self):
        response = requests.get(f"{BASE_URL}/api/premium-packages")
        data = response.json()
        assert "packages" in data, "Response missing 'packages' key"
        assert len(data["packages"]) == 6, f"Expected 6 packages, got {len(data['packages'])}"
        print("PASSED: Returns 6 premium packages")
    
    def test_premium_packages_all_have_cad_currency(self):
        response = requests.get(f"{BASE_URL}/api/premium-packages")
        data = response.json()
        for pkg_id, pkg in data["packages"].items():
            assert pkg["currency"] == "CAD", f"Package {pkg_id} has currency {pkg['currency']}, expected CAD"
        print("PASSED: All packages use CAD currency")
    
    def test_premium_packages_structure(self):
        response = requests.get(f"{BASE_URL}/api/premium-packages")
        data = response.json()
        expected_keys = ["name", "premium_type", "duration_days", "price", "currency"]
        for pkg_id, pkg in data["packages"].items():
            for key in expected_keys:
                assert key in pkg, f"Package {pkg_id} missing key '{key}'"
        print("PASSED: All packages have correct structure")
    
    def test_premium_packages_correct_ids(self):
        response = requests.get(f"{BASE_URL}/api/premium-packages")
        data = response.json()
        expected_ids = ["featured_7", "featured_30", "featured_90", "top_featured_7", "top_featured_30", "top_featured_90"]
        for pkg_id in expected_ids:
            assert pkg_id in data["packages"], f"Missing package {pkg_id}"
        print("PASSED: All expected package IDs present")


class TestBTCPayCreateInvoice:
    """Test POST /api/btcpay/create-invoice endpoint"""
    
    def test_create_invoice_requires_auth(self):
        """Unauthenticated request should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/btcpay/create-invoice",
            json={"package_id": "featured_7", "listing_id": "test", "origin_url": "http://test.com"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASSED: Create invoice requires authentication")
    
    def test_create_invoice_requires_escort_role(self):
        """Client role should be forbidden"""
        # Login as admin (not escort)
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@wildmachine.com",
            "password": "password123"
        })
        if login_resp.status_code != 200:
            pytest.skip("Admin login failed")
        
        token = login_resp.json().get("access_token")
        response = requests.post(
            f"{BASE_URL}/api/btcpay/create-invoice",
            headers={"Authorization": f"Bearer {token}"},
            json={"package_id": "featured_7", "listing_id": "test", "origin_url": "http://test.com"}
        )
        assert response.status_code == 403, f"Expected 403 for admin role, got {response.status_code}"
        print("PASSED: Create invoice requires escort role")
    
    def test_create_invoice_returns_503_when_btcpay_not_configured(self):
        """Should return 503 when BTCPay is not configured (empty env vars)"""
        # Login as escort
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "escort1@wildmachine.com",
            "password": "password123"
        })
        if login_resp.status_code != 200:
            pytest.skip("Escort login failed")
        
        token = login_resp.json().get("access_token")
        
        # First, we need a valid listing ID owned by this escort
        listings_resp = requests.get(
            f"{BASE_URL}/api/escort/listings",
            headers={"Authorization": f"Bearer {token}"}
        )
        if listings_resp.status_code != 200:
            pytest.skip("Could not fetch escort listings")
        
        listings = listings_resp.json().get("listings", [])
        listing_id = listings[0]["id"] if listings else "test-listing-id"
        
        response = requests.post(
            f"{BASE_URL}/api/btcpay/create-invoice",
            headers={"Authorization": f"Bearer {token}"},
            json={"package_id": "featured_7", "listing_id": listing_id, "origin_url": "http://test.com"}
        )
        # Expected: 503 if BTCPay not configured, 404 if listing not found
        assert response.status_code in [503, 404], f"Expected 503 or 404, got {response.status_code}"
        if response.status_code == 503:
            assert "not configured" in response.json().get("detail", "").lower()
            print("PASSED: Create invoice returns 503 when BTCPay not configured")
        else:
            print("PASSED: Create invoice validates listing ownership (returns 404)")


class TestBTCPayPaymentStatus:
    """Test GET /api/btcpay/payment-status/{txn_id} endpoint"""
    
    def test_payment_status_requires_auth(self):
        """Unauthenticated request should return 401"""
        response = requests.get(f"{BASE_URL}/api/btcpay/payment-status/test-txn-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASSED: Payment status requires authentication")
    
    def test_payment_status_returns_404_for_unknown_txn(self):
        """Unknown transaction ID should return 404"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "escort1@wildmachine.com",
            "password": "password123"
        })
        if login_resp.status_code != 200:
            pytest.skip("Escort login failed")
        
        token = login_resp.json().get("access_token")
        response = requests.get(
            f"{BASE_URL}/api/btcpay/payment-status/non-existent-txn-id",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        assert "not found" in response.json().get("detail", "").lower()
        print("PASSED: Payment status returns 404 for unknown transaction")


class TestBTCPayWebhook:
    """Test POST /api/webhook/btcpay endpoint"""
    
    def test_webhook_accepts_post_request(self):
        """Webhook should accept POST requests"""
        response = requests.post(
            f"{BASE_URL}/api/webhook/btcpay",
            json={"type": "InvoiceCreated", "invoiceId": "test-invoice"}
        )
        # Should return 200 even for unmatched invoices (graceful handling)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.json().get("status") == "ok"
        print("PASSED: Webhook accepts POST requests")
    
    def test_webhook_handles_invoice_settled_event(self):
        """InvoiceSettled event should be processed"""
        response = requests.post(
            f"{BASE_URL}/api/webhook/btcpay",
            json={"type": "InvoiceSettled", "invoiceId": "non-existent-invoice"}
        )
        assert response.status_code == 200
        print("PASSED: Webhook handles InvoiceSettled event")
    
    def test_webhook_handles_invoice_expired_event(self):
        """InvoiceExpired event should be processed"""
        response = requests.post(
            f"{BASE_URL}/api/webhook/btcpay",
            json={"type": "InvoiceExpired", "invoiceId": "non-existent-invoice"}
        )
        assert response.status_code == 200
        print("PASSED: Webhook handles InvoiceExpired event")
    
    def test_webhook_handles_invoice_invalid_event(self):
        """InvoiceInvalid event should be processed"""
        response = requests.post(
            f"{BASE_URL}/api/webhook/btcpay",
            json={"type": "InvoiceInvalid", "invoiceId": "non-existent-invoice"}
        )
        assert response.status_code == 200
        print("PASSED: Webhook handles InvoiceInvalid event")
    
    def test_webhook_handles_empty_payload(self):
        """Webhook should handle empty payload gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/webhook/btcpay",
            json={}
        )
        assert response.status_code == 200
        print("PASSED: Webhook handles empty payload gracefully")


class TestNoStripeReferences:
    """Verify ZERO Stripe references in backend files"""
    
    def test_server_py_no_stripe(self):
        """server.py should have no Stripe references"""
        import subprocess
        result = subprocess.run(
            ["grep", "-i", "stripe", "/app/backend/server.py"],
            capture_output=True, text=True
        )
        assert result.returncode != 0, "Found Stripe references in server.py"
        print("PASSED: No Stripe references in server.py")
    
    def test_env_no_stripe(self):
        """backend/.env should have no Stripe references"""
        import subprocess
        result = subprocess.run(
            ["grep", "-i", "stripe", "/app/backend/.env"],
            capture_output=True, text=True
        )
        assert result.returncode != 0, "Found Stripe references in .env"
        print("PASSED: No Stripe references in backend/.env")
    
    def test_requirements_no_stripe(self):
        """requirements.txt should have no Stripe references"""
        import subprocess
        result = subprocess.run(
            ["grep", "-i", "stripe", "/app/backend/requirements.txt"],
            capture_output=True, text=True
        )
        assert result.returncode != 0, "Found Stripe references in requirements.txt"
        print("PASSED: No Stripe references in requirements.txt")


class TestBTCPayEnvVars:
    """Verify BTCPay environment variables are defined"""
    
    def test_btcpay_env_vars_exist_in_env_file(self):
        """BTCPAY vars should be defined in .env (can be empty)"""
        with open("/app/backend/.env", "r") as f:
            content = f.read()
        
        required_vars = ["BTCPAY_SERVER_URL", "BTCPAY_API_KEY", "BTCPAY_STORE_ID", "BTCPAY_WEBHOOK_SECRET"]
        for var in required_vars:
            assert var in content, f"Missing {var} in .env"
        print("PASSED: All BTCPay env vars defined in .env")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
