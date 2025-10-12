# RBAC System Integration Test Script (PowerShell Version)
# Kiểm tra toàn bộ hệ thống RBAC, gRPC và Message Broker

Write-Host "🚀 Starting RBAC System Integration Tests..." -ForegroundColor Cyan

# Configuration
$API_GATEWAY = "http://localhost:3000"
$USER_SERVICE = "http://localhost:3001" 
$COURSE_SERVICE = "http://localhost:3002"

# Test counters
$PASSED = 0
$FAILED = 0

# Helper function to test API endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus,
        [hashtable]$Headers = @{}
    )
    
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -ErrorAction SilentlyContinue
        $actualStatus = $response.StatusCode
    }
    catch {
        $actualStatus = $_.Exception.Response.StatusCode.value__
    }
    
    if ($actualStatus -eq $ExpectedStatus) {
        Write-Host "✓ PASSED" -ForegroundColor Green -NoNewline
        Write-Host " (Status: $actualStatus)"
        $script:PASSED++
    }
    else {
        Write-Host "✗ FAILED" -ForegroundColor Red -NoNewline  
        Write-Host " (Expected: $ExpectedStatus, Got: $actualStatus)"
        $script:FAILED++
    }
}

# Helper function to make POST request with JSON
function Invoke-JsonPost {
    param(
        [string]$Url,
        [string]$Body,
        [hashtable]$Headers = @{}
    )
    
    $Headers['Content-Type'] = 'application/json'
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method POST -Body $Body -Headers $Headers -UseBasicParsing
        return @{
            StatusCode = $response.StatusCode
            Content = $response.Content
        }
    }
    catch {
        return @{
            StatusCode = $_.Exception.Response.StatusCode.value__
            Content = $_.ErrorDetails.Message
        }
    }
}

# Helper function to extract token from login response
function Get-LoginToken {
    param(
        [string]$Email,
        [string]$Password
    )
    
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    $response = Invoke-JsonPost -Url "$API_GATEWAY/api/users/login" -Body $loginBody
    
    if ($response.StatusCode -eq 200) {
        $responseObj = $response.Content | ConvertFrom-Json
        return $responseObj.token
    }
    
    return $null
}

Write-Host "`n📋 Phase 1: Health Checks" -ForegroundColor Yellow
Write-Host "=========================="

# Test health endpoints
Test-Endpoint -Name "API Gateway Health" -Url "$API_GATEWAY/health" -ExpectedStatus 200
Test-Endpoint -Name "User Service Health" -Url "$USER_SERVICE/health" -ExpectedStatus 200
Test-Endpoint -Name "Course Service Health" -Url "$COURSE_SERVICE/health" -ExpectedStatus 200

Write-Host "`n🔐 Phase 2: Authentication Tests" -ForegroundColor Yellow
Write-Host "================================="

# Test user registration
Write-Host "Testing User Registration... " -NoNewline
$registerBody = @{
    email = "test@example.com"
    password = "password123"
    name = "Test User"
    role = "student"
} | ConvertTo-Json

$registerResponse = Invoke-JsonPost -Url "$API_GATEWAY/api/users/register" -Body $registerBody

if ($registerResponse.StatusCode -eq 201 -or $registerResponse.StatusCode -eq 409) {
    Write-Host "✓ PASSED" -ForegroundColor Green -NoNewline
    Write-Host " (Status: $($registerResponse.StatusCode))"
    $PASSED++
}
else {
    Write-Host "✗ FAILED" -ForegroundColor Red -NoNewline
    Write-Host " (Status: $($registerResponse.StatusCode))"
    $FAILED++
}

# Test user login
Write-Host "Testing User Login... " -NoNewline
$USER_TOKEN = Get-LoginToken -Email "test@example.com" -Password "password123"

if ($USER_TOKEN) {
    Write-Host "✓ PASSED" -ForegroundColor Green
    $PASSED++
    Write-Host "Token extracted: $($USER_TOKEN.Substring(0, [Math]::Min(50, $USER_TOKEN.Length)))..."
}
else {
    Write-Host "✗ FAILED" -ForegroundColor Red
    $FAILED++
}

# Test invalid login
Write-Host "Testing Invalid Login... " -NoNewline
$invalidBody = @{
    email = "test@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

$invalidResponse = Invoke-JsonPost -Url "$API_GATEWAY/api/users/login" -Body $invalidBody

if ($invalidResponse.StatusCode -eq 401 -or $invalidResponse.StatusCode -eq 400) {
    Write-Host "✓ PASSED" -ForegroundColor Green -NoNewline
    Write-Host " (Status: $($invalidResponse.StatusCode))"
    $PASSED++
}
else {
    Write-Host "✗ FAILED" -ForegroundColor Red -NoNewline
    Write-Host " (Expected: 401, Got: $($invalidResponse.StatusCode))"
    $FAILED++
}

Write-Host "`n🛡️ Phase 3: Authorization Tests" -ForegroundColor Yellow
Write-Host "==============================="

if ($USER_TOKEN) {
    $authHeaders = @{ 'Authorization' = "Bearer $USER_TOKEN" }
    
    # Test authenticated access
    Test-Endpoint -Name "Authenticated Profile Access" -Url "$API_GATEWAY/api/users/me" -ExpectedStatus 200 -Headers $authHeaders
    
    # Test course access (should work for students)
    Test-Endpoint -Name "Course List Access" -Url "$API_GATEWAY/api/courses" -ExpectedStatus 200 -Headers $authHeaders
    
    # Test admin-only access (should fail for student)
    Test-Endpoint -Name "Admin Access (Should Fail)" -Url "$API_GATEWAY/api/users" -ExpectedStatus 403 -Headers $authHeaders
}
else {
    Write-Host "⚠ Skipping authorization tests - no valid token" -ForegroundColor Yellow
    $FAILED += 3
}

# Test unauthenticated access
Test-Endpoint -Name "Unauthenticated Access (Should Fail)" -Url "$API_GATEWAY/api/users/me" -ExpectedStatus 401

Write-Host "`n⚙️ Phase 4: gRPC Service Tests" -ForegroundColor Yellow
Write-Host "============================="

# Test gRPC port connectivity
Write-Host "Testing gRPC Port Connectivity... " -NoNewline
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.ConnectAsync("localhost", 50051).Wait(3000)
    if ($tcpClient.Connected) {
        Write-Host "✓ PASSED" -ForegroundColor Green
        $PASSED++
        $tcpClient.Close()
    }
    else {
        Write-Host "✗ FAILED" -ForegroundColor Red -NoNewline
        Write-Host " (Port 50051 not accessible)"
        $FAILED++
    }
}
catch {
    Write-Host "✗ FAILED" -ForegroundColor Red -NoNewline
    Write-Host " (gRPC service not responding)"
    $FAILED++
}

Write-Host "`n📊 Phase 5: Message Broker Tests" -ForegroundColor Yellow
Write-Host "==============================="

# Test Redis connection
Write-Host "Testing Redis Connection... " -NoNewline
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.ConnectAsync("localhost", 6379).Wait(3000)
    if ($tcpClient.Connected) {
        Write-Host "✓ PASSED" -ForegroundColor Green
        $PASSED++
        $tcpClient.Close()
    }
    else {
        Write-Host "✗ FAILED" -ForegroundColor Red -NoNewline
        Write-Host " (Redis not accessible)"
        $FAILED++
    }
}
catch {
    Write-Host "✗ FAILED" -ForegroundColor Red -NoNewline
    Write-Host " (Redis not responding)"
    $FAILED++
}

Write-Host "`n🧪 Phase 6: Permission System Tests" -ForegroundColor Yellow
Write-Host "==================================="

# Create admin user for permission tests
Write-Host "Creating Admin User... " -NoNewline
$adminBody = @{
    email = "admin@example.com"
    password = "admin123"
    name = "Admin User"
    role = "admin"
} | ConvertTo-Json

$adminResponse = Invoke-JsonPost -Url "$USER_SERVICE/api/users/register" -Body $adminBody

if ($adminResponse.StatusCode -eq 201 -or $adminResponse.StatusCode -eq 409) {
    Write-Host "✓ PASSED" -ForegroundColor Green
    $PASSED++
    
    # Login as admin
    $ADMIN_TOKEN = Get-LoginToken -Email "admin@example.com" -Password "admin123"
    
    if ($ADMIN_TOKEN) {
        $adminHeaders = @{ 'Authorization' = "Bearer $ADMIN_TOKEN" }
        
        # Test admin access
        Test-Endpoint -Name "Admin User Access" -Url "$API_GATEWAY/api/users" -ExpectedStatus 200 -Headers $adminHeaders
        
        # Test permission check  
        Test-Endpoint -Name "Permission Check" -Url "$USER_SERVICE/api/admin/permissions" -ExpectedStatus 200 -Headers $adminHeaders
    }
    else {
        Write-Host "✗ FAILED (Could not obtain admin token)" -ForegroundColor Red
        $FAILED += 2
    }
}
else {
    Write-Host "✗ FAILED" -ForegroundColor Red -NoNewline
    Write-Host " (Status: $($adminResponse.StatusCode))"
    $FAILED += 3
}

Write-Host "`n📈 Test Results Summary" -ForegroundColor Cyan
Write-Host "======================="
Write-Host "Total Tests: $($PASSED + $FAILED)"
Write-Host "Passed: $PASSED" -ForegroundColor Green
Write-Host "Failed: $FAILED" -ForegroundColor Red

if ($FAILED -eq 0) {
    Write-Host "`n🎉 All tests passed! RBAC system is working correctly." -ForegroundColor Green
    exit 0
}
else {
    Write-Host "`n⚠️ Some tests failed. Please check the system configuration." -ForegroundColor Yellow
    Write-Host "`nCommon troubleshooting steps:"
    Write-Host "1. Ensure all services are running (check with docker-compose ps)"
    Write-Host "2. Verify database connections (MongoDB, Redis)"
    Write-Host "3. Check environment variables (.env files)"
    Write-Host "4. Review service logs for errors"
    Write-Host "5. Confirm network connectivity between services"
    exit 1
}