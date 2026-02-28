# Offline Step Tracker for React Native

**One-Minute Summary:**
A fully offline pedometer + GPS route tracker for iOS & Android. Uses device sensors (no Google Fit/HealthKit), all data stored locally. Start tracking with one button; works in foreground and partially in background.

---

## Features

✅ **Offline-first**: All step counting and GPS tracking works without internet  
✅ **Device sensors only**: No Google Fit, HealthKit, or paid APIs  
✅ **Real-time step counter**: Uses TYPE_STEP_COUNTER (Android) and CMPedometer (iOS)  
✅ **GPS route mapping**: Polyline visualization of your running/walking path  
✅ **Local persistence**: All data saved to device storage (AsyncStorage)  
✅ **Reboot resilient**: Detects device reboot and reconciles step counts  
✅ **Minimal battery drain**: Batched GPS writes, optimized sensor sampling  
✅ **No telemetry**: Privacy-first; data never leaves your device unless you export it  

---

## Architecture

```
React Native (TypeScript/JS)
    ├─ StepTrackerScreen (UI: buttons, map, stats)
    └─ useStepTracker Hook (logic)
        ├─ storageManager (AsyncStorage persistence)
        ├─ Native Bridge (Android/iOS)
        │   ├─ Android: StepCounterModule.kt + StepCounterService.kt (foreground service)
        │   └─ iOS: StepCounterModule.swift (CMPedometer)
        └─ Geolocation Service (GPS tracking)
            └─ react-native-geolocation-service

All data stored locally:
    └─ AsyncStorage: Sessions, step totals, route points (JSON)
```

---

## Installation

### 1. Prerequisites

- React Native 0.73+ (or compatible version)
- Android SDK 21+ (API 21+) for Android
- Xcode 14+ and iOS 12+ for iOS
- Git and npm/yarn

### 2. Install Dependencies

```bash
cd RN_STEP_TRACKER

npm install
# or
yarn install

# Install React Native Pods (iOS)
cd ios && pod install && cd ..
```

### 3. Android Setup

#### Add to `android/app/build.gradle`:
```gradle
dependencies {
    // Existing dependencies...
    implementation 'androidx.localbroadcastmanager:localbroadcastmanager:1.1.0'
}
```

#### Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Inside <manifest> tag, before <application> -->
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.BODY_SENSORS" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

<!-- Inside <application> tag -->
<service
  android:name=".steps.StepCounterService"
  android:enabled="true"
  android:exported="false"
  android:foregroundServiceType="location" />
```

#### Register the Module (if not using autolinking):

In `android/app/src/main/java/com/yourcompany/MainApplication.java`:

```java
import com.fitway.steps.StepCounterPackage;

public class MainApplication extends Application implements ReactApplication {
  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.asList(
      new MainReactPackage(),
      new StepCounterPackage() // Add this line
      // ... other packages
    );
  }
}
```

### 4. iOS Setup

#### Update `ios/{YourApp}/Info.plist`:

```xml
<!-- Motion/Pedometer permission -->
<key>NSMotionUsageDescription</key>
<string>We use your device's motion sensors to count your steps.</string>

<!-- Location permission -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>We use your location to map your route and show distance traveled.</string>
```

#### Swift Module Bridging (if Objective-C bridge missing):

Create `ios/{YourApp}/{YourApp}-Bridging-Header.h`:

```objc
//
//  {YourApp}-Bridging-Header.h
//

#ifndef {YourApp}_Bridging_Header_h
#define {YourApp}_Bridging_Header_h

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#endif /* {YourApp}_Bridging_Header_h */
```

---

## Usage

### Basic Example

```tsx
import React from 'react';
import StepTrackerScreen from './src/components/StepTrackerScreen';

export default function App() {
  return <StepTrackerScreen />;
}
```

### Hook API (Advanced)

```tsx
import { useStepTracker } from './src/hooks/useStepTracker';

function MyComponent() {
  const {
    isTracking,
    stepsSinceStart,
    distanceKm,
    routePoints,
    startTracking,
    stopTracking,
    exportData,
  } = useStepTracker();

  return (
    <>
      <Text>Steps: {stepsSinceStart}</Text>
      <Text>Distance: {distanceKm.toFixed(2)} km</Text>
      <Button title={isTracking ? 'Stop' : 'Start'} onPress={isTracking ? stopTracking : startTracking} />
      <Button title="Export" onPress={exportData} />
    </>
  );
}
```

---

## Permissions

### Android Permissions

| Permission | Why | Required |
|-----------|-----|----------|
| ACTIVITY_RECOGNITION | Access step counter sensor | Yes (Android 10+) |
| BODY_SENSORS | Low-level sensor access | Yes (paired with ACTIVITY_RECOGNITION) |
| ACCESS_FINE_LOCATION | High-precision GPS for routes | Yes (if using GPS) |
| FOREGROUND_SERVICE | Run service with notification | Yes (for background tracking) |

**Note:** Android 13+ requires runtime permission requests. The hook handles this via `react-native-permissions`.

### iOS Permissions

| Key | Why | Required |
|-----|-----|----------|
| NSMotionUsageDescription | Access CMPedometer | Yes |
| NSLocationWhenInUseUsageDescription | GPS tracking | Yes (if using GPS) |
| NSLocationAlwaysAndWhenInUseUsageDescription | Background location (optional) | No |

**Note:** iOS shows permission dialogs on first use. Users must grant permission for tracking to work.

---

## Testing

### Android

#### Real Device

```bash
# Build and deploy to Android device
npm run android

# Check logcat for errors
adb logcat | grep StepCounter
```

#### Simulator

⚠️ **Emulators rarely have working step sensors.** For testing:
1. Use a **real Android device** if possible
2. Or use Android Device Monitor to simulate sensor events

### iOS

#### Real Device

```bash
# Build and deploy to iPhone
npm run ios

# Check Console.app for logs
```

#### Simulator

⚠️ **Simulators do NOT have motion sensors.** To test:
1. Use a **real iPhone** if possible
2. Or implement a mock sensor in development (set `useFallbackAccelerometer: true`)

### Manual Testing Checklist

- [ ] On real device, tap "Start Tracking"
- [ ] Step counter updates in real-time (Android/iOS)
- [ ] GPS points appear on map (may take ~1 min for first point)
- [ ] Tap "Stop Tracking" → session saved
- [ ] Kill and restart app → previous sessions in history
- [ ] Export button generates JSON/CSV
- [ ] Background: step listener should continue (Android foreground service)
- [ ] App resume: step counter is reconciled (no jumps or loss)

---

## Troubleshooting

### "Step counter not updating"

**Cause:** Device doesn't have a step sensor, or permissions denied  
**Fix:**
1. Check Android/iOS permissions are granted (Settings → Permissions)
2. Override `useFallbackAccelerometer: true` in `useStepTracker()` config to use accelerometer-based fallback
3. Test on real device (emulators lack step sensors)
4. Check native logs: `adb logcat` (Android) or Xcode Console (iOS)

### "GPS points not appearing"

**Cause:** Geolocation permission denied, or no GPS lock  
**Fix:**
1. Grant Location permission (When Using App)
2. Ensure GPS is enabled on device
3. Go outside or use a location simulator (GPS takes time to lock)
4. Check `gpsMinDistanceM` config isn't too high (default: 5m)

### "App crashed on startup"

**Cause:** Missing native module registration or incorrect permissions  
**Fix:**
1. Verify `StepCounterPackage` is registered in MainApplication (Android)
2. Verify Info.plist keys are correctly formatted (iOS)
3. Run `npm run build:android` or `npm run build:ios` to check for compile errors

### "Sessions not persisting"

**Cause:** AsyncStorage not initialized or permission denied  
**Fix:**
1. Check `@react-native-async-storage/async-storage` is installed
2. Verify app has WRITE_EXTERNAL_STORAGE (Android) if writing to SD card
3. Check device storage isn't full

### "Foreground service notification shows, then disappears (Android)"

**Cause:** Notification not properly created or service killed by OS  
**Fix:**
1. Verify NotificationChannel is created (code includes this)
2. Ensure service has `android:persistent="false"` removed (code has this)
3. Check device power-saving settings aren't killing foreground services

### Step count resets on device reboot

**Expected behavior:** Step counter resets on reboot. We reconcile this in the JS layer by:
1. Storing the last-known device step total in AsyncStorage
2. Detecting when new total < last total (indicates reboot)
3. Adding the delta to the current session

If not reconciling, check:
- `useStepTracker.syncOnResume()` is called on app resume
- `AppState` listener is registered (code includes this)

---

## Performance & Battery

### Optimization Tips

1. **Increase GPS interval** if you don't need real-time accuracy:
   ```ts
   useStepTracker({ gpsIntervalMs: 10000 }); // 10s instead of 5s
   ```

2. **Increase minimum distance** to filter GPS noise:
   ```ts
   useStepTracker({ gpsMinDistanceM: 20 }); // 20m instead of 5m
   ```

3. **Batch writes** to AsyncStorage:
   ```ts
   useStepTracker({ batchWriteIntervalMs: 30000 }); // 30s instead of 10s
   ```

4. **Disable fallback accelerometer** if not needed:
   ```ts
   useStepTracker({ useFallbackAccelerometer: false });
   ```

### Battery Impact

- **Step sensor:** ~1% per 24h (very low-power, OS-level)
- **GPS sampling (5s interval):** ~5-10% per hour (high depending on screen-on time)
- **AsyncStorage writes:** Negligible if batched

**Recommendation:** Use 10-30s GPS intervals for long tracking sessions.

---

## Privacy & Security

✅ **Zero cloud upload:** All data is stored locally on the device  
✅ **No telemetry:** No tracking, analytics, or third-party integrations  
✅ **Open-source:** Review the code; no hidden behaviors  
✅ **Export-only sharing:** Users explicitly choose to export data

**Recommendation:** Inform users that:
- Data is never sent to external servers
- GPS coordinates are stored locally and can be sensitive
- Only export data with explicit user consent

---

## Extending the Module

### Add a Custom Sensor

Edit `src/hooks/useStepTracker.ts`:

```ts
const startCustomSensor = () => {
  // Listen to accelerometer, gyro, etc.
  // Update state and batched writes
};
```

### Add Metrics Calculation

Edit `src/utils/stepCalculations.ts`:

```ts
// Compute MET, VO2 max, pace, elevation change, etc.
export function calculateAdvancedMetrics(steps: number, distance: number, ...) {
  // ...
}
```

### Integrate with External DB

Instead of AsyncStorage, use `react-native-sqlite-storage` or Firebase (with offline mode):

```ts
// In useStepTracker.ts replace persistSessionProgress:
const persistSessionProgress = async () => {
  // store to SQLite instead of AsyncStorage
  await db.insert('step_sessions', sessionRef.current);
};
```

---

## Known Limitations

1. **iOS background tracking:** iOS restricts background motion access unless using `BackgroundModes/location`. We opt out to save battery and respect user privacy. On resume, `queryPedometerData()` fetches historical steps to fill gaps.

2. **Android step counter resets on reboot:** Mitigation is in the JS layer. If the delta computation seems off, increase the polling frequency or add debug logs.

3. **Emulator step sensors:** Most emulators don't properly simulate step counter events. Always test on real devices.

4. **GPS accuracy:** Outdoor GPS can be ±5-10m. Reduce `gpsMinDistanceM` for high-resolution routes, but expect more noise.

5. **No Apple HealthKit integration:** By design (to keep open-source). If you need HealthKit sync, add it separately via a different native module.

---

## Building for Production

### Android

```bash
cd android
./gradlew assembleRelease
# APK in: android/app/build/outputs/apk/release/app-release.apk
```

### iOS

```bash
xcodebuild -workspace ios/RNStepTracker.xcworkspace \
  -scheme RNStepTracker \
  -configuration Release \
  -archivePath build/RNStepTracker.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/RNStepTracker.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/ipa
```

---

## Contributing

To improve this module:

1. Open an issue describing the feature or fix
2. Create a PR with tests (see `tests/` directory)
3. Ensure all native code compiles without warnings
4. Update this README if adding new features or permissions

---

## License

MIT License — feel free to use, modify, and distribute.

---

## Support

For issues, questions, or suggestions:

1. Check the **Troubleshooting** section above
2. Review the inline code comments (heavily documented)
3. Check native logs: `adb logcat` (Android) or Xcode Console (iOS)
4. Consult the `DEV_NOTES.md` for deep technical details

**Happy tracking! 🚀**
