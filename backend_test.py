#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class ProfitcastBackendTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log_result(self, test_name, success, response_data=None, error_msg=None):
        """Log test result and update counters"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            self.passed_tests.append(test_name)
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append({
                "test": test_name,
                "error": error_msg,
                "response": response_data
            })
            print(f"❌ {test_name} - FAILED: {error_msg}")

    def run_test(self, name, method, endpoint, expected_status, data=None, require_auth=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if require_auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            response_json = {}
            
            try:
                response_json = response.json()
                if success:
                    print(f"   Response: {json.dumps(response_json, indent=2)[:200]}...")
            except:
                if response.text:
                    print(f"   Response Text: {response.text[:200]}...")

            if success:
                self.log_result(name, True, response_json)
                return True, response_json
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                if response_json.get('error'):
                    error_msg += f" - {response_json['error']}"
                elif response_json.get('message'):
                    error_msg += f" - {response_json['message']}"
                
                self.log_result(name, False, response_json, error_msg)
                return False, response_json

        except requests.exceptions.RequestException as e:
            error_msg = f"Network error: {str(e)}"
            self.log_result(name, False, None, error_msg)
            return False, {}
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            self.log_result(name, False, None, error_msg)
            return False, {}

    def test_server_health(self):
        """Test if server is running"""
        try:
            response = requests.get(self.base_url, timeout=5)
            success = response.status_code == 200
            self.log_result("Server Health Check", success, 
                          {"status": response.status_code, "text": response.text[:100]},
                          None if success else f"Server responded with {response.status_code}")
            return success
        except Exception as e:
            self.log_result("Server Health Check", False, None, f"Server not reachable: {str(e)}")
            return False

    def test_login(self):
        """Test login with provided credentials"""
        success, response = self.run_test(
            "Login Authentication",
            "POST",
            "auth/login",
            200,
            data={"email": "newhr@profitcast.com", "password": "test123"},
            require_auth=False
        )
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user = response['user']
            print(f"   ✓ Token received and stored")
            print(f"   ✓ User role: {self.user.get('role', 'Unknown')}")
            return True
        else:
            print(f"   ✗ Login failed - missing token or user in response")
            return False

    def test_dashboard_endpoints(self):
        """Test dashboard related endpoints"""
        if not self.token:
            print("⚠️  Skipping dashboard tests - no valid token")
            return False
            
        # Test dashboard data
        self.run_test("Dashboard Data", "GET", "dashboard", 200)
        
        # Test dashboard stats
        self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)
        
        return True

    def test_employee_endpoints(self):
        """Test employee management endpoints"""
        if not self.token:
            print("⚠️  Skipping employee tests - no valid token")
            return False
            
        # Get all employees
        success, employees_response = self.run_test("Get All Employees", "GET", "employees", 200)
        
        # Test employee creation (if HR/MD role)
        if self.user and self.user.get('role') in ['HR', 'MD']:
            test_employee = {
                "fullName": "Test Employee",
                "email": "test.employee@profitcast.com",
                "role": "EMPLOYEE",
                "department": "Engineering",
                "employeeId": f"TEST{datetime.now().strftime('%m%d%H%M')}"
            }
            
            create_success, create_response = self.run_test(
                "Create Employee", "POST", "employees", 201, data=test_employee
            )
            
            if create_success and create_response.get('id'):
                employee_id = create_response['id']
                
                # Test get single employee
                self.run_test(f"Get Employee by ID", "GET", f"employees/{employee_id}", 200)
                
                # Test update employee
                update_data = {"fullName": "Test Employee Updated"}
                self.run_test(f"Update Employee", "PUT", f"employees/{employee_id}", 200, data=update_data)
                
                # Test delete employee
                self.run_test(f"Delete Employee", "DELETE", f"employees/{employee_id}", 200)
        
        return True

    def test_attendance_endpoints(self):
        """Test attendance tracking endpoints"""
        if not self.token:
            print("⚠️  Skipping attendance tests - no valid token")
            return False
        
        # Test today's attendance
        self.run_test("Get Today's Attendance", "GET", "attendance/today", 200)
        
        # Test attendance history
        self.run_test("Get Attendance History", "GET", "attendance", 200)
        
        # Test check-in (might already be checked in)
        success, checkin_response = self.run_test("Check-in", "POST", "attendance/checkin", [200, 400])
        
        # Test attendance stats
        self.run_test("Attendance Statistics", "GET", "attendance/stats", 200)
        
        return True

    def test_leave_endpoints(self):
        """Test leave management endpoints"""
        if not self.token:
            print("⚠️  Skipping leave tests - no valid token")
            return False
        
        # Test get leave balance
        self.run_test("Get Leave Balance", "GET", "leave/balance", 200)
        
        # Test get leave requests
        self.run_test("Get Leave Requests", "GET", "leave", 200)
        
        # Test create leave request
        leave_request = {
            "leaveType": "casual",
            "startDate": "2024-12-25",
            "endDate": "2024-12-26",
            "reason": "Test leave request"
        }
        
        create_success, leave_response = self.run_test(
            "Create Leave Request", "POST", "leave", 201, data=leave_request
        )
        
        if create_success and leave_response.get('id'):
            leave_id = leave_response['id']
            
            # Test get specific leave request
            self.run_test("Get Leave Request by ID", "GET", f"leave/{leave_id}", 200)
            
            # Test cancel leave request
            self.run_test("Cancel Leave Request", "DELETE", f"leave/{leave_id}", 200)
        
        return True

    def test_auth_endpoints(self):
        """Test authentication related endpoints"""
        # Test invalid login
        self.run_test(
            "Invalid Login", "POST", "auth/login", 401,
            data={"email": "invalid@test.com", "password": "wrongpass"},
            require_auth=False
        )
        
        # Test missing credentials
        self.run_test(
            "Missing Credentials", "POST", "auth/login", 400,
            data={"email": "test@test.com"},
            require_auth=False
        )
        
        return True

    def run_comprehensive_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Profitcast Backend Comprehensive Testing")
        print("=" * 60)
        
        # Test server health first
        if not self.test_server_health():
            print("\n❌ Server is not accessible. Stopping tests.")
            return False
        
        # Test authentication
        print(f"\n📋 Testing Authentication...")
        self.test_auth_endpoints()
        
        # Test login with valid credentials
        if not self.test_login():
            print("\n❌ Login failed. Cannot proceed with authenticated tests.")
            print("Please verify:")
            print("1. Database is accessible")
            print("2. User newhr@profitcast.com exists")  
            print("3. Password is 'test123'")
            return False
        
        # Test authenticated endpoints
        print(f"\n📋 Testing Dashboard Endpoints...")
        self.test_dashboard_endpoints()
        
        print(f"\n📋 Testing Employee Endpoints...")
        self.test_employee_endpoints()
        
        print(f"\n📋 Testing Attendance Endpoints...")
        self.test_attendance_endpoints()
        
        print(f"\n📋 Testing Leave Management...")
        self.test_leave_endpoints()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🏁 BACKEND TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {len(self.failed_tests)}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.passed_tests:
            print(f"\n✅ PASSED TESTS:")
            for test in self.passed_tests:
                print(f"   • {test}")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"   • {failure['test']}: {failure['error']}")
        
        return success_rate >= 70  # Consider 70% pass rate as acceptable

def main():
    """Main test execution"""
    tester = ProfitcastBackendTester()
    
    try:
        success = tester.run_comprehensive_tests()
        tester.print_summary()
        
        # Return appropriate exit code
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Unexpected error during testing: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)