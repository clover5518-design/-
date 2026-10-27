#!/usr/bin/env bash
set -e

echo "=== Building Complete Standalone Android APK for CloudReader ==="
echo "Packaging all environment files, runtime libraries, and assets into APK..."

# Ensure dx is in PATH
if [ ! -f /usr/bin/dx ]; then
  if [ -f /usr/bin/dalvik-exchange ]; then
    ln -sf /usr/bin/dalvik-exchange /usr/bin/dx
  elif [ -f /usr/lib/android-sdk/build-tools/debian/dx ]; then
    ln -sf /usr/lib/android-sdk/build-tools/debian/dx /usr/bin/dx
  fi
fi

# 1. Ensure web production build is fresh
echo "1. Building production frontend bundle with Vite..."
npm run build

BUILD_DIR="/tmp/android_apk_build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/com/cloudreader/app"
mkdir -p "$BUILD_DIR/res/layout"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xhdpi"
mkdir -p "$BUILD_DIR/res/mipmap-xxhdpi"
mkdir -p "$BUILD_DIR/bin"
mkdir -p "$BUILD_DIR/assets"

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
if [ ! -f "$ANDROID_JAR" ]; then
  FOUND_JAR=$(find /usr -name "android.jar" 2>/dev/null | head -n 1)
  if [ -n "$FOUND_JAR" ]; then
    ANDROID_JAR="$FOUND_JAR"
  fi
fi
echo "Using Android Jar: $ANDROID_JAR"

# 2. Copy the entire web app dist into assets (strictly excluding recursive downloads/ directory)
echo "2. Packaging web distribution into APK assets..."
cp -r dist/* "$BUILD_DIR/assets/"
rm -rf "$BUILD_DIR/assets/downloads"

# Copy launcher icons
if [ -f "public/pwa-192x192.png" ]; then
  cp public/pwa-192x192.png "$BUILD_DIR/res/mipmap-hdpi/ic_launcher.png"
  cp public/pwa-192x192.png "$BUILD_DIR/res/mipmap-xhdpi/ic_launcher.png"
  cp public/pwa-512x512.png "$BUILD_DIR/res/mipmap-xxhdpi/ic_launcher.png"
fi

# 3. AndroidManifest.xml
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.cloudreader.app"
    android:versionCode="3"
    android:versionName="1.0.2">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />

    <!-- Network permissions for AI translation & cloud sync -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <!-- Audio & background reading -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <!-- File import permissions -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 4. strings.xml
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">云语悦读</string>
</resources>
EOF

# 5. Java source code (MainActivity.java with Native Android TextToSpeech Hardware Bridge)
cat << 'EOF' > "$BUILD_DIR/src/com/cloudreader/app/MainActivity.java"
package com.cloudreader.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.KeyEvent;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.util.HashMap;
import java.util.Locale;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> mUploadMessageArray;
    private static final int FILE_CHOOSER_RESULT_CODE = 1001;
    private TextToSpeech textToSpeech;
    private boolean ttsInitialized = false;
    private Handler mainHandler;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        mainHandler = new Handler(Looper.getMainLooper());

        initNativeTTS();

        FrameLayout layout = new FrameLayout(this);
        layout.setBackgroundColor(0xFF18181B);
        webView = new WebView(this);
        webView.setBackgroundColor(0xFF18181B);
        layout.addView(webView);
        setContentView(layout);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Bind Native Android TTS Bridge to window.AndroidNativeTTS
        webView.addJavascriptInterface(new AndroidTTSBridge(), "AndroidNativeTTS");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("file:///android_asset/") || url.startsWith("blob:") || url.startsWith("data:")) {
                    return false;
                }
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    view.loadUrl(url);
                    return true;
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (mUploadMessageArray != null) {
                    mUploadMessageArray.onReceiveValue(null);
                    mUploadMessageArray = null;
                }
                mUploadMessageArray = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                String[] mimeTypes = new String[]{
                    "application/pdf",
                    "application/epub+zip",
                    "application/octet-stream",
                    "text/plain",
                    "*/*"
                };
                intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
                try {
                    startActivityForResult(
                        Intent.createChooser(intent, "选择图书文件 (PDF / EPUB / TXT)"),
                        FILE_CHOOSER_RESULT_CODE
                    );
                } catch (Exception e) {
                    if (mUploadMessageArray != null) {
                        mUploadMessageArray.onReceiveValue(null);
                        mUploadMessageArray = null;
                    }
                    return false;
                }
                return true;
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    private void initNativeTTS() {
        textToSpeech = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    textToSpeech.setLanguage(Locale.CHINESE);
                    ttsInitialized = true;
                }
            }
        });

        textToSpeech.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {
                postJs("if (window.__onNativeTtsStart) window.__onNativeTtsStart('" + utteranceId + "');");
            }

            @Override
            public void onDone(String utteranceId) {
                postJs("if (window.__onNativeTtsDone) window.__onNativeTtsDone('" + utteranceId + "');");
            }

            @Override
            public void onError(String utteranceId) {
                postJs("if (window.__onNativeTtsError) window.__onNativeTtsError('" + utteranceId + "');");
            }
        });
    }

    private void postJs(final String jsCode) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                if (webView != null) {
                    webView.evaluateJavascript(jsCode, null);
                }
            }
        });
    }

    public class AndroidTTSBridge {
        @JavascriptInterface
        public boolean isAvailable() {
            return true;
        }

        @JavascriptInterface
        public void speak(final String text, final String lang, final float rate, final float pitch, final String utteranceId) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    if (textToSpeech != null && ttsInitialized) {
                        if (lang != null && (lang.startsWith("en") || lang.startsWith("EN"))) {
                            textToSpeech.setLanguage(Locale.ENGLISH);
                        } else if (lang != null && (lang.contains("HK") || lang.contains("hk") || lang.contains("yue"))) {
                            textToSpeech.setLanguage(new Locale("zh", "HK"));
                        } else if (lang != null && (lang.contains("TW") || lang.contains("tw"))) {
                            textToSpeech.setLanguage(Locale.TRADITIONAL_CHINESE);
                        } else {
                            textToSpeech.setLanguage(Locale.SIMPLIFIED_CHINESE);
                        }
                        textToSpeech.setSpeechRate(rate > 0 ? rate : 1.0f);
                        textToSpeech.setPitch(pitch > 0 ? pitch : 1.0f);

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            Bundle params = new Bundle();
                            params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId);
                            textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
                        } else {
                            HashMap<String, String> params = new HashMap<String, String>();
                            params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId);
                            textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, params);
                        }
                    } else {
                        postJs("if (window.__onNativeTtsError) window.__onNativeTtsError('" + utteranceId + "');");
                    }
                }
            });
        }

        @JavascriptInterface
        public void stop() {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    if (textToSpeech != null) {
                        textToSpeech.stop();
                    }
                }
            });
        }
    }

    @Override
    protected void onDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        super.onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (mUploadMessageArray == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                ClipData clipData = data.getClipData();
                if (clipData != null) {
                    results = new Uri[clipData.getItemCount()];
                    for (int i = 0; i < clipData.getItemCount(); i++) {
                        results[i] = clipData.getItemAt(i).getUri();
                    }
                } else if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
            }
            mUploadMessageArray.onReceiveValue(results);
            mUploadMessageArray = null;
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
EOF

echo "6. Compiling resources with aapt..."
aapt package -f -m \
  -J "$BUILD_DIR/src" \
  -M "$BUILD_DIR/AndroidManifest.xml" \
  -S "$BUILD_DIR/res" \
  -I "$ANDROID_JAR"

echo "7. Compiling Java classes with javac..."
javac -source 1.8 -target 1.8 \
  -bootclasspath "$ANDROID_JAR" \
  -d "$BUILD_DIR/bin" \
  "$BUILD_DIR/src/com/cloudreader/app/R.java" \
  "$BUILD_DIR/src/com/cloudreader/app/MainActivity.java"

echo "8. Generating classes.dex with dx..."
dx --dex --output="$BUILD_DIR/classes.dex" "$BUILD_DIR/bin"

echo "9. Packaging full APK with complete web assets using aapt..."
aapt package -f \
  -M "$BUILD_DIR/AndroidManifest.xml" \
  -S "$BUILD_DIR/res" \
  -A "$BUILD_DIR/assets" \
  -I "$ANDROID_JAR" \
  -F "$BUILD_DIR/app.unsigned.apk"

cd "$BUILD_DIR"
echo "10. Adding classes.dex to APK..."
aapt add "app.unsigned.apk" classes.dex

echo "11. Aligning APK with zipalign..."
zipalign -v -p 4 "$BUILD_DIR/app.unsigned.apk" "$BUILD_DIR/app.aligned.apk"

echo "12. Creating or reusing signing keystore..."
KEYSTORE="/tmp/cloudreader.keystore"
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -alias cloudreader \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass cloudreader123 \
    -keypass cloudreader123 \
    -dname "CN=CloudReader, OU=Mobile, O=CloudReader, L=Beijing, ST=Beijing, C=CN"
fi

echo "13. Signing APK with apksigner (v1, v2, v3)..."
apksigner sign \
  --ks "$KEYSTORE" \
  --ks-pass pass:cloudreader123 \
  --key-pass pass:cloudreader123 \
  --ks-key-alias cloudreader \
  --out "$BUILD_DIR/CloudReader-v1.0.2.apk" \
  "$BUILD_DIR/app.aligned.apk"

echo "14. Verifying APK signature..."
apksigner verify -v "$BUILD_DIR/CloudReader-v1.0.2.apk"

mkdir -p /app/applet/public/downloads
mkdir -p /app/applet/dist/downloads
cp "$BUILD_DIR/CloudReader-v1.0.2.apk" /app/applet/public/downloads/CloudReader-v1.0.2.apk
cp "$BUILD_DIR/CloudReader-v1.0.2.apk" /app/applet/public/downloads/CloudReader-v1.0.1.apk
cp "$BUILD_DIR/CloudReader-v1.0.2.apk" /app/applet/public/downloads/CloudReader-v1.0.0.apk
cp "$BUILD_DIR/CloudReader-v1.0.2.apk" /app/applet/dist/downloads/CloudReader-v1.0.2.apk
cp "$BUILD_DIR/CloudReader-v1.0.2.apk" /app/applet/dist/downloads/CloudReader-v1.0.1.apk
cp "$BUILD_DIR/CloudReader-v1.0.2.apk" /app/applet/dist/downloads/CloudReader-v1.0.0.apk

echo "SUCCESS! Generated complete standalone APK with Native Android TTS hardware bridge (v1.0.2):"
ls -lh /app/applet/public/downloads/CloudReader-v1.0.2.apk
