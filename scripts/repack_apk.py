#!/usr/bin/env python3
import os
import shutil
import subprocess
import zipfile
import sys

print("=== Starting Standalone APK Repackage with Latest Web Code ===")

ROOT_DIR = "/app/applet"
BASE_APK = os.path.join(ROOT_DIR, "public/downloads/CloudReader-v1.0.0.apk")
DIST_DIR = os.path.join(ROOT_DIR, "dist")
WORK_DIR = "/tmp/apk_staging"
OUTPUT_APK = os.path.join(ROOT_DIR, "public/downloads/CloudReader-v1.0.0.apk")
KEYSTORE = "/tmp/cloudreader.keystore"

# 1. Verify base APK exists
if not os.path.isfile(BASE_APK):
    print(f"Error: Base APK not found at {BASE_APK}", file=sys.stderr)
    sys.exit(1)

# 2. Clean and create staging
if os.path.exists(WORK_DIR):
    shutil.rmtree(WORK_DIR)
os.makedirs(WORK_DIR, exist_ok=True)

# 3. Extract base APK
print(f"1. Extracting base APK from {BASE_APK}...")
with zipfile.ZipFile(BASE_APK, "r") as z:
    z.extractall(WORK_DIR)

# 4. Remove old META-INF signatures
meta_dir = os.path.join(WORK_DIR, "META-INF")
if os.path.exists(meta_dir):
    shutil.rmtree(meta_dir)
    print("2. Removed old META-INF signature files.")

# 5. Clear old assets
assets_dir = os.path.join(WORK_DIR, "assets")
if os.path.exists(assets_dir):
    shutil.rmtree(assets_dir)
os.makedirs(assets_dir, exist_ok=True)

# 6. Copy fresh dist files into assets, strictly excluding downloads/
print("3. Copying fresh dist assets into APK assets/...")
for root, dirs, files in os.walk(DIST_DIR):
    rel_path = os.path.relpath(root, DIST_DIR)
    if rel_path == "downloads" or rel_path.startswith("downloads/"):
        continue
    target_dir = os.path.join(assets_dir, rel_path) if rel_path != "." else assets_dir
    os.makedirs(target_dir, exist_ok=True)
    for f in files:
        if f.endswith(".apk"):
            continue
        src_file = os.path.join(root, f)
        dest_file = os.path.join(target_dir, f)
        shutil.copy2(src_file, dest_file)

print("Assets in staged APK:")
for r, d, files in os.walk(assets_dir):
    for f in files:
        full = os.path.join(r, f)
        print("  -", os.path.relpath(full, assets_dir), f"({os.path.getsize(full)} bytes)")

# 7. Create unaligned APK
unsigned_apk = "/tmp/app.unaligned.apk"
if os.path.exists(unsigned_apk):
    os.remove(unsigned_apk)

print("4. Creating unaligned ZIP/APK package...")
with zipfile.ZipFile(unsigned_apk, "w", compression=zipfile.ZIP_DEFLATED) as zout:
    for root, dirs, files in os.walk(WORK_DIR):
        for f in files:
            full_path = os.path.join(root, f)
            archive_name = os.path.relpath(full_path, WORK_DIR)
            # resources.arsc and uncompressed assets can be stored uncompressed for Android speed
            if f == "resources.arsc" or f.endswith(".png"):
                zout.write(full_path, archive_name, compress_type=zipfile.ZIP_STORED)
            else:
                zout.write(full_path, archive_name, compress_type=zipfile.ZIP_DEFLATED)

# 8. Align APK with zipalign
aligned_apk = "/tmp/app.aligned.apk"
if os.path.exists(aligned_apk):
    os.remove(aligned_apk)

print("5. 4-byte aligning APK with zipalign...")
subprocess.run(["zipalign", "-v", "-p", "4", unsigned_apk, aligned_apk], check=True, stdout=subprocess.DEVNULL)

# 9. Create signing keystore if needed
if not os.path.isfile(KEYSTORE):
    print("6. Generating release keystore...")
    subprocess.run([
        "keytool", "-genkeypair", "-v",
        "-keystore", KEYSTORE,
        "-alias", "cloudreader",
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-storepass", "cloudreader123",
        "-keypass", "cloudreader123",
        "-dname", "CN=CloudReader, OU=Mobile, O=CloudReader, L=Beijing, ST=Beijing, C=CN"
    ], check=True, stdout=subprocess.DEVNULL)

# 10. Sign APK with apksigner (v1, v2, v3 schemes)
signed_apk = "/tmp/CloudReader-signed.apk"
if os.path.exists(signed_apk):
    os.remove(signed_apk)

print("7. Signing APK with apksigner (v1 + v2 + v3 schemes)...")
subprocess.run([
    "apksigner", "sign",
    "--ks", KEYSTORE,
    "--ks-pass", "pass:cloudreader123",
    "--key-pass", "pass:cloudreader123",
    "--ks-key-alias", "cloudreader",
    "--out", signed_apk,
    aligned_apk
], check=True)

# 11. Verify APK signature
print("8. Verifying APK signature...")
verify_proc = subprocess.run(["apksigner", "verify", "-v", signed_apk], capture_output=True, text=True, check=True)
print(verify_proc.stdout)

# 12. Copy to public/downloads/CloudReader-v1.0.0.apk
shutil.copy2(signed_apk, OUTPUT_APK)
size = os.path.getsize(OUTPUT_APK)
print(f"SUCCESS! New APK generated at {OUTPUT_APK}")
print(f"File size: {size} bytes ({size / (1024*1024):.2f} MB)")
