# Sync the truly-shared frontend files from the cloud build (拾笺云端)
# into the desktop build (拾笺/public), then report divergent files for manual review.
# Usage: powershell -ExecutionPolicy Bypass -File sync-shared.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$cloud = Join-Path $root '拾笺云端'
$desktop = Join-Path $root '拾笺' 'public'

$shared = @('export.js', 'sjplus.js', 'sjplus.css')
$divergent = @('app.js', 'style.css', 'index.html')

Write-Host '=== Sync shared files: cloud -> desktop ==='
foreach ($f in $shared) {
  $src = Join-Path $cloud $f
  $dst = Join-Path $desktop $f
  if (-not (Test-Path $src)) { Write-Host "SKIP (missing in cloud): $f"; continue }
  Copy-Item -Force $src $dst
  $a = (Get-Item $src).Length
  $b = (Get-Item $dst).Length
  if ($a -eq $b) { Write-Host "OK   $f  ($a bytes)" } else { Write-Host "WARN $f  size mismatch cloud=$a desktop=$b" }
}

Write-Host ''
Write-Host '=== Divergent files (storage backends differ - REVIEW MANUALLY) ==='
foreach ($f in $divergent) {
  $c = Join-Path $cloud $f
  $d = Join-Path $desktop $f
  $cs = if (Test-Path $c) { (Get-Item $c).Length } else { 'NA' }
  $ds = if (Test-Path $d) { (Get-Item $d).Length } else { 'NA' }
  $flag = if ($cs -eq $ds) { 'SAME' } else { 'DIFF' }
  Write-Host "$flag  $f  cloud=$cs desktop=$ds"
}

Write-Host ''
Write-Host 'Note: 拾笺云端 uses local.js+mobilesync.js (client-only + cloud sync).'
Write-Host '      拾笺/public uses server.js+sync.js (served by Node, /api). Do NOT auto-merge these.'
