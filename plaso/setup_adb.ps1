$ErrorActionPreference = 'Stop'
$dest = "C:\platform-tools"
$adbPath = "$dest\adb.exe"

if (-not (Test-Path $adbPath)) {
    $zipPath = "$env:TEMP\platform-tools.zip"
    Write-Host "Downloading Google Platform Tools via curl..."
    & curl.exe -L "https://dl.google.com/android/repository/platform-tools-latest-windows.zip" -o $zipPath
    Write-Host "Extracting to C:\..."
    & tar.exe -xf $zipPath -C "C:\"
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
}

Write-Host "=== ADB VERSION ==="
& $adbPath version

Write-Host "`n=== CONNECTED DEVICES ==="
& $adbPath devices -l
