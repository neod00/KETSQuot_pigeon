param(
    [string]$TaskName = 'LRQA Outlook Coordination Agent',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing -and -not $Force) {
    throw "'$TaskName' 작업이 이미 있습니다. 교체하려면 -Force를 지정하세요."
}

$runner = Join-Path $PSScriptRoot 'run-outlook-coordination-sync.ps1'
if (-not (Test-Path -LiteralPath $runner)) {
    throw "실행 파일을 찾지 못했습니다: $runner"
}

$quotedRunner = '"' + $runner + '"'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File $quotedRunner --catch-up"
$triggers = @(
    New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At '09:00'
    New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At '12:30'
    New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At '16:30'
    New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
)
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask `
    -TaskName $TaskName `
    -Description '전체 Outlook 받은편지함을 평일 09:00, 12:30, 16:30에 읽고, 놓친 실행은 다음 로그인 후 보충합니다.' `
    -Action $action `
    -Trigger $triggers `
    -Settings $settings `
    -Principal $principal | Out-Null

Write-Host "작업 스케줄러 등록 완료: $TaskName"
Write-Host '평일 09:00, 12:30, 16:30 및 로그인 시 실행되며, --catch-up이 중복 실행을 막습니다.'
