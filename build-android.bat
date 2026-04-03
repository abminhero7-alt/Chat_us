@echo off
setlocal enabledelayedexpansion

REM Set Java and Android SDK paths
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%"

echo JAVA_HOME=%JAVA_HOME%
echo ANDROID_HOME=%ANDROID_HOME%

REM Check Java
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo ERROR: Java not found at %JAVA_HOME%
    pause
    exit /b 1
)

REM Create license files if they don't exist
if not exist "%ANDROID_HOME%\licenses" mkdir "%ANDROID_HOME%\licenses"

if not exist "%ANDROID_HOME%\licenses\android-sdk-license" (
    echo 24333f8a63b6825ea9c5514f83c2829b004d1fee>"%ANDROID_HOME%\licenses\android-sdk-license"
    echo Created android-sdk-license
)

if not exist "%ANDROID_HOME%\licenses\android-sdk-preview-license" (
    echo 84831b9409646a918e30573bab4c9c91346d8abd>"%ANDROID_HOME%\licenses\android-sdk-preview-license"
    echo Created android-sdk-preview-license
)

REM Install SDK components
if not exist "%ANDROID_HOME%\platforms\android-34" (
    echo Installing Android SDK Platform 34...
    call "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "platforms;android-34" --sdk_root="%ANDROID_HOME%"
)

if not exist "%ANDROID_HOME%\build-tools\34.0.0" (
    echo Installing Build Tools 34.0.0...
    call "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "build-tools;34.0.0" --sdk_root="%ANDROID_HOME%"
)

REM Build APK
echo.
echo Building APK...
cd /d "C:\xampp\htdocs\2\frontend\android"
call gradlew.bat assembleDebug --no-daemon

if %ERRORLEVEL% equ 0 (
    echo.
    echo ======================================
    echo BUILD SUCCESSFUL!
    echo APK: app\build\outputs\apk\debug\app-debug.apk
    echo ======================================
) else (
    echo.
    echo BUILD FAILED
)

pause
