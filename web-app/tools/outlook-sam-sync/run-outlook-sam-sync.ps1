$ErrorActionPreference = 'Stop'

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
    $nodePath = $nodeCommand.Source
} else {
    $oneDrive = if ($env:OneDriveCommercial) { $env:OneDriveCommercial } else { Join-Path $env:USERPROFILE 'OneDrive - LRQA' }
    $knownNodePath = Join-Path $oneDrive '문서\AI\D365_auto\node_portable\node.exe'
    if (Test-Path -LiteralPath $knownNodePath) {
        $nodePath = $knownNodePath
    } else {
        $nodePath = Get-ChildItem -LiteralPath $oneDrive -Filter node.exe -File -Recurse -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -match 'D365_auto\\node_portable\\node\.exe$' } |
            Select-Object -First 1 -ExpandProperty FullName
    }
}

if (-not $nodePath) {
    throw 'Node.js를 찾지 못했습니다. Node.js를 설치하거나 D365_auto/node_portable/node.exe가 있는지 확인하세요.'
}

& $nodePath (Join-Path $PSScriptRoot 'outlook-sam-sync.mjs') @args
exit $LASTEXITCODE
