I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase has solid foundations with Next.js 14 App Router, NextAuth v5, Prisma ORM, and all required dependencies installed. The Prisma Analytics model (lines 186-201) includes userId, date, shipCount, flowScore, codingMinutes, contextRefreshes, and metadata fields with a unique constraint on [userId, date]. The User model has timezone (default 'UTC') and shipStreak fields. Custom Tailwind colors (flow-green, caution-amber, stuck-red) and basic animations (fade-in, slide-up, pulse-glow) are defined. No UI components, stores, services, or API routes exist yet beyond the basic auth setup. The master plan provides comprehensive specifications for streak calculation algorithms, API endpoints, and component requirements. Date-fns 3.0.6 is available for timezone-aware date manipulation.

### Approach

Implement Phase 1.7 Analytics & Ship Streak by creating the analyticsService module for streak calculations and API integration, building ShipStreakCard and WeeklyShipChart components using Recharts, extending types and utilities for analytics-specific needs, and creating reusable UI primitives (Button, Card) if they don't exist. The approach follows established patterns from previous phases: service modules for business logic, React Query for server state, Zustand stores for client state (if needed), Radix UI for interactive components, and Tailwind for styling. The streak calculation algorithm will handle timezone-aware date comparisons using the User.timezone field, and celebration animations will use existing Tailwind animation utilities with potential confetti library integration.

### Reasoning

I explored the codebase structure and confirmed the foundation is in place: Recharts 2.10.4 is installed, Prisma Analytics model exists with shipCount and date fields, auth/prisma are configured, custom FlowForge colors are defined in tailwind.config.ts, and basic animation utilities exist in globals.css. I reviewed the master plan specifications for analytics components (lines 133-139, 197-203, 314-342), examined existing phase implementation plans to understand established patterns, and verified that no analytics service, components, or API routes exist yet. The types/index.ts has basic interfaces but needs analytics-specific extensions, and utils.ts needs timezone and date manipulation helpers.

## Mermaid Diagram

sequenceDiagram
    participant User
    participant ShipStreakCard
    participant WeeklyShipChart
    participant AnalyticsService
    participant ReactQuery
    participant API
    participant Prisma

    User->>ShipStreakCard: View dashboard
    ShipStreakCard->>ReactQuery: useQuery(['analytics', 'streak'])
    ReactQuery->>AnalyticsService: fetchStreakData()
    AnalyticsService->>API: GET /api/analytics/streak
    API->>Prisma: Query Analytics records (userId, orderBy date desc)
    Prisma-->>API: Return analytics records
    API->>API: calculateCurrentStreak(records, timezone)
    API->>API: calculateLongestStreak(records)
    API-->>AnalyticsService: Return StreakData
    AnalyticsService-->>ReactQuery: StreakData
    ReactQuery-->>ShipStreakCard: Display streak (🔥 X days)
    
    User->>WeeklyShipChart: View chart
    WeeklyShipChart->>ReactQuery: useQuery(['analytics', 'weekly'])
    ReactQuery->>AnalyticsService: fetchWeeklyShipData()
    AnalyticsService->>API: GET /api/analytics/weekly
    API->>Prisma: Query Analytics (last 7 days, userId)
    Prisma-->>API: Return weekly records
    API->>API: fillMissingDays(records)
    API-->>AnalyticsService: Return WeeklyShipData[]
    AnalyticsService->>AnalyticsService: formatWeeklyDataForChart()
    AnalyticsService-->>ReactQuery: Formatted data
    ReactQuery-->>WeeklyShipChart: Render Recharts BarChart
    
    User->>ShipStreakCard: Click "Mark Ship Today"
    ShipStreakCard->>ReactQuery: useMutation(markShipToday)
    ReactQuery->>AnalyticsService: markShipToday(notes?)
    AnalyticsService->>API: POST /api/analytics/ship
    API->>API: normalizeToUserTimezone(today, timezone)
    API->>Prisma: Upsert Analytics (userId, date)
    Prisma->>Prisma: Increment shipCount
    Prisma-->>API: Updated analytics record
    API->>Prisma: Update User.shipStreak
    API-->>AnalyticsService: Return { analytics, newStreak, isNewMilestone }
    AnalyticsService-->>ReactQuery: Success response
    ReactQuery->>ReactQuery: Invalidate ['analytics', 'streak']
    ReactQuery->>ReactQuery: Invalidate ['analytics', 'weekly']
    ReactQuery-->>ShipStreakCard: Refetch queries
    
    ShipStreakCard->>ShipStreakCard: shouldCelebrate(oldStreak, newStreak)
    alt Is Milestone
        ShipStreakCard->>ShipStreakCard: getStreakMilestone(newStreak)
        ShipStreakCard->>User: Show celebration animation + toast
    else Streak Extended
        ShipStreakCard->>User: Show success toast
    end

## Proposed File Changes

### src/types/index.ts(MODIFY)

References: 

- prisma/schema.prisma

**Extend types with analytics-specific interfaces:**

1. Add Analytics interface matching Prisma model (lines 186-201 in schema.prisma): id (string), userId (string), date (Date), shipCount (number), flowScore (number), codingMinutes (number), contextRefreshes (number), metadata (any | null), createdAt (Date).

2. Add StreakData interface with properties: currentStreak (number), longestStreak (number), lastShipDate (Date | null). Used by ShipStreakCard component and analytics API responses.

3. Add WeeklyShipData interface with properties: date (string in YYYY-MM-DD format), shipCount (number), dayOfWeek (string like 'Mon', 'Tue'). Used by WeeklyShipChart component.

4. Add MarkShipRequest interface with optional notes (string) field for documenting what was shipped.

5. Add ShipStreakCardProps interface with properties: currentStreak (number), longestStreak (number), lastShipDate (Date | null), onMarkShip (function returning Promise<void>), isLoading (boolean).

6. Add WeeklyShipChartProps interface with properties: data (WeeklyShipData array), isLoading (boolean), height (number, optional, default 300).

7. Ensure ApiResponse<T> and PaginatedResponse<T> generic types exist (should be added in Phase 1.1, but verify and add if missing).

8. Export all new analytics-related types for use throughout the application.

### src/lib/utils.ts(MODIFY)

References: 

- src/types/index.ts(MODIFY)

**Add analytics-specific utility functions:**

1. Import necessary functions from date-fns: startOfDay, endOfDay, differenceInDays, differenceInCalendarDays, format, parseISO, addDays, subDays, isAfter, isBefore, isSameDay.

2. Add normalizeToUserTimezone function: accepts date (Date) and timezone (string), returns Date normalized to start of day in user's timezone. Use startOfDay and handle timezone conversion. Critical for accurate 'today' calculations across timezones.

3. Add getUserTimezone function: returns user's timezone string using Intl.DateTimeFormat().resolvedOptions().timeZone. Fallback to 'UTC' if unavailable. Used throughout analytics calculations.

4. Add formatStreakDisplay function: accepts currentStreak (number), returns formatted string with fire emoji: '🔥 X day streak' or '🔥 X days streak' (handle singular/plural). If streak is 0, return 'No active streak'.

5. Add getStreakMilestone function: accepts currentStreak (number), returns milestone message for special streak numbers: 7 days='Week streak! 🎉', 30 days='Month streak! 🎊', 100 days='Century! 🏆', etc. Return null if not a milestone. Used for celebration triggers.

6. Add shouldCelebrate function: accepts previousStreak (number), newStreak (number), returns boolean indicating if celebration should trigger. Celebrate when: newStreak > previousStreak (streak extended) OR newStreak is milestone (7, 30, 100).

7. Add getWeekdayLabel function: accepts date (Date), returns short weekday label ('Mon', 'Tue', etc.) using format(date, 'EEE') from date-fns. Used for chart X-axis labels.

8. Add getLast7Days function: returns array of Date objects for the last 7 days including today, in chronological order. Use subDays to calculate. Used to ensure complete dataset for weekly chart.

9. Add formatChartDate function: accepts date (Date), returns formatted string for chart tooltips (e.g., 'Jan 15, 2024'). Use format(date, 'MMM d, yyyy') from date-fns.

10. Add groupByDate function: accepts array of items with date property, returns Map<string, T[]> grouped by date (YYYY-MM-DD string keys). Use format(date, 'yyyy-MM-dd') for keys. Useful for analytics aggregations.

11. Export all new utility functions for use in analytics service and components.

### src/lib/analyticsService.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create business logic service for analytics calculations and API integration:**

1. Import types from `src/types/index.ts`: Analytics, StreakData, WeeklyShipData, MarkShipRequest, ApiResponse.

2. Import utilities from `src/lib/utils.ts`: normalizeToUserTimezone, getUserTimezone, formatStreakDisplay, getStreakMilestone, shouldCelebrate, getWeekdayLabel, getLast7Days, formatChartDate.

3. Import date utilities from date-fns: startOfDay, differenceInCalendarDays, format, parseISO, isSameDay.

4. Define API_BASE constant: '/api/analytics'.

5. Create fetchStreakData async function: makes GET request to `${API_BASE}/streak`. Returns Promise<ApiResponse<StreakData>> with currentStreak, longestStreak, lastShipDate. Handle fetch errors with try-catch and return error response.

6. Create markShipToday async function: accepts optional notes (string). Makes POST request to `${API_BASE}/ship` with notes in body. Returns Promise<ApiResponse<{ analytics: Analytics, newStreak: number, isNewMilestone: boolean }>>. Handle errors appropriately.

7. Create fetchWeeklyShipData async function: makes GET request to `${API_BASE}/weekly`. Returns Promise<ApiResponse<WeeklyShipData[]>> with 7 days of ship data. Handle errors appropriately.

8. Create calculateCurrentStreak function (client-side helper): accepts analyticsRecords (Analytics array sorted by date descending), userTimezone (string). Implement streak algorithm: start from today (normalized to user timezone), iterate backwards through consecutive days, check if shipCount > 0, increment streak for each consecutive day, break on first gap (missing record or shipCount = 0). Return currentStreak number.

9. Create calculateLongestStreak function (client-side helper): accepts analyticsRecords (Analytics array). Iterate through entire history, track running streak and max streak, for each record with shipCount > 0 increment running streak, when gap found (shipCount = 0 or date gap > 1 day) compare running streak to max and update if higher, reset running streak. Return longestStreak number.

10. Create hasShippedToday function: accepts analyticsRecords (Analytics array), userTimezone (string). Normalize today's date to user timezone, check if any record matches today with shipCount > 0. Return boolean.

11. Create getLastShipDate function: accepts analyticsRecords (Analytics array sorted by date descending). Find first record with shipCount > 0, return its date field. Return null if no ships found.

12. Create fillMissingDays function: accepts weeklyData (WeeklyShipData array, may have gaps). Get last 7 days using getLast7Days utility, for each day check if data exists, if missing insert { date: formatted date, shipCount: 0, dayOfWeek: label }. Return complete array with all 7 days in chronological order. Used to ensure complete dataset for chart.

13. Create formatWeeklyDataForChart function: accepts weeklyData (WeeklyShipData array). Fill missing days using fillMissingDays, map to chart-friendly format with date labels using getWeekdayLabel. Return formatted array ready for Recharts consumption.

14. Create calculateWeeklyAverage function: accepts weeklyData (WeeklyShipData array). Calculate average shipCount across 7 days. Return number rounded to 1 decimal place. Used for summary stats.

15. Create validateAnalyticsData function: accepts analytics data object. Validate date is valid Date, shipCount is non-negative number. Return object with isValid (boolean) and errors (string array).

16. Add error handling utility: create handleAnalyticsError function that accepts error (unknown) and returns formatted error message string. Handle fetch errors, timezone errors, and API error responses consistently.

17. Export all functions as named exports for use in components and hooks.

### src/components/ui/Button.tsx(NEW)

References: 

- src/lib/utils.ts(MODIFY)

**Create reusable Button component with variants using CVA:**

1. Mark as 'use client' for interactive functionality.

2. Import React, forwardRef, ButtonHTMLAttributes for type safety.

3. Import Slot from '@radix-ui/react-slot' for composition pattern.

4. Import { cva, type VariantProps } from 'class-variance-authority' for variant management.

5. Import cn utility from `src/lib/utils.ts` for class merging.

6. Define buttonVariants using cva with base classes: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'.

7. Define variant options: default (bg-primary text-primary-foreground hover:bg-primary/90), secondary (bg-secondary text-secondary-foreground hover:bg-secondary/80), destructive (bg-destructive text-destructive-foreground hover:bg-destructive/90), outline (border border-input hover:bg-accent hover:text-accent-foreground), ghost (hover:bg-accent hover:text-accent-foreground), link (text-primary underline-offset-4 hover:underline).

8. Define size options: default (h-10 px-4 py-2), sm (h-9 rounded-md px-3), lg (h-11 rounded-md px-8), icon (h-10 w-10).

9. Create Button component using forwardRef with props extending ButtonHTMLAttributes and VariantProps from buttonVariants. Add asChild prop for Slot composition.

10. Render as Slot if asChild is true, otherwise render as button element. Apply buttonVariants with variant and size props, merge with custom className using cn.

11. Export Button component and buttonVariants for external use in analytics and other components.

### src/components/ui/Card.tsx(NEW)

References: 

- src/lib/utils.ts(MODIFY)

**Create reusable Card component with sub-components:**

1. Import React, forwardRef, HTMLAttributes for type safety.

2. Import cn utility from `src/lib/utils.ts` for class merging.

3. Create Card component using forwardRef with base classes: 'rounded-lg border bg-card text-card-foreground shadow-sm'. Accept className prop and merge with base classes using cn. Forward ref to div element.

4. Create CardHeader sub-component with classes: 'flex flex-col space-y-1.5 p-6'. Accept className prop for customization. Use forwardRef.

5. Create CardTitle sub-component as h3 with classes: 'text-2xl font-semibold leading-none tracking-tight'. Accept className prop. Use forwardRef.

6. Create CardDescription sub-component as p with classes: 'text-sm text-muted-foreground'. Accept className prop. Use forwardRef.

7. Create CardContent sub-component with classes: 'p-6 pt-0'. Accept className prop. Use forwardRef.

8. Create CardFooter sub-component with classes: 'flex items-center p-6 pt-0'. Accept className prop. Use forwardRef.

9. All sub-components should properly forward refs to their underlying HTML elements for accessibility and DOM manipulation.

10. Export Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter as named exports for use in analytics components.

### src/hooks/useToast.ts(NEW)

**Create custom toast notification hook using Radix Toast:**

1. Mark as 'use client' for client-side state management.

2. Import useState, useCallback from 'react'.

3. Define ToastType as union: 'success' | 'error' | 'info' | 'warning'.

4. Define Toast interface with properties: id (string), message (string), type (ToastType), duration (number, optional).

5. Create useToast hook that manages toast state internally with useState holding array of Toast objects.

6. Implement addToast function using useCallback: accepts message (string), type (ToastType), duration (number, default 5000). Generate unique id using Date.now() + Math.random(). Add toast to state array. Set timeout to remove toast after duration.

7. Implement removeToast function using useCallback: accepts id (string), filters toast from state array.

8. Return object with toast helper functions: success (message, duration?), error (message, duration?), info (message, duration?), warning (message, duration?), and toasts array for rendering.

9. Each helper function calls addToast with appropriate type.

10. Export useToast hook for use in analytics components. The Toaster component will be added to Providers in Phase 1.8 to render toasts globally.

### src/components/analytics/ShipStreakCard.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/analyticsService.ts(NEW)
- src/lib/utils.ts(MODIFY)
- src/hooks/useToast.ts(NEW)
- src/components/ui/Card.tsx(NEW)
- src/components/ui/Button.tsx(NEW)

**Create detailed ship streak display component with mark ship functionality:**

1. Mark as 'use client' for interactive button functionality and state management.

2. Import useState, useEffect from 'react' for celebration state management.

3. Import Card, CardHeader, CardTitle, CardContent, CardFooter from `src/components/ui/Card.tsx`.

4. Import Button from `src/components/ui/Button.tsx`.

5. Import useQuery, useMutation, useQueryClient from '@tanstack/react-query' for data fetching and mutations.

6. Import ShipStreakCardProps, StreakData from `src/types/index.ts`.

7. Import fetchStreakData, markShipToday, hasShippedToday from `src/lib/analyticsService.ts`.

8. Import utilities from `src/lib/utils.ts`: formatStreakDisplay, getStreakMilestone, shouldCelebrate, formatRelativeTime.

9. Import useToast from `src/hooks/useToast.ts` for success/error notifications.

10. Import icons from 'lucide-react': Flame, TrendingUp, Calendar, Sparkles.

11. Create useQuery to fetch streak data: query key ['analytics', 'streak'], calls fetchStreakData, staleTime 60000 (1 minute), refetchOnMount true.

12. Create useMutation for marking ship: calls markShipToday, on success invalidates ['analytics', 'streak'] query, checks if celebration should trigger using shouldCelebrate, shows success toast with milestone message if applicable, triggers celebration animation.

13. Manage celebration state with useState: isCelebrating (boolean), celebrationMessage (string | null). Set isCelebrating to true when milestone reached, reset after 3 seconds using useEffect cleanup.

14. Render Card component with gradient background (bg-gradient-to-br from-flow-green/10 to-flow-green/5) and border (border-flow-green/20).

15. In CardHeader, display Flame icon and 'Ship Streak' title. Show current streak prominently with fire emoji and number (text-4xl font-bold text-flow-green). Use formatStreakDisplay utility.

16. In CardContent, show longest streak as secondary info: 'Best: X days' with TrendingUp icon. Display last ship date if available using formatRelativeTime: 'Last shipped X ago' with Calendar icon. If no ship today, show encouraging message.

17. Show 'Mark Ship Today' button if hasShippedToday returns false (check using query data). Button should be disabled if already shipped today or mutation is loading. Show loading spinner during mutation.

18. When celebration triggers, show animated overlay with confetti effect or sparkles. Use Tailwind animate-fade-in and animate-slide-up classes. Display milestone message with Sparkles icon.

19. Add mini calendar visualization showing last 7 days with ship indicators: green dots for ship days, gray for no-ship days. Use flex layout with small circular indicators.

20. Apply consistent Tailwind styling with proper spacing (p-6, gap-4) and responsive design. Use flow-green color for active elements, muted colors for secondary info.

21. Handle loading state: show skeleton with animate-pulse while query is loading.

22. Handle error state: show error message with retry button if query fails.

### src/components/analytics/WeeklyShipChart.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/analyticsService.ts(NEW)
- src/lib/utils.ts(MODIFY)
- src/components/ui/Card.tsx(NEW)

**Create bar chart component for weekly ship activity visualization:**

1. Mark as 'use client' for Recharts rendering.

2. Import useQuery from '@tanstack/react-query' for data fetching.

3. Import Recharts components: BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell.

4. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

5. Import WeeklyShipChartProps, WeeklyShipData from `src/types/index.ts`.

6. Import fetchWeeklyShipData, formatWeeklyDataForChart, calculateWeeklyAverage from `src/lib/analyticsService.ts`.

7. Import formatChartDate from `src/lib/utils.ts` for tooltip formatting.

8. Import BarChart3 icon from 'lucide-react' for card header.

9. Create useQuery to fetch weekly data: query key ['analytics', 'weekly'], calls fetchWeeklyShipData, staleTime 300000 (5 minutes), refetchOnMount true.

10. Process fetched data using formatWeeklyDataForChart to ensure complete 7-day dataset with proper labels.

11. Render Card component with standard styling (bg-card, border, rounded-lg, shadow-sm).

12. In CardHeader, display BarChart3 icon and 'Weekly Ship Activity' title. Show weekly average as subtitle using calculateWeeklyAverage: 'Avg: X ships/day'.

13. In CardContent, render ResponsiveContainer with width='100%' and height from props (default 300px).

14. Render BarChart with data from query. Configure margin: { top: 10, right: 10, left: -20, bottom: 0 }.

15. Add CartesianGrid with strokeDasharray='3 3' and stroke color matching theme (use muted color).

16. Add XAxis with dataKey='dayOfWeek', tick color matching foreground, fontSize 12.

17. Add YAxis with tick color matching foreground, fontSize 12, allowDecimals false (ship count is integer).

18. Add Tooltip with custom content showing formatted date using formatChartDate, ship count, and encouraging message if count > 0.

19. Add Bar with dataKey='shipCount', radius [4, 4, 0, 0] for rounded top corners. Use Cell component to apply conditional coloring: flow-green (#00D9A5) for days with ships (shipCount > 0), muted gray for days without ships.

20. Show empty state when no ships in last 7 days: centered message with encouraging text 'Start your streak today!' and illustration/icon.

21. Handle loading state: show skeleton chart with animate-pulse while query is loading. Use gray bars as placeholders.

22. Handle error state: show error message with retry button if query fails.

23. Apply responsive design: chart adjusts to container width, labels remain readable on mobile (consider rotating X-axis labels if needed).

24. Use consistent Tailwind styling with proper spacing and colors matching FlowForge design system.