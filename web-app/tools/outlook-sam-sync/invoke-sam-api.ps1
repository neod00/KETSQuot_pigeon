param(
    [Parameter(Mandatory = $true)]
    [string]$Url
)

$ErrorActionPreference = 'Stop'
$request = [Console]::In.ReadToEnd() | ConvertFrom-Json
$headers = @{}
foreach ($property in $request.headers.psobject.Properties) {
    $headers[$property.Name] = [string]$property.Value
}

$parameters = @{
    Uri = $Url
    Method = $request.method
    Headers = $headers
    ErrorAction = 'Stop'
}

if ($null -ne $request.body) {
    $parameters['ContentType'] = 'application/json'
    $parameters['Body'] = [string]$request.body
}

try {
    Invoke-RestMethod @parameters | ConvertTo-Json -Depth 20 -Compress
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Error "SAM API rejected the sync key (HTTP $statusCode). Issue a new key in SAM and update outlook-sam-sync.config.json."
    } else {
        Write-Error "SAM API request failed (HTTP $statusCode): $($_.Exception.Message)"
    }
    exit 1
}
