# FlowForge App Store Screenshots

This directory contains screenshots for both iOS App Store and Google Play Store submissions.

## iOS Screenshots (en-US/)

### iPhone Screenshots
Required sizes for iPhone 8 Plus (1242 x 2208):
- `iPhone8Plus-1_dashboard.png` - Main dashboard view
- `iPhone8Plus-2_session_tracking.png` - Session tracking interface
- `iPhone8Plus-3_ai_context_health.png` - AI context health monitoring
- `iPhone8Plus-4_flow_analytics.png` - Flow analytics dashboard
- `iPhone8Plus-5_habit_tracking.png` - Habit tracking system

### iPad Screenshots
Required sizes for iPad Pro 12.9" (2048 x 2732):
- `iPadPro129-1_dashboard.png` - Tablet dashboard view
- `iPadPro129-2_analytics_overview.png` - Analytics overview

## Android Screenshots (android/en-US/)

### Phone Screenshots
Required sizes: 1080 x 1920 minimum
- `phoneScreenshots/1_dashboard.png` - Main dashboard
- `phoneScreenshots/2_session_tracking.png` - Session tracking
- `phoneScreenshots/3_ai_monitoring.png` - AI context monitoring
- `phoneScreenshots/4_productivity_metrics.png` - Productivity metrics
- `phoneScreenshots/5_habit_system.png` - Habit tracking

### Tablet Screenshots
Required sizes: 1536 x 2048 minimum
- `tabletScreenshots/1_tablet_dashboard.png` - Tablet dashboard
- `tabletScreenshots/2_tablet_analytics.png` - Tablet analytics

## Generating Screenshots

### Automated Screenshot Generation

Use Fastlane Snapshot for iOS:
```bash
fastlane snapshot
```

Use Fastlane Screengrab for Android:
```bash
fastlane screengrab
```

### Manual Screenshot Capture

1. Build the app on target devices/simulators
2. Navigate to each key screen
3. Capture screenshots at required resolutions
4. Apply any branding or text overlays
5. Save with appropriate naming convention

## Screenshot Guidelines

### Content Requirements
- Show actual FlowForge features in use
- Include realistic but non-sensitive data
- Highlight key differentiators (flow state, AI context)
- Use consistent color scheme and branding

### Technical Requirements
- iOS: PNG format, device-specific sizes
- Android: PNG or JPEG, minimum 1080px width
- No alpha channel transparency
- sRGB color profile

### Store Guidelines
- No promotional text in screenshots (use captions)
- Show actual app functionality
- Keep UI text readable
- Follow platform design guidelines

## Placeholder Note

Current files are placeholders for testing purposes. Replace with actual app screenshots before app store submission.

To generate production screenshots:
1. Complete app implementation
2. Use UI testing framework for consistency
3. Capture on multiple device sizes
4. Add localization for international markets
