import requests
import sys
import json
from datetime import datetime, timedelta

class RTBPlatformTester:
    def __init__(self, base_url="https://rtb-market.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.advertiser_token = None
        self.publisher_token = None
        self.advertiser_user = None
        self.publisher_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.campaign_id = None
        self.creative_id = None
        self.inventory_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_advertiser_registration(self):
        """Test advertiser registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Advertiser Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"advertiser_{timestamp}@test.com",
                "password": "TestPass123!",
                "company_name": f"Test Advertiser {timestamp}",
                "role": "advertiser"
            }
        )
        if success and 'token' in response:
            self.advertiser_token = response['token']
            self.advertiser_user = response['user']
            return True
        return False

    def test_publisher_registration(self):
        """Test publisher registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Publisher Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"publisher_{timestamp}@test.com",
                "password": "TestPass123!",
                "company_name": f"Test Publisher {timestamp}",
                "role": "publisher"
            }
        )
        if success and 'token' in response:
            self.publisher_token = response['token']
            self.publisher_user = response['user']
            return True
        return False

    def test_advertiser_login(self):
        """Test advertiser login"""
        if not self.advertiser_user:
            return False
        
        success, response = self.run_test(
            "Advertiser Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.advertiser_user['email'],
                "password": "TestPass123!"
            }
        )
        return success and 'token' in response

    def test_publisher_login(self):
        """Test publisher login"""
        if not self.publisher_user:
            return False
            
        success, response = self.run_test(
            "Publisher Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.publisher_user['email'],
                "password": "TestPass123!"
            }
        )
        return success and 'token' in response

    def test_get_me_advertiser(self):
        """Test get current user for advertiser"""
        success, response = self.run_test(
            "Get Current User (Advertiser)",
            "GET",
            "auth/me",
            200,
            token=self.advertiser_token
        )
        return success

    def test_get_me_publisher(self):
        """Test get current user for publisher"""
        success, response = self.run_test(
            "Get Current User (Publisher)",
            "GET",
            "auth/me",
            200,
            token=self.publisher_token
        )
        return success

    def test_create_campaign(self):
        """Test campaign creation"""
        start_date = datetime.now().strftime('%Y-%m-%d')
        end_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "Create Campaign",
            "POST",
            "campaigns",
            200,
            data={
                "name": "Test Campaign",
                "budget": 1000.0,
                "daily_budget": 50.0,
                "start_date": start_date,
                "end_date": end_date,
                "targeting": {"age": "25-35", "location": "US"}
            },
            token=self.advertiser_token
        )
        if success and 'id' in response:
            self.campaign_id = response['id']
            return True
        return False

    def test_get_campaigns(self):
        """Test getting campaigns"""
        success, response = self.run_test(
            "Get Campaigns",
            "GET",
            "campaigns",
            200,
            token=self.advertiser_token
        )
        return success

    def test_get_campaign_detail(self):
        """Test getting specific campaign"""
        if not self.campaign_id:
            return False
            
        success, response = self.run_test(
            "Get Campaign Detail",
            "GET",
            f"campaigns/{self.campaign_id}",
            200,
            token=self.advertiser_token
        )
        return success

    def test_update_campaign_status(self):
        """Test updating campaign status"""
        if not self.campaign_id:
            return False
            
        success, response = self.run_test(
            "Update Campaign Status",
            "PUT",
            f"campaigns/{self.campaign_id}?status=active",
            200,
            token=self.advertiser_token
        )
        return success

    def test_create_ad_creative(self):
        """Test creating ad creative"""
        if not self.campaign_id:
            return False
            
        success, response = self.run_test(
            "Create Ad Creative",
            "POST",
            "creatives",
            200,
            data={
                "campaign_id": self.campaign_id,
                "ad_type": "display",
                "creative_url": "https://example.com/ad.jpg",
                "title": "Test Ad",
                "description": "This is a test advertisement",
                "cta_text": "Click Here"
            },
            token=self.advertiser_token
        )
        if success and 'id' in response:
            self.creative_id = response['id']
            return True
        return False

    def test_get_creatives(self):
        """Test getting ad creatives"""
        success, response = self.run_test(
            "Get Ad Creatives",
            "GET",
            "creatives",
            200,
            token=self.advertiser_token
        )
        return success

    def test_create_inventory(self):
        """Test creating inventory"""
        success, response = self.run_test(
            "Create Inventory",
            "POST",
            "inventory",
            200,
            data={
                "site_url": "https://testsite.com",
                "ad_format": "300x250",
                "min_cpm": 5.0
            },
            token=self.publisher_token
        )
        if success and 'id' in response:
            self.inventory_id = response['id']
            return True
        return False

    def test_get_inventory(self):
        """Test getting inventory"""
        success, response = self.run_test(
            "Get Inventory",
            "GET",
            "inventory",
            200,
            token=self.publisher_token
        )
        return success

    def test_submit_bid(self):
        """Test submitting a bid"""
        if not self.campaign_id or not self.inventory_id:
            return False
            
        success, response = self.run_test(
            "Submit Bid",
            "POST",
            "bids/submit",
            200,
            data={
                "campaign_id": self.campaign_id,
                "inventory_id": self.inventory_id,
                "bid_amount": 6.0
            },
            token=self.advertiser_token
        )
        return success

    def test_dashboard_analytics_advertiser(self):
        """Test dashboard analytics for advertiser"""
        success, response = self.run_test(
            "Dashboard Analytics (Advertiser)",
            "GET",
            "analytics/dashboard",
            200,
            token=self.advertiser_token
        )
        return success

    def test_dashboard_analytics_publisher(self):
        """Test dashboard analytics for publisher"""
        success, response = self.run_test(
            "Dashboard Analytics (Publisher)",
            "GET",
            "analytics/dashboard",
            200,
            token=self.publisher_token
        )
        return success

    def test_campaign_analytics(self):
        """Test campaign analytics"""
        if not self.campaign_id:
            return False
            
        success, response = self.run_test(
            "Campaign Analytics",
            "GET",
            f"analytics/campaigns/{self.campaign_id}",
            200,
            token=self.advertiser_token
        )
        return success

def main():
    print("🚀 Starting RTB Platform API Tests")
    print("=" * 50)
    
    tester = RTBPlatformTester()
    
    # Test sequence
    tests = [
        # Authentication tests
        ("Advertiser Registration", tester.test_advertiser_registration),
        ("Publisher Registration", tester.test_publisher_registration),
        ("Advertiser Login", tester.test_advertiser_login),
        ("Publisher Login", tester.test_publisher_login),
        ("Get Me (Advertiser)", tester.test_get_me_advertiser),
        ("Get Me (Publisher)", tester.test_get_me_publisher),
        
        # Campaign tests (Advertiser)
        ("Create Campaign", tester.test_create_campaign),
        ("Get Campaigns", tester.test_get_campaigns),
        ("Get Campaign Detail", tester.test_get_campaign_detail),
        ("Update Campaign Status", tester.test_update_campaign_status),
        
        # Ad Creative tests (Advertiser)
        ("Create Ad Creative", tester.test_create_ad_creative),
        ("Get Ad Creatives", tester.test_get_creatives),
        
        # Inventory tests (Publisher)
        ("Create Inventory", tester.test_create_inventory),
        ("Get Inventory", tester.test_get_inventory),
        
        # Bidding tests
        ("Submit Bid", tester.test_submit_bid),
        
        # Analytics tests
        ("Dashboard Analytics (Advertiser)", tester.test_dashboard_analytics_advertiser),
        ("Dashboard Analytics (Publisher)", tester.test_dashboard_analytics_publisher),
        ("Campaign Analytics", tester.test_campaign_analytics),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"  - {test}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())