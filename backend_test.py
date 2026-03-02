import requests
import sys
import json
from datetime import datetime

class SignalAPITester:
    def __init__(self, base_url="https://fullstack-app-101.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test credentials from review request
        self.admin_username = "admin"
        self.admin_password = "Admin@123"

    def log_test(self, name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"\n🔍 Test: {name}")
        print(f"   Status: {status}")
        if details:
            print(f"   Details: {details}")
        if response_data and isinstance(response_data, dict):
            print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": name, "details": details})

    def make_request(self, method, endpoint, data=None, expected_status=None):
        """Make API request with proper headers"""
        url = f"{self.base_url}/api{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            # Check expected status if provided
            if expected_status and response.status_code != expected_status:
                return False, {
                    "error": f"Expected status {expected_status}, got {response.status_code}",
                    "response": response.text[:200]
                }
                
            # Try to parse JSON response
            try:
                return True, response.json()
            except:
                return True, {"raw_response": response.text[:200], "status": response.status_code}
                
        except Exception as e:
            return False, {"error": str(e)}

    def test_auth_login(self):
        """Test login functionality"""
        success, response = self.make_request('POST', '/auth/login', {
            "username": self.admin_username,
            "password": self.admin_password
        }, expected_status=200)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user = response.get('user', {})
            self.log_test("Admin Login", True, f"User: {self.user.get('username', 'Unknown')}")
            return True
        else:
            self.log_test("Admin Login", False, f"Login failed: {response}")
            return False

    def test_auth_me(self):
        """Test getting current user profile"""
        success, response = self.make_request('GET', '/auth/me', expected_status=200)
        self.log_test("Get Current User", success, 
                     f"User ID: {response.get('id', 'N/A')}" if success else str(response))
        return success

    def test_hrm_departments(self):
        """Test HRM department endpoints"""
        # List departments
        success, response = self.make_request('GET', '/hrm/departments', expected_status=200)
        self.log_test("List Departments", success, 
                     f"Found {len(response) if isinstance(response, list) else 0} departments" if success else str(response))
        return success

    def test_hrm_employees(self):
        """Test HRM employee endpoints"""
        # List employees
        success, response = self.make_request('GET', '/hrm/employees', expected_status=200)
        self.log_test("List Employees", success, 
                     f"Found {len(response) if isinstance(response, list) else 0} employees" if success else str(response))
        return success

    def test_attendance_endpoints(self):
        """Test attendance functionality"""
        # Get my attendance
        success, response = self.make_request('GET', '/hrm/attendance/my', expected_status=200)
        self.log_test("Get My Attendance", success, 
                     f"Records: {len(response) if isinstance(response, list) else 0}" if success else str(response))
        
        # Try check-in (might fail if already checked in today)
        success2, response2 = self.make_request('POST', '/hrm/attendance/checkin', 
                                               {"note": "Test check-in"})
        self.log_test("Attendance Check-in", success2 or response2.get('status') == 400, 
                     "Check-in successful or already checked in" if success2 else str(response2))
        
        return success

    def test_leave_endpoints(self):
        """Test leave management"""
        # Get leave balance
        success, response = self.make_request('GET', '/hrm/leaves/balance', expected_status=200)
        self.log_test("Get Leave Balance", success, 
                     f"Balance data available" if success else str(response))
        
        # Get my leaves
        success2, response2 = self.make_request('GET', '/hrm/leaves/my', expected_status=200)
        self.log_test("Get My Leaves", success2, 
                     f"Found {len(response2) if isinstance(response2, list) else 0} leave records" if success2 else str(response2))
        
        return success and success2

    def test_pms_endpoints(self):
        """Test Project Management System endpoints"""
        # List services
        success, response = self.make_request('GET', '/pms/services', expected_status=200)
        self.log_test("List PMS Services", success, 
                     f"Services available: {len(response) if isinstance(response, dict) else 0}" if success else str(response))
        
        # List projects
        success2, response2 = self.make_request('GET', '/pms/projects', expected_status=200)
        self.log_test("List Projects", success2, 
                     f"Found {len(response2) if isinstance(response2, list) else 0} projects" if success2 else str(response2))
        
        # List tasks
        success3, response3 = self.make_request('GET', '/pms/tasks', expected_status=200)
        self.log_test("List Tasks", success3, 
                     f"Found {len(response3) if isinstance(response3, list) else 0} tasks" if success3 else str(response3))
        
        return success and success2 and success3

    def test_vault_endpoints(self):
        """Test Credential Vault endpoints"""
        # List vault folders
        success, response = self.make_request('GET', '/vault/folders', expected_status=200)
        self.log_test("List Vault Folders", success, 
                     f"Found {len(response) if isinstance(response, list) else 0} folders" if success else str(response))
        
        return success

    def test_issues_endpoints(self):
        """Test Issues Tracker endpoints"""
        # List issues
        success, response = self.make_request('GET', '/issues', expected_status=200)
        self.log_test("List Issues", success, 
                     f"Found {len(response) if isinstance(response, list) else 0} issues" if success else str(response))
        
        return success

    def test_notifications_endpoints(self):
        """Test Notifications endpoints"""
        # List notifications
        success, response = self.make_request('GET', '/notifications', expected_status=200)
        self.log_test("List Notifications", success, 
                     f"Found {len(response) if isinstance(response, list) else 0} notifications" if success else str(response))
        
        return success

    def test_calendar_endpoints(self):
        """Test Calendar endpoints"""
        # List calendar events
        success, response = self.make_request('GET', '/calendar/events', expected_status=200)
        self.log_test("List Calendar Events", success, 
                     f"Found {len(response) if isinstance(response, list) else 0} events" if success else str(response))
        
        return success

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting Signal by Profitcast API Tests...")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication tests (required for other tests)
        if not self.test_auth_login():
            print("❌ Authentication failed - stopping tests")
            return False
            
        self.test_auth_me()
        
        # Core module tests
        self.test_hrm_departments()
        self.test_hrm_employees()
        self.test_attendance_endpoints()
        self.test_leave_endpoints()
        self.test_pms_endpoints()
        self.test_vault_endpoints()
        self.test_issues_endpoints()
        self.test_notifications_endpoints()
        self.test_calendar_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {len(self.failed_tests)}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"   - {failed['test']}: {failed['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = SignalAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())