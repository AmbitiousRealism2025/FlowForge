I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase has a solid foundation with Next.js 14 App Router, NextAuth v5, Prisma ORM, and all required dependencies. The Prisma CodingSession model includes sessionType, sessionStatus, aiContextHealth, aiModelsUsed, checkpointNotes, and proper relationships. Custom Tailwind colors (flow-green, caution-amber, stuck-red) are defined for consistent theming. The types/index.ts file has basic enums but needs extension for SessionStatus and additional types. The sessionStore.ts and sessionManager.ts files don't exist yet and need to be created. API routes haven't been implemented. The master plan provides comprehensive specifications for all components, including UI patterns, data flows, and business logic requirements.

### Approach

Implement Phase 1.4 Session Management by creating a sessions page with history list, filters, and summary stats; building three core components (StartSessionDialog, SessionTimer, SessionCard); implementing the sessionStore for real-time state management; and creating the sessionManager service for business logic. The approach follows established patterns from the codebase: Radix UI for dialogs/dropdowns, React Query for server state, Zustand for client state, Tailwind for styling, and Zod for validation. Components will integrate with API endpoints from Phase 1.2 and leverage types/utilities from Phase 1.1.

### Reasoning

I explored the repository structure and confirmed that Phase 1.1-1.3 foundations are partially in place: types/enums exist, basic utilities are defined, Prisma schema is complete with CodingSession model, auth is configured with NextAuth, and the providers setup includes React Query. However, the sessionStore, sessionManager service, API routes, and dashboard components from Phase 1.3 are not yet implemented. I reviewed the master plan specifications for detailed requirements, examined the Prisma schema for the CodingSession model structure, and confirmed all necessary dependencies (Zustand, React Query, Radix UI, date-fns, Zod) are installed in package.json.

## Mermaid Diagram

sequenceDiagram
    participant User
    participant SessionsPage
    participant StartSessionDialog
    participant SessionStore
    participant SessionManager
    participant API
    participant SessionTimer
    participant SessionCard

    User->>SessionsPage: Navigate to /sessions
    SessionsPage->>API: GET /api/sessions (with filters)
    API-->>SessionsPage: Return paginated sessions
    SessionsPage->>SessionCard: Render session cards
    
    User->>SessionsPage: Click "Start New Session"
    SessionsPage->>StartSessionDialog: Open dialog
    StartSessionDialog->>API: GET /api/projects (for dropdown)
    API-->>StartSessionDialog: Return active projects
    
    User->>StartSessionDialog: Select type, project, AI model
    User->>StartSessionDialog: Click "Start Session"
    StartSessionDialog->>SessionManager: startSession(type, project, model)
    SessionManager->>API: POST /api/sessions
    API-->>SessionManager: Return created session
    SessionManager-->>StartSessionDialog: Session created
    
    StartSessionDialog->>SessionStore: startSession(sessionId, type, project, model)
    SessionStore-->>StartSessionDialog: State updated
    StartSessionDialog->>SessionsPage: onSessionStarted callback
    SessionsPage->>API: Refetch sessions
    StartSessionDialog->>User: Close dialog, show success toast
    
    Note over SessionTimer: Timer runs in background
    loop Every second
        SessionTimer->>SessionStore: updateElapsed()
        SessionTimer->>SessionStore: updateContextHealth()
    end
    
    loop Every 60 seconds
        SessionTimer->>SessionManager: syncSessionDuration(id, elapsed)
        SessionManager->>API: PATCH /api/sessions/{id}
        API-->>SessionManager: Updated session
        SessionManager->>SessionStore: syncWithServer()
    end
    
    User->>SessionTimer: Click "Pause"
    SessionTimer->>SessionStore: pauseSession()
    SessionTimer->>SessionManager: pauseSession(sessionId)
    SessionManager->>API: PATCH /api/sessions/{id} (status: PAUSED)
    
    User->>SessionTimer: Click "End Session"
    SessionTimer->>SessionManager: endSession(id, duration, score)
    SessionManager->>API: PATCH /api/sessions/{id} (status: COMPLETED)
    API-->>SessionManager: Updated session
    SessionManager->>SessionStore: endSession()
    SessionStore-->>SessionTimer: State cleared
    SessionTimer->>SessionsPage: Refetch sessions
    
    User->>SessionCard: Click action menu
    User->>SessionCard: Select "Delete"
    SessionCard->>API: DELETE /api/sessions/{id}
    API-->>SessionCard: Success
    SessionCard->>SessionsPage: Invalidate query
    SessionsPage->>API: Refetch sessions

## Proposed File Changes

### src/types/index.ts(MODIFY)

References: 

- prisma/schema.prisma

**Extend types with SessionStatus enum and session-related types:**

1. Add SessionStatus enum with values: ACTIVE, PAUSED, COMPLETED, ABANDONED to match the Prisma schema enum at `prisma/schema.prisma` (lines 218-223).

2. Update the Session interface (currently lines 59-70) to align with Prisma CodingSession model: rename to CodingSession, add sessionStatus field (SessionStatus enum), add checkpointNotes field (string | null), ensure all fields match the Prisma model.

3. Add SessionFilters interface with optional fields: sessionType (SessionType | null), projectId (string | null), dateRange ({ start: Date, end: Date } | null), used by the sessions page for filtering.

4. Add SessionStats interface with fields: totalSessions (number), totalCodingMinutes (number), averageSessionDuration (number), used for summary statistics display.

5. Add component prop types: SessionCardProps interface with session (CodingSession), onDelete (optional function), onCheckpoint (optional function), onViewDetails (optional function).

6. Add SessionTimerProps interface with sessionId (string), startTime (Date), isPaused (boolean), elapsedSeconds (number), contextHealth (number), onPause (function), onResume (function), onEnd (function), onCheckpoint (function).

7. Add StartSessionDialogProps interface with isOpen (boolean), onClose (function), onSessionStarted (optional function accepting CodingSession).

8. Add CreateSessionRequest interface with sessionType (SessionType), projectId (string | null), aiModelsUsed (string array), used for API POST requests.

9. Add UpdateSessionRequest interface with optional fields: durationSeconds (number), aiContextHealth (number), productivityScore (number), checkpointNotes (string), sessionStatus (SessionStatus), used for API PATCH requests.

10. Export all new types and ensure they're available for import throughout the application.

### src/lib/utils.ts(MODIFY)

References: 

- src/types/index.ts(MODIFY)

**Enhance utilities with session-specific helpers:**

1. Import necessary functions from date-fns: format, formatDistanceToNow, differenceInSeconds, parseISO.

2. Extend formatDuration function (currently lines 15-23) to handle seconds display for durations under 1 minute (e.g., '45s'), and add optional 'long' format parameter for verbose output like '2 hours 15 minutes'.

3. Add formatSessionDuration function that accepts a CodingSession object, calculates duration from startedAt/endedAt or uses durationSeconds field, returns formatted string using formatDuration.

4. Add formatRelativeTime function that accepts a Date and returns human-readable relative time (e.g., '2 hours ago', 'just now') using formatDistanceToNow with addSuffix option.

5. Add getSessionTypeIcon function that accepts SessionType enum and returns emoji string: BUILDING='🔨', EXPLORING='🔍', DEBUGGING='🐛', SHIPPING='🚀'.

6. Add getSessionTypeLabel function that accepts SessionType enum and returns human-readable label: BUILDING='Building', EXPLORING='Exploring', DEBUGGING='Debugging', SHIPPING='Shipping'.

7. Add getSessionTypeColor function that accepts SessionType enum and returns Tailwind color class: BUILDING='text-blue-500', EXPLORING='text-purple-500', DEBUGGING='text-red-500', SHIPPING='text-green-500'.

8. Add getSessionStatusColor function that accepts SessionStatus enum and returns Tailwind color class: ACTIVE='text-green-500', PAUSED='text-yellow-500', COMPLETED='text-gray-500', ABANDONED='text-red-500'.

9. Add getSessionStatusLabel function that accepts SessionStatus enum and returns human-readable label: ACTIVE='In Progress', PAUSED='Paused', COMPLETED='Completed', ABANDONED='Abandoned'.

10. Add calculateContextHealthColor function that accepts health number (0-100) and returns object with textColor and bgColor Tailwind classes: >=70 green, 40-69 yellow, <40 red, using the custom colors (flow-green, caution-amber, stuck-red).

11. Add truncateText function that accepts text string, maxLength number, and optional suffix (default '...'), returns truncated string for checkpoint notes preview.

12. Export all new utility functions for use in session components.

### src/store/sessionStore.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create Zustand store for active session client-side state management:**

1. Import create from 'zustand', persist and createJSONStorage from 'zustand/middleware' for localStorage persistence.

2. Import SessionType and SessionStatus from `src/types/index.ts`.

3. Define SessionState interface with properties: activeSessionId (string | null), sessionType (SessionType | null), projectId (string | null), aiModel (string | null), startTime (Date | null), isPaused (boolean), elapsedSeconds (number), contextHealth (number), lastSyncTime (Date | null).

4. Define SessionActions interface with methods: startSession (accepts sessionId, sessionType, projectId, aiModel), pauseSession, resumeSession, endSession, updateElapsed (increments elapsedSeconds), updateContextHealth (accepts new health value), syncWithServer (updates lastSyncTime).

5. Create store using create with persist middleware. Persist key: 'flowforge-session-store'. Include activeSessionId, sessionType, projectId, aiModel, startTime, elapsedSeconds in persisted state. Exclude isPaused and lastSyncTime from persistence.

6. Implement startSession action: set all session properties, initialize elapsedSeconds to 0, set isPaused to false, set contextHealth to 100, record startTime as new Date(), clear any previous session state first.

7. Implement pauseSession action: set isPaused to true without clearing other state.

8. Implement resumeSession action: set isPaused to false.

9. Implement endSession action: reset all state properties to null/default values (activeSessionId null, sessionType null, projectId null, aiModel null, startTime null, isPaused false, elapsedSeconds 0, contextHealth 100).

10. Implement updateElapsed action: increment elapsedSeconds by 1, called every second by SessionTimer when not paused.

11. Implement updateContextHealth action: calculate time-based degradation (decrease by 10 points per hour: contextHealth - (elapsedSeconds / 3600 * 10)), clamp between 0 and 100, update contextHealth property.

12. Implement syncWithServer action: update lastSyncTime to current Date, called after successfully syncing duration to API.

13. Add computed selector isActive: return boolean (activeSessionId !== null && !isPaused).

14. Add computed selector formattedElapsed: return formatted time string (HH:MM:SS) using formatDuration from `src/lib/utils.ts`.

15. Export useSessionStore hook as default export following Zustand best practices.

### src/lib/sessionManager.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create business logic service for session lifecycle management:**

1. Import types (CodingSession, SessionType, SessionStatus, CreateSessionRequest, UpdateSessionRequest) from `src/types/index.ts`.

2. Import utilities (formatDuration, formatSessionDuration, getSessionTypeIcon, getSessionTypeLabel) from `src/lib/utils.ts`.

3. Define API_BASE constant: '/api/sessions'.

4. Create startSession async function: accepts sessionType (SessionType), projectId (string | null), aiModel (string). Construct CreateSessionRequest payload with sessionType, projectId, aiModelsUsed array containing aiModel. Make POST request to API_BASE. Return created CodingSession or throw error. Handle fetch errors with try-catch.

5. Create updateSession async function: accepts sessionId (string) and partial UpdateSessionRequest data. Make PATCH request to `${API_BASE}/${sessionId}` with data. Return updated CodingSession or throw error.

6. Create pauseSession async function: accepts sessionId (string). Call updateSession with sessionStatus: SessionStatus.PAUSED. Return updated session.

7. Create resumeSession async function: accepts sessionId (string). Call updateSession with sessionStatus: SessionStatus.ACTIVE. Return updated session.

8. Create endSession async function: accepts sessionId (string), finalDuration (number), productivityScore (number | null). Call updateSession with endedAt: new Date(), durationSeconds: finalDuration, sessionStatus: SessionStatus.COMPLETED, productivityScore. Return updated session.

9. Create saveCheckpoint async function: accepts sessionId (string), checkpointText (string). Make POST request to `${API_BASE}/${sessionId}/checkpoint` with checkpoint text. Return updated session with new checkpoint.

10. Create syncSessionDuration async function: accepts sessionId (string), durationSeconds (number). Call updateSession with durationSeconds. Handle errors silently (log but don't throw) since this is background sync. Return boolean indicating success.

11. Create calculateContextHealth function: accepts elapsedSeconds (number), initialHealth (number, default 100). Implement time-based degradation: initialHealth - (elapsedSeconds / 3600 * 10). Clamp result between 0 and 100. Return number.

12. Create getSessionDuration function: accepts session (CodingSession). If session has endedAt, calculate difference between startedAt and endedAt using differenceInSeconds from date-fns. Otherwise use durationSeconds field. Return number (seconds).

13. Create formatSessionInfo function: accepts session (CodingSession). Return object with formatted properties: duration (formatted string), typeIcon (emoji), typeLabel (string), statusLabel (string), used by SessionCard for display.

14. Create validateSessionData function: accepts session data object. Validate required fields are present and valid types. Return object with isValid (boolean) and errors (string array).

15. Export all functions as named exports for use in components and hooks.

### src/components/ui/Button.tsx(NEW)

References: 

- src/lib/utils.ts(MODIFY)

**Create reusable Button component with variants using CVA:**

1. Mark as 'use client' for interactive functionality.

2. Import React, forwardRef for ref forwarding, ButtonHTMLAttributes for type safety.

3. Import Slot from '@radix-ui/react-slot' for composition pattern.

4. Import { cva, type VariantProps } from 'class-variance-authority' for variant management.

5. Import cn utility from `src/lib/utils.ts` for class merging.

6. Define buttonVariants using cva with base classes: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'.

7. Define variant options: default (bg-primary text-primary-foreground hover:bg-primary/90), secondary (bg-secondary text-secondary-foreground hover:bg-secondary/80), destructive (bg-destructive text-destructive-foreground hover:bg-destructive/90), outline (border border-input hover:bg-accent hover:text-accent-foreground), ghost (hover:bg-accent hover:text-accent-foreground), link (text-primary underline-offset-4 hover:underline).

8. Define size options: default (h-10 px-4 py-2), sm (h-9 rounded-md px-3), lg (h-11 rounded-md px-8), icon (h-10 w-10).

9. Create Button component using forwardRef with props extending ButtonHTMLAttributes and VariantProps from buttonVariants. Add asChild prop for Slot composition.

10. Render as Slot if asChild is true, otherwise render as button element. Apply buttonVariants with variant and size props, merge with custom className using cn.

11. Export Button component and buttonVariants for external use in other components.

### src/components/ui/Card.tsx(NEW)

References: 

- src/lib/utils.ts(MODIFY)

**Create reusable Card component with sub-components:**

1. Import React, forwardRef, HTMLAttributes for type safety.

2. Import cn utility from `src/lib/utils.ts` for class merging.

3. Create Card component using forwardRef with base classes: 'rounded-lg border bg-card text-card-foreground shadow-sm'. Accept className prop and merge with base classes using cn. Forward ref to div element.

4. Create CardHeader sub-component with classes: 'flex flex-col space-y-1.5 p-6'. Accept className prop for customization.

5. Create CardTitle sub-component as h3 with classes: 'text-2xl font-semibold leading-none tracking-tight'. Accept className prop.

6. Create CardDescription sub-component as p with classes: 'text-sm text-muted-foreground'. Accept className prop.

7. Create CardContent sub-component with classes: 'p-6 pt-0'. Accept className prop.

8. Create CardFooter sub-component with classes: 'flex items-center p-6 pt-0'. Accept className prop.

9. All sub-components should use forwardRef to properly forward refs to their underlying HTML elements.

10. Export Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter as named exports for use in session components.

### src/hooks/useToast.ts(NEW)

**Create custom toast notification hook using Radix Toast:**

1. Mark as 'use client' for client-side state management.

2. Import useState, useCallback from 'react'.

3. Import Toast components from '@radix-ui/react-toast': Provider, Root, Title, Description, Action, Close, Viewport.

4. Define ToastType as union: 'success' | 'error' | 'info' | 'warning'.

5. Define Toast interface with id (string), message (string), type (ToastType), duration (number, optional).

6. Create useToast hook that manages toast state internally with useState holding array of Toast objects.

7. Implement addToast function using useCallback: accepts message (string), type (ToastType), duration (number, default 5000). Generate unique id using Date.now() + Math.random(). Add toast to state array.

8. Implement removeToast function using useCallback: accepts id (string), filters toast from state array.

9. Return object with toast helper functions: success (message, duration?), error (message, duration?), info (message, duration?), warning (message, duration?), and toasts array for rendering.

10. Each helper function calls addToast with appropriate type.

11. Export useToast hook and Toast components for use in components. Components will need to render Toast.Provider and Toast.Viewport in their tree, with individual Toast.Root elements for each toast in the array.

12. Include auto-dismiss logic: use useEffect to set timeout for each toast based on duration, call removeToast when timeout expires.

### src/components/sessions/StartSessionDialog.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/store/sessionStore.ts(NEW)
- src/lib/sessionManager.ts(NEW)
- src/hooks/useToast.ts(NEW)
- src/components/ui/Button.tsx(NEW)

**Create modal dialog for starting new coding sessions:**

1. Mark as 'use client' for interactive form functionality.

2. Import useState from 'react' for form state management.

3. Import Dialog components from '@radix-ui/react-dialog': Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger.

4. Import Select components from '@radix-ui/react-select' for dropdowns.

5. Import Button from `src/components/ui/Button.tsx`.

6. Import useQuery, useMutation, useQueryClient from '@tanstack/react-query' for data fetching and mutations.

7. Import SessionType, StartSessionDialogProps from `src/types/index.ts`.

8. Import useSessionStore from `src/store/sessionStore.ts` for updating client state.

9. Import startSession from `src/lib/sessionManager.ts` for API calls.

10. Import useToast from `src/hooks/useToast.ts` for notifications.

11. Import session type icons from lucide-react: Hammer, Search, Bug, Rocket.

12. Accept props: isOpen (boolean), onClose (function), onSessionStarted (optional callback).

13. Manage form state with useState: selectedType (SessionType | null), selectedProject (string | null), selectedAiModel (string), notes (string).

14. Create useQuery to fetch active projects from '/api/projects?isActive=true' for project dropdown.

15. Create useMutation for starting session: calls startSession from sessionManager, on success updates sessionStore.startSession with returned session data, invalidates sessions query, shows success toast, calls onSessionStarted callback, closes dialog.

16. Render Dialog with open={isOpen} and onOpenChange={onClose}.

17. In DialogContent, create form with session type selector using radio buttons or card-based selection (4 options: BUILDING, EXPLORING, DEBUGGING, SHIPPING) with icons and labels.

18. Add Select dropdown for project association (optional), populated from projects query, with 'No Project' option.

19. Add Select dropdown for AI model with predefined options: 'Claude 3.5 Sonnet', 'GPT-4', 'Cursor', 'Copilot', 'Local Model', 'Other'.

20. Add optional textarea for initial session notes/context.

21. In DialogFooter, add Cancel button (calls onClose) and Start Session button (calls mutation, disabled if no session type selected, shows loading state during mutation).

22. Apply consistent styling with Tailwind classes, use Card-like styling for session type options with hover states.

23. Handle loading and error states from projects query and mutation gracefully.

### src/components/sessions/SessionTimer.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/store/sessionStore.ts(NEW)
- src/lib/sessionManager.ts(NEW)
- src/lib/utils.ts(MODIFY)
- src/hooks/useToast.ts(NEW)
- src/components/ui/Button.tsx(NEW)

**Create real-time timer component for active sessions:**

1. Mark as 'use client' for timer functionality and state updates.

2. Import useEffect, useRef, useState from 'react'.

3. Import Button from `src/components/ui/Button.tsx`.

4. Import Progress from '@radix-ui/react-progress' for context health bar.

5. Import SessionTimerProps from `src/types/index.ts`.

6. Import useSessionStore from `src/store/sessionStore.ts` for state management.

7. Import syncSessionDuration, endSession, saveCheckpoint from `src/lib/sessionManager.ts`.

8. Import formatDuration, calculateContextHealthColor from `src/lib/utils.ts`.

9. Import useToast from `src/hooks/useToast.ts` for notifications.

10. Import icons from lucide-react: Play, Pause, Square, Bookmark, AlertTriangle.

11. Accept props from SessionTimerProps interface.

12. Use useRef to store interval ID for timer and sync counter.

13. Use useEffect to set up interval when component mounts and session is not paused: increment elapsedSeconds every second by calling sessionStore.updateElapsed, update context health every second using sessionStore.updateContextHealth.

14. Implement sync logic: every 60 seconds (track with counter), call syncSessionDuration with sessionId and current elapsedSeconds, update sessionStore.syncWithServer on success.

15. Clean up interval on unmount or when paused using useEffect return function.

16. Render timer display showing elapsed time in HH:MM:SS format using formatDuration.

17. Display context health Progress bar with value={contextHealth}, apply color classes based on health level using calculateContextHealthColor (green >=70, yellow 40-69, red <40).

18. Show AlertTriangle icon with warning message when context health drops below 40.

19. Render control buttons: Pause/Resume button (toggles isPaused, calls onPause/onResume props), Checkpoint button (opens dialog or inline input for checkpoint notes, calls onCheckpoint prop), End Session button (calls onEnd prop).

20. Handle pause state: when paused, stop interval but maintain elapsed time, show Resume button instead of Pause.

21. Apply consistent styling with Tailwind, use flow-green for healthy context, caution-amber for medium, stuck-red for low.

22. Show last sync time indicator: 'Last synced X seconds ago' using lastSyncTime from sessionStore.

### src/components/sessions/SessionCard.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)
- src/components/ui/Card.tsx(NEW)
- src/components/ui/Button.tsx(NEW)

**Create card component for displaying session information:**

1. Mark as 'use client' for interactive menu functionality.

2. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

3. Import Button from `src/components/ui/Button.tsx`.

4. Import DropdownMenu components from '@radix-ui/react-dropdown-menu' for action menu.

5. Import SessionCardProps, CodingSession from `src/types/index.ts`.

6. Import formatSessionDuration, formatRelativeTime, getSessionTypeIcon, getSessionTypeLabel, getSessionTypeColor, getSessionStatusColor, getSessionStatusLabel, truncateText from `src/lib/utils.ts`.

7. Import icons from lucide-react: MoreVertical, Trash2, FileText, Eye.

8. Accept props from SessionCardProps interface: session, onDelete, onCheckpoint, onViewDetails.

9. Render Card component with hover effect and cursor-pointer if onViewDetails is provided.

10. In CardHeader, display session type icon (from getSessionTypeIcon) and label (from getSessionTypeLabel) with appropriate color (from getSessionTypeColor).

11. Show session status badge with color coding using getSessionStatusColor and getSessionStatusLabel.

12. In CardContent, display formatted duration using formatSessionDuration.

13. Show AI model badges for each model in session.aiModelsUsed array, styled as small pills with appropriate colors.

14. Display productivity score if present (1-10 scale) with visual indicator (stars or progress bar).

15. Show checkpoint notes preview if present: truncate to 100 characters using truncateText, with 'Read more' link.

16. Display associated project name if session.projectId exists (fetch from included relation or show ID).

17. Show timestamp: 'Started {relative time}' using formatRelativeTime with session.startedAt.

18. Render DropdownMenu trigger button (MoreVertical icon) in top-right corner of card.

19. In DropdownMenuContent, add menu items: View Details (calls onViewDetails), Add Checkpoint (calls onCheckpoint), Delete (calls onDelete with confirmation).

20. Apply color coding to entire card border based on sessionStatus: green for COMPLETED, yellow for PAUSED, red for ABANDONED, blue for ACTIVE.

21. Make card clickable to call onViewDetails if provided.

22. Use consistent Tailwind styling with hover states and transitions.

### src/app/(dashboard)/sessions/page.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)
- src/components/ui/Button.tsx(NEW)
- src/components/ui/Card.tsx(NEW)
- src/components/sessions/SessionCard.tsx(NEW)
- src/components/sessions/StartSessionDialog.tsx(NEW)
- src/hooks/useToast.ts(NEW)

**Create sessions history page with list, filters, and summary stats:**

1. Mark as 'use client' for interactive filtering and state management.

2. Import useState from 'react' for filter state management.

3. Import useQuery, useMutation, useQueryClient from '@tanstack/react-query' for data fetching.

4. Import Button from `src/components/ui/Button.tsx`.

5. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

6. Import Select components from '@radix-ui/react-select' for filter dropdowns.

7. Import SessionCard from `src/components/sessions/SessionCard.tsx`.

8. Import StartSessionDialog from `src/components/sessions/StartSessionDialog.tsx`.

9. Import SessionType, SessionFilters, SessionStats, CodingSession from `src/types/index.ts`.

10. Import formatDuration from `src/lib/utils.ts`.

11. Import useToast from `src/hooks/useToast.ts`.

12. Import icons from lucide-react: Plus, Filter, Calendar, Clock.

13. Manage state: filters (SessionFilters), isDialogOpen (boolean), page (number), limit (number, default 20).

14. Create useQuery to fetch sessions from '/api/sessions' with query params: page, limit, sessionType filter, projectId filter, dateRange filter. Query key should include filter values for proper caching.

15. Create useQuery to fetch projects from '/api/projects?isActive=true' for project filter dropdown.

16. Calculate summary statistics from fetched sessions: totalSessions (count), totalCodingMinutes (sum of durationSeconds / 60), averageSessionDuration (total duration / count).

17. Create useMutation for deleting sessions: DELETE to '/api/sessions/{id}', on success invalidate sessions query and show success toast.

18. Render page header with title 'Sessions' and 'Start New Session' button (opens StartSessionDialog).

19. Display summary statistics cards in a grid: Total Sessions This Week, Total Coding Time, Average Session Duration, using Card components with icons.

20. Render filter section with Select dropdowns: Session Type filter (all types + 'All'), Project filter (all projects + 'All'), Date Range filter (Today, This Week, This Month, All Time).

21. Map sessions data to SessionCard components, passing session object and callback handlers (onDelete, onCheckpoint, onViewDetails).

22. Implement pagination controls at bottom: Previous/Next buttons, page number display, disable buttons appropriately based on hasMore from API response.

23. Show loading skeleton states while sessions query is loading: render placeholder cards with animated pulse.

24. Show empty state when no sessions exist: encouraging message with illustration/icon, 'Start Your First Session' button.

25. Show empty state when filters return no results: 'No sessions match your filters' message with 'Clear Filters' button.

26. Render StartSessionDialog with isOpen state, onClose handler, onSessionStarted callback that refetches sessions query.

27. Apply responsive layout: grid of cards adjusts columns based on screen size (1 column mobile, 2-3 columns desktop).

28. Use consistent Tailwind styling with proper spacing and responsive design.