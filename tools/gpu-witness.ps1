# GPU contention witness for tools/perf.mjs and tools/startup.mjs (Windows only): about every 2 s, the 3D-engine utilisation of every
# process using the GPU ("GPU Engine" performance counters), one line per sample:
#   <epoch ms> <pid>@<phys adapter>:<percent>:<process name> ...
# Other sessions' headless browsers share the integrated GPU: a measurement taken while one of them renders is not trusted.
param([string]$Out, [int]$Secs = 3600)
$end = (Get-Date).AddSeconds($Secs)
while ((Get-Date) -lt $end) {
  $t = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
  $s = (Get-Counter '\GPU Engine(*engtype_3D)\Utilization Percentage' -ErrorAction SilentlyContinue).CounterSamples | Where-Object { $_.CookedValue -gt 2 }
  $parts = foreach ($x in $s) {
    $id = [regex]::Match($x.InstanceName, 'pid_(\d+)').Groups[1].Value
    $ph = [regex]::Match($x.InstanceName, 'phys_(\d+)').Groups[1].Value
    $n = (Get-Process -Id $id -ErrorAction SilentlyContinue).ProcessName
    '{0}@{1}:{2}:{3}' -f $id, $ph, [math]::Round($x.CookedValue), $n
  }
  Add-Content -Path $Out -Value ("$t " + ($parts -join ' '))
  Start-Sleep -Milliseconds 1000
}
