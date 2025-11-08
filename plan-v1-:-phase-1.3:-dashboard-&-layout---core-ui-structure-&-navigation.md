I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The FlowForge codebase has a solid foundation with Next.js 14 App Router, NextAuth v5 for authentication, Prisma ORM with comprehensive schema, and all necessary UI dependencies (Radix UI, Lucide icons, React Query, Zustand). The root layout already wraps children with a Providers component that currently only includes QueryClientProvider. The Prisma schema shows User.preferences as JSON field for storing todaysFocus, User.flowState for VibeMeter, User.shipStreak for streak tracking, and proper relationships between models. Custom Tailwind colors are defined (flow-green, caution-amber, stuck-red, claude-purple, neutral-slate) for consistent theming. The user indicated Phase 1.1 (stores/services) and Phase 1.2 (API routes) are implemented, so this phase will reference those modules for data fetching and state management.

### Approach

Create a responsive dashboard layout using Next.js 14 App Router patterns with server-side auth checks and client-side interactivity. Implement a two-tier navigation system: Sidebar for desktop (>768px) and MobileNav for mobile (<768px). Build the main dashboard page as a composition of five widget components that fetch data via React Query hooks and manage local state via Zustand stores. Update the Providers component to include NextAuth SessionProvider and Radix Toast for notifications. Follow atomic design principles with reusable components, consistent error handling, and optimistic updates for better UX.

### Reasoning

I explored the repository structure, read existing files (layout.tsx, auth.ts, providers.tsx, schema.prisma, types/index.ts, utils.ts, globals.css, tailwind.config.ts), reviewed the master plan specifications for detailed component requirements, confirmed all necessary dependencies are installed in package.json, and verified the Prisma schema structure to understand data models and relationships. I identified that stores and API routes from previous phases will be referenced but may need to be created alongside this work.

## Mermaid Diagram

sequenceDiagram
    participant User
    participant Browser
    participant DashboardLayout
    participant DashboardPage
    participant Widgets
    participant Stores
    participant ReactQuery
    participant API

    User->>Browser: Navigate to /dashboard
    Browser->>DashboardLayout: Server Component Auth Check
    DashboardLayout->>API: getServerSession()
    
    alt Not Authenticated
        API-->>DashboardLayout: No session
        DashboardLayout->>Browser: Redirect to /auth/signin
    else Authenticated
        API-->>DashboardLayout: Valid session
        DashboardLayout->>Browser: Render Layout (Sidebar + Content)
        Browser->>DashboardPage: Load Dashboard Page
        
        par Fetch Dashboard Data
            DashboardPage->>ReactQuery: useDashboardStats()
            ReactQuery->>API: GET /api/dashboard/stats
            API-->>ReactQuery: Dashboard stats data
            ReactQuery-->>DashboardPage: Stats available
        end
        
        DashboardPage->>Widgets: Render TodaysFocus
        Widgets->>ReactQuery: useQuery('/api/dashboard/focus')
        ReactQuery->>API: GET /api/dashboard/focus
        API-->>ReactQuery: Focus text
        ReactQuery-->>Widgets: Display focus
        
        DashboardPage->>Widgets: Render ActiveSession
        Widgets->>Stores: useSessionStore()
        Stores-->>Widgets: Session state
        Widgets->>Browser: Show timer/controls
        
        DashboardPage->>Widgets: Render ShipStreak
        Widgets->>ReactQuery: useQuery('/api/analytics/streak')
        ReactQuery->>API: GET /api/analytics/streak
        API-->>ReactQuery: Streak data
        ReactQuery-->>Widgets: Display streak
        
        DashboardPage->>Widgets: Render VibeMeter + QuickCapture
        Widgets->>Browser: Display all widgets
        
        User->>Widgets: Mark Ship Today
        Widgets->>ReactQuery: useMutation('/api/analytics/ship')
        ReactQuery->>API: POST /api/analytics/ship
        API-->>ReactQuery: Updated streak
        ReactQuery->>ReactQuery: Invalidate queries
        ReactQuery-->>Widgets: Refetch & celebrate
        Widgets->>Browser: Show celebration toast
    end

## Proposed File Changes

### src/components/providers/providers.tsx(MODIFY)

References: 

- src/styles/globals.css

**Add SessionProvider and Toaster to the providers stack:**

1. Import SessionProvider from 'next-auth/react' to provide authentication context to client components.

2. Import Toaster component from '@radix-ui/react-toast' and create a custom Toast component wrapper for notifications.

3. Wrap the existing QueryClientProvider with SessionProvider as the outer provider, ensuring session data is available to React Query hooks that need authentication.

4. Add Toaster component at the end of the provider tree (after children) to render toast notifications globally.

5. Configure Toaster with default positioning (bottom-right), duration (5000ms), and styling that matches FlowForge design tokens from `src/styles/globals.css`.

6. The provider hierarchy should be: SessionProvider > QueryClientProvider > children > Toaster.

7. Keep the existing QueryClient configuration with staleTime: 60000 and refetchOnWindowFocus: false.

8. Keep ReactQueryDevtools for development environment debugging.

### src/app/(dashboard)/layout.tsx(NEW)

References: 

- src/lib/auth.ts

**Create the authenticated dashboard layout with responsive navigation:**

1. Import getServerSession from 'next-auth' and authOptions from `src/lib/auth.ts` for server-side authentication.

2. Import redirect from 'next/navigation' to handle unauthenticated users.

3. Import Sidebar component from `src/components/layout/Sidebar.tsx` and MobileNav from `src/components/layout/MobileNav.tsx`.

4. Define as async server component that calls getServerSession(authOptions) to check authentication.

5. If no session exists, redirect to '/auth/signin' using redirect() function.

6. Return layout structure with fixed Sidebar on left for desktop (hidden on mobile with 'hidden md:flex'), main content area with proper padding to avoid overlap, and fixed MobileNav at bottom for mobile (hidden on desktop with 'md:hidden').

7. Apply responsive padding to main content: 'pb-20 md:pb-0' for mobile nav clearance, 'md:pl-64' for sidebar clearance on desktop.

8. Use semantic HTML with aside for Sidebar, main for content area, and nav for MobileNav.

9. Add min-h-screen to ensure full viewport height coverage.

10. Pass session data to client components via props if needed for user info display.

### src/components/layout/Sidebar.tsx(NEW)

References: 

- src/styles/globals.css

**Create desktop navigation sidebar with route links and user menu:**

1. Mark as 'use client' since it uses interactive elements and hooks.

2. Import Link from 'next/link', usePathname from 'next/navigation' for active route detection.

3. Import icons from 'lucide-react': LayoutDashboard, Clock, FolderKanban, StickyNote, BarChart3.

4. Import UserMenu component from `src/components/layout/UserMenu.tsx`.

5. Define navigation items array with objects containing: label, href, icon component. Items: Dashboard (/dashboard), Sessions (/sessions), Projects (/projects), Notes (/notes), Analytics (/analytics).

6. Use usePathname() to determine active route and apply active styling (bg-primary/10, text-primary, border-l-2 border-primary).

7. Render fixed sidebar with w-64 width, full height, bg-card background, border-r border.

8. Display FlowForge logo/text at top with flow-green color and appropriate padding.

9. Map navigation items to Link components with icon, label, and active state styling.

10. Position UserMenu component at bottom of sidebar with mt-auto.

11. Apply hover states to navigation links: hover:bg-accent transition-colors.

12. Use flex flex-col for vertical layout with space-between to push UserMenu to bottom.

13. Add appropriate padding and spacing: p-4 for container, gap-2 for nav items.

### src/components/layout/MobileNav.tsx(NEW)

References: 

- src/styles/globals.css

**Create mobile bottom navigation with essential routes and more menu:**

1. Mark as 'use client' for interactive functionality.

2. Import Link from 'next/link', usePathname from 'next/navigation'.

3. Import icons from 'lucide-react': LayoutDashboard, Clock, FolderKanban, MoreHorizontal.

4. Import Sheet, SheetContent, SheetTrigger from '@radix-ui/react-dialog' for the More menu.

5. Import useState from 'react' to manage sheet open state.

6. Define primary nav items (Dashboard, Sessions, Projects) and secondary items for sheet (Notes, Analytics, Settings).

7. Render fixed bottom navigation with 'fixed bottom-0 left-0 right-0 z-50' positioning.

8. Apply safe area insets for iOS: 'pb-safe' or custom padding-bottom.

9. Use bg-card with border-t border, backdrop-blur-lg for glassmorphism effect.

10. Create flex container with justify-around for even spacing of nav buttons.

11. Each nav button should be minimum 44px touch target (h-16 w-16) for accessibility.

12. Show icon and optional small label below, apply active state styling similar to Sidebar.

13. Fourth button opens Sheet with More menu containing Notes, Analytics, and future Settings link.

14. Sheet should slide up from bottom on mobile, contain navigation links with icons and labels.

15. Use usePathname() to highlight active route in both bottom nav and sheet menu.

16. Apply transition animations for smooth interactions.

### src/components/layout/UserMenu.tsx(NEW)

References: 

- src/lib/auth.ts

**Create user profile dropdown menu with session info and actions:**

1. Mark as 'use client' for interactive dropdown functionality.

2. Import useSession from 'next-auth/react' to access user session data.

3. Import signOut from 'next-auth/react' for logout functionality.

4. Import DropdownMenu components from '@radix-ui/react-dropdown-menu': DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel.

5. Import icons from 'lucide-react': User, Settings, HelpCircle, LogOut, ChevronDown.

6. Import Avatar components from '@radix-ui/react-avatar' for user image display.

7. Use useSession() hook to get session data (user name, email, image).

8. Render DropdownMenuTrigger as button showing user avatar, name, and chevron icon.

9. Display user image in Avatar component with fallback to first letter of name or email.

10. DropdownMenuContent should contain: user info header (name, email), separator, menu items (Profile/Settings, Help/Documentation, Sign Out).

11. Sign Out item calls signOut({ callbackUrl: '/' }) to log out and redirect to home.

12. Apply appropriate styling: hover states, focus rings, proper spacing.

13. Position dropdown to align-start and offset appropriately from trigger.

14. Add keyboard navigation support (built into Radix DropdownMenu).

15. Show loading state if session is loading.

16. Consider adding user's current flow state indicator in the header section for quick reference.

### src/app/(dashboard)/dashboard/page.tsx(NEW)

References: 

- src/lib/utils.ts

**Create main dashboard page composing all widget components:**

1. Mark as 'use client' since widgets use interactive hooks and state.

2. Import dashboard widget components: TodaysFocus from `src/components/dashboard/TodaysFocus.tsx`, ActiveSession from `src/components/dashboard/ActiveSession.tsx`, ShipStreak from `src/components/dashboard/ShipStreak.tsx`, VibeMeter from `src/components/dashboard/VibeMeter.tsx`, QuickCapture from `src/components/dashboard/QuickCapture.tsx`.

3. Import useQuery from '@tanstack/react-query' for fetching dashboard stats.

4. Create custom hook useDashboardStats that fetches from '/api/dashboard/stats' endpoint, returns activeSessionId, shipStreak, activeProjectsCount, todaysCodingMinutes, flowState.

5. Implement responsive grid layout using CSS Grid or Tailwind grid classes.

6. Desktop layout (md and up): 2-column grid with TodaysFocus spanning full width at top, then 2-column layout for other widgets.

7. Mobile layout: single column stack with proper spacing.

8. Grid structure: TodaysFocus (col-span-2), ActiveSession (col-span-1), ShipStreak (col-span-1), VibeMeter (col-span-1), QuickCapture (col-span-1).

9. Apply consistent gap between cards: gap-4 or gap-6.

10. Add page header with greeting based on time of day using getTimeOfDay utility from `src/lib/utils.ts`.

11. Show loading skeleton states while dashboard stats are fetching.

12. Implement error boundary or error state display if data fetching fails.

13. Pass necessary props to widgets: activeSessionId to ActiveSession, shipStreak to ShipStreak, flowState to VibeMeter.

14. Add padding to page container: p-4 md:p-6 lg:p-8.

15. Consider adding a refresh button or pull-to-refresh for mobile to manually refetch dashboard data.

### src/components/dashboard/TodaysFocus.tsx(NEW)

References: 

- src/store/dashboardStore.ts
- src/lib/utils.ts

**Create hero card for daily focus objective with inline editing:**

1. Mark as 'use client' for interactive editing functionality.

2. Import useState from 'react' for managing edit mode and input value.

3. Import useQuery, useMutation from '@tanstack/react-query' for data fetching and updates.

4. Import useDashboardStore from `src/store/dashboardStore.ts` for temporary state management.

5. Import icons from 'lucide-react': Target, Edit2, Check, X.

6. Create useQuery hook to fetch focus text from '/api/dashboard/focus' endpoint.

7. Create useMutation hook to update focus text via PUT to '/api/dashboard/focus'.

8. Manage local state for isEditing (boolean) and editValue (string).

9. Render large card with prominent styling: bg-gradient-to-br from-primary/10 to-primary/5, border border-primary/20, rounded-lg, p-6.

10. Display Target icon and 'Today's Focus' label at top.

11. Show focus text as large heading (text-2xl md:text-3xl) when not editing, with placeholder 'What's your main focus today?' if empty.

12. On click, enter edit mode: show textarea with current value, auto-focus, and action buttons (Save, Cancel).

13. Save button calls mutation with new value, shows loading state, displays success toast on completion.

14. Cancel button reverts to display mode without saving.

15. Use debounced auto-save to dashboardStore while typing to prevent data loss.

16. Apply smooth transitions between edit and display modes.

17. Show Edit icon button when hovering over text in display mode.

18. Handle loading and error states gracefully with appropriate UI feedback.

### src/components/dashboard/ActiveSession.tsx(NEW)

References: 

- src/store/sessionStore.ts
- src/lib/utils.ts
- src/lib/sessionManager.ts

**Create active session display with timer and controls:**

1. Mark as 'use client' for real-time timer updates.

2. Import useSessionStore from `src/store/sessionStore.ts` for session state management.

3. Import useQuery from '@tanstack/react-query' to fetch active session details if needed.

4. Import icons from 'lucide-react': Play, Pause, Square, Bookmark, Clock.

5. Import Progress from '@radix-ui/react-progress' for context health bar.

6. Import formatDuration, getFlowStateColor utilities from `src/lib/utils.ts`.

7. Import getSessionTypeIcon from `src/lib/sessionManager.ts` for session type display.

8. Connect to sessionStore using selectors: activeSessionId, sessionType, elapsedSeconds, isPaused, contextHealth, isActive.

9. If no active session (activeSessionId is null), show 'Start Session' button that opens StartSessionDialog (to be implemented in Phase 1.4).

10. If active session exists, display card with session type icon and label, running timer showing elapsed time in HH:MM:SS format using formatDuration.

11. Show AI model badge if aiModel is set in store.

12. Display context health progress bar using Radix Progress component, color-coded: green (70-100), yellow (40-69), red (0-39) using getFlowStateColor utility.

13. Include action buttons: Pause/Resume (toggles isPaused in store), Checkpoint (opens dialog for checkpoint notes), End Session (calls endSession action).

14. Buttons should call appropriate sessionStore actions: pauseSession, resumeSession, endSession.

15. Show visual warning icon when context health drops below 40.

16. Apply card styling: bg-card, border, rounded-lg, p-4, shadow-sm.

17. Use useEffect to update timer every second when session is active and not paused.

18. For Phase 1.3, stub the StartSessionDialog button to show toast saying 'Coming in Phase 1.4' instead of opening dialog.

### src/components/dashboard/ShipStreak.tsx(NEW)

References: 

- src/lib/analyticsService.ts
- src/lib/utils.ts

**Create ship streak display with mark ship functionality:**

1. Mark as 'use client' for interactive button functionality.

2. Import useQuery, useMutation, useQueryClient from '@tanstack/react-query' for data fetching and updates.

3. Import icons from 'lucide-react': Flame, TrendingUp, Package.

4. Import Button from a button component (create simple button wrapper if needed) or use native button with Tailwind styling.

5. Import toast from '@radix-ui/react-toast' or use custom toast hook for notifications.

6. Import formatStreakDisplay, hasShippedToday, getStreakMilestone from `src/lib/analyticsService.ts`.

7. Create useQuery hook to fetch streak data from '/api/analytics/streak' endpoint, returns currentStreak, longestStreak, lastShipDate.

8. Create useMutation hook for marking ship today via POST to '/api/analytics/ship'.

9. Display card with fire emoji (🔥) and current streak number prominently (text-4xl font-bold).

10. Show longest streak as secondary info: 'Best: X days'.

11. Display 'Mark Ship Today' button if hasShippedToday returns false, disabled if already shipped today.

12. Button calls mutation on click, shows loading state during request.

13. On successful ship mark, invalidate streak query to refetch updated data, show celebration toast with streak milestone message if applicable.

14. If streak is extended (new streak > previous), trigger confetti animation or special celebration UI.

15. Show last ship date if no ship today: 'Last shipped X days ago' using formatRelativeTime from `src/lib/utils.ts`.

16. Apply color coding: flow-green for active streaks, muted for no streak.

17. Card styling: bg-card, border, rounded-lg, p-4, shadow-sm.

18. Handle loading and error states with appropriate UI feedback.

19. Consider adding a mini calendar view showing last 7 days with ship indicators (green dots for ship days).

### src/components/dashboard/VibeMeter.tsx(NEW)

References: 

- src/types/index.ts
- tailwind.config.ts

**Create flow state indicator with manual update capability:**

1. Mark as 'use client' for interactive state updates.

2. Import useState from 'react' for managing dropdown/selector state.

3. Import useQuery, useMutation from '@tanstack/react-query' for fetching and updating flow state.

4. Import FlowState enum from `src/types/index.ts`.

5. Import Select components from '@radix-ui/react-select' for flow state selector.

6. Import icons from 'lucide-react': Activity, AlertCircle, Zap, Sparkles.

7. Create useQuery hook to fetch current user flow state (could be from dashboard stats or separate endpoint).

8. Create useMutation hook to update flow state via PATCH to user preferences or dedicated endpoint.

9. Define flow state display mapping: BLOCKED (🚫, red, 'Blocked'), NEUTRAL (😐, yellow, 'Neutral'), FLOWING (🟢, green, 'Flowing'), DEEP_FLOW (⚡, bright green, 'Deep Flow').

10. Display current flow state prominently with emoji/icon, label, and color-coded background.

11. Provide Select dropdown or button group to manually change flow state.

12. On selection change, call mutation to update user's flow state, show loading indicator.

13. Display success toast on successful update.

14. Apply color-coded styling based on current state: bg-stuck-red/10 for BLOCKED, bg-caution-amber/10 for NEUTRAL, bg-flow-green/10 for FLOWING, bg-flow-green/20 for DEEP_FLOW.

15. Card styling: border, rounded-lg, p-4, shadow-sm.

16. Include brief description of what each flow state means (tooltip or small text).

17. Consider adding automatic flow state detection based on session activity (future enhancement note).

18. Handle loading and error states gracefully.

### src/components/dashboard/QuickCapture.tsx(NEW)

References: 

- src/store/dashboardStore.ts
- src/types/index.ts

**Create one-tap note capture with optimistic updates:**

1. Mark as 'use client' for interactive input functionality.

2. Import useState from 'react' for managing input value.

3. Import useMutation, useQueryClient from '@tanstack/react-query' for note creation.

4. Import useDashboardStore from `src/store/dashboardStore.ts` for persisting unsaved text.

5. Import icons from 'lucide-react': Plus, Lightbulb, Send.

6. Import toast from '@radix-ui/react-toast' for success notifications.

7. Import NoteCategory from `src/types/index.ts`.

8. Connect to dashboardStore to get and update quickCaptureBuffer.

9. Create useMutation hook for creating notes via POST to '/api/notes' with category: INSIGHT, tags: [].

10. Render compact card with textarea input and submit button.

11. Input placeholder: 'Quick capture an idea...' or similar encouraging text.

12. On input change, update both local state and dashboardStore.quickCaptureBuffer to prevent data loss.

13. Submit button (Plus or Send icon) calls mutation with current input value.

14. Use optimistic update: immediately clear input and show success state before API response.

15. On successful mutation, clear dashboardStore.quickCaptureBuffer, show success toast, invalidate notes query.

16. On mutation error, restore input value from buffer, show error toast.

17. Apply card styling: bg-card, border, rounded-lg, p-3, shadow-sm.

18. Make textarea auto-resize or use fixed small height (2-3 rows).

19. Add keyboard shortcut hint: 'Press Cmd/Ctrl+Enter to capture' (implement keyboard handler).

20. Consider adding category selector for quick capture (default to INSIGHT but allow changing).

21. Show character count if approaching any limits.

22. Disable submit button when input is empty.

### src/hooks/useDashboardStats.ts(NEW)

References: 

- src/types/index.ts

**Create custom React Query hook for fetching dashboard statistics:**

1. Import useQuery from '@tanstack/react-query'.

2. Import DashboardStats type from `src/types/index.ts`.

3. Define query key constant: ['dashboard', 'stats'].

4. Create async function fetchDashboardStats that makes GET request to '/api/dashboard/stats'.

5. Parse response JSON and return typed DashboardStats object.

6. Export useDashboardStats hook that wraps useQuery with the fetch function and query key.

7. Configure query options: staleTime: 60000 (1 minute), refetchInterval: 300000 (5 minutes for auto-refresh).

8. Return query result with data, isLoading, isError, error, refetch properties.

9. Handle fetch errors by throwing or returning error object for React Query to catch.

10. Add TypeScript types for return value and error handling.

### src/hooks/useToast.ts(NEW)

**Create custom hook for toast notifications using Radix Toast:**

1. Import useState from 'react'.

2. Import Toast components from '@radix-ui/react-toast' if not already wrapped in Providers.

3. Define toast types: 'success', 'error', 'info', 'warning'.

4. Create hook that returns toast function accepting message (string) and type (toast type).

5. Manage toast state internally with array of toast objects containing id, message, type.

6. Implement addToast function that adds new toast to state with unique id.

7. Implement removeToast function that removes toast by id after duration.

8. Return toast function that components can call: toast.success('Message'), toast.error('Error').

9. Configure default duration: 5000ms, allow override via options parameter.

10. Apply appropriate styling based on toast type: success (green), error (red), info (blue), warning (amber).

11. Position toasts in bottom-right corner by default.

12. Support stacking multiple toasts with proper spacing.

13. Add close button to each toast for manual dismissal.

14. Implement auto-dismiss after duration expires.

### src/components/ui/Button.tsx(NEW)

References: 

- src/lib/utils.ts

**Create reusable Button component with variants:**

1. Mark as 'use client' if using interactive features.

2. Import React, forwardRef for ref forwarding.

3. Import Slot from '@radix-ui/react-slot' for composition pattern.

4. Import cn utility from `src/lib/utils.ts` for class merging.

5. Import cva (class-variance-authority) for variant management.

6. Define button variants using cva: default (primary), secondary, destructive, outline, ghost, link.

7. Define size variants: default, sm, lg, icon.

8. Base classes: inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50.

9. Variant classes: default (bg-primary text-primary-foreground hover:bg-primary/90), secondary (bg-secondary text-secondary-foreground hover:bg-secondary/80), destructive (bg-destructive text-destructive-foreground hover:bg-destructive/90), outline (border border-input hover:bg-accent), ghost (hover:bg-accent), link (underline-offset-4 hover:underline).

10. Size classes: default (h-10 px-4 py-2), sm (h-9 px-3), lg (h-11 px-8), icon (h-10 w-10).

11. Accept props: variant, size, asChild (for Slot composition), className, children, disabled, onClick, type.

12. Use forwardRef to forward ref to button element.

13. Render as Slot if asChild is true, otherwise render as button element.

14. Merge variant classes with custom className using cn utility.

15. Export Button component and buttonVariants for external use.

### src/components/ui/Card.tsx(NEW)

References: 

- src/lib/utils.ts

**Create reusable Card component with sub-components:**

1. Import React, forwardRef for ref forwarding.

2. Import cn utility from `src/lib/utils.ts` for class merging.

3. Create Card component as div with base classes: rounded-lg border bg-card text-card-foreground shadow-sm.

4. Accept className prop and merge with base classes using cn.

5. Use forwardRef to forward ref to div element.

6. Create CardHeader sub-component with classes: flex flex-col space-y-1.5 p-6.

7. Create CardTitle sub-component as h3 with classes: text-2xl font-semibold leading-none tracking-tight.

8. Create CardDescription sub-component as p with classes: text-sm text-muted-foreground.

9. Create CardContent sub-component with classes: p-6 pt-0.

10. Create CardFooter sub-component with classes: flex items-center p-6 pt-0.

11. All sub-components should accept className prop for customization.

12. Export Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter as named exports.

13. Use semantic HTML elements where appropriate (header, footer).

14. Ensure all components forward refs properly.