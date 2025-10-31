# CDBL Leave Companion iOS App

A SwiftUI-based iOS companion app for the CDBL Leave Management System. Allows employees to create leave requests offline and export secure JSON/QR packages for email submission.

## 📋 Prerequisites

- **Xcode 16.0+** (latest version recommended)
- **macOS 14.0+** (Sonoma or later)
- **Apple ID** (free account is sufficient for personal device testing)
- **iOS 26.0+** device or simulator (required for Liquid Glass features)

## 🚀 Building & Running

### Step 1: Open Project

1. Navigate to the project directory:
   ```bash
   cd mobile/ios/CDBLLeaveCompanion
   ```

2. Open the Xcode project:
   ```bash
   open CDBLLeaveCompanion.xcodeproj
   ```
   Or double-click `CDBLLeaveCompanion.xcodeproj` in Finder.

### Step 2: Configure Signing

1. In Xcode, select the project in the navigator
2. Select the **CDBLLeaveCompanion** target
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (your Apple ID)
   - If no team appears, click **"Add Account"** and sign in with your Apple ID
   - Free Apple ID works for personal device testing

### Step 3: Select Destination

Choose a simulator or connected device:

- **Simulator**: 
  - Click the device selector at the top (next to the scheme)
  - Choose an iPhone simulator running **iOS 26.0+**
  - Recommended: iPhone 15 Pro (iOS 26) or later for Liquid Glass UI features

- **Physical Device**:
  - Connect your iPhone via USB
  - Trust the computer on your iPhone if prompted
  - Select your device from the device list
  - Ensure your device is registered in your Apple Developer account (automatic with free account)

### Step 4: Build & Run

- Press **⌘R** (Cmd + R) or click the **Play** button
- Xcode will build the app and launch it on your selected device/simulator

### First Launch Notes

- The app generates a device-specific signing key on first launch (stored in Keychain)
- No login or configuration required
- You can start creating leave requests immediately

## 🧪 Testing Email Functionality

### On Simulator

The iOS Simulator **cannot send real emails**. For email testing:

1. Use the **Share Sheet** to save the JSON file to Files app
2. Use **Save to Files** functionality
3. Test on a **physical device** for actual email composition

### On Physical Device

1. Ensure the device has a mail account configured in Settings → Mail
2. The app will use the system Mail app to compose emails
3. Pre-filled recipient: `hr@cdbl.com.bd` (configurable in code)

## 📱 Supported Platforms

- **iPhone**: Full support (primary target)
- **iPad**: Full support with NavigationSplitView layout
- **Mac (via Mac Catalyst)**: Partial support (may require adjustments)

## 🛠️ Project Structure

```
CDBLLeaveCompanion/
├── CDBLLeaveCompanionApp.swift    # App entry point
├── Persistence.swift               # Core Data setup
├── Models/                         # Data models
├── Views/                          # SwiftUI views
├── Services/                       # Business logic
└── UI/                             # Design system
```

See [DOCS.md](./DOCS.md) for detailed architecture documentation.

## 🔧 Troubleshooting

### Build Errors

1. **"No such module 'SwiftUI'"**
   - Ensure you're using Xcode 16.0+
   - Clean build folder: **Product → Clean Build Folder** (⇧⌘K)

2. **"Signing requires a development team"**
   - Go to Signing & Capabilities
   - Add your Apple ID as a team
   - Free account works for personal devices

3. **"App installation failed"**
   - For physical devices: Trust your developer certificate in Settings → General → VPN & Device Management
   - For simulators: Reset the simulator (Device → Erase All Content and Settings)

### Runtime Issues

1. **Email composer doesn't appear**
   - Check that Mail app is configured on device
   - On simulator, use Share Sheet instead

2. **Core Data errors**
   - Delete the app and reinstall
   - Core Data stores are cleared on app deletion

## 📦 Dependencies

This project uses **zero external dependencies**. All functionality is provided by:

- SwiftUI
- CoreData
- CoreImage
- CryptoKit
- MessageUI
- Foundation

## 🔮 Future Expansion Notes

### Skip Framework (Swift → Android)

The codebase is structured to be compatible with [Skip](https://skiplang.com/):

- Pure SwiftUI (no UIKit dependencies)
- Standard Foundation APIs
- Core Data can be replaced with Skip's SQLite wrapper

To add Skip support:
1. Add Skip plugin to Xcode project
2. Replace Core Data with Skip's persistence layer
3. Test Android build

### Flutter Alternative

If migrating to Flutter:

- Models translate directly (Dart classes)
- Services map to Dart functions/classes
- Core Data → Hive/SQLite/Drift

### React Native Alternative

If migrating to React Native:

- Models → TypeScript interfaces
- SwiftUI views → React Native components
- Services → JavaScript modules
- Core Data → AsyncStorage/Realm

## 📄 License

Internal use only - CDBL Leave Management System.

## 🤝 Support

For issues or questions:
1. Check [DOCS.md](./DOCS.md) for architecture details
2. Review error messages in Xcode console
3. Ensure iOS version compatibility (iOS 26.0+ required for Liquid Glass features)

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Minimum iOS**: 17.0  
**Target iOS**: 26.0+ (Liquid Glass support)

