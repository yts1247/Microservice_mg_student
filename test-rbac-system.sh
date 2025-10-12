#!/bin/bash

# RBAC System Integration Test Script
# Kiểm tra toàn bộ hệ thống RBAC, gRPC và Message Broker

echo "🚀 Starting RBAC System Integration Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_GATEWAY="http://localhost:3000"
USER_SERVICE="http://localhost:3001"
COURSE_SERVICE="http://localhost:3002"

# Test counter
PASSED=0
FAILED=0

# Helper function to test API endpoint
test_endpoint() {
    local name="$1"
    local url="$2" 
    local expected_status="$3"
    local headers="$4"
    
    echo -n "Testing $name... "
    
    if [ -n "$headers" ]; then
        response=$(curl -s -w "%{http_code}" -o /dev/null -H "$headers" "$url")
    else
        response=$(curl -s -w "%{http_code}" -o /dev/null "$url")
    fi
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $response)"
        ((FAILED++))
    fi
}

# Helper function to extract token from login response
login_user() {
    local email="$1"
    local password="$2"
    
    response=$(curl -s -X POST "$API_GATEWAY/api/users/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    # Extract token using grep and sed (cross-platform)
    token=$(echo "$response" | grep -o '"token":"[^"]*"' | sed 's/"token":"//g' | sed 's/"//g')
    echo "$token"
}

echo "📋 Phase 1: Health Checks"
echo "=========================="

# Test health endpoints
test_endpoint "API Gateway Health" "$API_GATEWAY/health" 200
test_endpoint "User Service Health" "$USER_SERVICE/health" 200
test_endpoint "Course Service Health" "$COURSE_SERVICE/health" 200

echo -e "\n🔐 Phase 2: Authentication Tests"
echo "================================="

# Test user registration
echo -n "Testing User Registration... "
register_response=$(curl -s -w "%{http_code}" -X POST "$API_GATEWAY/api/users/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "password123", 
        "name": "Test User",
        "role": "student"
    }')

register_status="${register_response: -3}"
if [ "$register_status" -eq 201 ] || [ "$register_status" -eq 409 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Status: $register_status)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (Status: $register_status)"
    ((FAILED++))
fi

# Test user login
echo -n "Testing User Login... "
login_response=$(curl -s -X POST "$API_GATEWAY/api/users/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "password123"
    }')

if echo "$login_response" | grep -q "token"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
    
    # Extract token for subsequent tests
    USER_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*"' | sed 's/"token":"//g' | sed 's/"//g')
    echo "Token extracted: ${USER_TOKEN:0:50}..."
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
    USER_TOKEN=""
fi

# Test invalid login
echo -n "Testing Invalid Login... "
invalid_response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_GATEWAY/api/users/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "wrongpassword"
    }')

if [ "$invalid_response" -eq 401 ] || [ "$invalid_response" -eq 400 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Status: $invalid_response)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (Expected: 401, Got: $invalid_response)"
    ((FAILED++))
fi

echo -e "\n🛡️ Phase 3: Authorization Tests"
echo "==============================="

if [ -n "$USER_TOKEN" ]; then
    # Test authenticated access
    test_endpoint "Authenticated Profile Access" "$API_GATEWAY/api/users/me" 200 "Authorization: Bearer $USER_TOKEN"
    
    # Test course access (should work for students)
    test_endpoint "Course List Access" "$API_GATEWAY/api/courses" 200 "Authorization: Bearer $USER_TOKEN"
    
    # Test admin-only access (should fail for student)
    test_endpoint "Admin Access (Should Fail)" "$API_GATEWAY/api/users" 403 "Authorization: Bearer $USER_TOKEN"
else
    echo -e "${YELLOW}⚠ Skipping authorization tests - no valid token${NC}"
    ((FAILED+=3))
fi

# Test unauthenticated access
test_endpoint "Unauthenticated Access (Should Fail)" "$API_GATEWAY/api/users/me" 401

echo -e "\n⚙️ Phase 4: gRPC Service Tests"
echo "============================="

# Test gRPC services (if grpc_cli is available)
if command -v grpc_cli &> /dev/null; then
    echo -n "Testing User gRPC Service... "
    grpc_response=$(timeout 5 grpc_cli call localhost:50051 UserService.GetServerInfo '{}' 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (gRPC service not responding)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ grpc_cli not found, skipping gRPC tests${NC}"
fi

echo -e "\n📊 Phase 5: Message Broker Tests"
echo "==============================="

# Test Redis connection (if redis-cli is available)
if command -v redis-cli &> /dev/null; then
    echo -n "Testing Redis Connection... "
    redis_response=$(timeout 3 redis-cli ping 2>/dev/null)
    if [ "$redis_response" = "PONG" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Redis not responding)"
        ((FAILED++))
    fi
    
    # Check for audit logs
    echo -n "Testing Audit Logs... "
    log_count=$(redis-cli llen audit_logs:info 2>/dev/null || echo "0")
    if [ "$log_count" -gt 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC} ($log_count logs found)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ NO LOGS${NC} (Message broker may not be logging yet)"
    fi
else
    echo -e "${YELLOW}⚠ redis-cli not found, skipping Redis tests${NC}"
fi

echo -e "\n🧪 Phase 6: Permission System Tests"
echo "==================================="

# Create admin user for permission tests
echo -n "Creating Admin User... "
admin_register=$(curl -s -w "%{http_code}" -X POST "$USER_SERVICE/api/users/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@example.com",
        "password": "admin123",
        "name": "Admin User", 
        "role": "admin"
    }')

admin_status="${admin_register: -3}"
if [ "$admin_status" -eq 201 ] || [ "$admin_status" -eq 409 ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
    
    # Login as admin
    ADMIN_TOKEN=$(login_user "admin@example.com" "admin123")
    
    if [ -n "$ADMIN_TOKEN" ]; then
        # Test admin access
        test_endpoint "Admin User Access" "$API_GATEWAY/api/users" 200 "Authorization: Bearer $ADMIN_TOKEN"
        
        # Test permission check
        test_endpoint "Permission Check" "$USER_SERVICE/api/admin/permissions" 200 "Authorization: Bearer $ADMIN_TOKEN"
    else
        echo -e "${RED}✗ FAILED${NC} (Could not obtain admin token)"
        ((FAILED+=2))
    fi
else
    echo -e "${RED}✗ FAILED${NC} (Status: $admin_status)"
    ((FAILED+=3))
fi

echo -e "\n📈 Test Results Summary"
echo "======================="
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All tests passed! RBAC system is working correctly.${NC}"
    exit 0
else
    echo -e "\n⚠️ ${YELLOW}Some tests failed. Please check the system configuration.${NC}"
    echo -e "\nCommon troubleshooting steps:"
    echo "1. Ensure all services are running (check with docker-compose ps)"
    echo "2. Verify database connections (MongoDB, Redis)"
    echo "3. Check environment variables (.env files)"
    echo "4. Review service logs for errors"
    echo "5. Confirm network connectivity between services"
    exit 1
fi