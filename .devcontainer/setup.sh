#!/bin/bash
set -e

echo "=== Installing Flutter SDK ==="
git clone https://github.com/flutter/flutter.git -b stable --depth 1 ~/flutter
export PATH="$HOME/flutter/bin:$PATH"
echo 'export PATH="$HOME/flutter/bin:$PATH"' >> ~/.bashrc

echo "=== Installing Android SDK ==="
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O tools.zip
unzip -q tools.zip
mv cmdline-tools latest
rm tools.zip

export ANDROID_HOME=~/android-sdk
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
echo 'export ANDROID_HOME=~/android-sdk' >> ~/.bashrc
echo 'export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"' >> ~/.bashrc

echo "=== Accepting Android licenses ==="
yes | sdkmanager --licenses > /dev/null 2>&1 || true
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

echo "=== Flutter setup ==="
flutter config --android-sdk ~/android-sdk
flutter doctor --android-licenses <<< "y" > /dev/null 2>&1 || true

echo "=== Getting dependencies ==="
cd /workspaces/CircleSuperStar/flutter_app
flutter pub get

echo ""
echo "============================================"
echo "  Setup complete! To build the APK:"
echo "  cd flutter_app"
echo "  flutter build apk"
echo "============================================"
