# Package energy witness for tools/cadence.mjs (Windows only, read-only "Energy Meter" performance counters: the RAPL package and its
# cores; the Radeon 780M sits in the package). About every second, one line:
#   <epoch ms> <meter ms> <package energy> <sum of the cores' energy>          (energies in picowatt-hours)
# Package minus cores = the SoC (integrated GPU, memory, fabric): the iGPU's share, other processes' CPU work left out. The counter set's
# name is localised, so it is found by its instance name; no output (empty file) when the machine has no such meter.
param([string]$Out, [int]$Secs = 3600)
$set = Get-Counter -ListSet * -ErrorAction SilentlyContinue | Where-Object { $_.PathsWithInstances -match 'RAPL_Package0_PKG' } | Select-Object -First 1
if (-not $set) { exit 0 }
# counters in their declared order: power (mW), energy (pWh), time (ms)
$energyName = ($set.Paths[1] -split '\\')[-1]; $timeName = ($set.Paths[2] -split '\\')[-1]
$paths = $set.PathsWithInstances | Where-Object { $_ -match 'RAPL_Package0_(PKG|Core\d+_CORE)' -and ($_ -like ('*\' + $energyName) -or $_ -like ('*\' + $timeName)) }
$end = (Get-Date).AddSeconds($Secs)
while ((Get-Date) -lt $end) {
  $t = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
  $s = (Get-Counter -Counter $paths -ErrorAction SilentlyContinue).CounterSamples
  $pkg = 0.0; $cores = 0.0; $ms = 0.0
  foreach ($x in $s) {
    $isTime = $x.Path -like ('*\' + $timeName)
    if ($x.Path -match 'rapl_package0_pkg') { if ($isTime) { $ms = [double]$x.RawValue } else { $pkg = [double]$x.RawValue } }
    elseif (-not $isTime) { $cores += [double]$x.RawValue }
  }
  Add-Content -Path $Out -Value ('{0} {1} {2} {3}' -f $t, $ms, $pkg, $cores)
  Start-Sleep -Milliseconds 400
}
