param(
    [Parameter(Mandatory=$false)]
    [switch]$Enable,
    
    [Parameter(Mandatory=$false)]
    [switch]$Disable,

    [Parameter(Mandatory=$false)]
    [string]$Site = "https://sobackitsover.xyz",  # Change to your site URL

    [Parameter(Mandatory=$false)]
    [string]$Key = "Hzr5zB2DyqAf6HGk92LU"  # Replace with your actual key
)

# Validate input
if (-not ($Enable -xor $Disable)) {
    Write-Host "Please specify either -Enable or -Disable" -ForegroundColor Yellow
    exit
}

$enabled = $Enable.IsPresent

# Prepare request
$body = @{
    enabled = $enabled
    key = $Key
} | ConvertTo-Json

try {
    # Make the request
    $response = Invoke-RestMethod -Uri "$Site/api/maintenance" -Method Post -Body $body -ContentType "application/json"
    
    # Show result
    if ($enabled) {
        Write-Host "✅ Maintenance mode enabled" -ForegroundColor Green
    } else {
        Write-Host "✅ Maintenance mode disabled" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to update maintenance mode: $_" -ForegroundColor Red
}

# Check API endpoints
$endpoints = @(
    "/api/latest",
    "/api/history",
    "/api/console",
    "/api/trend"
)

$apiUrl = $env:NEXT_PUBLIC_API_URL
Write-Host "Checking API endpoints at $apiUrl..."

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$apiUrl$endpoint" -Method GET
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $endpoint is healthy" -ForegroundColor Green
            # Log sample data
            Write-Host "Sample data: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..."
        } else {
            Write-Host "⚠️ $endpoint returned status code $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $endpoint check failed: $_" -ForegroundColor Red
    }
} 