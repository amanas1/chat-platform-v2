# iOS Wrapper Setup Instructions

## 1. Create Xcode Project
1. Open Xcode → File → New → Project
2. Choose "App" template
3. Product Name: `StreamFlow`
4. Bundle Identifier: `com.streamflow.radio`
5. Interface: **Storyboard**
6. Language: **Swift**
7. Save to `ios-wrapper/`

## 2. Replace ViewController.swift
- Copy contents from `ios-wrapper/ViewController.swift`
- Update production URL in `viewDidLoad()`

## 3. Configure Info.plist
Add these keys:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>

<key>NSMicrophoneUsageDescription</key>
<string>StreamFlow needs microphone access for voice chat features</string>

<key>NSCameraUsageDescription</key>
<string>StreamFlow needs camera access to share photos in chat</string>

<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

## 4. Generate App Icons
Use https://appicon.co or similar:
- Upload 1024x1024 icon
- Download Xcode asset catalog
- Add to Assets.xcassets/AppIcon.appiconset

## 5. Build
1. Select target device
2. Product → Archive
3. Distribute → App Store Connect

## 6. App Store Submission
- Privacy Policy URL required
- Screenshots for all device sizes
- Explain WebView usage in review notes
