Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

while ($true) {
  node (Join-Path $PSScriptRoot 'content-audit.mjs')
  Start-Sleep -Seconds 900
}
