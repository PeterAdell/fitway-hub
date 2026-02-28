/**
 * SETUP_GUIDE.md
 * 
 * Step-by-step integration guide for adding the offline step tracker to your existing React Native project.
 */

# Offline Step Tracker Integration Guide

This guide shows how to integrate the step tracker module into an existing React Native project.

## Step 1: Copy the Module Files

```bash
# Copy the entire RN_STEP_TRACKER directory to your project
cp -r RN_STEP_TRACKER/ /path/to/your/project/

# Or: merge individual files into your project structure:
# - src/hooks/useStepTracker.ts
# - src/components/StepTrackerScreen.tsx
# - src/utils/storageManager.ts
# - android/app/src/main/java/com/fitway/steps/*.kt
# - ios/StepCounterModule.swift
```

## Step 2: Install Dependencies

```bash
cd /path/to/your/project

npm install react-native-maps react-native-geolocation-service @react-native-async-storage/async-storage react-native-permissions react-native-sensors

# iOS only: update Pods
cd ios && pod install && cd ..
```

## Step 3: Android Configuration

### Update AndroidManifest.xml

Add permissions (before `<application>` tag):

```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.BODY_SENSORS" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.INTERNET" />
```

Add service declaration (inside `<application>` tag):

```xml
<service
  android:name=".steps.StepCounterService"
  android:enabled="true"
  android:exported="false"
  android:foregroundServiceType="location" />
```

### Update build.gradle

```gradle
dependencies {
  implementation 'androidx.localbroadcastmanager:localbroadcastmanager:1.1.0'
  implementation 'com.facebook.react:react-native-maps:1.7.1'
}
```

### Register Native Module

**Option A: Autolinking (RN 0.60+)** — Should work automatically; no additional steps.

**Option B: Manual Registration** — Edit `android/app/src/main/java/.../MainApplication.java`:

```java
import com.fitway.steps.StepCounterPackage;

public class MainApplication extends Application implements ReactApplication {
  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.asList(
      new MainReactPackage(),
      new StepCounterPackage() // Add this
    );
  }
}
```

## Step 4: iOS Configuration

### Update Info.plist

Add permission keys:

```xml
<key>NSMotionUsageDescription</key>
<string>We use your device's motion sensors to count your steps.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We use your location to map your route and measure distance.</string>
```

### Xcode Project Setup

1. Open `ios/{YourApp}.xcodeproj` in Xcode
2. Add `StepCounterModule.swift` to your project:
   - Right-click on project → Add Files to "{YourApp}"
   - Select `apple/StepCounterModule.swift`
   - Choose targets and click Add

3. If mixing Objective-C and Swift:
   - Create a bridging header (see Xcode prompts)
   - Or add to Build Settings: `Bridging Header = {YourApp}/{YourApp}-Bridging-Header.h`

4. Update Podfile if needed for map dependencies:

```ruby
target '{YourApp}' do
  # ... existing pods ...
  pod 'react-native-maps'
end
```

Then run `pod install`.

## Step 5: Use in Your app

### Option A: Use the Pre-Built Component

```tsx
import StepTrackerScreen from './src/components/StepTrackerScreen';

export default function App() {
  return <StepTrackerScreen />;
}
```

### Option B: Use the Hook Directly

```tsx
import { useStepTracker } from './src/hooks/useStepTracker';
import { Button, Text, View } from 'react-native';

function MyTrackerScreen() {
  const {
    isTracking,
    stepsSinceStart,
    startTracking,
    stopTracking,
  } = useStepTracker();

  return (
    <View>
      <Text>Steps: {stepsSinceStart}</Text>
      <Button
        title={isTracking ? 'Stop' : 'Start'}
        onPress={isTracking ? stopTracking : startTracking}
      />
    </View>
  );
}
```

## Step 6: Test

### Android

```bash
npm run android

# Check logs
adb logcat *:S StepCounter:D
```

### iOS

```bash
npm run ios

# Check Console output in Xcode
```

On real devices:
1. Tap app → request permissions (grant all)
2. Tap "Start Tracking"
3. Take 5-10 steps → step counter should update
4. Walk around for 1-2 minutes → GPS points appear on map
5. Tap "Stop Tracking" → session saved

## Troubleshooting

### "Couldn't find native module"

- **Android:** Verify `StepCounterPackage` is in `getPackages()`
- **iOS:** Verify `StepCounterModule.swift` is added to target

### "Permission denied"

- **Android:** Run `adb shell pm grant <your-package> android.permission.ACTIVITY_RECOGNITION`
- **iOS:** Check Privacy → Motion in Settings after first run

### "Step counter not updating"

- Test on a real device (emulators don't have step sensors)
- Physically walk a few steps
- Check native logs for errors

### "GPS not showing"

- Ensure location permission is granted (When in Use)
- GPS takes time to lock; move outdoors
- Check `gpsMinDistanceM` isn't too high

## Next Steps

- Review [README.md](../README.md) for full feature documentation
- Review [DEV_NOTES.md](../DEV_NOTES.md) for technical deep dives
- Customize the UI and theme to match your app
- Add cloud sync (optional) using React Native's AsyncStorage + your backend

---

**Questions?** Check the troubleshooting section in README.md or review the inline code comments.
