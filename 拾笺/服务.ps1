# 拾笺 · 后台启动本地服务（供「开机自动启动」使用）
# 只拉起 node 服务，不开浏览器、不开应用窗口、不留黑框。
# 手动停止：项目根目录的 停止.bat
# 手动运行：powershell -NoProfile -ExecutionPolicy Bypass -File "服务.ps1"

$ErrorActionPreference = 'SilentlyContinue'

$base = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $base

$port = 5173
if ($env:PORT -and $env:PORT -match '^\d+$') { $port = [int]$env:PORT }
$probe = "http://127.0.0.1:$port/api/state"

# 1) 服务已在运行：直接退出，避免第二个 node 进程改同一份数据
try {
    $r = Invoke-WebRequest -Uri $probe -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200 -and ($r.Headers['Content-Type'] -match 'application/json')) {
        exit 0
    }
} catch { }

# 2) 找 node.exe：随包 runtime → PATH → 标准安装目录 → WorkBuddy 内置运行时
$cands = New-Object System.Collections.ArrayList
[void]$cands.Add((Join-Path $base 'runtime\win\node.exe'))
$cmd = Get-Command node.exe -ErrorAction SilentlyContinue
if ($cmd) { [void]$cands.Add($cmd.Source) }
[void]$cands.Add((Join-Path $env:ProgramFiles 'nodejs\node.exe'))
if (${env:ProgramFiles(x86)}) {
    [void]$cands.Add((Join-Path ${env:ProgramFiles(x86)} 'nodejs\node.exe'))
}
[void]$cands.Add((Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'))
$wb = Join-Path $env:USERPROFILE '.workbuddy\binaries\node\versions'
if (Test-Path -LiteralPath $wb) {
    Get-ChildItem -Path $wb -Directory |
        Sort-Object Name -Descending |
        ForEach-Object { [void]$cands.Add((Join-Path $_.FullName 'node.exe')) }
}

$node = $null
foreach ($c in $cands) {
    if ($c -and (Test-Path -LiteralPath $c)) { $node = $c; break }
}

$log = Join-Path $base '服务启动失败.log'
if (-not $node) {
    "找不到 node.exe，拾笺服务没能启动。" | Out-File -FilePath $log -Encoding utf8
    exit 1
}

# 3) 后台启动，窗口隐藏；服务自身的日志由 server.js 自行处理
Start-Process -FilePath $node -ArgumentList 'server.js' -WorkingDirectory $base -WindowStyle Hidden
exit 0
