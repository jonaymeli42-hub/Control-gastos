#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
SDK_ROOT="${ANDROID_SDK_ROOT:-/workspace/android-sdk}"
BT="$SDK_ROOT/build-tools/36.0.0"
JAR="$SDK_ROOT/platforms/android-36/android.jar"
SIGN_KEY="${ANOTAR_SIGNING_KEY:-/workspace/shared/anotar-gasto-signing.p12}"
SIGN_PASS="${ANOTAR_SIGNING_PASSWORD_FILE:-/workspace/shared/anotar-gasto-signing-password}"
mkdir -p build/android-tests/classes build/android-tests/dex
"$BT/aapt2" link -o build/android-tests/resources.apk -I "$JAR" --manifest tests/android/AndroidManifest.xml
java --module jdk.compiler/com.sun.tools.javac.Main -source 8 -target 8 -bootclasspath "$BT/core-lambda-stubs.jar:$JAR" -classpath build/classes -d build/android-tests/classes tests/android/NativeTests.java
"$BT/d8" --lib "$JAR" --classpath build/classes --min-api 26 --output build/android-tests/dex build/android-tests/classes/com/controlfinanzas/anotargasto/tests/*.class
python3 - <<'PY'
import zipfile
with zipfile.ZipFile('build/android-tests/resources.apk') as src,zipfile.ZipFile('build/android-tests/unsigned.apk','w',zipfile.ZIP_DEFLATED) as dst:
 for f in src.infolist():dst.writestr(f,src.read(f.filename))
 dst.write('build/android-tests/dex/classes.dex','classes.dex')
PY
"$BT/zipalign" -f 4 build/android-tests/unsigned.apk build/android-tests/aligned.apk
"$BT/apksigner" sign --ks "$SIGN_KEY" --ks-key-alias anotar --ks-pass "file:$SIGN_PASS" --out build/android-tests/tests.apk build/android-tests/aligned.apk
"$SDK_ROOT/platform-tools/adb" install --no-incremental -r downloads/anotar-gasto-1.4.apk
"$SDK_ROOT/platform-tools/adb" shell pm grant com.controlfinanzas.anotargasto android.permission.RECORD_AUDIO
"$SDK_ROOT/platform-tools/adb" install --no-incremental -r -t build/android-tests/tests.apk
"$SDK_ROOT/platform-tools/adb" shell am instrument -w com.controlfinanzas.anotargasto.tests/.NativeTests
