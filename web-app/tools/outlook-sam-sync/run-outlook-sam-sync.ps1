$ErrorActionPreference = 'Stop'

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
    $nodePath = $nodeCommand.Source
} else {
    $oneDrive = Join-Path $env:USERPROFILE 'OneDrive - LRQA'
    $nodePath = Get-ChildItem -LiteralPath $oneDrive -Filter node.exe -File -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match 'D365_auto\\node_portable\\node\.exe$' } |
        Select-Object -First 1 -ExpandProperty FullName
}

if (-not $nodePath) {
    throw 'Node.js를 찾지 못했습니다. Node.js를 설치하거나 D365_auto/node_portable/node.exe가 있는지 확인하세요.'
}

& $nodePath (Join-Path $PSScriptRoot 'outlook-sam-sync.mjs') @args
exit $LASTEXITCODE
