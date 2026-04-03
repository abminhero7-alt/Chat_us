@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%

echo Accepting Android SDK licenses...
"%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" --licenses --sdk_root="%ANDROID_HOME%" < nul

echo.
echo Building APK...
cd /d C:\xampp\htdocs\2\frontend\android
gradlew.bat assembleDebug --no-daemon

pause
