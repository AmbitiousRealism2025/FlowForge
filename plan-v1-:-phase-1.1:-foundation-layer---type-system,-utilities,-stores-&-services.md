I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase has a solid foundation with Next.js 14, Prisma ORM, NextAuth v5, and all necessary dependencies (Zustand 4.4.7, date-fns 3.0.6, Zod 3.22.4) already installed. The Prisma schema is comprehensive with User, Project, CodingSession, Habit, Note, FlowBlock, AIContext, and Analytics models. Current `src/types/index.ts` has basic enums and interfaces but needs extension with Prisma-generated types, API response types, and component prop types. The `src/lib/utils.ts` file has minimal utilities (cn, formatDuration, getFlowStateColor) and needs enhancement. No stores or service modules exist yet, providing a clean slate for implementation following established patterns from the master plan.

### Approach

This phase establishes the foundational layer for FlowForge by extending type definitions to align with Prisma models, enhancing utilities with date/time and validation helpers, creating Zustand stores for client-side state management, and implementing business logic services for core domain operations. The approach prioritizes type safety, reusability, and separation of concerns between client state (Zustand), server state (React Query), and business logic (service modules).

### Reasoning

I explored the repository structure, read the existing type definitions, utility functions, and Prisma schema. I reviewed the master plan to understand detailed requirements for stores and services. I verified available dependencies in package.json and confirmed that all necessary libraries (Zustand, date-fns, Zod) are already installed.

## Proposed File Changes

### src/types/index.ts(MODIFY)

References: 

- prisma/schema.prisma

**Extend with Prisma-aligned types and API response types:**

1. **Align Session interface with Prisma CodingSession model** - Rename the `Session` interface to `CodingSession` to match the Prisma schema at `prisma/schema.prisma` (lines 95-115). Add missing fields: `checkpointNotes` (string | null), `sessionStatus` (SessionStatus enum), and update field names to match exactly (e.g., ensure `aiModelsUsed` is string array).

2. **Add SessionStatus enum** - Create new enum with values: ACTIVE, PAUSED, COMPLETED, ABANDONED to match the Prisma enum at `prisma/schema.prisma` (lines 218-223).

3. **Add FlowBlockType enum** - Create new enum with values: FOCUS_TIME, MEETING, BREAK, REVIEW to match Prisma enum at `prisma/schema.prisma` (lines 241-246).

4. **Create Prisma-extended types** - Add interfaces for FlowBlock, AIContext, and Analytics models that mirror the Prisma schema structure. Include all fields with proper types (id, userId, timestamps, etc.).

5. **Add API response wrapper types** - Create generic `ApiResponse<T>` type with properties: success (boolean), data (T | null), error (string | null), message (string | null). Create `PaginatedResponse<T>` type extending ApiResponse with additional properties: items (T[]), total (number), page (number), limit (number), hasMore (boolean).

6. **Add API request types** - Create interfaces for common request payloads: `CreateSessionRequest` (sessionType, projectId?, aiModelsUsed), `UpdateSessionRequest` (durationSeconds?, aiContextHealth?, productivityScore?, checkpointNotes?), `CreateProjectRequest` (name, description?, feelsRightScore?, shipTarget?, stackNotes?), `UpdateProjectRequest` (partial fields), `CreateNoteRequest` (title?, content, category, tags, sessionId?, projectId?), `UpdateNoteRequest` (partial fields).

7. **Add component prop types** - Create interfaces for major component props: `SessionTimerProps` (sessionId, startTime, isPaused, onPause, onResume, onEnd), `SessionCardProps` (session: CodingSession, onDelete?, onViewDetails?), `ProjectCardProps` (project: Project, onUpdate?, onStartSession?), `FeelsRightSliderProps` (projectId, initialValue, onChange), `NoteCardProps` (note: Note, onEdit?, onDelete?), `ShipStreakCardProps` (currentStreak, longestStreak, lastShipDate?, onMarkShip).

8. **Add dashboard-specific types** - Create `DashboardStats` interface with properties: activeSessionId (string | null), shipStreak (number), activeProjectsCount (number), todaysCodingMinutes (number), flowState (FlowState). Create `StreakData` interface with currentStreak, longestStreak, lastShipDate properties.

9. **Add utility types** - Create `Momentum` type as union: 'HOT' | 'ACTIVE' | 'QUIET'. Create `DateRange` interface with start and end Date properties. Create `SessionFilters` interface with optional sessionType, projectId, dateRange properties.

10. **Export all types** - Ensure all new types, interfaces, and enums are properly exported for use throughout the application.

### src/lib/utils.ts(MODIFY)

References: 

- src/types/index.ts(MODIFY)

**Enhance with comprehensive date/time, duration, and validation utilities:**

1. **Add date-fns imports** - Import necessary functions from date-fns library (format, formatDistance, formatDistanceToNow, parseISO, startOfDay, endOfDay, isToday, isYesterday, differenceInDays, differenceInHours, differenceInMinutes, addDays, subDays).

2. **Enhance formatDuration function** - Extend the existing formatDuration function (lines 15-23) to handle edge cases: show seconds for durations under 1 minute (e.g., '45s'), show days for durations over 24 hours (e.g., '2d 3h'), add optional 'long' format parameter for verbose output (e.g., '2 hours 15 minutes').

3. **Add formatDate function** - Create function that accepts Date and optional format string, returns formatted date string. Support common formats: 'short' (Jan 15), 'medium' (Jan 15, 2024), 'long' (January 15, 2024), 'time' (2:30 PM), 'datetime' (Jan 15, 2:30 PM). Use date-fns format function internally.

4. **Add formatRelativeTime function** - Create function that accepts Date and returns human-readable relative time string (e.g., '2 hours ago', 'in 3 days', 'just now'). Use date-fns formatDistanceToNow with addSuffix option. Handle edge cases for 'just now' (< 1 minute).

5. **Add getTimeOfDay function** - Create function that accepts Date and returns time period: 'morning' (5am-12pm), 'afternoon' (12pm-5pm), 'evening' (5pm-9pm), 'night' (9pm-5am). Useful for contextual greetings.

6. **Add calculateDuration function** - Create function that accepts start Date and optional end Date (defaults to now), returns duration in seconds as number. Use differenceInMinutes and convert to seconds.

7. **Add isWithinDateRange function** - Create function that accepts date to check, start Date, and end Date, returns boolean indicating if date falls within range. Use date-fns comparison functions.

8. **Add validation helper: validateFeelsRightScore** - Create function that accepts number and returns boolean. Validate score is integer between 1-5 inclusive. Used by FeelsRightSlider component.

9. **Add validation helper: validateSessionType** - Create function that accepts string and returns boolean. Check if value is valid SessionType enum value (BUILDING, EXPLORING, DEBUGGING, SHIPPING). Use type guard pattern.

10. **Add validation helper: validateNoteCategory** - Create function that accepts string and returns boolean. Check if value is valid NoteCategory enum value. Import NoteCategory from `src/types/index.ts`.

11. **Add validation helper: validateEmail** - Create function that accepts string and returns boolean. Use regex pattern for basic email validation. Useful for user profile forms.

12. **Add string utility: truncateText** - Create function that accepts text string, max length number, and optional suffix string (default '...'), returns truncated string. Used by NoteCard for content previews.

13. **Add string utility: slugify** - Create function that accepts string and returns URL-friendly slug (lowercase, hyphens, no special chars). Useful for project names in URLs.

14. **Add color utility: getMomentumColor** - Create function that accepts Momentum type ('HOT' | 'ACTIVE' | 'QUIET') and returns Tailwind color class string. Return 'text-red-500' for HOT, 'text-yellow-500' for ACTIVE, 'text-gray-400' for QUIET.

15. **Add color utility: getSessionTypeColor** - Create function that accepts SessionType enum and returns Tailwind color class. Map BUILDING to blue, EXPLORING to purple, DEBUGGING to red, SHIPPING to green.

16. **Add color utility: getNoteCategoryColor** - Create function that accepts NoteCategory enum and returns Tailwind color class. Map categories to appropriate colors matching the master plan specifications.

17. **Enhance getFlowStateColor function** - Keep existing function (lines 28-32) but add optional 'variant' parameter to return background colors or border colors in addition to text colors.

18. **Add array utility: groupByDate** - Create generic function that accepts array of items with date property and returns Map grouped by date (YYYY-MM-DD string keys). Useful for analytics visualizations.

19. **Add number utility: calculatePercentage** - Create function that accepts value and total, returns percentage number rounded to specified decimal places (default 0). Handle division by zero.

20. **Add timezone utility: getUserTimezone** - Create function that returns user's timezone string using Intl.DateTimeFormat().resolvedOptions().timeZone. Fallback to 'UTC' if unavailable.

### src/store/sessionStore.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create Zustand store for active session client-side state management:**

1. **Import dependencies** - Import create from 'zustand', persist middleware from 'zustand/middleware', and relevant types (SessionType, SessionStatus) from `src/types/index.ts`.

2. **Define SessionState interface** - Create interface with properties: activeSessionId (string | null), sessionType (SessionType | null), projectId (string | null), aiModel (string | null), startTime (Date | null), isPaused (boolean), elapsedSeconds (number), lastSyncTime (Date | null), contextHealth (number).

3. **Define SessionActions interface** - Create interface with action methods: startSession (accepts sessionId, sessionType, projectId?, aiModel?), pauseSession, resumeSession, endSession (clears all state), updateElapsed (increments elapsedSeconds), updateContextHealth (accepts new health value), syncWithServer (updates lastSyncTime).

4. **Create store with persist middleware** - Use create with persist middleware to save critical state to localStorage. Persist key: 'flowforge-session-store'. Include activeSessionId, sessionType, projectId, startTime, elapsedSeconds in persisted state. Exclude isPaused and lastSyncTime from persistence.

5. **Implement startSession action** - Set all session properties, initialize elapsedSeconds to 0, set isPaused to false, set contextHealth to 100, record startTime as new Date(). Clear any previous session state first.

6. **Implement pauseSession action** - Set isPaused to true. Do not clear other state. This allows resuming the same session.

7. **Implement resumeSession action** - Set isPaused to false. Adjust startTime to account for paused duration to maintain accurate elapsed time calculation.

8. **Implement endSession action** - Reset all state properties to null/default values: activeSessionId null, sessionType null, projectId null, aiModel null, startTime null, isPaused false, elapsedSeconds 0, contextHealth 100.

9. **Implement updateElapsed action** - Increment elapsedSeconds by 1. This should be called every second by the SessionTimer component when not paused.

10. **Implement updateContextHealth action** - Accept new health value and update contextHealth property. Implement simple time-based degradation: decrease by 10 points per hour (calculated as elapsedSeconds / 3600 * 10).

11. **Implement syncWithServer action** - Update lastSyncTime to current Date. This is called after successfully syncing session duration to the API (every 60 seconds as per master plan).

12. **Add computed getter: isActive** - Return boolean indicating if there's an active session (activeSessionId !== null && !isPaused).

13. **Add computed getter: formattedElapsed** - Return formatted time string (HH:MM:SS) using the formatDuration utility from `src/lib/utils.ts`. Convert elapsedSeconds to appropriate format.

14. **Export store hook** - Export the store as useSessionStore for use in components. Follow Zustand best practices for selector usage to prevent unnecessary re-renders.

### src/store/dashboardStore.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create Zustand store for dashboard UI state management:**

1. **Import dependencies** - Import create from 'zustand', persist middleware from 'zustand/middleware', and FlowState enum from `src/types/index.ts`.

2. **Define DashboardState interface** - Create interface with properties: todaysFocus (string), quickCaptureBuffer (string), flowState (FlowState), lastRefresh (Date | null), isRefreshing (boolean).

3. **Define DashboardActions interface** - Create interface with action methods: setTodaysFocus (accepts string), updateQuickCaptureBuffer (accepts string), clearQuickCaptureBuffer, setFlowState (accepts FlowState), refreshDashboard, setRefreshing (accepts boolean).

4. **Create store with persist middleware** - Use create with persist middleware to save state to localStorage. Persist key: 'flowforge-dashboard-store'. Include todaysFocus and flowState in persisted state. Exclude quickCaptureBuffer, lastRefresh, and isRefreshing from persistence (these are temporary UI state).

5. **Initialize default state** - Set todaysFocus to empty string, quickCaptureBuffer to empty string, flowState to FlowState.NEUTRAL, lastRefresh to null, isRefreshing to false.

6. **Implement setTodaysFocus action** - Update todaysFocus property with provided string. This should be debounced in the component that calls it to avoid excessive API calls (debounce at component level, not in store).

7. **Implement updateQuickCaptureBuffer action** - Update quickCaptureBuffer property with provided string. This stores unsaved quick capture text to prevent data loss if user navigates away.

8. **Implement clearQuickCaptureBuffer action** - Reset quickCaptureBuffer to empty string. Called after successfully creating a note from quick capture.

9. **Implement setFlowState action** - Update flowState property with provided FlowState enum value. This allows manual flow state updates from the VibeMeter component.

10. **Implement refreshDashboard action** - Update lastRefresh to current Date and trigger any necessary data refetching. This is called when user manually refreshes dashboard or after significant actions (marking ship, ending session).

11. **Implement setRefreshing action** - Update isRefreshing boolean. Used to show loading indicators during dashboard data refresh.

12. **Add computed getter: hasUnsavedCapture** - Return boolean indicating if quickCaptureBuffer has content (length > 0). Used to show warning before navigation if user has unsaved quick capture text.

13. **Add computed getter: focusPlaceholder** - Return appropriate placeholder text based on time of day. Use getTimeOfDay utility from `src/lib/utils.ts` to return contextual placeholders like 'What's your morning focus?', 'What's your afternoon goal?', etc.

14. **Export store hook** - Export the store as useDashboardStore for use in components. Follow Zustand best practices for selector usage.

### src/lib/sessionManager.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create business logic service for session lifecycle management:**

1. **Import dependencies** - Import types (CodingSession, SessionType, SessionStatus, CreateSessionRequest, UpdateSessionRequest, ApiResponse) from `src/types/index.ts`. Import date utilities (formatDuration, calculateDuration) from `src/lib/utils.ts`.

2. **Define API base URL constant** - Create constant for API endpoint base path: '/api/sessions'.

3. **Create startSession function** - Accept parameters: sessionType (SessionType), projectId (string | null), aiModel (string), userId (string). Construct CreateSessionRequest payload with sessionType, projectId, aiModelsUsed array containing the aiModel. Make POST request to '/api/sessions'. Return ApiResponse<CodingSession> with the created session data. Handle fetch errors and return error response with appropriate message.

4. **Create pauseSession function** - Accept sessionId (string). Make PATCH request to '/api/sessions/[id]' with sessionStatus: SessionStatus.PAUSED. Return ApiResponse<CodingSession>. Handle errors appropriately.

5. **Create resumeSession function** - Accept sessionId (string). Make PATCH request to '/api/sessions/[id]' with sessionStatus: SessionStatus.ACTIVE. Return ApiResponse<CodingSession>. Handle errors appropriately.

6. **Create endSession function** - Accept sessionId (string), finalDuration (number in seconds), productivityScore (number | null). Make PATCH request to '/api/sessions/[id]' with endedAt: new Date(), durationSeconds: finalDuration, sessionStatus: SessionStatus.COMPLETED, productivityScore. Return ApiResponse<CodingSession>. Handle errors appropriately.

7. **Create updateSessionDuration function** - Accept sessionId (string), durationSeconds (number). Make PATCH request to '/api/sessions/[id]' with durationSeconds. This is called every 60 seconds by SessionTimer to sync elapsed time. Return ApiResponse<CodingSession>. Handle errors silently (log but don't throw) since this is background sync.

8. **Create saveCheckpoint function** - Accept sessionId (string), checkpointText (string). Make POST request to '/api/sessions/[id]/checkpoint' with checkpoint text. Return ApiResponse<CodingSession> with updated session including new checkpoint. Handle errors appropriately.

9. **Create calculateContextHealth function** - Accept elapsedSeconds (number), initialHealth (number, default 100). Implement simple time-based degradation: decrease by 10 points per hour. Formula: initialHealth - (elapsedSeconds / 3600 * 10). Clamp result between 0 and 100. Return number.

10. **Create getSessionDuration function** - Accept session (CodingSession). Calculate duration: if session has endedAt, use difference between startedAt and endedAt; otherwise use durationSeconds field. Return number (seconds).

11. **Create formatSessionDuration function** - Accept session (CodingSession). Get duration using getSessionDuration, format using formatDuration utility from `src/lib/utils.ts`. Return formatted string (e.g., '2h 15m').

12. **Create getSessionStatus function** - Accept session (CodingSession). Return human-readable status string based on sessionStatus enum. Map ACTIVE to 'In Progress', PAUSED to 'Paused', COMPLETED to 'Completed', ABANDONED to 'Abandoned'.

13. **Create getSessionTypeIcon function** - Accept sessionType (SessionType). Return appropriate icon name or emoji for each type. Map BUILDING to '🔨', EXPLORING to '🔍', DEBUGGING to '🐛', SHIPPING to '🚀'. Used by SessionCard component.

14. **Create validateSessionData function** - Accept session data object. Validate required fields are present and valid types. Return object with isValid (boolean) and errors (string array). Used before making API calls.

15. **Add error handling utility** - Create handleSessionError function that accepts error (unknown) and returns formatted error message string. Handle fetch errors, network errors, and API error responses consistently.

16. **Export all functions** - Export all session management functions for use in components and other services.

### src/lib/projectService.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create business logic service for project management operations:**

1. **Import dependencies** - Import types (Project, CodingSession, Momentum, CreateProjectRequest, UpdateProjectRequest, ApiResponse, PaginatedResponse) from `src/types/index.ts`. Import date utilities (formatRelativeTime, differenceInDays, differenceInHours) from `src/lib/utils.ts`.

2. **Define API base URL constant** - Create constant for API endpoint base path: '/api/projects'.

3. **Create createProject function** - Accept parameters: name (string), description (string | null), feelsRightScore (number, default 3), shipTarget (Date | null), stackNotes (string | null). Construct CreateProjectRequest payload. Make POST request to '/api/projects'. Return ApiResponse<Project> with created project. Handle errors appropriately.

4. **Create updateProject function** - Accept projectId (string) and partial project data (UpdateProjectRequest). Make PATCH request to '/api/projects/[id]' with provided fields. Return ApiResponse<Project>. Handle errors appropriately.

5. **Create updateFeelsRightScore function** - Accept projectId (string) and score (number 1-5). Validate score using validateFeelsRightScore from `src/lib/utils.ts`. Make PATCH request to '/api/projects/[id]/feels-right' with score. Return ApiResponse<Project>. Handle validation errors before making request.

6. **Create recordPivot function** - Accept projectId (string) and optional pivotNotes (string). Make POST request to '/api/projects/[id]/pivot' with notes. Return ApiResponse<Project> with incremented pivotCount. Handle errors appropriately.

7. **Create calculateMomentum function** - Accept project (Project) and sessions (CodingSession array). Determine momentum based on most recent session: if session within last 24 hours return 'HOT', if within last 7 days return 'ACTIVE', otherwise return 'QUIET'. Use differenceInHours utility from `src/lib/utils.ts`. Return Momentum type.

8. **Create getProjectStats function** - Accept projectId (string). Fetch project with related sessions from API. Calculate statistics: totalSessions (count), totalCodingTime (sum of durationSeconds), lastWorkedDate (most recent session startedAt), averageFeelsRightScore (if historical tracking implemented). Return object with these stats. Handle errors appropriately.

9. **Create getMomentumEmoji function** - Accept momentum (Momentum type). Return appropriate emoji: '🔥' for HOT, '⚡' for ACTIVE, '💤' for QUIET. Used by ProjectCard component.

10. **Create getMomentumLabel function** - Accept momentum (Momentum type). Return human-readable label: 'Hot' for HOT, 'Active' for ACTIVE, 'Quiet' for QUIET. Used by ProjectCard component.

11. **Create getFeelsRightEmoji function** - Accept score (number 1-5). Return appropriate emoji based on score: 1='😰', 2='😕', 3='😐', 4='😊', 5='🚀'. Used by FeelsRightSlider component.

12. **Create getFeelsRightLabel function** - Accept score (number 1-5). Return descriptive label: 1='Struggling', 2='Uncertain', 3='Okay', 4='Good', 5='Nailing It'. Used by FeelsRightSlider component.

13. **Create formatShipTarget function** - Accept shipTarget (Date | null). If null, return 'No target set'. Otherwise, format as relative time using formatRelativeTime from `src/lib/utils.ts` (e.g., 'in 5 days', '2 days ago'). Add context: prefix with 'Ships' for future dates, 'Shipped' for past dates.

14. **Create getProjectDuration function** - Accept project (Project) and sessions (CodingSession array). Sum all session durations. Format using formatDuration from `src/lib/utils.ts`. Return formatted string (e.g., '15h 30m').

15. **Create sortProjectsByMomentum function** - Accept projects array with momentum data. Sort by momentum priority: HOT first, then ACTIVE, then QUIET. Within same momentum, sort by updatedAt descending. Return sorted array.

16. **Create sortProjectsByFeelsRight function** - Accept projects array. Sort by feelsRightScore descending (highest scores first). Return sorted array.

17. **Create validateProjectData function** - Accept project data object. Validate required fields (name must be non-empty), feelsRightScore is 1-5, shipTarget is valid date if provided. Return object with isValid (boolean) and errors (string array).

18. **Add error handling utility** - Create handleProjectError function that accepts error (unknown) and returns formatted error message string. Handle fetch errors, validation errors, and API error responses consistently.

19. **Export all functions** - Export all project management functions for use in components and other services.

### src/lib/notesService.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create business logic service for notes CRUD operations:**

1. **Import dependencies** - Import types (Note, NoteCategory, CreateNoteRequest, UpdateNoteRequest, ApiResponse, PaginatedResponse) from `src/types/index.ts`. Import utilities (truncateText, formatRelativeTime, validateNoteCategory) from `src/lib/utils.ts`.

2. **Define API base URL constant** - Create constant for API endpoint base path: '/api/notes'.

3. **Create createNote function** - Accept parameters: title (string | null), content (string), category (NoteCategory), tags (string array), sessionId (string | null), projectId (string | null). Validate category using validateNoteCategory from `src/lib/utils.ts`. Construct CreateNoteRequest payload. Make POST request to '/api/notes'. Return ApiResponse<Note> with created note. Handle errors appropriately.

4. **Create updateNote function** - Accept noteId (string) and partial note data (UpdateNoteRequest). Make PATCH request to '/api/notes/[id]' with provided fields. Return ApiResponse<Note>. Handle errors appropriately.

5. **Create deleteNote function** - Accept noteId (string). Make DELETE request to '/api/notes/[id]'. Return ApiResponse<void>. Handle errors appropriately.

6. **Create searchNotes function** - Accept searchQuery (string), category (NoteCategory | null), tags (string array), page (number), limit (number). Construct query parameters. Make GET request to '/api/notes' with filters. Return PaginatedResponse<Note>. Handle errors appropriately.

7. **Create getNotesByCategory function** - Accept category (NoteCategory), page (number), limit (number). Call searchNotes with category filter. Return PaginatedResponse<Note>.

8. **Create getNotesByTags function** - Accept tags (string array), page (number), limit (number). Call searchNotes with tags filter. Return PaginatedResponse<Note>.

9. **Create parseTags function** - Accept tagsInput (string, comma-separated). Split by comma, trim whitespace, filter empty strings, convert to lowercase, remove duplicates. Return string array. Used when user inputs tags as comma-separated string.

10. **Create formatTags function** - Accept tags (string array). Join with comma and space. Return formatted string for display. Used in forms and displays.

11. **Create getNotePreview function** - Accept note (Note). Extract first 150 characters of content using truncateText from `src/lib/utils.ts`. Return preview string with ellipsis if truncated. Used by NoteCard component.

12. **Create getNoteCategoryIcon function** - Accept category (NoteCategory). Return appropriate emoji icon: PROMPT_PATTERN='💡', GOLDEN_CODE='⭐', DEBUG_LOG='🐛', MODEL_NOTE='🤖', INSIGHT='💭'. Used by NoteCard component.

13. **Create getNoteCategoryLabel function** - Accept category (NoteCategory). Return human-readable label: PROMPT_PATTERN='Prompt Pattern', GOLDEN_CODE='Golden Code', DEBUG_LOG='Debug Log', MODEL_NOTE='Model Note', INSIGHT='Insight'. Used in category filters and displays.

14. **Create getNoteCategoryColor function** - Accept category (NoteCategory). Return Tailwind color class: PROMPT_PATTERN='text-purple-500', GOLDEN_CODE='text-yellow-500', DEBUG_LOG='text-red-500', MODEL_NOTE='text-blue-500', INSIGHT='text-gray-500'. Used by NoteCard for category badges.

15. **Create formatNoteTimestamp function** - Accept note (Note). If updated recently (< 24 hours), show relative time using formatRelativeTime from `src/lib/utils.ts`. Otherwise show formatted date. Return formatted string like 'Updated 2 hours ago' or 'Created Jan 15'.

16. **Create extractCommonTags function** - Accept notes (Note array). Aggregate all tags, count occurrences, return top 10 most common tags with counts. Return array of objects with tag (string) and count (number). Used for tag filter suggestions.

17. **Create groupNotesByCategory function** - Accept notes (Note array). Group by category using Map. Return Map<NoteCategory, Note[]>. Used for category-based displays.

18. **Create validateNoteData function** - Accept note data object. Validate required fields: content must be non-empty, category must be valid NoteCategory, tags must be string array. Return object with isValid (boolean) and errors (string array).

19. **Add error handling utility** - Create handleNoteError function that accepts error (unknown) and returns formatted error message string. Handle fetch errors, validation errors, and API error responses consistently.

20. **Export all functions** - Export all notes management functions for use in components and other services.

### src/lib/analyticsService.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create business logic service for analytics calculations:**

1. **Import dependencies** - Import types (StreakData, ApiResponse) from `src/types/index.ts`. Import date utilities (startOfDay, differenceInDays, formatDate, isToday, addDays, subDays) from date-fns. Import getUserTimezone from `src/lib/utils.ts`.

2. **Define API base URL constant** - Create constant for API endpoint base path: '/api/analytics'.

3. **Create calculateShipStreak function** - Accept analytics records array (sorted by date descending). Implement streak calculation algorithm: start with currentStreak = 0, iterate through consecutive days checking shipCount > 0, increment streak for each consecutive day, break on first gap (day with shipCount = 0 or missing day). Handle timezone correctly by normalizing dates to user's timezone using getUserTimezone. Return currentStreak number.

4. **Create calculateLongestStreak function** - Accept analytics records array. Implement algorithm to find maximum consecutive days with shipCount > 0 in entire history. Iterate through all records, track current streak and max streak, update max when current streak exceeds it, reset current streak on gaps. Return longestStreak number.

5. **Create getStreakData function** - Make GET request to '/api/analytics/streak'. Return ApiResponse<StreakData> with currentStreak, longestStreak, and lastShipDate. Handle errors appropriately. This fetches pre-calculated streak data from the API.

6. **Create markShipToday function** - Make POST request to '/api/analytics/ship' to create or update today's Analytics record with incremented shipCount. Accept optional metadata object. Return ApiResponse with updated analytics record. Handle timezone correctly to ensure 'today' is based on user's timezone.

7. **Create getWeeklyShipData function** - Make GET request to '/api/analytics/weekly' to fetch last 7 days of ship data. Return array of objects with date (string), shipCount (number), dayOfWeek (string). Handle timezone correctly. Used by WeeklyShipChart component.

8. **Create hasShippedToday function** - Accept analytics records array or make API call to check if today's record has shipCount > 0. Handle timezone correctly using getUserTimezone. Return boolean. Used to show/hide 'Mark Ship Today' button.

9. **Create getLastShipDate function** - Accept analytics records array (sorted by date descending). Find first record with shipCount > 0. Return Date or null if no ships found. Used to display 'Last shipped X days ago'.

10. **Create getDaysSinceLastShip function** - Accept lastShipDate (Date | null). If null, return null. Otherwise calculate difference between today and lastShipDate using differenceInDays. Handle timezone correctly. Return number or null.

11. **Create formatStreakDisplay function** - Accept currentStreak (number). Return formatted string with fire emoji: '🔥 X day streak' or '🔥 X days streak' (handle singular/plural). If streak is 0, return 'No active streak'.

12. **Create getStreakMilestone function** - Accept currentStreak (number). Return milestone message for special streak numbers: 7 days='Week streak!', 30 days='Month streak!', 100 days='Century!', etc. Return null if not a milestone. Used for celebration animations.

13. **Create shouldCelebrate function** - Accept previousStreak (number), newStreak (number). Return boolean indicating if celebration should trigger. Celebrate when: newStreak > previousStreak (streak extended), newStreak is milestone (7, 30, 100, etc.). Used to trigger confetti animations.

14. **Create normalizeToUserTimezone function** - Accept date (Date) and timezone (string). Convert date to user's timezone for accurate 'today' calculations. Use date-fns-tz or native Date methods. Return normalized Date.

15. **Create getWeekdayLabels function** - Return array of weekday labels for chart X-axis: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']. Used by WeeklyShipChart component.

16. **Create fillMissingDays function** - Accept weekly data array (may have gaps). Fill in missing days with shipCount: 0 to ensure complete 7-day dataset for chart. Return complete array with all 7 days.

17. **Create calculateWeeklyAverage function** - Accept weekly data array. Calculate average shipCount across 7 days. Return number rounded to 1 decimal place. Used for weekly summary stats.

18. **Create validateAnalyticsData function** - Accept analytics data object. Validate date is valid Date, shipCount is non-negative number. Return object with isValid (boolean) and errors (string array).

19. **Add error handling utility** - Create handleAnalyticsError function that accepts error (unknown) and returns formatted error message string. Handle fetch errors, timezone errors, and API error responses consistently.

20. **Export all functions** - Export all analytics functions for use in components and other services.