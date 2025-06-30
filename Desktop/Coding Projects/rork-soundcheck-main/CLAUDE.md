# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Management
- **Install dependencies**: `bun install` (preferred) or `npm install`
- Uses Bun as the primary package manager with `bun.lock`

### Development Server
- **Start development server**: `npm start` (uses bunx rork with custom tunnel)
- **Start web version**: `npm start-web`
- **Start web with debug**: `npm start-web-dev`
- **Direct command**: `bunx rork start -p jy4wm6od3zu9t24ssevkq --tunnel`

### Testing
- **Run tests**: `npm test` (Jest with verbose output)
- Tests are located in `__tests__/` directories alongside source files
- Uses Jest with React Native Testing Library and jest-expo preset
- Test setup includes manual AsyncStorage mocks in `__mocks__/`

## Architecture Overview

### Core Technologies
- **Framework**: React Native with Expo SDK 53
- **Routing**: Expo Router (file-based routing in `app/` directory)
- **State Management**: Zustand with AsyncStorage persistence
- **Styling**: React Native StyleSheet with consistent design system
- **UI Components**: Custom React Native components with Lucide React Native icons
- **TypeScript**: Full TypeScript implementation with strict configuration

### State Management Pattern
The app uses Zustand stores with custom AsyncStorage adapters for data persistence:

- **gigStore.ts**: Manages performance/gig data with date serialization
- **practiceStore.ts**: Handles personal practice tasks and categories
- **rehearsalStore.ts**: Manages rehearsal tasks and events with relationships

Each store implements:
- Custom storage adapters that handle Date object serialization/deserialization
- Retry logic for AsyncStorage operations via `utils/retry.ts`
- Comprehensive error handling with try-catch blocks

### App Structure
- **File-based routing**: All screens in `app/` directory with Expo Router
- **Modal presentations**: Add/edit screens presented as modals
- **Tab navigation**: Main tabs for rehearsals, practice, and gigs
- **Onboarding**: First-launch experience handled in `_layout.tsx`
- **Error boundaries**: App-wide error handling with `ErrorBoundary` component

### Data Models
Core types defined in `types/index.ts`:
- `RehearsalTask` and `RehearsalEvent` with optional relationships
- `PracticeTask` with categories and completion tracking  
- `Gig` with venue details, dates, and compensation tracking

### Form Validation
- Custom validation system in `utils/validation.ts`
- `ValidatedInput` component for consistent form inputs
- `useFormValidation` hook for form state management
- Applied across all add/edit screens

### Component Architecture
- Reusable components in `components/` directory
- Consistent styling via `constants/colors.ts`
- Error handling components (`ErrorBoundary`, `LoadingState`, `EmptyState`)
- Form components with built-in validation

### Development Status
- Current test status: Mix of passing/failing tests (date formatting issues)
- Error handling and retry logic fully implemented
- Form validation system complete across all screens
- AsyncStorage persistence with custom serialization working

## Key Files to Understand

- `app/_layout.tsx`: Root layout with onboarding and navigation setup
- `store/`: Zustand stores with custom AsyncStorage persistence
- `utils/validation.ts`: Form validation utilities and patterns
- `components/ErrorBoundary.tsx`: App-wide error handling
- `constants/`: App configuration and styling constants