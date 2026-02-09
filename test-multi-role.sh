#!/bin/bash

# Multi-Role Authentication Testing Script
# This script tests the multi-role authentication flow

BASE_URL="http://localhost:3000"
EMAIL="test-multi-role@example.com"
PASSWORD="TestPassword123!"

echo "======================================"
echo "Multi-Role Authentication Test Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
    fi
}

echo "Test 1: Register user as Customer"
echo "-----------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"email\": \"$EMAIL\",
    \"phone\": \"+1234567890\",
    \"password\": \"$PASSWORD\",
    \"role\": \"Customer\"
  }")

CUSTOMER_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
ACTIVE_ROLE=$(echo $REGISTER_RESPONSE | grep -o '"activeRole":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$CUSTOMER_TOKEN" ] && [ "$ACTIVE_ROLE" = "Customer" ]; then
    print_result 0 "User registered as Customer"
    echo "Token: ${CUSTOMER_TOKEN:0:20}..."
else
    print_result 1 "User registration failed"
    echo "Response: $REGISTER_RESPONSE"
fi
echo ""

echo "Test 2: Add Business_owner role to same email"
echo "----------------------------------------------"
REGISTER2_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"email\": \"$EMAIL\",
    \"phone\": \"+1234567890\",
    \"password\": \"$PASSWORD\",
    \"role\": \"Business_owner\"
  }")

BUSINESS_TOKEN=$(echo $REGISTER2_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
ACTIVE_ROLE2=$(echo $REGISTER2_RESPONSE | grep -o '"activeRole":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$BUSINESS_TOKEN" ] && [ "$ACTIVE_ROLE2" = "Business_owner" ]; then
    print_result 0 "Business_owner role added successfully"
    echo "Token: ${BUSINESS_TOKEN:0:20}..."
else
    print_result 1 "Adding Business_owner role failed"
    echo "Response: $REGISTER2_RESPONSE"
fi
echo ""

echo "Test 3: Login as Customer"
echo "-------------------------"
LOGIN_CUSTOMER=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"role\": \"Customer\"
  }")

LOGIN_TOKEN=$(echo $LOGIN_CUSTOMER | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
LOGIN_ROLE=$(echo $LOGIN_CUSTOMER | grep -o '"activeRole":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$LOGIN_TOKEN" ] && [ "$LOGIN_ROLE" = "Customer" ]; then
    print_result 0 "Login as Customer successful"
    echo "Active Role: $LOGIN_ROLE"
else
    print_result 1 "Login as Customer failed"
    echo "Response: $LOGIN_CUSTOMER"
fi
echo ""

echo "Test 4: Login as Business_owner (Role Switch)"
echo "---------------------------------------------"
LOGIN_BUSINESS=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"role\": \"Business_owner\"
  }")

LOGIN_TOKEN2=$(echo $LOGIN_BUSINESS | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
LOGIN_ROLE2=$(echo $LOGIN_BUSINESS | grep -o '"activeRole":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$LOGIN_TOKEN2" ] && [ "$LOGIN_ROLE2" = "Business_owner" ]; then
    print_result 0 "Login as Business_owner successful (role switched)"
    echo "Active Role: $LOGIN_ROLE2"
else
    print_result 1 "Login as Business_owner failed"
    echo "Response: $LOGIN_BUSINESS"
fi
echo ""

echo "Test 5: Try to login with role user doesn't have"
echo "------------------------------------------------"
LOGIN_INVALID=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"role\": \"Super_Admin\"
  }")

HTTP_CODE="${LOGIN_INVALID: -3}"
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    print_result 0 "Correctly rejected login with role user doesn't have (HTTP $HTTP_CODE)"
else
    print_result 1 "Should reject login with invalid role"
    echo "Response: $LOGIN_INVALID"
fi
echo ""

echo "Test 6: Get user profile with activeRole"
echo "----------------------------------------"
if [ ! -z "$LOGIN_TOKEN" ]; then
    PROFILE=$(curl -s -X GET "$BASE_URL/user/me" \
      -H "Authorization: Bearer $LOGIN_TOKEN")
    
    PROFILE_ROLE=$(echo $PROFILE | grep -o '"activeRole":"[^"]*' | cut -d'"' -f4)
    
    if [ "$PROFILE_ROLE" = "Customer" ]; then
        print_result 0 "Profile endpoint returns correct activeRole"
        echo "Active Role in Profile: $PROFILE_ROLE"
    else
        print_result 1 "Profile endpoint activeRole incorrect"
        echo "Response: $PROFILE"
    fi
else
    print_result 1 "Cannot test profile - no token available"
fi
echo ""

echo "======================================"
echo "Test Suite Complete"
echo "======================================"
echo ""
echo -e "${YELLOW}Note:${NC} Make sure the server is running on $BASE_URL"
echo "To clean up the test user, you can delete it from the database:"
echo "DELETE FROM users WHERE email = '$EMAIL';"
