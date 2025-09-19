# CoffeeShop React Native App – In‑Depth Guide

A learning-focused React Native application demonstrating end-to-end mobile app concepts: environment setup (Android Studio + Xcode), app bootstrapping, core components and styling, navigation patterns, state management, Firebase (Auth + FCM), permissions, assets, theming, and build/release.


## 1) Prerequisites and Environment Setup

- macOS with Homebrew
- Android Studio (Android SDK + Emulator), Xcode (for iOS builds), Java 17 (Zulu)
- Node.js, Watchman

```bash
# Core tooling
brew install node
brew install watchman

# Java 17 (Zulu)
brew install --cask zulu@17
brew info --cask zulu@17  # note version printed
open /opt/homebrew/Caskroom/zulu@17/<version number>

# Verify Android/Xcode installations manually after installing from their websites
```

Recommended: Run the official guide once: https://reactnative.dev/docs/set-up-your-environment

Environment variables (Android):
```bash
# ~/.zshrc (example)
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH"
```
Reload your shell after editing.

Health check:
```bash
npx react-native doctor
```


## 2) Project Creation Options

- Native CLI:
```bash
npx @react-native-community/cli init CoffeeShop
```
- Expo (alternative):
```bash
npx create-expo-app@latest coffeeshop --template blank@sdk-49
```
This repository uses the Native CLI path.


## 3) Getting Started (this repo)

Install dependencies and start Metro:
```bash
# from project root
npm install
npm start  # or: yarn start
```

Run Android:
```bash
npm run android  # or: yarn android
```

Run iOS:
```bash
gem install bundler  # once
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios  # or: yarn ios
```

Clean Android build if needed:
```bash
cd android && ./gradlew clean && cd ..
```


## 4) Android/iOS Native Configuration Notes

- Enable React Native Screens optimization (Android): edit `android/app/src/main/java/<your package>/MainActivity.java`:
```java
import android.os.Bundle;

@Override
protected void onCreate(Bundle savedInstanceState) {
  super.onCreate(null);
}
```
- Portrait-only (Android): set orientation in `AndroidManifest.xml` for the main activity.
- iOS pods: always run `bundle exec pod install` after native dependency changes.


## 5) Assets and Linking

Place images/fonts in `src/assets`.

`react-native.config.js` is configured to link assets:
```js
module.exports = {
    project: { ios: {}, android: {} },
    assets: ['./coffeeShop/src/assets'],
};
```
Link once:
```bash
npx react-native-asset
```


## 6) Project Structure (src/)

- `components/`: Small presentational units (buttons, cards, etc.).
- `screens/`: Screen-level containers; each fills the viewport.
- `navigators/`: Stack/Tab navigators.
- `store/`: Global state (Zustand), Immer for immutable updates, persistence with AsyncStorage.
- `contexts/`: React contexts (if used alongside Zustand for scoped state).
- `auth/`: Authentication logic (Firebase Auth + Google Sign-In).
- `firestore/`: Firestore queries/data shapes (if used).
- `permissions/`: Permission handling helpers (camera, storage, notifications).
- `pushNotification/`: FCM setup and handlers.
- `theme/`: Colors, typography, spacing, and theming helpers.
- `data/`: Static or seed data.
- `lottie/`: Lottie animation JSON files.

Guideline: screens orchestrate data and pass props to presentational components. Keep separation of concerns.


## 7) Core React Native Concepts (with CoffeeShop context)

- View: rectangular container for layout, touch, accessibility (similar to `<div>`).
- Text: display text.
- Image: display images; for remote: `{ uri: 'https://...' }` with explicit width/height.
- ImageBackground: background images for containers.
- ScrollView: scrollable content; ensure bounded height in parent layout.
- Button: simple pressable; for flexible control prefer `Pressable`.
- Pressable: detect `onPress`, `onPressIn`, `onPressOut`, `onLongPress`.
- Modal: overlay UI for dialogs/flows (`animationType`, `presentationStyle`).
- StatusBar: control bar style/color/visibility.
- ActivityIndicator: loading spinner; use sparingly.
- Alert: native alert dialogs for simple confirmations.

Styling and Box Model:
- Use `StyleSheet.create` or inline styles (camelCase). Multiple styles array: last wins.
- Box Model: margin > border > padding > content.
- Shadows: iOS: `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`; Android: `elevation`.

Layout with Flexbox:
- `flexDirection`: row/column, `justifyContent` (main axis), `alignItems` (cross axis), `alignSelf` per-item.
- `flex`, `flexGrow`, `flexShrink`, `flexBasis`, `flexWrap`, `alignContent`.
- Positioning: `position: 'relative' | 'absolute'`; use absolute for overlays/precise placement.

Platform/Dimensions/Safe Areas:
- `Platform.OS` for minor diffs; `Platform.select` for larger diffs.
- Platform files: `Component.ios.tsx`, `Component.android.tsx` for major divergence.
- `Dimensions` (static) vs `useWindowDimensions` (reactive) for layout; prefer the hook for rotation.
- `SafeAreaView` to avoid notches/home indicators.


## 8) Navigation (React Navigation)

Install:
```bash
npm install @react-navigation/native
npm install react-native-screens react-native-safe-area-context
npm install @react-navigation/native-stack
npm install @react-navigation/bottom-tabs
```
Android requires `MainActivity` `onCreate(null)` (see above) for proper screen behavior.

Patterns used:
- Stack Navigation (auth flow, detail screens)
- Tab Navigation (primary app sections)

Keep navigators in `src/navigators/`, define screen params/types, and wrap app with `NavigationContainer`.


## 9) State Management and Persistence

- Zustand: simple global store for cross-screen state.
- Immer: immutable updates for nested structures.
- AsyncStorage: persistence layer for user/session/preferences.

Example concepts:
- Create stores in `src/store/`, export hooks (e.g., `useCartStore`) with actions/selectors.
- Persist slices using `zustand/middleware` + AsyncStorage.


## 10) Permissions

Centralized helpers under `src/permissions/` to request and check runtime permissions (camera, photos, notifications, etc.).
- Android specifics: declare in `AndroidManifest.xml`.
- iOS specifics: add usage descriptions to `Info.plist` (e.g., `NSCameraUsageDescription`).

Docs: https://reactnative.dev/docs/permissionsandroid


## 11) Firebase Authentication (Email/Google)

Create a Firebase project, then:
```bash
cd android && ./gradlew signinReport && cd ..
```
Copy SHA-1 and SHA-256 (debug) into Firebase Android app settings. Download `google-services.json` → place in `android/app/`.

Install packages:
```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin
```

Android Gradle setup:
- Project `android/build.gradle`: add Google services classpath if not present.
- App `android/app/build.gradle`: apply `com.google.gms.google-services` plugin.

Implement Google Sign-In in `src/auth/` and wire into your auth stack. Ensure reverse client id and URL schemes for iOS if adding iOS Google Sign-In later.

Docs: https://rnfirebase.io/auth/usage


## 12) Push Notifications (Firebase Cloud Messaging)

- Use FCM for device tokens and message handling under `src/pushNotification/`.
- Configure Firebase for Cloud Messaging; for iOS, request APNs permissions and upload APNs key to Firebase.
- Background/terminated handlers need native setup; follow RNFirebase Messaging docs.

Docs: https://rnfirebase.io/messaging/usage


## 13) Theming, Lottie, and UI Enhancements

- `react-native-linear-gradient` for gradients.
- `@react-native-community/blur` for blur effects.
- `lottie-react-native` for animations (files in `src/lottie`).
- `react-native-vector-icons` (types via `@types/react-native-vector-icons`).

Install:
```bash
npm install react-native-linear-gradient @react-native-community/blur lottie-react-native @react-native-async-storage/async-storage zustand immer
npm i --save-dev @types/react-native-vector-icons
```


## 14) Build and Release

Android (APK/AAB):
- Generate a release keystore and configure `gradle.properties`.
- Build:
```bash
cd android
./gradlew assembleRelease      # APK
./gradlew bundleRelease        # AAB (Play Store)
cd ..
```

iOS (.ipa):
- Use Xcode: set scheme to Release, archive, then export .ipa via Organizer.
- Or use `fastlane` (optional) for automation.


## 15) Troubleshooting

- Run `npx react-native doctor` to verify environment.
- If Android build is stuck: `cd android && ./gradlew clean && cd ..`.
- Clear Metro cache: `rm -rf $TMPDIR/metro-cache && rm -rf node_modules && npm i`.
- iOS pod issues: `cd ios && pod repo update && bundle exec pod install && cd ..`.
- Emulator not launching: ensure HAXM/Arm virtualization, cold boot device.


## 16) Capability Matrix (Learning Tracker)

| Category | Capability/Feature | Description | Official Docs/Resources | Completed | Notes | Column 1 |
|---|---|---|---|---|---|---|
| React Native Core Features | UI/UX | Understand core components (View, Text, Image) and Flexbox layouts. | https://reactnative.dev/docs/getting-started | TRUE |  |  |
| React Native Core Features | State Management | Manage data via hooks (useState/useContext) or libraries. | https://medium.com/@ahmad.almezaal/understanding-state-management-in-react-native-a-deep-dive-into-redux-and-redux-toolkit-0d89e6c223f2 | FALSE | MST, context, Redux |  |
| React Native Core Features | Navigation | Screen transitions with React Navigation. | https://docs.sentry.io/platforms/react-native/tracing/instrumentation/react-native-navigation/ | TRUE | Tab + Stack |  |
| Essential Modules & Functionalities | Authentication | Firebase Authentication (email/Google). | https://rnfirebase.io/auth/usage | TRUE | Firebase Auth |  |
| Essential Modules & Functionalities | Push Notifications | Firebase Cloud Messaging (FCM). | https://rnfirebase.io/messaging/usage | TRUE | FCM |  |
| Essential Modules & Functionalities | File & Media Sharing | Share content to other apps. | https://www.npmjs.com/package/react-native-share | FALSE |  |  |
| Essential Modules & Functionalities | Video Streaming | Video playback (local/remote). | https://github.com/react-native-video/react-native-video | FALSE |  |  |
| Essential Modules & Functionalities | Permissions | Manage runtime permissions. | https://reactnative.dev/docs/permissionsandroid | TRUE |  |  |
| Essential Modules & Functionalities | App Optimization & Security | Optimize size (R8/ProGuard), security best practices. | https://metadesignsolutions.com/security-best-practices-in-react-native-development/ | FALSE |  |  |
| Essential Modules & Functionalities | Library Integrations | Integrate third-party libraries. | https://www.intuz.com/blog/react-native-libraries-for-cross-platform-development | FALSE |  |  |
| Essential Modules & Functionalities | Third Party API Integrations | Integrate external APIs. |  | FALSE |  |  |
| Essential Modules & Functionalities | Build, Convert to .apk / .ipa | Release builds for Android/iOS. |  | FALSE |  |  |


## 17) Tools and References

- Splash screen: `react-native-splash-screen` (assets: 4096×4096 recommended). Video: https://www.youtube.com/watch?v=_hgsAlPTGXY
- Guide: https://github.com/crazycodeboy/react-native-splash-screen
- Icons: IconKitchen for asset generation


## 18) Command Reference (Quick)

```bash
# Start
npm start

# Run Android / iOS
npm run android
npm run ios

# Health
npx react-native doctor

# Android clean
cd android && ./gradlew clean && cd ..

# Pods
cd ios && bundle exec pod install && cd ..

# Link assets (once)
npx react-native-asset
```


## 19) What to Explore Next

- Add File/Media sharing, video playback to complete matrix
- Add optimization and security hardening (ProGuard/R8 rules, code push, obfuscation)
- Add third-party API examples (REST + OAuth)


—
This README is tailored to this repository’s structure under `src/` and captures the learning flow from setup → concepts → modules → build/release. Adjust the matrix as you complete items.
