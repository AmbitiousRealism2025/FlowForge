I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase has comprehensive infrastructure: Prisma Habit model with all needed fields (id, userId, name, category, streakCount, targetFrequency, lastCompletedAt, isActive, createdAt), HabitCategory enum with 5 values (DAILY_SHIP, CONTEXT_REFRESH, CODE_REVIEW, BACKUP_CHECK, FLOW_BLOCK), established patterns for components (Card, Button, Toast), service modules (fetch functions, error handling, validation), API routes (withAuth, Zod validation, pagination), and styling system (FlowForge colors, animations). The master plan specifies default habits created at signup, streak milestones (7/30/100 days), optimistic updates, and celebration animations. No HabitCompletion model exists, so streak calculation will use lastCompletedAt field and timezone-aware date comparisons similar to analytics streak logic.

### Approach

Implement Phase 2.1 Habit Tracking System following established patterns from previous phases (sessions, projects, notes, analytics). Create habits page with list view and summary stats, build HabitCard and HabitCheckIn components with streak tracking and milestone celebrations, implement habitService module for business logic and API integration, and create three API routes (list/create, complete, streak history). Use existing Habit model fields (streakCount, lastCompletedAt) for tracking without adding new models. Follow React Query + Zustand patterns, Radix UI components, Zod validation, and FlowForge styling system with celebration animations.

### Reasoning

I explored the codebase thoroughly by reading: (1) Prisma schema confirming Habit model structure with 5 HabitCategory values, (2) Master plan specifications for detailed requirements, (3) Existing component patterns (ShipStreak, ProjectCard) to understand structure, (4) Service module patterns (analyticsService, projectService) for API integration, (5) API route patterns (sessions/route.ts) for withAuth and validation, (6) Validation schemas to understand Zod patterns, (7) Toast hook implementation for notifications, (8) Utils for helper functions. Confirmed no HabitCompletion model exists - will use Habit.lastCompletedAt and streakCount fields for tracking.

## Mermaid Diagram

sequenceDiagram
    participant User
    participant HabitsPage
    participant HabitCard
    participant HabitService
    participant ReactQuery
    participant API
    participant Prisma

    User->>HabitsPage: Navigate to /habits
    HabitsPage->>ReactQuery: useQuery(['habits'])
    ReactQuery->>HabitService: fetchHabits()
    HabitService->>API: GET /api/habits
    API->>Prisma: habit.findMany(userId, orderBy streakCount desc)
    Prisma-->>API: Return habits array
    API-->>HabitService: Habits data
    HabitService->>HabitService: enrichHabitWithStats(habits, timezone)
    HabitService-->>ReactQuery: HabitWithStats[]
    ReactQuery-->>HabitsPage: Display habits
    HabitsPage->>HabitCard: Render habit cards
    
    HabitsPage->>HabitsPage: Calculate summary stats
    HabitsPage->>User: Show stats (active, longest streak, completed today)
    
    User->>HabitCard: Click "Check In Today"
    HabitCard->>HabitsPage: onComplete(habitId)
    HabitsPage->>ReactQuery: useMutation(completeHabit)
    ReactQuery->>ReactQuery: Optimistic update (set completedToday=true)
    ReactQuery->>HabitService: completeHabit(habitId, notes?)
    HabitService->>API: POST /api/habits/{id}/complete
    API->>Prisma: habit.findUnique(id)
    Prisma-->>API: Habit data
    
    API->>API: Check if completed today (timezone-aware)
    alt Already Completed Today
        API-->>HabitService: 400 Error
        HabitService-->>ReactQuery: Error response
        ReactQuery->>ReactQuery: Rollback optimistic update
        ReactQuery-->>HabitsPage: Show error toast
    else Not Completed Yet
        API->>API: Calculate new streak (yesterday=continue, older=break)
        API->>Prisma: habit.update(lastCompletedAt, streakCount)
        Prisma-->>API: Updated habit
        API->>API: Check milestone (7/30/100 days)
        API-->>HabitService: {habit, newStreak, isMilestone, milestoneMessage}
        HabitService-->>ReactQuery: Success response
        ReactQuery->>ReactQuery: Invalidate ['habits'] query
        ReactQuery-->>HabitsPage: Refetch habits
        
        alt Is Milestone
            HabitsPage->>HabitCard: Trigger celebration animation
            HabitCard->>User: Show confetti + milestone toast
        else Streak Extended
            HabitsPage->>User: Show success toast
        end
    end
    
    User->>HabitsPage: Click "Add Custom Habit"
    HabitsPage->>User: Show toast "Coming soon"

## Proposed File Changes

### src/types/index.ts(MODIFY)

References: 

- prisma/schema.prisma

**Extend types with habit-specific interfaces:**

1. Add HabitWithStats interface extending Habit with calculated fields: `completedToday: boolean`, `daysUntilDue: number`, `completionRate: number` (percentage of days completed vs target). Used by HabitCard component.

2. Add CreateHabitRequest interface with fields: `name: string`, `category: HabitCategory`, `targetFrequency: number` (default 1 for daily). Used for API POST requests.

3. Add UpdateHabitRequest interface with optional fields: `name?: string`, `targetFrequency?: number`, `isActive?: boolean`. Used for API PATCH requests.

4. Add CompleteHabitRequest interface with optional `notes?: string` field for documenting completion. Used for completion API endpoint.

5. Add HabitStreakData interface with properties: `currentStreak: number`, `longestStreak: number`, `completionDates: Date[]`, `completionRate: number`, `lastCompletedAt: Date | null`. Used by streak history endpoint.

6. Add HabitSummaryStats interface with properties: `totalActiveHabits: number`, `longestCurrentStreak: number`, `habitsCompletedToday: number`, `totalCompletions: number`. Used by habits page for summary display.

7. Add component prop types: HabitCardProps interface with `habit: HabitWithStats`, `onComplete: (habitId: string) => void`, `onEdit?: (habitId: string) => void`, `onArchive?: (habitId: string) => void`.

8. Add HabitCheckInProps interface with `habitId: string`, `habitName: string`, `completedToday: boolean`, `onComplete: () => Promise<void>`, `isLoading: boolean`.

9. Export all new habit-related types for use throughout the application.

### src/lib/utils.ts(MODIFY)

References: 

- src/types/index.ts(MODIFY)

**Add habit-specific utility functions:**

1. Import HabitCategory from `src/types/index.ts`.

2. Add getHabitCategoryIcon function: accepts `category: HabitCategory`, returns emoji string: DAILY_SHIP='🚀', CONTEXT_REFRESH='🔄', CODE_REVIEW='👀', BACKUP_CHECK='💾', FLOW_BLOCK='⏰'. Used by HabitCard component.

3. Add getHabitCategoryLabel function: accepts `category: HabitCategory`, returns human-readable label: DAILY_SHIP='Daily Ship', CONTEXT_REFRESH='Context Refresh', CODE_REVIEW='Code Review', BACKUP_CHECK='Backup Check', FLOW_BLOCK='Flow Block'. Used for display.

4. Add getHabitCategoryColor function: accepts `category: HabitCategory`, returns Tailwind color class: DAILY_SHIP='text-flow-green', CONTEXT_REFRESH='text-claude-purple', CODE_REVIEW='text-blue-500', BACKUP_CHECK='text-caution-amber', FLOW_BLOCK='text-red-500'.

5. Add getHabitCategoryDescription function: accepts `category: HabitCategory`, returns brief description: DAILY_SHIP='Ship something every day', CONTEXT_REFRESH='Refresh AI context regularly', CODE_REVIEW='Review code quality', BACKUP_CHECK='Verify backups', FLOW_BLOCK='Schedule focused work time'. Used in habit creation dialog.

6. Add formatHabitStreak function: accepts `streakCount: number`, returns formatted string with fire emoji: '🔥 X day streak' or '🔥 X days streak' (handle singular/plural). If streak is 0, return 'No streak yet'.

7. Add getHabitStreakMilestone function: accepts `streakCount: number`, returns milestone message for special numbers: 7='Week streak! 🎉', 30='Month streak! 🚀', 100='Century! 💯', etc. Return null if not a milestone. Used for celebration triggers.

8. Add isHabitDueToday function: accepts `lastCompletedAt: Date | null`, `targetFrequency: number`, `timezone: string`, returns boolean indicating if habit should be completed today. For daily habits (frequency=1), check if lastCompletedAt is not today. For weekly habits (frequency=7), check if 7 days have passed.

9. Add calculateHabitStreak function: accepts `lastCompletedAt: Date | null`, `streakCount: number`, `timezone: string`, returns updated streak count. If lastCompletedAt is yesterday, streak continues. If today, streak is current. If older, streak breaks (return 0).

10. Export all new utility functions for use in habit service and components.

### src/lib/validations.ts(MODIFY)

References: 

- src/types/index.ts(MODIFY)

**Add Zod validation schemas for habit endpoints:**

1. Import HabitCategory from `src/types/index.ts` at the top with other enum imports.

2. Add CreateHabitSchema after the Analytics Schemas section (around line 103): Define schema with `name: z.string().min(1).max(100)`, `category: z.nativeEnum(HabitCategory)`, `targetFrequency: z.number().int().min(1).max(365).default(1)`. Validates habit creation requests.

3. Add UpdateHabitSchema: Define schema with all optional fields: `name: z.string().min(1).max(100).optional()`, `targetFrequency: z.number().int().min(1).max(365).optional()`, `isActive: z.boolean().optional()`. Validates habit update requests.

4. Add CompleteHabitSchema: Define schema with `notes: z.string().max(500).optional()`. Validates habit completion requests with optional notes.

5. Add type exports at the bottom (around line 118): `export type CreateHabitInput = z.infer<typeof CreateHabitSchema>`, `export type UpdateHabitInput = z.infer<typeof UpdateHabitSchema>`, `export type CompleteHabitInput = z.infer<typeof CompleteHabitSchema>`.

6. Export all habit schemas for use in API route handlers.

### src/lib/habitService.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)
- src/lib/analyticsService.ts

**Create business logic service for habit CRUD operations and streak calculations:**

1. Import types from `src/types/index.ts`: Habit, HabitWithStats, HabitCategory, CreateHabitRequest, UpdateHabitRequest, CompleteHabitRequest, HabitStreakData, ApiResponse.

2. Import utilities from `src/lib/utils.ts`: formatHabitStreak, getHabitStreakMilestone, isHabitDueToday, calculateHabitStreak, getUserTimezone, formatRelativeTime.

3. Import date utilities from date-fns: startOfDay, differenceInDays, differenceInCalendarDays, isSameDay, subDays.

4. Define API_BASE_URL constant: '/api/habits'.

5. Create fetchHabits async function: makes GET request to API_BASE_URL. Returns Promise<ApiResponse<Habit[]>> with all user habits. Handle fetch errors with try-catch and return error response.

6. Create createHabit async function: accepts name (string), category (HabitCategory), targetFrequency (number, default 1). Constructs CreateHabitRequest payload. Makes POST request to API_BASE_URL. Returns Promise<ApiResponse<Habit>> with created habit. Handle errors appropriately.

7. Create updateHabit async function: accepts habitId (string) and UpdateHabitRequest data. Makes PATCH request to `${API_BASE_URL}/${habitId}`. Returns Promise<ApiResponse<Habit>>. Handle errors appropriately.

8. Create completeHabit async function: accepts habitId (string) and optional notes (string). Makes POST request to `${API_BASE_URL}/${habitId}/complete` with notes and timezone. Returns Promise<ApiResponse<{ habit: Habit, newStreak: number, isMilestone: boolean, milestoneMessage: string | null }>>. Handle errors appropriately.

9. Create getHabitStreak async function: accepts habitId (string). Makes GET request to `${API_BASE_URL}/${habitId}/streak`. Returns Promise<ApiResponse<HabitStreakData>> with detailed streak information. Handle errors appropriately.

10. Create calculateStreakFromLastCompleted function (client-side helper): accepts lastCompletedAt (Date | null), currentStreak (number), timezone (string). Implement streak logic: if lastCompletedAt is null, return 0. If lastCompletedAt is today, return currentStreak (already completed). If lastCompletedAt is yesterday, streak continues. If older than yesterday, streak breaks (return 0). Use timezone-aware date comparisons similar to analyticsService.

11. Create isCompletedToday function: accepts lastCompletedAt (Date | null), timezone (string). Normalize today's date to user timezone, check if lastCompletedAt matches today. Return boolean.

12. Create enrichHabitWithStats function: accepts habit (Habit), timezone (string). Calculate completedToday using isCompletedToday, daysUntilDue based on targetFrequency and lastCompletedAt, completionRate (placeholder, requires completion history). Return HabitWithStats object.

13. Create validateHabitData function: accepts habit data object. Validate required fields (name non-empty), targetFrequency is positive integer. Return object with isValid (boolean) and errors (string array).

14. Add error handling utility: create handleHabitError function that accepts error (unknown) and returns formatted error message string. Handle fetch errors, validation errors, and API error responses consistently.

15. Export all functions as named exports for use in components and hooks.

### src/components/habits/HabitCard.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)
- src/components/ui/Card.tsx
- src/components/ui/Button.tsx

**Create habit card component with streak tracking and check-in functionality:**

1. Mark as 'use client' for interactive functionality.

2. Import Card, CardHeader, CardTitle, CardContent, CardFooter from `src/components/ui/Card.tsx`.

3. Import Button from `src/components/ui/Button.tsx`.

4. Import DropdownMenu components from '@radix-ui/react-dropdown-menu' for action menu.

5. Import HabitCardProps, HabitWithStats from `src/types/index.ts`.

6. Import utilities from `src/lib/utils.ts`: getHabitCategoryIcon, getHabitCategoryLabel, getHabitCategoryColor, formatHabitStreak, formatRelativeTime.

7. Import icons from 'lucide-react': Flame, MoreVertical, Edit, Archive, CheckCircle, Circle.

8. Import useState from 'react' for celebration animation state.

9. Accept props from HabitCardProps: habit, onComplete, onEdit, onArchive.

10. Manage celebration state with useState: isCelebrating (boolean), celebrationMessage (string | null). Trigger celebration when onComplete succeeds with milestone.

11. Render Card component with hover effect (hover:shadow-md transition-shadow) and border-l-4 accent using category color.

12. In CardHeader, display category icon and label using getHabitCategoryIcon and getHabitCategoryLabel with appropriate color from getHabitCategoryColor. Show habit name as CardTitle.

13. Display current streak prominently with fire emoji and count using formatHabitStreak. Apply color coding: green for active streaks (>0), gray for no streak (0).

14. Show last completed date if present using formatRelativeTime: 'Last completed X ago'. If never completed, show 'Never completed'.

15. In CardContent, render large check-in button if not completedToday: 'Check In Today' with CheckCircle icon. If completedToday, show completed state: '✓ Completed Today' with green background (bg-flow-green/10).

16. Check-in button calls onComplete(habit.id) on click. Show loading state during mutation.

17. Display target frequency info: 'Daily' for frequency=1, 'Weekly' for frequency=7, 'Every X days' for custom.

18. In CardFooter, render DropdownMenu trigger button (MoreVertical icon) in top-right corner.

19. In DropdownMenuContent, add menu items: Edit Habit (calls onEdit with habitId, shows Edit icon), Archive Habit (calls onArchive with habitId, shows Archive icon).

20. When celebration triggers (milestone reached), show animated overlay with confetti effect or sparkles using Tailwind animate-bounce-in class. Display milestone message with Flame icon. Auto-dismiss after 3 seconds.

21. Apply consistent Tailwind styling with proper spacing (p-4, gap-3) and responsive design. Use FlowForge colors for category badges and streak indicators.

22. Ensure button has minimum 44px touch target for mobile accessibility.

### src/components/habits/HabitCheckIn.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/components/ui/Button.tsx

**Create check-in interface component for habit completion:**

1. Mark as 'use client' for interactive button functionality.

2. Import Button from `src/components/ui/Button.tsx`.

3. Import HabitCheckInProps from `src/types/index.ts`.

4. Import icons from 'lucide-react': CheckCircle, Circle, Loader2.

5. Accept props from HabitCheckInProps: habitId, habitName, completedToday, onComplete, isLoading.

6. Render large prominent button for check-in action. If completedToday is false, show 'Check In' button with Circle icon. If completedToday is true, show completed state with CheckCircle icon and green styling.

7. Button calls onComplete() on click. Disable button if completedToday is true or isLoading is true.

8. Show loading spinner (Loader2 icon with animate-spin) when isLoading is true, with text 'Checking in...'.

9. Apply visual feedback on click: use Tailwind active:scale-95 for press effect.

10. Style completed state with bg-flow-green/10, border-flow-green/20, text-flow-green to indicate success.

11. Style pending state with default button styling (bg-primary, hover:bg-primary/90).

12. Include habit name in button text for context: 'Check In: {habitName}' or 'Completed: {habitName}'.

13. Ensure button has minimum 44px height for mobile touch targets.

14. Apply consistent Tailwind styling with proper spacing and transitions.

### src/app/(dashboard)/habits/page.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/habitService.ts(NEW)
- src/lib/utils.ts(MODIFY)
- src/hooks/useToast.ts
- src/components/ui/Card.tsx
- src/components/ui/Button.tsx
- src/components/habits/HabitCard.tsx(NEW)

**Create habits dashboard page with list view and summary statistics:**

1. Mark as 'use client' for interactive state management.

2. Import useState from 'react' for dialog state.

3. Import useQuery, useMutation, useQueryClient from '@tanstack/react-query' for data fetching.

4. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

5. Import Button from `src/components/ui/Button.tsx`.

6. Import HabitCard from `src/components/habits/HabitCard.tsx`.

7. Import Habit, HabitWithStats, HabitSummaryStats from `src/types/index.ts`.

8. Import fetchHabits, completeHabit, enrichHabitWithStats from `src/lib/habitService.ts`.

9. Import getUserTimezone from `src/lib/utils.ts`.

10. Import useToast from `src/hooks/useToast.ts` for success/error notifications.

11. Import icons from 'lucide-react': Plus, Flame, CheckCircle, Target.

12. Create useQuery to fetch habits: query key ['habits'], calls fetchHabits, staleTime 60000 (1 minute), refetchOnMount true.

13. Create useMutation for completing habits: calls completeHabit from habitService, on success invalidates ['habits'] query, checks if milestone reached using response data, shows success toast with milestone message if applicable, triggers celebration animation.

14. Process fetched habits using enrichHabitWithStats to add calculated fields (completedToday, daysUntilDue, completionRate) for each habit.

15. Calculate summary statistics from enriched habits: totalActiveHabits (count where isActive=true), longestCurrentStreak (max streakCount), habitsCompletedToday (count where completedToday=true).

16. Render page header with title 'Habits' and 'Add Custom Habit' button (Plus icon). Button opens dialog for creating custom habits (stub for now, show toast 'Coming soon').

17. Display summary statistics cards in a grid (3 columns on desktop, 1 on mobile): Active Habits (Target icon, count), Longest Streak (Flame icon, count with fire emoji), Completed Today (CheckCircle icon, count).

18. Sort habits by streakCount descending to highlight achievements (habits with longest streaks appear first).

19. Map enriched habits to HabitCard components in responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6). Pass habit object and callback handlers: onComplete (calls completion mutation), onEdit (show toast 'Coming soon'), onArchive (show toast 'Coming soon').

20. Show loading skeleton states while habits query is loading: render 5 placeholder cards with animated pulse (bg-gray-200 animate-pulse rounded-lg h-48).

21. Show empty state when no habits exist: centered message with Target icon, 'No habits yet', encouraging text 'Default habits should be created at signup. Contact support if missing.', and 'Add Custom Habit' button.

22. Handle completion mutation optimistically: update React Query cache immediately before API response to show instant UI feedback (set completedToday=true, increment streakCount).

23. Apply responsive layout: proper padding (p-4 md:p-6 lg:p-8), responsive grid columns, mobile-friendly summary cards.

24. Use consistent Tailwind styling with proper spacing, hover states, and transitions. Use FlowForge colors for summary stats and streak indicators.

### src/app/api/habits/route.ts(NEW)

References: 

- src/lib/prisma.ts
- src/lib/validations.ts(MODIFY)
- src/lib/api-utils.ts
- src/app/api/sessions/route.ts

**Create API route for habits list and creation:**

1. Import NextRequest from 'next/server'.

2. Import prisma from `src/lib/prisma.ts`.

3. Import CreateHabitSchema from `src/lib/validations.ts`.

4. Import apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError, withAuth from `src/lib/api-utils.ts`.

5. Implement GET handler function listHabitsHandler: accepts userId (string) and request (NextRequest). Query Habit model with prisma.habit.findMany where userId equals userId, orderBy streakCount desc (show highest streaks first). Return all habits with apiResponse. Handle errors with try-catch and handlePrismaError.

6. Export GET handler wrapped with withAuth: `export const GET = withAuth((userId, request) => listHabitsHandler(userId, request))`.

7. Implement POST handler function createHabitHandler: accepts userId (string) and request (NextRequest). Parse request body with parseJsonBody. Validate with CreateHabitSchema.safeParse(body). Return 422 with handleZodError if invalid. Extract name, category, targetFrequency from validated data. Create habit with prisma.habit.create with data: userId, name, category, targetFrequency, streakCount: 0, isActive: true. Return created habit with apiResponse, status 201. Handle errors with try-catch and handlePrismaError.

8. Export POST handler wrapped with withAuth: `export const POST = withAuth((userId, request) => createHabitHandler(userId, request))`.

9. Add JSDoc comments explaining endpoint purpose and parameters.

10. Follow established patterns from `src/app/api/sessions/route.ts` for consistency.

### src/app/api/habits/[id]/complete/route.ts(NEW)

References: 

- src/lib/prisma.ts
- src/lib/validations.ts(MODIFY)
- src/lib/api-utils.ts
- src/lib/utils.ts(MODIFY)
- src/app/api/analytics/ship/route.ts

**Create API route for habit completion:**

1. Import NextRequest from 'next/server'.

2. Import prisma from `src/lib/prisma.ts`.

3. Import CompleteHabitSchema from `src/lib/validations.ts`.

4. Import apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError, withAuth from `src/lib/api-utils.ts`.

5. Import startOfDay, differenceInCalendarDays from 'date-fns'.

6. Import getHabitStreakMilestone from `src/lib/utils.ts`.

7. Implement POST handler function completeHabitHandler: accepts userId (string), request (NextRequest), params ({ id: string }). Parse request body with parseJsonBody. Validate with CompleteHabitSchema.safeParse(body). Return 422 with handleZodError if invalid. Extract optional notes and timezone from validated data (default timezone to 'UTC').

8. Query existing habit with prisma.habit.findUnique where id equals params.id. Return 404 with apiError if not found. Check if habit.userId equals userId, return 403 with apiError if not owner.

9. Normalize today's date to user's timezone using startOfDay and timezone parameter. This ensures 'today' is based on user's local time, not server time.

10. Check if habit was already completed today: if habit.lastCompletedAt exists and is same day as today (use isSameDay from date-fns with timezone awareness), return 400 with apiError 'Habit already completed today'.

11. Calculate new streak: if habit.lastCompletedAt is null, newStreak = 1 (first completion). If lastCompletedAt is yesterday (differenceInCalendarDays = 1), newStreak = habit.streakCount + 1 (streak continues). If lastCompletedAt is older than yesterday, newStreak = 1 (streak breaks, start fresh).

12. Update habit with prisma.habit.update where id, data: { lastCompletedAt: new Date(), streakCount: newStreak }. This records completion timestamp and updates streak.

13. Check if newStreak is a milestone using getHabitStreakMilestone(newStreak). If milestone exists, include in response for UI celebration.

14. Return apiResponse with object: { habit: updatedHabit, newStreak, isMilestone: milestone !== null, milestoneMessage: milestone }. Status 200.

15. Handle errors with try-catch and handlePrismaError.

16. Export POST handler wrapped with withAuth: `export const POST = withAuth((userId, request, params) => completeHabitHandler(userId, request, params))`.

17. Add JSDoc comments explaining endpoint purpose, timezone handling, and streak calculation logic.

18. Follow established patterns from `src/app/api/analytics/ship/route.ts` for timezone-aware date handling.

### src/app/api/habits/[id]/streak/route.ts(NEW)

References: 

- src/lib/prisma.ts
- src/lib/api-utils.ts
- src/app/api/analytics/streak/route.ts

**Create API route for habit streak history:**

1. Import NextRequest from 'next/server'.

2. Import prisma from `src/lib/prisma.ts`.

3. Import apiResponse, apiError, handlePrismaError, withAuth from `src/lib/api-utils.ts`.

4. Import startOfDay, differenceInCalendarDays, subDays from 'date-fns'.

5. Implement GET handler function getHabitStreakHandler: accepts userId (string), request (NextRequest), params ({ id: string }). Query habit with prisma.habit.findUnique where id equals params.id. Return 404 with apiError if not found. Check if habit.userId equals userId, return 403 with apiError if not owner.

6. Calculate current streak from habit.streakCount field (already maintained by completion endpoint).

7. Calculate longest streak: for MVP, use habit.streakCount as longest streak (assumes user hasn't broken streak yet). In future, this could track historical longest streak in a separate field or table.

8. Generate completion dates array: since we don't have a HabitCompletion table, generate approximate dates based on current streak. If streakCount > 0, create array of last N days where N = streakCount. Use subDays to generate dates. This is an approximation for MVP.

9. Calculate completion rate: for MVP, return 100% if streakCount > 0, 0% otherwise. In future, this would be calculated from actual completion history.

10. Return apiResponse with HabitStreakData object: { currentStreak: habit.streakCount, longestStreak: habit.streakCount, completionDates: generatedDates, completionRate: calculatedRate, lastCompletedAt: habit.lastCompletedAt }. Status 200.

11. Handle errors with try-catch and handlePrismaError.

12. Export GET handler wrapped with withAuth: `export const GET = withAuth((userId, request, params) => getHabitStreakHandler(userId, request, params))`.

13. Add JSDoc comments explaining endpoint purpose and noting that completion dates are approximated for MVP (no completion history table).

14. Add TODO comment: 'Future enhancement: Add HabitCompletion table to track detailed completion history with notes and timestamps'.

15. Follow established patterns from `src/app/api/analytics/streak/route.ts` for streak calculation logic.