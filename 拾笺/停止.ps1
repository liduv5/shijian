# Shijian - stop local server
# Kill the running node server.js process(es) precisely.
$procs = Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%server.js%' AND Name = 'node.exe'"
if ($procs) {
    $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Write-Host ("Stopped {0} Shijian local server process(es)." -f $procs.Count)
} else {
    Write-Host "No running Shijian local server found."
}
