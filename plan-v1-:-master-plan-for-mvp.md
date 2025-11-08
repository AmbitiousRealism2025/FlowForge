I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The FlowForge project has a solid foundation (Next.js 14, complete Prisma schema, NextAuth configured) but lacks all application functionality. The existing 52-task plan is over-engineered with excessive implementation detail, trying to build advanced features (MCP integration, real-time WebSocket, InfluxDB analytics) before proving core value.

The database schema in `prisma/schema.prisma` is fully implemented with all necessary models: User, Project, CodingSession, Habit, Note, FlowBlock, AIContext, and Analytics. The tech stack is modern and appropriate: Next.js 14 App Router, Prisma ORM, NextAuth.js, Radix UI, Zustand, React Query, and Tailwind CSS.

The core value proposition is tracking AI-assisted coding sessions with "feels right" progress indicators, not traditional task management. The MVP should focus on this unique differentiator rather than building everything at once.


### Approach

Create a lean three-phase master plan that prioritizes rapid MVP delivery:

**Phase 1 (Weeks 1-6)**: Core MVP focusing on session tracking, project management with "feels right" scoring, ship streak counter, and basic notes. Build the essential dashboard that demonstrates unique value.

**Phase 2 (Weeks 7-10)**: Engagement features including habit tracking with streaks, enhanced analytics, focus mode, and mobile-responsive design to drive daily usage.

**Phase 3 (Weeks 11-16)**: Growth features with PWA/mobile apps, team collaboration, and integrations (GitHub, Calendar, MCP) for scale and monetization.

This approach delivers a working product in 6 weeks instead of 3 months, validates the concept early, and allows iterative improvement based on user feedback.


### Reasoning

I explored the repository structure to understand the current state, read the comprehensive PRD and existing planning documents to grasp the product vision, examined the implemented Prisma schema and NextAuth configuration, and analyzed the existing 52-task plan to identify over-engineering issues. This revealed that while the foundation is solid, no actual application functionality exists, and the current plan tries to build too much too soon.


## Proposed File Changes

### src/app/(dashboard)/dashboard/page.tsx(NEW)

References: 

- src/app/layout.tsx
- src/lib/auth.ts

Create the main dashboard page that serves as the central hub for FlowForge. This page should compose all dashboard components (TodaysFocus, ActiveSession, ShipStreak, VibeMeter, QuickCapture) into a responsive grid layout. Fetch initial dashboard data using React Query hooks for server state management. Implement loading states and error boundaries for graceful degradation. Use the existing layout from `src/app/layout.tsx` and ensure proper authentication checks via NextAuth session.

### src/app/(dashboard)/layout.tsx(NEW)

References: 

- src/app/layout.tsx

Create the dashboard layout wrapper that includes the navigation sidebar for desktop and bottom navigation for mobile. This layout should wrap all dashboard routes and provide consistent navigation structure. Include the Sidebar component for desktop (>768px) and MobileNav for mobile. Add user menu in the header with profile dropdown and sign out functionality using NextAuth signOut method. Ensure proper authentication middleware protection.

### src/components/dashboard/TodaysFocus.tsx(NEW)

Create a hero card component that displays and allows editing of a single daily objective (not a task list). This should be a large, prominent card at the top of the dashboard. Implement inline editing functionality where clicking the text makes it editable. Store the focus text in the User.preferences JSON field via API call to the focus endpoint. Use Radix UI components for the editable text area and save button. Show a placeholder like 'What's your main focus today?' when empty.

### src/components/dashboard/ActiveSession.tsx(NEW)

Create a component that displays the currently active coding session with a running timer, AI model badge, and context health progress bar. Connect to the sessionStore Zustand store for real-time timer updates. Display session type (BUILDING/EXPLORING/DEBUGGING/SHIPPING) with appropriate icons. Show elapsed time in HH:MM:SS format. Include action buttons for 'Pause', 'Checkpoint', and 'End Session'. The context health bar should visually degrade from green (100%) to yellow (60%) to red (40%) based on aiContextHealth value. When no session is active, show a 'Start Session' button that opens the StartSessionDialog.

### src/components/dashboard/ShipStreak.tsx(NEW)

Create a card component that displays the current ship streak (consecutive days with deployments) and longest streak. Show a fire emoji (🔥) with the streak number prominently. Include a 'Mark Ship Today' button that calls the ship API endpoint to increment today's ship count. Query the Analytics model via API to calculate streaks by checking consecutive dates with shipCount > 0. Handle timezone correctly using the User.timezone field. Show visual celebration (confetti animation or similar) when marking a ship that extends the streak. Display last ship date if no ship today.

### src/components/dashboard/VibeMeter.tsx(NEW)

Create a visual flow state indicator that reads from User.flowState enum (BLOCKED/NEUTRAL/FLOWING/DEEP_FLOW). Display color-coded status: red for BLOCKED, yellow for NEUTRAL, green for FLOWING, bright green for DEEP_FLOW. Use emoji or icon representations: 🚫 BLOCKED, 😐 NEUTRAL, 🟢 FLOWING, ⚡ DEEP_FLOW. Allow users to manually update their flow state via a dropdown or button group. The flow state should also update automatically based on session activity patterns (e.g., long productive sessions set FLOWING, no activity sets NEUTRAL).

### src/components/dashboard/QuickCapture.tsx(NEW)

Create a one-tap idea capture component that allows rapid note creation without context switching. Implement a simple text input with a '+' or 'Capture' button. When submitted, create a Note record with category INSIGHT and empty tags array. Use optimistic updates via React Query mutations for instant feedback. Show a brief success toast notification using Radix Toast. The input should clear immediately after submission. Consider adding keyboard shortcut (Cmd/Ctrl + K) for power users. Store temporary unsaved text in dashboardStore to prevent data loss.

### src/components/sessions/StartSessionDialog.tsx(NEW)

Create a modal dialog using Radix Dialog that presents options for starting a new coding session. Include a session type selector with radio buttons or cards for BUILDING, EXPLORING, DEBUGGING, and SHIPPING. Add an optional project association dropdown populated from the user's active projects. Include an AI model dropdown with options like 'Claude 3.5 Sonnet', 'GPT-4', 'Cursor', 'Copilot', 'Local Model', etc. Add an optional notes field for initial session context. On submit, call the sessions API POST endpoint to create a CodingSession record and update the sessionStore to start the client-side timer. Close dialog and show success toast.

### src/components/sessions/SessionTimer.tsx(NEW)

Create a timer component that displays elapsed time for the active session in HH:MM:SS format. Use browser setInterval to update every second, storing the interval ID in component state or ref. Connect to sessionStore for session state (startTime, isPaused). Include controls for Pause/Resume and End Session. When paused, stop the timer but maintain elapsed time. Sync duration to the database every 60 seconds via PATCH to the sessions API endpoint to prevent data loss. Calculate and update aiContextHealth based on elapsed time (decrease by 10 points per hour as simple time-based degradation). Show visual warning when context health drops below 40%.

### src/components/sessions/SessionCard.tsx(NEW)

Create a card component for displaying individual session information in the sessions list. Show session type icon and label, duration in human-readable format (e.g., '2h 15m'), AI model badge with appropriate color/icon, productivity score (1-10 scale) if rated, and checkpoint notes preview. Display project name if associated. Include timestamp showing when the session started. Add action menu with options to view details, add checkpoint note, or delete session. Use color coding based on sessionStatus: green for COMPLETED, yellow for PAUSED, red for ABANDONED. Make the card clickable to expand and show full details.

### src/app/(dashboard)/sessions/page.tsx(NEW)

References: 

- src/app/(dashboard)/layout.tsx(NEW)

Create the sessions history page that displays a list of all coding sessions with pagination. Fetch sessions using React Query with infinite scroll or traditional pagination. Include filters for session type, date range, and associated project. Show summary statistics at the top: total sessions this week, total coding time, average session duration. Render SessionCard components for each session. Include a prominent 'Start New Session' button that opens StartSessionDialog. Implement loading skeleton states and empty state when no sessions exist. Sort sessions by startedAt descending (most recent first).

### src/app/(dashboard)/projects/page.tsx(NEW)

References: 

- src/app/(dashboard)/layout.tsx(NEW)

Create the projects page that displays all user projects in a grid or list layout. Fetch projects using React Query with filters for status (ACTIVE/PAUSED/SHIPPED/ABANDONED). Include search functionality to filter by project name. Show sorting options: by momentum (recent activity), by feels right score, by ship target date. Render ProjectCard components for each project. Include a 'New Project' button that opens CreateProjectDialog. Display summary stats: active projects count, projects shipped this month. Implement responsive grid that adjusts columns based on screen size (1 column mobile, 2-3 columns desktop). Show empty state with encouragement to create first project.

### src/components/projects/ProjectCard.tsx(NEW)

Create a visual project card component that displays project information with emphasis on subjective progress. Show project name prominently, with optional color indicator. Display the 'feels right' score using the FeelsRightSlider component (1-5 scale) with emoji or visual representation (not percentages). Show momentum indicator: 🔥 Hot (worked on in last 24h), ⚡ Active (last 7 days), 💤 Quiet (7+ days) based on session activity. Include pivot counter badge that celebrates direction changes positively. Display ship target date if set, framed as flexible target not rigid deadline. Show last worked timestamp. Include action menu with options: Update Feelings, Record Pivot, Start Session, Edit Project, Archive. Make the card clickable to navigate to project detail view.

### src/components/projects/FeelsRightSlider.tsx(NEW)

Create an interactive slider component using Radix UI Slider for the 'feels right' progress indicator. Implement a 1-5 scale (not 0-100 percentage) with visual markers or emoji at each level: 1=😰 Struggling, 2=😕 Uncertain, 3=😐 Okay, 4=😊 Good, 5=🚀 Nailing It. Emphasize in the UI that this is subjective feeling, not objective completion percentage. On change, debounce the update and call the feels-right API endpoint to update Project.feelsRightScore. Show the current score prominently. Use color coding: red for 1-2, yellow for 3, green for 4-5. Include tooltip explaining the subjective nature of this metric.

### src/components/projects/CreateProjectDialog.tsx(NEW)

Create a modal dialog using Radix Dialog for creating new projects. Include form fields: project name (required), description (optional), initial feels right score (default 3), optional ship target date (use date picker), and stack notes textarea for documenting optimal AI tools and approaches. Use Zod schema for form validation. On submit, call the projects API POST endpoint to create a Project record. Show loading state during submission. Close dialog and show success toast on completion. Navigate to the new project or refresh the projects list. Include cancel button to close without saving.

### src/components/projects/PivotCounter.tsx(NEW)

Create a component that displays and increments the pivot counter for a project. Show the current pivot count with a positive framing like '🔄 3 Pivots' or '🔄 Exploring (3 pivots)'. Include a 'Record Pivot' button that calls the pivot API endpoint to increment Project.pivotCount. Frame pivots as positive exploration and learning, not failure. Show a brief animation or celebration when recording a pivot. Consider adding optional notes field to document what changed and why. Display pivot history if available (future enhancement).

### src/app/(dashboard)/notes/page.tsx(NEW)

References: 

- src/app/(dashboard)/layout.tsx(NEW)

Create the notes page that displays all user notes with search and filtering capabilities. Fetch notes using React Query with search query parameter for filtering by title/content. Include category filter dropdown for PROMPT_PATTERN, GOLDEN_CODE, DEBUG_LOG, MODEL_NOTE, INSIGHT. Show tag filter with common tags. Render NoteCard components in a masonry or grid layout. Include prominent 'New Note' button that opens CreateNoteDialog. Implement search with debounced input that queries the notes API. Show empty state when no notes match filters. Sort by updatedAt descending by default, with option to sort by createdAt or category.

### src/components/notes/NoteCard.tsx(NEW)

Create a card component for displaying individual notes. Show note title (if present) or first line of content as heading. Display content preview (first 150 characters) with 'Read more' if truncated. Show category badge with appropriate icon and color: 💡 PROMPT_PATTERN (purple), ⭐ GOLDEN_CODE (gold), 🐛 DEBUG_LOG (red), 🤖 MODEL_NOTE (blue), 💭 INSIGHT (gray). Display tags as small pills/badges. Show timestamps for created and last updated. Include action menu with options: Edit, Delete, Copy to Clipboard. If associated with a session or project, show that relationship. Make the card clickable to expand and show full content or navigate to detail view.

### src/components/notes/CreateNoteDialog.tsx(NEW)

Create a modal dialog using Radix Dialog for creating new notes. Include form fields: optional title, content textarea (required), category selector (radio buttons or dropdown), tags input (comma-separated or tag chips), optional session association (if creating from active session), optional project association. Use Zod schema for validation. On submit, call the notes API POST endpoint to create a Note record with the selected category and tags array. Show loading state during submission. Close dialog and show success toast on completion. Include cancel button. Consider auto-saving to prevent data loss for longer notes.

### src/components/notes/NoteEditor.tsx(NEW)

Create a textarea component with category selection for note editing. Implement a simple markdown-aware textarea (no full WYSIWYG for MVP) with monospace font option for code snippets. Include character count display. Add category selector as radio buttons or segmented control above the textarea. Provide quick action buttons for common formatting (code block, bullet list) that insert markdown syntax. Auto-save draft to localStorage to prevent data loss. Show save status indicator (Saved, Saving, Unsaved changes). Use controlled component pattern with form state management.

### src/components/analytics/ShipStreakCard.tsx(NEW)

Create a detailed ship streak display component that shows current streak, longest streak, and 'Mark Ship Today' functionality. Display current streak prominently with fire emoji and number. Show longest streak as a goal to beat. Include a calendar-style visualization of the last 30 days with indicators for ship days (green) and no-ship days (gray). Implement the 'Mark Ship Today' button that calls the ship API endpoint to create/update today's Analytics record with incremented shipCount. Show celebration animation when marking a ship that extends the streak. Display last ship date and time since last ship if no ship today. Handle timezone correctly using User.timezone field.

### src/components/analytics/WeeklyShipChart.tsx(NEW)

Create a simple bar chart component using Recharts library (already in dependencies) to visualize ship activity over the last 7 days. Fetch data from the weekly analytics API endpoint. Display days of the week on X-axis and ship count on Y-axis. Use color coding: green bars for days with ships, gray for days without. Show tooltip on hover with exact ship count and date. Include a goal line if user has set a weekly ship target. Make the chart responsive to container width. Show empty state with encouragement if no ships in the last 7 days.

### src/components/layout/Sidebar.tsx(NEW)

References: 

- src/styles/globals.css(MODIFY)

Create a navigation sidebar component for desktop view (>768px). Include navigation links to Dashboard, Sessions, Projects, Notes, and Analytics pages. Use Next.js Link component for client-side navigation. Highlight the active route using usePathname hook. Show FlowForge logo at the top. Include user profile section at the bottom with avatar, name, and dropdown menu. Add collapse/expand functionality to save screen space. Use Radix UI components for the dropdown menu. Style with Tailwind CSS using the custom design tokens from globals.css. Make the sidebar fixed position on the left side of the screen.

### src/components/layout/MobileNav.tsx(NEW)

References: 

- src/styles/globals.css(MODIFY)

Create a bottom navigation bar component for mobile view (<768px). Include navigation buttons for Dashboard, Sessions, Projects, and More (which opens a sheet with Notes, Analytics, Settings). Use icons for each navigation item with optional labels. Highlight the active route. Position fixed at the bottom of the screen with safe area insets for iOS. Use Radix UI Sheet component for the 'More' menu. Ensure minimum 44px touch targets for all buttons. Style with Tailwind CSS and ensure it doesn't overlap with page content (add bottom padding to main content area).

### src/components/layout/UserMenu.tsx(NEW)

References: 

- src/lib/auth.ts

Create a user profile dropdown menu component using Radix UI DropdownMenu. Display user avatar (from NextAuth session) and name. Include menu items: Profile/Settings, Theme Toggle (light/dark), Help/Documentation, and Sign Out. Implement sign out functionality using NextAuth signOut method from `src/lib/auth.ts`. Show user email and current flow state in the menu header. Add keyboard shortcuts for common actions. Style consistently with the design system. Position the menu in the top-right corner of the dashboard layout or at the bottom of the sidebar.

### src/store/sessionStore.ts(NEW)

Create a Zustand store for managing active session state on the client side. Store properties: activeSessionId (string or null), sessionType (SessionType enum), startTime (Date), isPaused (boolean), elapsedSeconds (number), aiModel (string), projectId (string or null). Include actions: startSession (initialize state), pauseSession (stop timer), resumeSession (restart timer), endSession (clear state), updateElapsed (increment seconds). Implement timer logic that updates elapsedSeconds every second when not paused. Persist critical state to localStorage to survive page refreshes. Sync with server every 60 seconds by calling the sessions API PATCH endpoint.

### src/store/dashboardStore.ts(NEW)

Create a Zustand store for dashboard-specific client state. Store properties: todaysFocus (string), quickCaptureBuffer (string for unsaved quick capture text), flowState (FlowState enum), lastRefresh (Date). Include actions: setTodaysFocus, updateQuickCaptureBuffer, setFlowState, refreshDashboard. This store handles temporary UI state that doesn't need immediate server persistence. Implement debounced sync for todaysFocus to avoid excessive API calls. Clear quickCaptureBuffer after successful note creation.

### src/lib/sessionManager.ts(NEW)

References: 

- prisma/schema.prisma

Create a business logic module for session lifecycle management. Export functions: startSession (create CodingSession record via API), pauseSession (update status), endSession (set endedAt and calculate final metrics), updateContextHealth (time-based degradation calculation), saveCheckpoint (add checkpoint notes). Implement context health calculation: start at 100, decrease by 10 points per hour (simple time-based for MVP). Include helper functions for calculating session duration, formatting time displays, and determining session status. Handle API calls using fetch or axios with proper error handling. Return typed results that components can consume.

### src/lib/projectService.ts(NEW)

References: 

- prisma/schema.prisma

Create a business logic module for project management operations. Export functions: createProject, updateProject, updateFeelsRightScore, recordPivot, calculateMomentum, getProjectStats. Implement momentum calculation by querying CodingSession records associated with the project: 🔥 Hot if sessions in last 24h, ⚡ Active if sessions in last 7 days, 💤 Quiet otherwise. Calculate project statistics: total sessions, total coding time, last worked date, average feels right score over time. Handle API calls with proper error handling and return typed results. Include helper functions for formatting dates and durations.

### src/lib/notesService.ts(NEW)

References: 

- prisma/schema.prisma

Create a business logic module for notes CRUD operations. Export functions: createNote, updateNote, deleteNote, searchNotes, getNotesByCategory, getNotesByTags. Implement search functionality that queries the API with search terms for title/content filtering using Prisma contains queries. Handle tag parsing (comma-separated string to array). Include helper functions for formatting note previews (truncate to 150 chars), categorizing notes with appropriate icons/colors, and managing note associations with sessions/projects. Return typed results with proper error handling.

### src/lib/analyticsService.ts(NEW)

References: 

- prisma/schema.prisma

Create a business logic module for analytics calculations. Export functions: calculateShipStreak, calculateLongestStreak, getWeeklyShipData, markShipToday. Implement streak calculation algorithm: query Analytics records ordered by date, iterate through consecutive days checking shipCount > 0, break on first gap. Handle timezone correctly using User.timezone field when determining 'today'. Include helper functions for date manipulation, formatting streak displays, and aggregating weekly data. Return typed results with current streak, longest streak, and last ship date.

### src/app/api/dashboard/focus/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts

Create API route handlers for today's focus text. Implement GET handler that retrieves the focus text from User.preferences JSON field (e.g., preferences.todaysFocus). Implement PUT handler that updates the focus text in User.preferences. Use NextAuth getServerSession to authenticate requests and get the current user ID from `src/lib/auth.ts`. Query the User model via Prisma client from `src/lib/prisma.ts`. Return JSON responses with proper status codes: 200 for success, 401 for unauthorized, 500 for errors. Validate input using Zod schema.

### src/app/api/dashboard/stats/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route GET handler for aggregated dashboard statistics. Calculate and return: current ship streak (query Analytics model), active projects count (count Project records where isActive=true), active session info (query CodingSession where sessionStatus=ACTIVE), today's coding time (sum durationSeconds from today's sessions). Use NextAuth getServerSession for authentication. Query multiple models via Prisma client and aggregate results. Return JSON response with all dashboard metrics. Implement caching strategy (e.g., cache for 60 seconds) to reduce database load. Handle errors gracefully with appropriate status codes.

### src/app/api/sessions/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route handlers for sessions. Implement POST handler to create new CodingSession records with sessionType, optional projectId, aiModelsUsed array, and startedAt timestamp. Set initial aiContextHealth to 100 and sessionStatus to ACTIVE. Implement GET handler to list sessions with pagination (query params: page, limit) and optional filters (sessionType, projectId, dateRange). Use NextAuth getServerSession for authentication. Query CodingSession model via Prisma with proper relations (include project, user). Return paginated results with metadata (total count, page info). Validate inputs using Zod schemas. Handle errors with appropriate status codes.

### src/app/api/sessions/[id]/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route handlers for individual session operations. Implement GET handler to retrieve a single session by ID with full details. Implement PATCH handler to update session fields: durationSeconds, aiContextHealth, productivityScore, checkpointNotes. Implement DELETE handler to end a session by setting endedAt timestamp and sessionStatus to COMPLETED or ABANDONED. Use NextAuth getServerSession for authentication and verify the session belongs to the authenticated user. Query CodingSession model via Prisma. Validate inputs using Zod schemas. Return appropriate status codes: 200 for success, 404 for not found, 403 for forbidden, 401 for unauthorized.

### src/app/api/sessions/[id]/checkpoint/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route POST handler for saving checkpoint notes during an active session. Accept checkpoint text in request body and append to the session's checkpointNotes field (consider using array or timestamped entries format). Use NextAuth getServerSession for authentication and verify session ownership. Update the CodingSession record via Prisma. Return the updated session data. Validate input using Zod schema. Handle errors with appropriate status codes. Consider implementing a checkpoint history structure in the checkpointNotes field (e.g., JSON array with timestamp and text).

### src/app/api/projects/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route handlers for projects. Implement POST handler to create new Project records with name, optional description, initial feelsRightScore (default 3), optional shipTarget date, and optional stackNotes. Set isActive to true by default. Implement GET handler to list projects with optional filters (status, isActive) and sorting (by updatedAt, feelsRightScore, momentum). Use NextAuth getServerSession for authentication. Query Project model via Prisma with aggregated session statistics. Return projects with calculated momentum indicators. Validate inputs using Zod schemas. Handle errors with appropriate status codes.

### src/app/api/projects/[id]/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route handlers for individual project operations. Implement GET handler to retrieve a single project by ID with full details and statistics (total sessions, total coding time, momentum). Implement PATCH handler to update project fields: name, description, feelsRightScore, shipTarget, stackNotes, isActive. Implement DELETE handler to soft-delete or archive a project (set isActive to false). Use NextAuth getServerSession for authentication and verify project ownership. Query Project model via Prisma with related CodingSession data for statistics. Validate inputs using Zod schemas. Return appropriate status codes.

### src/app/api/projects/[id]/feels-right/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route PATCH handler specifically for updating the feels right score. Accept a score value (1-5 integer) in the request body. Use NextAuth getServerSession for authentication and verify project ownership. Update the Project.feelsRightScore field via Prisma. Consider logging the score change to Analytics model for historical tracking. Return the updated project data. Validate input using Zod schema (ensure score is between 1-5). Handle errors with appropriate status codes. This dedicated endpoint allows for optimized updates without sending the entire project object.

### src/app/api/projects/[id]/pivot/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route POST handler for recording project pivots. Increment the Project.pivotCount field by 1. Optionally accept pivot notes in the request body to document what changed. Use NextAuth getServerSession for authentication and verify project ownership. Update the Project record via Prisma. Consider creating a Note record with category INSIGHT to document the pivot details. Return the updated project data with new pivot count. Validate inputs using Zod schema. Handle errors with appropriate status codes. This celebrates direction changes as positive exploration.

### src/app/api/notes/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route handlers for notes. Implement POST handler to create new Note records with optional title, content (required), category, tags array, optional sessionId, and optional projectId. Set isTemplate to false by default. Implement GET handler to list notes with optional filters (category, tags, search query for title/content) and pagination. Use Prisma contains query for search functionality. Use NextAuth getServerSession for authentication. Query Note model via Prisma with proper relations (include session, project). Return paginated results. Validate inputs using Zod schemas. Handle errors with appropriate status codes.

### src/app/api/notes/[id]/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route handlers for individual note operations. Implement GET handler to retrieve a single note by ID with full details. Implement PATCH handler to update note fields: title, content, category, tags, isTemplate. Implement DELETE handler to permanently delete a note. Use NextAuth getServerSession for authentication and verify note ownership. Query Note model via Prisma. Validate inputs using Zod schemas. Return appropriate status codes: 200 for success, 404 for not found, 403 for forbidden, 401 for unauthorized. Consider soft delete option for future recovery.

### src/app/api/analytics/streak/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route GET handler for calculating ship streaks. Query the Analytics model for the authenticated user, ordered by date descending. Implement streak calculation algorithm: iterate through consecutive days checking shipCount > 0, break on first gap to get current streak. Calculate longest streak by finding the maximum consecutive days in the entire history. Handle timezone correctly using User.timezone field. Use NextAuth getServerSession for authentication. Return JSON response with currentStreak, longestStreak, lastShipDate. Implement caching to reduce database load. Handle errors with appropriate status codes.

### src/app/api/analytics/ship/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route POST handler for marking a ship today. Use the authenticated user's timezone to determine the current date. Create or update an Analytics record for today's date, incrementing the shipCount field. Use Prisma upsert operation with the unique constraint on [userId, date]. Update the User.shipStreak field if this extends the current streak. Use NextAuth getServerSession for authentication. Return the updated analytics record and new streak count. Validate that the date is today (prevent backdating). Handle errors with appropriate status codes. Consider adding optional notes field to document what was shipped.

### src/app/api/analytics/weekly/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route GET handler for weekly ship data. Query the Analytics model for the last 7 days of data for the authenticated user. Use the user's timezone to calculate the date range correctly. Return an array of objects with date and shipCount for each day. Fill in missing days with shipCount of 0 for complete visualization. Use NextAuth getServerSession for authentication. Query via Prisma with date range filter. Return JSON response with array of daily data. Implement caching strategy. Handle errors with appropriate status codes.

### src/styles/globals.css(MODIFY)

Enhance the global styles with additional custom CSS variables and utility classes for FlowForge. Ensure the custom color palette is properly defined as CSS variables: --flow-green (#00D9A5), --caution-amber (#FFB800), --stuck-red (#FF4757), --claude-purple (#7C3AED), --neutral-slate (#2F3542). Add utility classes for common patterns like card styles, button variants, and animation keyframes. Implement dark mode support using CSS variables that change based on data-theme attribute. Add responsive typography scale. Include focus styles for accessibility. Add animation classes for celebrations (confetti, streak milestones). Ensure all Radix UI component overrides are styled consistently.

### src/components/providers/providers.tsx(MODIFY)

References: 

- src/lib/auth.ts

Enhance the providers component to include all necessary context providers for the application. Wrap children with SessionProvider from next-auth/react for authentication context (already imported from `src/lib/auth.ts`). Add QueryClientProvider from @tanstack/react-query with configured QueryClient (staleTime, cacheTime, refetchOnWindowFocus settings). Add ReactQueryDevtools for development. Include Toaster component from Radix Toast for global toast notifications. Consider adding ThemeProvider for dark mode support. Ensure proper provider nesting order: SessionProvider outermost, then QueryClientProvider, then other providers.

### src/types/index.ts(MODIFY)

References: 

- prisma/schema.prisma

Extend the TypeScript type definitions to include all necessary types for the application. Import and re-export Prisma types from @prisma/client for models (User, Project, CodingSession, Habit, Note, etc.) and enums (FlowState, SessionType, SessionStatus, etc.). Define additional types for API responses: PaginatedResponse<T>, ApiResponse<T>, ApiError. Define types for component props and state: SessionTimerState, DashboardStats, ProjectWithStats, NoteWithRelations. Define types for form inputs and validation schemas. Ensure all types are properly exported for use throughout the application.

### src/lib/utils.ts(MODIFY)

Enhance the utility functions file with additional helper functions needed throughout the application. Add date formatting functions (formatDuration, formatRelativeTime, formatDate) using date-fns library (already in dependencies). Add string utilities (truncate, slugify). Add number formatting (formatNumber, formatPercentage). Add className merging utility using clsx and tailwind-merge (already in dependencies). Add validation helpers. Add color utilities for generating project colors. Add timezone conversion helpers using User.timezone. Ensure all functions are properly typed and exported.

### public/manifest.json(MODIFY)

Enhance the PWA manifest with complete configuration for installability. Update name to 'FlowForge - AI Productivity Companion' and short_name to 'FlowForge'. Set start_url to '/dashboard'. Set display to 'standalone' for app-like experience. Add theme_color '#7C3AED' (claude-purple) and background_color '#ffffff'. Add comprehensive icons array with sizes 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512 (reference icons in public/icons/ directory). Add description field. Add categories: ['productivity', 'developer-tools']. Add shortcuts for quick actions: Start Session, Quick Capture, Mark Ship. Ensure all fields meet PWA requirements for iOS and Android.

### src/app/(dashboard)/habits/page.tsx(NEW)

References: 

- src/app/(dashboard)/layout.tsx(NEW)

Create the habits dashboard page for Phase 2. Display all user habits with current streaks and check-in functionality. Fetch habits using React Query from the habits API endpoint. Show default habits (Daily Ship, Context Refresh, Code Review, Backup Check, Flow Block) that were created during user signup. Render HabitCard components for each habit. Include 'Add Custom Habit' button for creating additional habits. Show summary statistics: total active habits, longest current streak, habits completed today. Implement loading states and empty state. Sort habits by streak count descending to highlight achievements.

### src/components/habits/HabitCard.tsx(NEW)

Create a habit card component for Phase 2 that displays individual habit information with streak tracking. Show habit name, category badge, current streak with fire emoji (🔥), target frequency, and last completed date. Include a prominent 'Check In' button that calls the habit completion API endpoint. Disable the button if already completed today. Show visual celebration (confetti animation) for milestone streaks (7, 30, 100 days). Display longest streak as a goal indicator. Use color coding: green for active streaks, gray for broken streaks. Include action menu with options to edit habit settings or archive. Make the card visually engaging to motivate daily check-ins.

### src/components/habits/HabitCheckIn.tsx(NEW)

Create a check-in interface component for Phase 2 that handles habit completion. Implement a button or card that users click to mark a habit as complete for today. On click, call the habit completion API endpoint to create a HabitCompletion record. Update the habit's streakCount and lastCompletedAt fields. Show immediate visual feedback with animation or toast notification. Optionally allow adding notes to the completion. Handle the case where the habit was already completed today (show 'Completed ✓' state). Calculate and display if the check-in extends the current streak. Implement optimistic updates for instant UI feedback.

### src/lib/habitService.ts(NEW)

References: 

- prisma/schema.prisma

Create a business logic module for Phase 2 habit tracking operations. Export functions: createHabit, completeHabit, calculateStreak, getHabitHistory. Implement streak calculation algorithm: query HabitCompletion records ordered by date, iterate through consecutive days, break on first gap. Handle different target frequencies (DAILY, WEEKLY, CUSTOM). Update Habit.currentStreak and longestStreak fields. Include helper functions for determining if a habit is due today, formatting streak displays, and calculating completion rates. Handle API calls with proper error handling and return typed results.

### src/app/(dashboard)/analytics/page.tsx(NEW)

References: 

- src/app/(dashboard)/layout.tsx(NEW)

Create the enhanced analytics dashboard page for Phase 2. Display comprehensive productivity insights with multiple visualization components: FlowScoreChart (30-day trend), ModelPerformanceCard (AI model comparison), BestTimesHeatmap (productivity patterns), WeeklyShipChart (deployment frequency). Fetch analytics data using React Query from various analytics API endpoints. Show summary metrics at the top: average flow score, most productive AI model, best time of day, total ships this month. Implement date range selector for filtering data. Use Recharts library for all visualizations. Ensure responsive layout that adapts to mobile screens. Include export functionality for data download.

### src/components/analytics/FlowScoreChart.tsx(NEW)

Create a line chart component for Phase 2 using Recharts to visualize flow score over time. Fetch data from the flow-score analytics API endpoint. Display the last 30 days of average daily productivity scores (aggregated from CodingSession.productivityScore). Use a smooth line chart with gradient fill. Show trend line or moving average. Include tooltip showing exact score and date on hover. Use color coding: green for high scores (7-10), yellow for medium (4-6), red for low (1-3). Add markers for significant events (ships, pivots). Make the chart responsive to container width. Show empty state with encouragement if no data available.

### src/components/analytics/ModelPerformanceCard.tsx(NEW)

Create a comparison card component for Phase 2 that shows AI model effectiveness. Fetch data from the model-performance analytics API endpoint. Display average productivity scores grouped by AI model (from CodingSession.aiModelsUsed). Show each model with its average score, total sessions, and total coding time. Use bar chart or card layout for comparison. Highlight the best-performing model. Include model-specific icons or colors (Claude purple, GPT teal, etc.). Show insights like 'Claude 3.5 works best for building' or 'GPT-4 excels at debugging'. Make it actionable by suggesting which model to use for different session types.

### src/components/analytics/BestTimesHeatmap.tsx(NEW)

Create a heatmap visualization component for Phase 2 that shows productivity patterns by time of day and day of week. Fetch data from the best-times analytics API endpoint. Analyze CodingSession start times to identify peak productivity windows. Display a 7x24 grid (days of week vs hours of day) with color intensity representing productivity score or session frequency. Use green gradient for high productivity times. Show tooltip with exact metrics on hover. Highlight the user's best time of day prominently. Include insights like 'You're most productive on Tuesday mornings' or 'Avoid Friday afternoons for deep work'. Use Recharts or custom SVG for the heatmap visualization.

### src/lib/analyticsCalculations.ts(NEW)

References: 

- prisma/schema.prisma

Create a business logic module for Phase 2 complex analytics calculations. Export functions: calculateFlowScore (aggregate productivity scores by day), calculateModelPerformance (group by AI model and calculate averages), calculateBestTimes (analyze session start times for patterns), calculateShipRate (deployments per week vs coding hours). Implement time-series aggregation logic. Handle timezone conversions using User.timezone. Include statistical functions for averages, trends, and percentiles. Return typed results with formatted data ready for visualization components. Handle edge cases like insufficient data or outliers.

### src/components/focus/FocusTimer.tsx(NEW)

Create a Pomodoro-style focus timer component for Phase 2. Implement configurable timer durations: 25/50 minute work sessions with 5/10 minute breaks. Display large countdown timer with circular progress indicator. Include controls: Start, Pause, Reset, Skip Break. Integrate with active coding session (start a session when focus timer starts). Show current phase (Focus/Break) prominently. Play gentle sound or notification when timer completes. Track completed focus sessions (pomodoros) for the day. Use browser Notification API to alert user when timer ends (with permission). Store timer state in localStorage to survive page refreshes. Style with calming colors and minimal distractions.

### src/components/focus/ContextHealthAlert.tsx(NEW)

Create an alert component for Phase 2 that warns when AI context health degrades. Monitor the active session's aiContextHealth value from sessionStore. Show warning banner when health drops below 40 (yellow) and critical alert below 20 (red). Display message like 'Your AI context is getting stale. Consider starting a fresh conversation.' Include action buttons: 'Refresh Context' (ends current session and suggests starting new one), 'Continue Anyway', 'Dismiss'. Use Radix Alert component for accessibility. Show tips for maintaining context health: keep conversations focused, use checkpoints, start fresh after major pivots. Make the alert non-intrusive but noticeable.

### src/components/focus/BreakReminder.tsx(NEW)

Create a break reminder component for Phase 2 that suggests breaks after extended coding sessions. Monitor total active session time from sessionStore. Show gentle reminder after 2 hours of continuous coding: 'You've been coding for 2 hours. Time for a break?' Include action buttons: 'Take 5 min break' (pauses session, starts break timer), 'Take 15 min break', 'Keep going'. Use non-intrusive notification style (toast or banner). Track break frequency and show encouragement for taking breaks. Prevent frustration spirals by enforcing breaks during stuck sessions (low productivity score). Make reminders dismissible but persistent if ignored multiple times.

### src/lib/focusManager.ts(NEW)

Create a business logic module for Phase 2 focus mode functionality. Export functions: startFocusSession (initialize timer and session), pauseFocus, resumeFocus, endFocus, checkContextHealth (evaluate if refresh needed), suggestBreak (determine if break is due). Implement timer logic with configurable durations. Track focus session statistics: completed pomodoros, total focus time, break compliance. Include helper functions for calculating optimal break timing based on session duration and productivity score. Handle integration with coding sessions (auto-start session when focus starts). Return typed results for UI consumption.

### src/app/api/habits/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route handlers for Phase 2 habit management. Implement GET handler to list all habits for the authenticated user with current streak information. Include related HabitCompletion records to calculate streaks. Implement POST handler to create custom habits with name, description, category, and targetFrequency. Use NextAuth getServerSession for authentication. Query Habit model via Prisma with proper relations. Return habits sorted by currentStreak descending. Validate inputs using Zod schemas. Handle errors with appropriate status codes. Ensure default habits were created during user signup via NextAuth events.

### src/app/api/habits/[id]/complete/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route POST handler for Phase 2 habit completion. Create a HabitCompletion record for today with optional notes. Update the Habit.lastCompletedAt timestamp and recalculate currentStreak and longestStreak. Use the user's timezone to determine today's date correctly. Prevent duplicate completions for the same day. Use NextAuth getServerSession for authentication and verify habit ownership. Query Habit and HabitCompletion models via Prisma. Return the updated habit with new streak information. Validate inputs using Zod schema. Handle errors with appropriate status codes. Check if this completion achieves a milestone (7, 30, 100 days) and include that in the response for UI celebration.

### src/app/api/habits/[id]/streak/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route GET handler for Phase 2 habit streak history. Query all HabitCompletion records for the specified habit, ordered by date. Calculate current streak and longest streak using the streak calculation algorithm. Return detailed streak information: current streak count, longest streak count, completion dates array, completion rate (percentage of days completed vs target frequency). Use NextAuth getServerSession for authentication and verify habit ownership. Query via Prisma with date range filters. Return JSON response with streak data. Implement caching strategy. Handle errors with appropriate status codes.

### src/app/api/analytics/flow-score/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route GET handler for Phase 2 flow score time-series data. Query CodingSession records for the authenticated user with optional date range parameter (default last 30 days). Aggregate productivityScore by date to calculate daily average flow scores. Return array of objects with date and average score. Fill in missing days with null or 0 for complete visualization. Use NextAuth getServerSession for authentication. Query via Prisma with date range filter and aggregation. Return JSON response with time-series data. Implement caching strategy. Handle errors with appropriate status codes. Include metadata like overall average and trend direction.

### src/app/api/analytics/model-performance/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route GET handler for Phase 2 AI model performance comparison. Query CodingSession records for the authenticated user. Group sessions by aiModelsUsed (handle array field appropriately). Calculate average productivityScore, total sessions, and total coding time for each AI model. Return array of objects with model name and performance metrics. Sort by average score descending. Use NextAuth getServerSession for authentication. Query via Prisma with aggregation logic. Return JSON response with model comparison data. Handle cases where multiple models were used in a single session. Include insights like best model for each session type. Handle errors with appropriate status codes.

### src/app/api/analytics/best-times/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- prisma/schema.prisma

Create API route GET handler for Phase 2 productivity pattern analysis. Query CodingSession records for the authenticated user. Extract hour of day and day of week from startedAt timestamps (convert to user's timezone). Group sessions by time slot and calculate average productivityScore or session frequency. Return a 2D array or object representing the heatmap data (7 days x 24 hours). Identify and highlight the user's most productive time slots. Use NextAuth getServerSession for authentication. Query via Prisma with timezone-aware date extraction. Return JSON response with heatmap data and insights. Handle errors with appropriate status codes.