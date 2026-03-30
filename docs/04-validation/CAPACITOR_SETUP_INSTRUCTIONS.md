# Capacitor Validation — Setup Instructions

**Goal**: Validate that Capacitor plugins work for Thap's 4 must-have native features before committing to the full integration.

**Estimated time**: 4-6 hours over 2 days  
**Cost**: Free (Firebase free tier, Android Studio free)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 10+ | `npm install -g pnpm@10` |
| Android Studio | Latest | https://developer.android.com/studio |
| JDK | 17+ | Bundled with Android Studio |
| Firebase account | Free | https://console.firebase.google.com |
| Android device | Android 8+ | Or use Android emulator |

---

## Week 1 Day 1: Environment Setup

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → Name it `Thap Validation`
3. Disable Google Analytics (not needed for validation)
4. Click **Create project**

### Step 2: Add Android App to Firebase

1. In Firebase Console → click **Android** icon
2. Package name: `com.thap.validation`
3. App nickname: `Thap Validation`
4. Click **Register app**
5. **Download `google-services.json`** — you will need this file
6. Skip the remaining steps (SDK setup handled by Capacitor)

### Step 3: Set Up Validation Project

```bash
# Create project directory
mkdir thap-capacitor-validation
cd thap-capacitor-validation

# Initialize Node project
pnpm init

# Install Capacitor and plugins
pnpm add @capacitor/core @capacitor/cli @capacitor/android
pnpm add @capacitor/push-notifications @capacitor/filesystem
pnpm add @capacitor/nfc  # Week 2
pnpm add @capacitor-community/sqlite  # Week 2

# Initialize Capacitor
npx cap init "Thap Validation" "com.thap.validation" --web-dir dist

# Add Android platform
npx cap add android
```

### Step 4: Add Firebase Configuration

```bash
# Copy google-services.json to the Android app directory
cp /path/to/google-services.json android/app/google-services.json
```

### Step 5: Add Firebase to Android Build

Edit `android/app/build.gradle` — add at the bottom:
```gradle
apply plugin: 'com.google.gms.google-services'
```

Edit `android/build.gradle` — add to dependencies:
```gradle
classpath 'com.google.gms:google-services:4.4.0'
```

### Step 6: Build and Sync

```bash
# Build web app
pnpm run build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## Week 1 Day 2: Push Notification Tests

### Test 1: Initialize Push Notifications

```javascript
import { PushNotifications } from '@capacitor/push-notifications';

async function initPush() {
  const result = await PushNotifications.requestPermissions();
  if (result.receive === 'granted') {
    await PushNotifications.register();
  }
  
  PushNotifications.addListener('registration', (token) => {
    console.log('FCM Token:', token.value);
    // Save token — you'll use it to send test notifications
  });
}
```

**Expected result**: FCM token logged to console. Copy this token.

---

### Test 2: Send Test Notification (Foreground)

1. Open Firebase Console → Your project → **Cloud Messaging**
2. Click **Send your first message**
3. Title: `Test Notification`, Body: `Hello from Firebase`
4. Target: **Single device** → paste your FCM token
5. Click **Send**

**Expected result**: Notification appears while app is open.

---

### Test 3: Background Notification

1. Press Home button (app goes to background)
2. Send another test notification from Firebase Console
3. Check notification tray

**Expected result**: Notification appears in system tray.

---

### Test 4: App-Closed Notification

1. Force close the app
2. Send another test notification
3. Check notification tray

**Expected result**: Notification appears even with app closed.

---

### Test 5: Notification Deep Link

```javascript
PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
  const data = action.notification.data;
  if (data.productId) {
    // Navigate to product detail
    console.log('Navigate to product:', data.productId);
  }
});
```

**Expected result**: Tapping notification triggers navigation handler.

---

## Week 1 Day 2: File System Tests

### Test 1: Write File

```javascript
import { Filesystem, Directory } from '@capacitor/filesystem';

async function writeTest() {
  await Filesystem.writeFile({
    path: 'thap-test.txt',
    data: 'Hello from Thap!',
    directory: Directory.Documents,
    encoding: 'utf8',
  });
  console.log('Write: SUCCESS');
}
```

### Test 2: Read File

```javascript
async function readTest() {
  const result = await Filesystem.readFile({
    path: 'thap-test.txt',
    directory: Directory.Documents,
    encoding: 'utf8',
  });
  console.log('Read:', result.data); // Should be "Hello from Thap!"
}
```

### Test 3: List Files

```javascript
async function listTest() {
  const result = await Filesystem.readdir({
    path: '',
    directory: Directory.Documents,
  });
  console.log('Files:', result.files);
}
```

### Test 4: Delete File

```javascript
async function deleteTest() {
  await Filesystem.deleteFile({
    path: 'thap-test.txt',
    directory: Directory.Documents,
  });
  console.log('Delete: SUCCESS');
}
```

---

## Success Criteria — Week 1

Record results in `VALIDATION_LOG.md`.

| Test | Pass Criteria | Result |
|------|--------------|--------|
| Push: Initialize | FCM token received | |
| Push: Foreground | Notification visible | |
| Push: Background | Notification in tray | |
| Push: App closed | Notification in tray | |
| Push: Deep link | Navigation triggered | |
| File: Write | No error thrown | |
| File: Read | Correct content returned | |
| File: List | File appears in list | |
| File: Delete | File removed | |
| Build: APK | APK generated successfully | |

**GO criteria**: 9/10 tests pass  
**NO-GO criteria**: 3+ tests fail, or push notifications fail on all 3 states

---

## Week 2: NFC + Offline Database

*(Proceed only if Week 1 passes)*

### NFC Setup

```bash
pnpm add @capacitor/nfc
npx cap sync android
```

Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

### SQLite Setup

```bash
pnpm add @capacitor-community/sqlite
npx cap sync android
```

See VALIDATION_ROADMAP.md for full Week 2 test plan.

---

## Troubleshooting

### Push notifications not received

1. Verify `google-services.json` is in `android/app/`
2. Check Firebase Console for delivery errors
3. Disable battery optimisation for the app: Settings → Apps → Thap Validation → Battery → Unrestricted
4. Check Logcat in Android Studio for FCM errors

### File system permission denied

1. Grant storage permission manually: Settings → Apps → Thap Validation → Permissions → Storage
2. For Android 11+: use `Directory.Documents` or `Directory.Cache` (scoped storage)

### Build fails

```bash
# Clean and rebuild
cd android && ./gradlew clean assembleDebug
```

Check Java version: `java --version` (must be 17+)

---

## Resources

- Capacitor Docs: https://capacitorjs.com/docs
- Push Notifications Plugin: https://capacitorjs.com/docs/apis/push-notifications
- Filesystem Plugin: https://capacitorjs.com/docs/apis/filesystem
- NFC Plugin: https://github.com/capacitor-community/nfc
- SQLite Plugin: https://github.com/capacitor-community/sqlite
- Firebase Console: https://console.firebase.google.com
