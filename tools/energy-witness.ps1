# Package energy witness for tools/cadence.mjs (Windows only, read-only "Energy Meter" performance counters: the RAPL package and its
# cores; the Radeon 780M sits in the package). About every second, one line:
#   <epoch ms> <meter ms> <package energy> <sum of the cores' energy>          (energies in picowatt-hours)
# Package minus cores = the SoC (integrated GPU, memory, fabric): the iGPU's share, other processes' CPU work left out. The counter set's
# name is localised, so it is found by its instance name; no output (empty file) when the machine has no such meter.
# The counters are written as integers in the invariant culture: as [double], a value past 1e15 pWh (1 kWh since the meter's start) was
# written "1,011E+15" under a French culture, which the reader cannot parse, and every sample was lost from then on (journal pass 6i).
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
  $pkg = [decimal]0; $cores = [decimal]0; $ms = [decimal]0
  foreach ($x in $s) {
    $isTime = $x.Path -like ('*\' + $timeName)
    if ($x.Path -match 'rapl_package0_pkg') { if ($isTime) { $ms = [decimal]$x.RawValue } else { $pkg = [decimal]$x.RawValue } }
    elseif (-not $isTime) { $cores += [decimal]$x.RawValue }
  }
  Add-Content -Path $Out -Value ([string]::Format([Globalization.CultureInfo]::InvariantCulture, '{0} {1} {2} {3}', $t, $ms, $pkg, $cores))
  Start-Sleep -Milliseconds 400
}
