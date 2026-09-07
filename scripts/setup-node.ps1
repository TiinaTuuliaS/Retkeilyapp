$ErrorActionPreference = 'Stop'
$nodeVersion = '22.23.2'
$archiveName = "node-v$nodeVersion-win-x64.zip"
$expectedHash = '1177b4137ba5adaa56354ae40f1080c7450e8ae09cecb47da459d1c52ac99f97'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsDirectory = Join-Path $projectRoot '.tools'
$nodeDirectory = Join-Path $toolsDirectory "node-v$nodeVersion-win-x64"

if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -ne 'X64') {
    throw 'This installer requires Windows x64.'
}

if (Test-Path (Join-Path $nodeDirectory 'node.exe')) {
    & (Join-Path $nodeDirectory 'node.exe') --version
    if ($LASTEXITCODE -ne 0) { throw 'Local Node could not start.' }
    exit 0
}

New-Item -ItemType Directory -Force -Path $toolsDirectory | Out-Null
$archivePath = Join-Path $toolsDirectory $archiveName
Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/v$nodeVersion/$archiveName" -OutFile $archivePath
if ((Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash -ne $expectedHash) {
    throw 'Node archive checksum mismatch. Installation stopped.'
}
Expand-Archive -LiteralPath $archivePath -DestinationPath $toolsDirectory -Force
& (Join-Path $nodeDirectory 'node.exe') --version
if ($LASTEXITCODE -ne 0) { throw 'Local Node could not start.' }
Write-Host 'Project-local Node is ready. System Node was not changed.'
