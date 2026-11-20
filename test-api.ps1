# RhConnect Comprehensive API Testing Script

$baseURL = "http://localhost:8080/api"
$results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [object]$Body,
        [string]$Token
    )
    
    try {
        $headers = @{ "Content-Type" = "application/json" }
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $url = "$baseURL$Endpoint"
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        
        Write-Host "✅ $Name - SUCCESS"
        return @{
            Name = $Name
            Status = "✅ Working"
            Response = $response
            Token = $null
        }
    }
    catch {
        Write-Host "❌ $Name - FAILED: $($_.Exception.Message)"
        return @{
            Name = $Name
            Status = "❌ Failed"
            Error = $_.Exception.Message
            Token = $null
        }
    }
}

Write-Host "=========================================="
Write-Host "RhConnect API Testing - Starting"
Write-Host "=========================================="

# Test 1: Candidate Login
Write-Host "`n[1] Testing Candidate Workflow..."
$candidateLogin = Test-Endpoint -Name "Candidate Login" -Method "POST" -Endpoint "/auth/login" -Body @{
    email = "email-any-verified-candidate@example.com"
    password = "password"
}

if ($candidateLogin.Response.token) {
    $candidateToken = $candidateLogin.Response.token
    Write-Host "Token obtained: $($candidateToken.Substring(0,20))..."
    
    # Test 2: Get Candidate Profile
    Test-Endpoint -Name "Get Candidate Profile" -Method "GET" -Endpoint "/candidates/me" -Token $candidateToken | Out-Null
    
    # Test 3: Get Offers
    Test-Endpoint -Name "Get Offers (Browse)" -Method "GET" -Endpoint "/offers?page=0&limit=10" -Token $candidateToken | Out-Null
    
    # Test 4: Get Applications
    Test-Endpoint -Name "Get My Applications" -Method "GET" -Endpoint "/applications/me" -Token $candidateToken | Out-Null
    
    # Test 5: Get Notifications
    Test-Endpoint -Name "Get Notifications" -Method "GET" -Endpoint "/notifications" -Token $candidateToken | Out-Null
}

# Test 6: Company Login
Write-Host "`n[2] Testing Company Workflow..."
$companyLogin = Test-Endpoint -Name "Company Login" -Method "POST" -Endpoint "/auth/login" -Body @{
    email = "recruiter@techcorp-tn.com"
    password = "RhConnect2026!"
}

if ($companyLogin.Response.token) {
    $companyToken = $companyLogin.Response.token
    Write-Host "Token obtained: $($companyToken.Substring(0,20))..."
    
    # Test 7: Get Company Profile
    Test-Endpoint -Name "Get Company Profile" -Method "GET" -Endpoint "/companies/me" -Token $companyToken | Out-Null
    
    # Test 8: Get My Offers
    Test-Endpoint -Name "Get My Offers" -Method "GET" -Endpoint "/offers/my" -Token $companyToken | Out-Null
    
    # Test 9: Get Applications
    Test-Endpoint -Name "Get Applications" -Method "GET" -Endpoint "/applications" -Token $companyToken | Out-Null
}

# Test 10: Admin Login
Write-Host "`n[3] Testing Admin Workflow..."
$adminLogin = Test-Endpoint -Name "Admin Login" -Method "POST" -Endpoint "/auth/login" -Body @{
    email = "admin@rhconnect.tn"
    password = "admin"
}

if ($adminLogin.Response.token) {
    $adminToken = $adminLogin.Response.token
    Write-Host "Token obtained: $($adminToken.Substring(0,20))..."
    
    # Test 11: Get All Offers (Admin)
    Test-Endpoint -Name "Get All Offers (Admin)" -Method "GET" -Endpoint "/offers/admin/all" -Token $adminToken | Out-Null
    
    # Test 12: Get All Applications (Admin)
    Test-Endpoint -Name "Get All Applications (Admin)" -Method "GET" -Endpoint "/applications/admin/all" -Token $adminToken | Out-Null
}

Write-Host "`n=========================================="
Write-Host "API Testing - Complete"
Write-Host "=========================================="
