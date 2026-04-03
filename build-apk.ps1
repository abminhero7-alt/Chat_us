# Build APK Script
$ErrorActionPreference = "Stop"

# Set Java Home (find correct path)
$javaPaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot",
    "C:\Program Files\Java\jdk-17",
    "C:\Program Files\Java\jdk-11"
)

$javaHome = $null
foreach ($path in $javaPaths) {
    if (Test-Path "$path\bin\java.exe") {
        $javaHome = $path
        break
    }
}

if (-not $javaHome) {
    Write-Host "ERROR: Java JDK not found!" -ForegroundColor Red
    Write-Host "Please install Java 17 JDK from: https://adoptium.net" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found Java at: $javaHome" -ForegroundColor Green

# Set environment variables
$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$javaHome\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:Path"

# Accept licenses
Write-Host "`nAccepting Android SDK licenses..." -ForegroundColor Cyan
$licensesDir = "$env:ANDROID_HOME\licenses"
New-Item -ItemType Directory -Force -Path $licensesDir | Out-Null

# Create license files if they don't exist
$licenses = @{
    "android-sdk-license" = "24333f8a63b6825ea9c5514f83c2829b004d1fee"
    "android-sdk-preview-license" = "84831b9409646a918e30573bab4c9c91346d8abd"
    "google-gdk-license" = "33b6a2b64607f11b759f320ef9dff4ae5f47f97a"
}

foreach ($license in $licenses.GetEnumerator()) {
    $licenseFile = Join-Path $licensesDir $license.Key
    if (-not (Test-Path $licenseFile)) {
        $license.Value | Out-File -FilePath $licenseFile -Encoding ASCII
        Write-Host "Created license: $($license.Key)" -ForegroundColor Green
    }
}

# Build APK
Write-Host "`nBuilding APK..." -ForegroundColor Cyan
Set-Location "C:\xampp\htdocs\2\frontend\android"

& ".\gradlew.bat" assembleDebug --no-daemon

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build successful!" -ForegroundColor Green
    $apkPath = "C:\xampp\htdocs\2\frontend\android\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        Write-Host "APK location: $apkPath" -ForegroundColor Green
    }
} else {
    Write-Host "`n❌ Build failed" -ForegroundColor Red
}

pause
