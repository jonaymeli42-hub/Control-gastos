#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
SDK_ROOT="${ANDROID_SDK_ROOT:-/workspace/android-sdk}"
BUILD_TOOLS="$SDK_ROOT/build-tools/36.0.0"
ANDROID_JAR="$SDK_ROOT/platforms/android-36/android.jar"
SIGN_KEY="${ANOTAR_SIGNING_KEY:-/workspace/shared/anotar-gasto-signing.p12}"
SIGN_PASS="${ANOTAR_SIGNING_PASSWORD_FILE:-/workspace/shared/anotar-gasto-signing-password}"
mkdir -p build/classes build/generated build/dex downloads
"$BUILD_TOOLS/aapt2" compile --dir app/src/main/res -o build/resources.zip
"$BUILD_TOOLS/aapt2" link -o build/resources.apk -I "$ANDROID_JAR" --manifest app/src/main/AndroidManifest.xml --java build/generated --min-sdk-version 26 --target-sdk-version 36 build/resources.zip
python3 - <<'PY'
from pathlib import Path
Path('build/sources.list').write_text('\n'.join(str(p) for base in ['app/src/main/java','build/generated'] for p in Path(base).rglob('*.java')))
PY
java --module jdk.compiler/com.sun.tools.javac.Main -encoding UTF-8 -source 8 -target 8 -bootclasspath "$BUILD_TOOLS/core-lambda-stubs.jar:$ANDROID_JAR" -d build/classes @build/sources.list
python3 - <<'PY'
from pathlib import Path
Path('build/classes.list').write_text('\n'.join(str(p) for p in Path('build/classes').rglob('*.class')))
PY
"$BUILD_TOOLS/d8" --release --lib "$ANDROID_JAR" --min-api 26 --output build/dex @build/classes.list
python3 - <<'PY'
from pathlib import Path
import zipfile
with zipfile.ZipFile('build/resources.apk') as src,zipfile.ZipFile('build/unsigned.apk','w',zipfile.ZIP_DEFLATED) as dst:
 for f in src.infolist():dst.writestr(f,src.read(f.filename))
 for p in Path('build/dex').glob('*.dex'):dst.write(p,p.name)
PY
"$BUILD_TOOLS/zipalign" -f -p 4 build/unsigned.apk build/aligned.apk
"$BUILD_TOOLS/apksigner" sign --ks "$SIGN_KEY" --ks-key-alias anotar --ks-pass "file:$SIGN_PASS" --out downloads/anotar-gasto-1.1.apk build/aligned.apk
"$BUILD_TOOLS/apksigner" verify --verbose downloads/anotar-gasto-1.1.apk
sha256sum downloads/anotar-gasto-1.1.apk > downloads/anotar-gasto-1.1.apk.sha256
