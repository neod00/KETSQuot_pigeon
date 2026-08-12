param(
    [Parameter(Mandatory = $true)]
    [string]$Url,

    [Parameter(Mandatory = $true)]
    [string]$RequestPath
)

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$request = Get-Content -LiteralPath $RequestPath -Raw -Encoding UTF8 | ConvertFrom-Json
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
    $parameters['ContentType'] = 'application/json; charset=utf-8'
    $parameters['Body'] = $utf8.GetBytes([string]$request.body)
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
