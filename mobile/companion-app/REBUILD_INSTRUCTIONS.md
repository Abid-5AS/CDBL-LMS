# Native Module Fix - Complete Rebuild Instructions

## Problem Summary

You were experiencing persistent errors:
- `Cannot find native module 'ExpoDocumentPicker'`
- `Cannot find native module 'ExpoPushTokenManager'`
- Route warnings about missing default export

## Root Cause

These native modules require native code to be built into the app. They cannot run in Expo Go. The native iOS/Android folders were not generated, so the modules weren't linked.

## What Was Done

1. ✅ Cleaned all caches (npm, Expo, Metro)
2. ✅ Reinstalled dependencies
3. ✅ Generated native iOS/Android folders using `expo prebuild`
4. ✅ Native modules are now properly configured

## Next Steps (REQUIRED - Run on Your Mac)

### For iOS Development:

1. **Navigate to the mobile app directory:**
   ```bash
   cd /path/to/CDBL-LMS/mobile/companion-app
   ```

2. **Install CocoaPods dependencies (REQUIRED for iOS):**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Clean Xcode build (if you have Xcode):**
   ```bash
   # Optional but recommended
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

4. **Build and run the development client:**
   ```bash
   npx expo run:ios
   ```

   Or to run on a specific device:
   ```bash
   npx expo run:ios --device
   ```

### For Android Development:

1. **Navigate to the mobile app directory:**
   ```bash
   cd /path/to/CDBL-LMS/mobile/companion-app
   ```

2. **Clean Android build:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

3. **Build and run the development client:**
   ```bash
   npx expo run:android
   ```

## Important Notes

### ⚠️ Do NOT Use Expo Go

Expo Go does not support custom native modules like:
- `expo-document-picker`
- `expo-notifications`

You MUST use a **development build** (which is what `expo run:ios` creates).

### ⚠️ If Errors Persist After Following Steps Above

Try this complete nuclear clean and rebuild:

```bash
# 1. Stop all Metro/Expo processes
pkill -9 node

# 2. Clean everything
rm -rf node_modules package-lock.json
rm -rf ios android .expo
npx expo start --clear # Start and immediately stop (Ctrl+C)

# 3. Reinstall
npm install

# 4. Prebuild
npx expo prebuild --clean

# 5. Install iOS pods (on Mac only)
cd ios && pod install && cd ..

# 6. Run the app
npx expo run:ios
# OR
npx expo run:android
```

### ⚠️ If You See "Watchman" Errors

```bash
watchman watch-del-all
```

### ⚠️ If You See "Port Already in Use"

```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or kill all node processes
pkill -9 node
```

## Understanding Development Builds

- **Expo Go**: Pre-built app with limited native modules
- **Development Build**: Custom built app with ALL your native modules

You're now using a development build, which gives you:
- ✅ Full access to native modules
- ✅ Custom native code support
- ✅ Better debugging capabilities

## Verification

After rebuilding, you should see:
- ✅ No "Cannot find native module" errors
- ✅ Document picker works when tapping "Attach Certificate"
- ✅ Push notifications initialize properly
- ✅ All routes load correctly

## File Structure

Your project now has:
```
mobile/companion-app/
├── ios/                    # Native iOS code (generated)
│   ├── Podfile            # CocoaPods dependencies
│   └── companionapp.xcodeproj
├── android/                # Native Android code (generated)
│   ├── build.gradle
│   └── app/
├── app/                    # Your React Native code
├── src/                    # Source code
└── package.json
```

## Common Questions

**Q: Do I need to commit ios/ and android/ folders?**
A: No, they're gitignored. They can be regenerated with `expo prebuild`.

**Q: How do I update native dependencies in the future?**
A: After adding a new native module:
```bash
npm install <package>
npx expo prebuild --clean
cd ios && pod install && cd ..
npx expo run:ios
```

**Q: Can I switch back to Expo Go?**
A: Not with these native modules. You need a development build.

## Support

If you still encounter issues:
1. Check expo logs: `npx expo start`
2. Check native logs: `npx expo run:ios` (shows Xcode errors)
3. Verify all dependencies: `npx expo-doctor`

---

**Status:** ✅ Native folders generated and ready for build
**Next:** Run `pod install` in the ios/ folder on your Mac, then build with `expo run:ios`
