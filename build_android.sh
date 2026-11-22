#!/bin/bash
# Menyalin game web ke proyek Android lalu (opsional) membangun APK debug. Butuh Android SDK + Gradle.
set -e
cd "$(dirname "$0")"
rm -rf android/app/src/main/assets/www && mkdir -p android/app/src/main/assets && cp -r www android/app/src/main/assets/www
cd android && if [ -x ./gradlew ]; then ./gradlew assembleDebug; else gradle assembleDebug; fi
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"
