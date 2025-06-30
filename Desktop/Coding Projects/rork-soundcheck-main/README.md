# SoundCheck

SoundCheck is a comprehensive mobile app designed for musicians to manage rehearsals, track personal practice, and organize gigs in one streamlined platform.

## Overview

SoundCheck helps musicians stay organized by providing dedicated spaces for managing different aspects of their musical activities:

- **Rehearsal Management**: Track tasks and events for band rehearsals
- **Practice Tracking**: Monitor personal practice goals and progress
- **Gig Management**: Keep track of upcoming performances with venue details

## Features

### Rehearsal Management

- **Task Tracking**: Create, edit, and complete rehearsal preparation tasks
- **Event Organization**: Group tasks by rehearsal events
- **Due Dates**: Set deadlines for rehearsal tasks
- **Notes**: Add detailed notes to tasks

### Practice Tracking

- **Personal Goals**: Track individual practice tasks and goals
- **Categorization**: Organize practice tasks by technique, repertoire, theory, etc.
- **Progress Monitoring**: Mark tasks as complete to track progress
- **Target Dates**: Set target completion dates for practice goals

### Gig Management

- **Venue Details**: Store venue names, addresses, and contact information
- **Performance Schedule**: Track dates and call times for gigs
- **Navigation**: Open maps directly from the app to navigate to venues
- **Compensation Tracking**: Record payment details for each gig
- **Notes**: Add additional information about each performance

## Technical Implementation

- **Framework**: React Native with Expo
- **Navigation**: Expo Router for file-based routing
- **State Management**: Zustand with AsyncStorage persistence
- **UI Components**: Custom React Native components
- **Styling**: React Native StyleSheet with a consistent design system

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- [Bun](https://bun.sh) (required for the provided npm scripts). Install with:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### Installation

1. Clone the repository
2. Install dependencies (recommended with Bun to use `bun.lock`):
   ```
   bun install
   ```
   or use npm/yarn
   ```
   npm install
   ```
   ```
   yarn install
   ```
3. Start the development server (scripts use **bunx**):
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```
   Alternatively, run the underlying command directly without Bun:
   ```
   npx rork start -p jy4wm6od3zu9t24ssevkq --tunnel
   ```

### Previewing on Mobile Devices with Expo Go

Once you have the prerequisites installed and the project dependencies set up (by running `bun install`, `npm install`, or `yarn install`), you can preview the app on your iOS or Android device using the Expo Go app:

1.  **Install Expo Go:**
    *   Download and install the Expo Go app from the [App Store (iOS)](https://apps.apple.com/app/apple-store/id982107779) or [Google Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent).

2.  **Start the Development Server:**
    *   Open your terminal, navigate to the project directory, and run the start command:
        ```bash
        npm start
        ```
        Alternatively, you can use `yarn start` or `bun run start`. This will start the Expo development server and display a QR code in the terminal.

3.  **Open the App in Expo Go:**
    *   **On Android:** Open the Expo Go app and tap "Scan QR Code". Point your device's camera at the QR code shown in your terminal.
    *   **On iOS:** Open the built-in Camera app and point it at the QR code shown in your terminal. A notification will appear to open the link in Expo Go. Tap on it.

The SoundCheck app should now load in Expo Go on your device, and it will automatically reload whenever you make changes to the code.

## App Structure

- `app/`: Contains all screens and navigation setup (Expo Router)
- `components/`: Reusable UI components
- `constants/`: App-wide constants like colors
- `store/`: Zustand stores for state management
- `types/`: TypeScript type definitions

## Recommended Next Steps

### Feature Enhancements

1. **Calendar Integration**:
   - Add a calendar view to visualize rehearsals and gigs
   - Enable export to device calendar

2. **Notifications**:
   - Add reminders for upcoming rehearsals and gigs
   - Practice session reminders

3. **Statistics and Analytics**:
   - Track practice time and frequency
   - Visualize progress with charts

4. **Setlist Management**:
   - Create and manage setlists for gigs
   - Link songs to practice tasks

5. **Media Integration**:
   - Record practice sessions
   - Attach audio/video to tasks for reference

6. **Collaboration**:
   - Share rehearsal tasks with band members
   - Collaborative editing of gig details

### Technical Improvements

1. **Testing**:
   - Add unit tests for components and stores
   - Implement end-to-end testing

2. **Performance Optimization**:
   - Optimize list rendering for large datasets
   - Implement virtualized lists

3. **Offline Support**:
   - Enhance offline capabilities
   - Background sync when connection is restored

4. **Accessibility**:
   - Improve screen reader support
   - Add keyboard navigation for web

5. **Theming**:
   - Add dark mode support
   - Allow customizable accent colors

## Development Progress

### Recently Completed
- ✅ Initial setup and dependency installation
- ✅ Fixed TypeScript configuration issues
- ✅ Implemented comprehensive error handling:
  - ErrorBoundary component for React errors
  - Try-catch blocks in all async store operations
  - Error logging service for production
  - Retry logic for failed operations
  - User-friendly error messages
- ✅ Started form validation implementation:
  - Created validation utility functions
  - Built ValidatedInput component
  - Created useFormValidation hook
  - Applied validation to add-rehearsal form

### Next Steps
## Current Development Status

### Recently Completed
- ✅ Fixed form validation issues in edit screens (edit-gig, edit-practice, edit-rehearsal-event)
- ✅ Added comprehensive error handling with retry logic for all stores
- ✅ Implemented ErrorBoundary component for graceful error recovery
- ✅ Created validation utility functions with custom validation support
- ✅ Set up testing infrastructure with Jest
- ✅ Created test files for stores (practiceStore, gigStore), utilities (validation), and hooks (useFormValidation)
- ✅ Fixed test implementation issues to match actual store APIs

### In Progress
- 🔄 Writing and fixing unit tests for all components
- 🔄 Current test status: 54 passing, 28 failing
- 🔄 Main issues: Date formatting in tests, missing rehearsalStore tests, component rendering issues

### Next Steps
1. **Complete Testing Coverage**
   - Fix remaining test failures (date formatting, component tests)
   - Add tests for rehearsalStore
   - Add integration tests for critical user flows
   - Achieve minimum 70% code coverage

2. **Performance Optimization**
   - Add React.memo to list components
   - Implement lazy loading for tab screens
   - Optimize re-renders with useCallback and useMemo

3. **Accessibility Improvements**
   - Add screen reader support
   - Implement proper focus management
   - Ensure all interactive elements have proper labels

4. **UI/UX Enhancements**
   - Add loading states for all async operations
   - Implement pull-to-refresh on list screens
   - Add empty state illustrations
   - Improve form feedback and validation messages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
