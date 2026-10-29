$ErrorActionPreference = 'Stop'

try {
  $clipboard = [string](Get-Clipboard -Raw)
} catch {
  Write-Host 'Could not read the clipboard. Copy the Meta API key and run this again.' -ForegroundColor Red
  exit 1
}

$key = [regex]::Replace($clipboard, '[\s\p{C}]', '')
if ($key -notmatch '^LLM_[A-Za-z0-9_-]{12,}$') {
  Write-Host 'Clipboard does not contain a full Meta API key. Copy only the key itself, then run this again.' -ForegroundColor Red
  exit 1
}

Set-Clipboard -Value ''
$env:MODEL_API_KEY = $key
$key = $null
$clipboard = $null
$env:PORT = '4173'
node (Join-Path $PSScriptRoot 'server.mjs')
