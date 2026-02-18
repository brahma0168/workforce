#!/usr/bin/env python3

import requests
import json

def test_basic_endpoints():
    base_url = "http://localhost:8001"
    token = None
    
    print("🔍 Testing basic backend functionality...")
    
    # Test 1: Server health
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            print("✅ Server Health: PASSED")
        else:
            print(f"❌ Server Health: FAILED ({response.status_code})")
    except Exception as e:
        print(f"❌ Server Health: FAILED ({str(e)})")
        return False
    
    # Test 2: Login
    try:
        login_data = {"email": "newhr@profitcast.com", "password": "test123"}
        response = requests.post(f"{base_url}/api/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if 'token' in result and 'user' in result:
                token = result['token']
                print(f"✅ Login: PASSED (Role: {result['user'].get('role')})")
            else:
                print("❌ Login: FAILED (Missing token/user)")
                return False
        else:
            print(f"❌ Login: FAILED ({response.status_code}) - {response.text[:100]}")
            return False
    except Exception as e:
        print(f"❌ Login: FAILED ({str(e)})")
        return False
    
    if not token:
        print("❌ No token available for authenticated tests")
        return False
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Test 3: Basic authenticated endpoint
    try:
        response = requests.get(f"{base_url}/api/employees", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Employees Endpoint: PASSED ({len(data.get('employees', data))} employees)")
        else:
            print(f"❌ Employees Endpoint: FAILED ({response.status_code}) - {response.text[:100]}")
    except Exception as e:
        print(f"❌ Employees Endpoint: FAILED ({str(e)})")
    
    # Test 4: Attendance endpoint
    try:
        response = requests.get(f"{base_url}/api/attendance/today", headers=headers, timeout=10)
        print(f"✅ Attendance Today: PASSED ({response.status_code})")
    except Exception as e:
        print(f"❌ Attendance Today: FAILED ({str(e)})")
    
    # Test 5: Leave balance
    try:
        response = requests.get(f"{base_url}/api/leave/balance", headers=headers, timeout=10)
        if response.status_code == 200:
            balance = response.json()
            print(f"✅ Leave Balance: PASSED")
        else:
            print(f"⚠️  Leave Balance: {response.status_code}")
    except Exception as e:
        print(f"❌ Leave Balance: FAILED ({str(e)})")
    
    return True

if __name__ == "__main__":
    test_basic_endpoints()