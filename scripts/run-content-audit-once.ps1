Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$logDir = Join-Path $PSScriptRoot '..\logs'
if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir | Out-Null
}

$logFile = Join-Path $logDir 'content-audit.log'
$timestamp = Get-Date -Format o
"[$timestamp] Starting content audit" | Out-File -FilePath $logFile -Append -Encoding utf8
node (Join-Path $PSScriptRoot 'content-audit.mjs') 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
"[$(Get-Date -Format o)] Finished content audit" | Out-File -FilePath $logFile -Append -Encoding utf8
