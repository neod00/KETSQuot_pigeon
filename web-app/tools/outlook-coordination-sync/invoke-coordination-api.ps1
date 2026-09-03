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
        Write-Error "조정 에이전트 API가 수집기 키를 거부했습니다(HTTP $statusCode). 화면에서 새 키를 발급해 설정 파일을 갱신하세요."
    } else {
        Write-Error "조정 에이전트 API 요청 실패(HTTP $statusCode): $($_.Exception.Message)"
    }
    exit 1
}
