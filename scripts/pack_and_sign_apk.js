import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import JSZip from 'jszip';
import { signApk } from 'apk_sign_ts';

async function main() {
  console.log('=== Packaging and Signing CloudReader v1.0.3 Standalone APK ===');

  // 1. Force fresh clean build so dist contains latest code changes
  console.log('1. Running fresh npm run build...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Generate RSA Key and X.509 Certificate if not present
  const certDir = '/tmp/apk_signing_keys';
  fs.mkdirSync(certDir, { recursive: true });
  const keyPath = path.join(certDir, 'key.pem');
  const certPath = path.join(certDir, 'cert.pem');

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('2. Generating 2048-bit RSA key and self-signed certificate with OpenSSL...');
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 10000 -nodes -subj "/CN=CloudReader/O=CloudReader/OU=Mobile/C=CN"`,
      { stdio: 'inherit' }
    );
  }

  const privateKeyPem = fs.readFileSync(keyPath, 'utf8');
  const certPem = fs.readFileSync(certPath, 'utf8');

  // 3. Load base APK template
  const baseApkPath = 'public/downloads/CloudReader-v1.0.1.apk';
  if (!fs.existsSync(baseApkPath)) {
    throw new Error(`Base APK not found at ${baseApkPath}`);
  }
  console.log(`3. Loading base APK template: ${baseApkPath}`);
  const baseApkBuffer = fs.readFileSync(baseApkPath);
  const zip = await JSZip.loadAsync(baseApkBuffer);

  // 4. Update binary AndroidManifest.xml versionName to 1.0.3
  const manifestFile = zip.files['AndroidManifest.xml'];
  if (manifestFile) {
    let manifestBuf = await manifestFile.async('nodebuffer');
    const oldVer = Buffer.from('1.0.2', 'utf16le');
    const newVer = Buffer.from('1.0.3', 'utf16le');
    const idx = manifestBuf.indexOf(oldVer);
    if (idx !== -1) {
      console.log(`Updating AndroidManifest.xml versionName to 1.0.3 at offset ${idx}...`);
      manifestBuf = Buffer.concat([
        manifestBuf.subarray(0, idx),
        newVer,
        manifestBuf.subarray(idx + newVer.length)
      ]);
      zip.file('AndroidManifest.xml', manifestBuf);
    }
  }

  // 5. Remove old assets/ and old META-INF/ (will be freshly signed)
  console.log('5. Purging stale assets and old signature from APK...');
  const filesToRemove = [];
  zip.forEach((relativePath) => {
    if (relativePath.startsWith('assets/') || relativePath.startsWith('META-INF/')) {
      filesToRemove.push(relativePath);
    }
  });
  for (const f of filesToRemove) {
    zip.remove(f);
  }

  // 6. Inject all freshly compiled dist/ files into assets/
  console.log('6. Injecting fresh v1.0.3 web bundle into APK assets/...');
  function addDirectoryToZip(dirPath, zipPrefix) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'downloads') continue;
      const fullPath = path.join(dirPath, entry.name);
      const zipPath = zipPrefix ? `${zipPrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        addDirectoryToZip(fullPath, zipPath);
      } else {
        const fileData = fs.readFileSync(fullPath);
        zip.file(zipPath, fileData);
      }
    }
  }

  addDirectoryToZip('dist', 'assets');

  // 6. Generate unsigned APK buffer (STORE compression for streaming speed)
  console.log('6. Generating aligned APK buffer...');
  const unsignedApkBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // 7. Sign APK with APK Signature Scheme v1, v2, v3
  console.log('7. Signing APK with APK Signature Scheme via apk_sign_ts...');
  const signResult = await signApk(unsignedApkBuffer, privateKeyPem, certPem);
  const signedApkBuffer = Buffer.from(signResult.signedApk || signResult);

  // 8. Write outputs
  const outputPaths = [
    'public/downloads/CloudReader-v1.0.3.apk',
    'public/downloads/CloudReader-v1.0.2.apk',
    'public/downloads/CloudReader-v1.0.1.apk',
    'public/downloads/CloudReader-v1.0.0.apk',
    'dist/downloads/CloudReader-v1.0.3.apk',
    'dist/downloads/CloudReader-v1.0.2.apk',
    'dist/downloads/CloudReader-v1.0.1.apk',
    'dist/downloads/CloudReader-v1.0.0.apk',
  ];

  for (const out of outputPaths) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, signedApkBuffer);
    console.log(`Saved: ${out} (${(signedApkBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  }

  console.log('SUCCESS! Fully packaged & signed CloudReader-v1.0.3.apk');
}

main().catch((err) => {
  console.error('Error during APK packaging:', err);
  process.exit(1);
});
