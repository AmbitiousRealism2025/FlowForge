I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase has solid foundations with established patterns: React Query for data fetching with loading/error states, Card components for consistent layouts, timezone-aware date handling in analytics endpoints, withAuth middleware for protected routes, Prisma queries with proper indexing, and FlowForge color system (flow-green, caution-amber, stuck-red). The ShipStreak component demonstrates the pattern: useQuery for data fetching, useMutation for actions, loading skeletons, error handling, and celebration logic. The existing analyticsService.ts provides timezone utilities (normalizeToUserTimezone, getUserTimezone) that can be reused. API routes follow consistent patterns with getServerSession, Prisma queries, and apiResponse/apiError helpers. Recharts is installed but not yet used, so we'll establish visualization patterns. The master plan specifies: 30-day flow score trends, AI model performance comparison, 7x24 productivity heatmap, date range filtering, summary metrics, and export functionality.

### Approach

Implement Phase 2.2 Advanced Analytics Dashboard by creating an analytics page with three Recharts visualization components (FlowScoreChart, ModelPerformanceCard, BestTimesHeatmap), an advanced analytics service module for complex calculations, and three API routes for data endpoints. Follow established patterns: React Query for data fetching, Recharts for visualizations (already used in package.json), timezone-aware date handling (similar to existing analytics endpoints), and consistent API response structures. The approach prioritizes reusable calculation functions, responsive chart designs, and proper error/loading states.

### Reasoning

I explored the codebase thoroughly: (1) Read existing analytics components (ShipStreak) to understand React Query patterns, loading states, and card layouts, (2) Examined analyticsService.ts to understand timezone handling and calculation patterns, (3) Reviewed API route structure (streak/route.ts) to understand auth middleware, Prisma queries, and response formatting, (4) Checked api-utils.ts for withAuth, apiResponse, and error handling utilities, (5) Verified Recharts 2.10.4 is installed in package.json, (6) Reviewed Prisma schema to understand CodingSession fields (productivityScore, aiModelsUsed, sessionType, startedAt, durationSeconds) and Analytics model, (7) Examined utils.ts for existing date/time utilities, (8) Reviewed dashboard page structure to understand layout patterns, (9) Confirmed types/index.ts has base types but needs analytics-specific extensions.

## Mermaid Diagram

sequenceDiagram
    participant User
    participant AnalyticsPage
    participant FlowScoreChart
    participant ModelPerformanceCard
    participant BestTimesHeatmap
    participant AdvancedAnalytics
    participant ReactQuery
    participant API
    participant Prisma

    User->>AnalyticsPage: Navigate to /analytics
    AnalyticsPage->>ReactQuery: useQuery(['analytics', 'summary', '30d'])
    ReactQuery->>AdvancedAnalytics: getAnalyticsSummary('30d')
    AdvancedAnalytics->>API: GET /api/analytics/advanced/summary?range=30d
    API->>Prisma: Parallel queries (avg score, model perf, best times, ships, minutes)
    Prisma-->>API: Aggregated data
    API-->>AdvancedAnalytics: AnalyticsSummary
    AdvancedAnalytics-->>ReactQuery: Summary data
    ReactQuery-->>AnalyticsPage: Display summary metrics
    
    par Fetch Visualizations
        AnalyticsPage->>ReactQuery: useQuery(['analytics', 'flow-score', '30d'])
        ReactQuery->>AdvancedAnalytics: getFlowScoreTrend('30d')
        AdvancedAnalytics->>API: GET /api/analytics/advanced/flow-score?range=30d
        API->>Prisma: Query CodingSessions (startedAt >= 30d ago, productivityScore != null)
        Prisma-->>API: Sessions array
        API->>API: Group by date, calculate averageScore per day
        API->>API: Fill missing dates with 0 values
        API-->>AdvancedAnalytics: FlowScoreTrendData[]
        AdvancedAnalytics-->>ReactQuery: Trend data
        ReactQuery-->>AnalyticsPage: Pass to FlowScoreChart
        
        AnalyticsPage->>ReactQuery: useQuery(['analytics', 'model-performance', '30d'])
        ReactQuery->>AdvancedAnalytics: getModelPerformance('30d')
        AdvancedAnalytics->>API: GET /api/analytics/advanced/model-performance?range=30d
        API->>Prisma: Query CodingSessions (aiModelsUsed, productivityScore)
        Prisma-->>API: Sessions array
        API->>API: Group by model (first in aiModelsUsed array)
        API->>API: Calculate avg score, best session type per model
        API-->>AdvancedAnalytics: ModelPerformanceData[]
        AdvancedAnalytics-->>ReactQuery: Model data
        ReactQuery-->>AnalyticsPage: Pass to ModelPerformanceCard
        
        AnalyticsPage->>ReactQuery: useQuery(['analytics', 'best-times', '30d'])
        ReactQuery->>AdvancedAnalytics: getBestTimes('30d')
        AdvancedAnalytics->>API: GET /api/analytics/advanced/best-times?range=30d
        API->>Prisma: Query CodingSessions (startedAt, productivityScore)
        Prisma-->>API: Sessions array
        API->>API: Extract day of week + hour (timezone-aware)
        API->>API: Group by (dayOfWeek, hour), calculate avg score
        API->>API: Generate complete 7x24 grid
        API-->>AdvancedAnalytics: ProductivityHeatmapData[]
        AdvancedAnalytics-->>ReactQuery: Heatmap data
        ReactQuery-->>AnalyticsPage: Pass to BestTimesHeatmap
    end
    
    AnalyticsPage->>FlowScoreChart: Render with trend data
    FlowScoreChart->>FlowScoreChart: Calculate moving average
    FlowScoreChart->>User: Display AreaChart with gradient
    
    AnalyticsPage->>ModelPerformanceCard: Render with model data
    ModelPerformanceCard->>ModelPerformanceCard: Sort by averageScore desc
    ModelPerformanceCard->>User: Display BarChart + model cards
    
    AnalyticsPage->>BestTimesHeatmap: Render with heatmap data
    BestTimesHeatmap->>BestTimesHeatmap: Create 7x24 grid, apply color coding
    BestTimesHeatmap->>User: Display SVG heatmap
    
    User->>AnalyticsPage: Change date range to '7d'
    AnalyticsPage->>ReactQuery: Refetch all queries with new range
    ReactQuery->>API: GET requests with range=7d
    API-->>ReactQuery: Updated data
    ReactQuery-->>AnalyticsPage: Update all visualizations
    
    User->>AnalyticsPage: Click "Export Data"
    AnalyticsPage->>AdvancedAnalytics: exportAnalyticsData(combinedData, 'analytics.csv')
    AdvancedAnalytics->>AdvancedAnalytics: Convert to CSV format
    AdvancedAnalytics->>User: Trigger browser download

## Proposed File Changes

### src/types/index.ts(MODIFY)

References: 

- prisma/schema.prisma

**Extend types with advanced analytics interfaces:**

1. Add FlowScoreTrendData interface after StreakData (around line 292): properties include `date: string` (YYYY-MM-DD format), `averageScore: number` (0-10 scale), `sessionCount: number`, `totalMinutes: number`. Used by FlowScoreChart component for 30-day trend visualization.

2. Add ModelPerformanceData interface: properties include `modelName: string`, `averageScore: number`, `sessionCount: number`, `totalMinutes: number`, `bestSessionType: SessionType`. Used by ModelPerformanceCard for AI model comparison.

3. Add ProductivityHeatmapData interface: properties include `dayOfWeek: number` (0-6, Sunday-Saturday), `hour: number` (0-23), `averageScore: number`, `sessionCount: number`. Used by BestTimesHeatmap for 7x24 grid visualization.

4. Add AnalyticsSummary interface: properties include `averageFlowScore: number`, `mostProductiveModel: string`, `bestTimeOfDay: string`, `totalShipsThisMonth: number`, `totalCodingMinutes: number`. Used for dashboard summary metrics display.

5. Add DateRangeFilter type as union: `'7d' | '30d' | '90d' | 'all'`. Used for date range selector in analytics page.

6. Add component prop types: FlowScoreChartProps interface with `data: FlowScoreTrendData[]`, `isLoading: boolean`, `dateRange: DateRangeFilter`. ModelPerformanceCardProps interface with `data: ModelPerformanceData[]`, `isLoading: boolean`. BestTimesHeatmapProps interface with `data: ProductivityHeatmapData[]`, `isLoading: boolean`.

7. Export all new analytics-related types for use throughout the application.

### src/lib/advancedAnalytics.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts
- src/lib/analyticsService.ts

**Create advanced analytics service module for complex calculations:**

1. Import types from `src/types/index.ts`: FlowScoreTrendData, ModelPerformanceData, ProductivityHeatmapData, AnalyticsSummary, DateRangeFilter, SessionType, ApiResponse.

2. Import date utilities from date-fns: startOfDay, subDays, format, getDay, getHours, differenceInDays.

3. Import getUserTimezone from `src/lib/utils.ts` for timezone-aware calculations.

4. Define API_BASE constant: '/api/analytics/advanced'.

5. Create getFlowScoreTrend async function: accepts dateRange (DateRangeFilter). Calculate start date based on range (7d=7 days ago, 30d=30 days ago, 90d=90 days ago, all=user creation date). Make GET request to `${API_BASE}/flow-score?range=${dateRange}&timezone=${timezone}`. Return Promise<ApiResponse<FlowScoreTrendData[]>>. Handle fetch errors with try-catch.

6. Create getModelPerformance async function: accepts dateRange (DateRangeFilter). Make GET request to `${API_BASE}/model-performance?range=${dateRange}&timezone=${timezone}`. Return Promise<ApiResponse<ModelPerformanceData[]>>. Handle errors appropriately.

7. Create getBestTimes async function: accepts dateRange (DateRangeFilter). Make GET request to `${API_BASE}/best-times?range=${dateRange}&timezone=${timezone}`. Return Promise<ApiResponse<ProductivityHeatmapData[]>>. Handle errors appropriately.

8. Create getAnalyticsSummary async function: accepts dateRange (DateRangeFilter). Make GET request to `${API_BASE}/summary?range=${dateRange}&timezone=${timezone}`. Return Promise<ApiResponse<AnalyticsSummary>>. Aggregates key metrics for dashboard header.

9. Create calculateMovingAverage function (client-side helper): accepts data (FlowScoreTrendData[]), windowSize (number, default 7). Implement simple moving average algorithm for trend smoothing. Return smoothed data array. Used by FlowScoreChart for trend line.

10. Create findBestTimeOfDay function (client-side helper): accepts heatmapData (ProductivityHeatmapData[]). Find hour with highest average score. Return formatted string like 'Tuesday mornings' or 'Friday afternoons'. Used for summary insights.

11. Create formatModelName function: accepts modelName (string). Standardize model names for display (e.g., 'claude-3-5-sonnet' → 'Claude 3.5 Sonnet', 'gpt-4' → 'GPT-4'). Return formatted string.

12. Create exportAnalyticsData function: accepts data (FlowScoreTrendData[] | ModelPerformanceData[] | ProductivityHeatmapData[]), filename (string). Convert data to CSV format. Trigger browser download using Blob and URL.createObjectURL. Handle different data structures appropriately.

13. Create validateDateRange function: accepts range (string). Check if value is valid DateRangeFilter. Return boolean. Used for query param validation.

14. Add error handling utility: create handleAdvancedAnalyticsError function that accepts error (unknown) and returns formatted error message string. Handle fetch errors, timezone errors, and API error responses consistently.

15. Export all functions as named exports for use in components and hooks.

### src/components/analytics/FlowScoreChart.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/advancedAnalytics.ts(NEW)
- src/components/ui/Card.tsx
- src/components/dashboard/ShipStreak.tsx

**Create line chart component for flow score trends using Recharts:**

1. Mark as 'use client' for Recharts rendering.

2. Import Recharts components: LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart.

3. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

4. Import FlowScoreChartProps, FlowScoreTrendData from `src/types/index.ts`.

5. Import calculateMovingAverage from `src/lib/advancedAnalytics.ts`.

6. Import format from date-fns for date formatting in tooltips.

7. Import TrendingUp icon from lucide-react for card header.

8. Accept props from FlowScoreChartProps: data, isLoading, dateRange.

9. Process data: calculate moving average using calculateMovingAverage(data, 7) for trend line. Format dates for X-axis labels using format(parseISO(date), 'MMM d').

10. Render Card component with standard styling (bg-card, border, rounded-lg, shadow-sm).

11. In CardHeader, display TrendingUp icon and 'Flow Score Trend' title. Show date range as subtitle: 'Last 30 days' or 'Last 7 days' based on dateRange prop.

12. In CardContent, render ResponsiveContainer with width='100%' and height={300}.

13. Render AreaChart (not LineChart) with data array. Configure margin: { top: 10, right: 10, left: -20, bottom: 0 }.

14. Add CartesianGrid with strokeDasharray='3 3' and stroke='hsl(var(--border))'.

15. Add XAxis with dataKey='date', tick={{ fontSize: 12 }}, stroke='hsl(var(--muted-foreground))'. Show every 3rd label to avoid crowding.

16. Add YAxis with domain={[0, 10]}, tick={{ fontSize: 12 }}, stroke='hsl(var(--muted-foreground))'. Label as 'Score'.

17. Add Tooltip with custom content showing formatted date, average score, session count, and total minutes. Style with bg-card, border, rounded, shadow.

18. Add Area with dataKey='averageScore', stroke='hsl(var(--flow-green))', fill='url(#flowGradient)', strokeWidth={2}. Define gradient with defs: linearGradient from flow-green with opacity 0.3 to transparent.

19. Add second Line for moving average trend with dataKey='movingAverage', stroke='hsl(var(--claude-purple))', strokeWidth={2}, strokeDasharray='5 5', dot={false}. This shows the smoothed trend.

20. Apply color coding to Area fill based on score ranges: use conditional rendering or gradient stops. Green for high scores (7-10), yellow for medium (4-6), red for low (1-3).

21. Show empty state when data.length === 0: centered message with TrendingUp icon, 'No productivity data yet', encouraging text 'Complete sessions with productivity scores to see trends'.

22. Handle loading state: show skeleton chart with animate-pulse while isLoading is true. Use gray rectangles as placeholders for chart area.

23. Apply responsive design: chart adjusts to container width, labels remain readable on mobile. Consider rotating X-axis labels 45 degrees if needed.

24. Use consistent Tailwind styling with FlowForge colors (flow-green for positive trends, caution-amber for medium, stuck-red for low).

### src/components/analytics/ModelPerformanceCard.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/advancedAnalytics.ts(NEW)
- src/lib/utils.ts
- src/components/ui/Card.tsx

**Create AI model comparison card with bar chart visualization:**

1. Mark as 'use client' for Recharts rendering.

2. Import Recharts components: BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell.

3. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

4. Import ModelPerformanceCardProps, ModelPerformanceData from `src/types/index.ts`.

5. Import formatModelName from `src/lib/advancedAnalytics.ts`.

6. Import formatDuration from `src/lib/utils.ts` for displaying total minutes.

7. Import Sparkles, Award icons from lucide-react.

8. Accept props from ModelPerformanceCardProps: data, isLoading.

9. Process data: sort by averageScore descending to show best models first. Format model names using formatModelName. Identify best model (highest averageScore).

10. Render Card component with standard styling.

11. In CardHeader, display Sparkles icon and 'AI Model Performance' title. Show insight as subtitle: 'Which models work best for you'.

12. In CardContent, render two sections: (1) Bar chart visualization, (2) Detailed model cards.

13. For bar chart section: render ResponsiveContainer with width='100%' and height={200}.

14. Render BarChart with data array. Configure margin: { top: 10, right: 10, left: -20, bottom: 0 }.

15. Add XAxis with dataKey='modelName', tick={{ fontSize: 11 }}, angle={-45}, textAnchor='end'. This rotates labels for readability.

16. Add YAxis with domain={[0, 10]}, tick={{ fontSize: 12 }}. Label as 'Avg Score'.

17. Add Tooltip with custom content showing model name, average score, session count, total time, best session type.

18. Add Bar with dataKey='averageScore', radius={[4, 4, 0, 0]}. Use Cell component to apply conditional coloring: highlight best model with flow-green, others with claude-purple or muted colors.

19. For detailed cards section: map data to individual model cards. Each card shows: model name with icon, average score (large number with color coding), session count, total coding time (formatted with formatDuration), best session type badge.

20. Highlight best model card with Award icon, border-flow-green, and 'Top Performer' badge.

21. Show insights for each model: 'Great for building' (if bestSessionType is BUILDING), 'Excellent for debugging' (if DEBUGGING), etc. Use getSessionTypeColor from utils for badge colors.

22. Show empty state when data.length === 0: centered message with Sparkles icon, 'No model data yet', encouraging text 'Use different AI models in sessions to see performance comparison'.

23. Handle loading state: show skeleton cards with animate-pulse while isLoading is true.

24. Apply responsive design: cards stack on mobile (grid-cols-1), 2 columns on tablet (md:grid-cols-2), 3 columns on desktop (lg:grid-cols-3).

25. Use consistent Tailwind styling with FlowForge colors and model-specific colors (claude-purple for Claude, blue for GPT, etc.).

### src/components/analytics/BestTimesHeatmap.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/advancedAnalytics.ts(NEW)
- src/components/ui/Card.tsx

**Create productivity heatmap showing best times by day and hour:**

1. Mark as 'use client' for interactive heatmap rendering.

2. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

3. Import BestTimesHeatmapProps, ProductivityHeatmapData from `src/types/index.ts`.

4. Import findBestTimeOfDay from `src/lib/advancedAnalytics.ts`.

5. Import Calendar, Clock icons from lucide-react.

6. Accept props from BestTimesHeatmapProps: data, isLoading.

7. Process data: create 7x24 grid structure (days of week x hours of day). Map data array to grid positions using dayOfWeek and hour. Fill missing cells with default values (averageScore: 0, sessionCount: 0).

8. Calculate color intensity for each cell based on averageScore: 0-3 (red/stuck-red), 4-6 (yellow/caution-amber), 7-10 (green/flow-green). Use opacity to show intensity: higher scores = more opaque.

9. Identify best time using findBestTimeOfDay(data). Highlight this cell with border and glow effect.

10. Render Card component with standard styling.

11. In CardHeader, display Calendar icon and 'Best Times to Code' title. Show insight as subtitle using findBestTimeOfDay result: 'You're most productive on Tuesday mornings'.

12. In CardContent, render custom SVG heatmap (not Recharts, as Recharts doesn't have native heatmap support).

13. Create SVG with viewBox='0 0 800 300' for responsive scaling. Use preserveAspectRatio='xMidYMid meet'.

14. Render Y-axis labels (days of week): Sun, Mon, Tue, Wed, Thu, Fri, Sat. Position at x=0, y=row*cellHeight.

15. Render X-axis labels (hours): 12a, 3a, 6a, 9a, 12p, 3p, 6p, 9p (every 3 hours). Position at x=col*cellWidth, y=0.

16. Render grid cells: map through 7 days x 24 hours. Each cell is a rect with width=cellWidth, height=cellHeight, fill based on score color and opacity, stroke='hsl(var(--border))'.

17. Add hover effect: use CSS hover to show tooltip with exact metrics. Tooltip shows: day name, hour (e.g., '2:00 PM'), average score, session count.

18. Highlight best time cell with thicker border (stroke-width=3), glow effect (filter: drop-shadow), and pulsing animation.

19. Add legend below heatmap: show color scale from red (low productivity) to green (high productivity) with labels 'Low', 'Medium', 'High'.

20. Show empty state when data.length === 0: centered message with Clock icon, 'No productivity patterns yet', encouraging text 'Complete more sessions to discover your best coding times'.

21. Handle loading state: show skeleton heatmap with animate-pulse while isLoading is true. Use gray rectangles as placeholders.

22. Apply responsive design: SVG scales to container width. On mobile, consider showing simplified view (e.g., only weekdays, or aggregated by time of day).

23. Use consistent Tailwind styling with FlowForge colors for the heatmap gradient (stuck-red → caution-amber → flow-green).

24. Add accessibility: include aria-label for each cell with descriptive text, ensure keyboard navigation works for interactive elements.

### src/app/(dashboard)/analytics/page.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/advancedAnalytics.ts(NEW)
- src/components/ui/Card.tsx
- src/components/ui/Button.tsx
- src/app/(dashboard)/dashboard/page.tsx

**Create analytics dashboard page with multiple visualizations:**

1. Mark as 'use client' for interactive state management and React Query.

2. Import useState from 'react' for date range filter state.

3. Import useQuery from '@tanstack/react-query' for data fetching.

4. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

5. Import Button from `src/components/ui/Button.tsx`.

6. Import Select components from '@radix-ui/react-select' for date range selector.

7. Import FlowScoreChart from `src/components/analytics/FlowScoreChart.tsx`.

8. Import ModelPerformanceCard from `src/components/analytics/ModelPerformanceCard.tsx`.

9. Import BestTimesHeatmap from `src/components/analytics/BestTimesHeatmap.tsx`.

10. Import DateRangeFilter, AnalyticsSummary from `src/types/index.ts`.

11. Import getFlowScoreTrend, getModelPerformance, getBestTimes, getAnalyticsSummary, exportAnalyticsData from `src/lib/advancedAnalytics.ts`.

12. Import BarChart3, Download, TrendingUp, Award, Clock icons from lucide-react.

13. Manage state: dateRange (DateRangeFilter, default '30d').

14. Create useQuery for flow score trend: query key ['analytics', 'flow-score', dateRange], calls getFlowScoreTrend(dateRange), staleTime 300000 (5 minutes).

15. Create useQuery for model performance: query key ['analytics', 'model-performance', dateRange], calls getModelPerformance(dateRange), staleTime 300000.

16. Create useQuery for best times: query key ['analytics', 'best-times', dateRange], calls getBestTimes(dateRange), staleTime 300000.

17. Create useQuery for summary: query key ['analytics', 'summary', dateRange], calls getAnalyticsSummary(dateRange), staleTime 300000.

18. Render page header with title 'Analytics Dashboard' and subtitle 'Insights into your productivity patterns'.

19. Render controls section: date range selector (Select with options: Last 7 days, Last 30 days, Last 90 days, All time) and Export button (calls exportAnalyticsData with combined data).

20. Render summary metrics cards in a grid (4 columns on desktop, 2 on tablet, 1 on mobile): Average Flow Score (TrendingUp icon, large number with color coding), Most Productive Model (Award icon, model name), Best Time of Day (Clock icon, formatted time), Total Ships This Month (BarChart3 icon, count).

21. Render main visualizations section in responsive grid: FlowScoreChart (full width on mobile, 2/3 width on desktop), ModelPerformanceCard (full width), BestTimesHeatmap (full width).

22. Pass appropriate props to each component: data from queries, isLoading states, dateRange to FlowScoreChart.

23. Show loading skeleton states while queries are loading: render placeholder cards with animate-pulse for summary metrics and chart areas.

24. Show error state if any query fails: display error message with retry button that refetches all queries.

25. Handle empty state when no data exists: show encouraging message with illustration, 'Start coding to see analytics', and link to start a session.

26. Apply responsive layout: proper padding (p-4 md:p-6 lg:p-8), responsive grid columns (grid-cols-1 md:grid-cols-2 lg:grid-cols-4 for summary, grid-cols-1 lg:grid-cols-3 for charts).

27. Use consistent Tailwind styling with FlowForge colors and proper spacing (gap-4 md:gap-6).

28. Ensure all interactive elements have proper focus states for accessibility.

### src/app/api/analytics/advanced/flow-score/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/api-utils.ts
- src/types/index.ts(MODIFY)
- src/app/api/analytics/streak/route.ts

**Create API route for flow score trend data:**

1. Import getServerSession from 'next-auth/next', authOptions from `src/lib/auth.ts`.

2. Import prisma from `src/lib/prisma.ts`.

3. Import apiResponse, apiError from `src/lib/api-utils.ts`.

4. Import startOfDay, subDays, format from date-fns.

5. Import FlowScoreTrendData from `src/types/index.ts`.

6. Add cache configuration: export const revalidate = 300 (5 minutes).

7. Implement GET handler function: call getServerSession(authOptions) to authenticate. Return 401 with apiError if no session.

8. Extract query parameters: range (DateRangeFilter, default '30d'), timezone (string, default 'UTC') from request.nextUrl.searchParams.

9. Calculate start date based on range: 7d = 7 days ago, 30d = 30 days ago, 90d = 90 days ago, all = user createdAt date. Use subDays and startOfDay for date calculations.

10. Query CodingSession records with prisma.codingSession.findMany: where userId equals session.user.id, startedAt >= startDate, productivityScore is not null (only sessions with scores), orderBy startedAt asc. Select id, startedAt, productivityScore, durationSeconds.

11. Group sessions by date: use Map to aggregate sessions by date (YYYY-MM-DD format). For each date, calculate: averageScore (mean of productivityScore values), sessionCount (count of sessions), totalMinutes (sum of durationSeconds / 60).

12. Fill missing dates: generate array of all dates in range using loop with subDays. For dates without sessions, insert { date, averageScore: 0, sessionCount: 0, totalMinutes: 0 }. This ensures complete dataset for chart.

13. Format response: map aggregated data to FlowScoreTrendData array. Sort by date ascending. Return with apiResponse.

14. Handle timezone: normalize dates to user's timezone using Intl.DateTimeFormat with timeZone option. This ensures 'today' is based on user's local time.

15. Handle errors: wrap in try-catch, return 500 with apiError on database failures. Log errors for monitoring.

16. Export GET handler for Next.js App Router.

17. Add JSDoc comments explaining endpoint purpose, query parameters, and response structure.

18. Follow established patterns from `src/app/api/analytics/streak/route.ts` for consistency.

### src/app/api/analytics/advanced/model-performance/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/api-utils.ts
- src/types/index.ts(MODIFY)
- prisma/schema.prisma

**Create API route for AI model performance comparison:**

1. Import getServerSession from 'next-auth/next', authOptions from `src/lib/auth.ts`.

2. Import prisma from `src/lib/prisma.ts`.

3. Import apiResponse, apiError from `src/lib/api-utils.ts`.

4. Import startOfDay, subDays from date-fns.

5. Import ModelPerformanceData, SessionType from `src/types/index.ts`.

6. Add cache configuration: export const revalidate = 300 (5 minutes).

7. Implement GET handler function: call getServerSession(authOptions) to authenticate. Return 401 with apiError if no session.

8. Extract query parameters: range (DateRangeFilter, default '30d'), timezone (string, default 'UTC') from request.nextUrl.searchParams.

9. Calculate start date based on range (same logic as flow-score endpoint).

10. Query CodingSession records with prisma.codingSession.findMany: where userId equals session.user.id, startedAt >= startDate, productivityScore is not null, aiModelsUsed is not empty array. Select id, aiModelsUsed, productivityScore, durationSeconds, sessionType.

11. Process aiModelsUsed arrays: since CodingSession.aiModelsUsed is string[], extract the primary model (first element) for each session. Handle cases where array has multiple models by using the first one.

12. Group sessions by model name: use Map to aggregate sessions by model. For each model, calculate: averageScore (mean of productivityScore), sessionCount (count), totalMinutes (sum of durationSeconds / 60).

13. Determine best session type for each model: for each model, group sessions by sessionType, calculate average score per type, identify type with highest average. Store as bestSessionType.

14. Format response: map aggregated data to ModelPerformanceData array. Sort by averageScore descending (best models first). Return with apiResponse.

15. Handle edge cases: if a model has no sessions with scores, exclude it from results. If aiModelsUsed array is empty, skip that session.

16. Handle errors: wrap in try-catch, return 500 with apiError on database failures. Log errors for monitoring.

17. Export GET handler for Next.js App Router.

18. Add JSDoc comments explaining endpoint purpose, model extraction logic, and response structure.

19. Follow established patterns from other analytics endpoints for consistency.

### src/app/api/analytics/advanced/best-times/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/api-utils.ts
- src/types/index.ts(MODIFY)
- src/lib/analyticsService.ts

**Create API route for productivity heatmap data:**

1. Import getServerSession from 'next-auth/next', authOptions from `src/lib/auth.ts`.

2. Import prisma from `src/lib/prisma.ts`.

3. Import apiResponse, apiError from `src/lib/api-utils.ts`.

4. Import startOfDay, subDays, getDay, getHours from date-fns.

5. Import ProductivityHeatmapData from `src/types/index.ts`.

6. Add cache configuration: export const revalidate = 300 (5 minutes).

7. Implement GET handler function: call getServerSession(authOptions) to authenticate. Return 401 with apiError if no session.

8. Extract query parameters: range (DateRangeFilter, default '30d'), timezone (string, default 'UTC') from request.nextUrl.searchParams.

9. Calculate start date based on range (same logic as other endpoints).

10. Query CodingSession records with prisma.codingSession.findMany: where userId equals session.user.id, startedAt >= startDate, productivityScore is not null. Select id, startedAt, productivityScore.

11. Process sessions to extract day of week and hour: for each session, use getDay(startedAt) to get day (0-6, Sunday-Saturday), use getHours(startedAt) to get hour (0-23). Handle timezone conversion using Intl.DateTimeFormat with user's timezone.

12. Group sessions by (dayOfWeek, hour) tuple: use nested Map structure or composite key (e.g., 'day-hour'). For each cell, calculate: averageScore (mean of productivityScore), sessionCount (count).

13. Generate complete 7x24 grid: create array of all possible (dayOfWeek, hour) combinations. For cells without sessions, insert { dayOfWeek, hour, averageScore: 0, sessionCount: 0 }. This ensures complete heatmap data.

14. Format response: map aggregated data to ProductivityHeatmapData array. Sort by dayOfWeek then hour. Return with apiResponse.

15. Handle timezone carefully: ensure startedAt is converted to user's timezone before extracting day/hour. Use Intl.DateTimeFormat with timeZone option for accurate conversion.

16. Handle errors: wrap in try-catch, return 500 with apiError on database failures. Log errors for monitoring.

17. Export GET handler for Next.js App Router.

18. Add JSDoc comments explaining endpoint purpose, timezone handling, and heatmap data structure.

19. Follow established patterns from other analytics endpoints for consistency.

### src/app/api/analytics/advanced/summary/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/api-utils.ts
- src/types/index.ts(MODIFY)
- prisma/schema.prisma

**Create API route for analytics summary metrics:**

1. Import getServerSession from 'next-auth/next', authOptions from `src/lib/auth.ts`.

2. Import prisma from `src/lib/prisma.ts`.

3. Import apiResponse, apiError from `src/lib/api-utils.ts`.

4. Import startOfDay, subDays, startOfMonth, endOfMonth from date-fns.

5. Import AnalyticsSummary from `src/types/index.ts`.

6. Add cache configuration: export const revalidate = 300 (5 minutes).

7. Implement GET handler function: call getServerSession(authOptions) to authenticate. Return 401 with apiError if no session.

8. Extract query parameters: range (DateRangeFilter, default '30d'), timezone (string, default 'UTC') from request.nextUrl.searchParams.

9. Calculate start date based on range (same logic as other endpoints).

10. Execute parallel queries with Promise.all: (1) Query CodingSessions for average flow score: calculate mean of productivityScore where startedAt >= startDate and productivityScore is not null. (2) Query CodingSessions grouped by aiModelsUsed: find model with highest average productivityScore. (3) Query ProductivityHeatmapData (reuse logic from best-times endpoint): find hour with highest average score, format as 'Tuesday mornings' or 'Friday afternoons'. (4) Query Analytics for total ships this month: sum shipCount where date between startOfMonth(now) and endOfMonth(now). (5) Query CodingSessions for total coding minutes: sum durationSeconds / 60 where startedAt >= startDate.

11. Process results: extract averageFlowScore (round to 1 decimal), mostProductiveModel (model name with highest score), bestTimeOfDay (formatted string), totalShipsThisMonth (count), totalCodingMinutes (sum).

12. Format response: create AnalyticsSummary object with all calculated metrics. Return with apiResponse.

13. Handle edge cases: if no sessions exist, return default values (averageFlowScore: 0, mostProductiveModel: 'N/A', bestTimeOfDay: 'Not enough data', totalShipsThisMonth: 0, totalCodingMinutes: 0).

14. Handle errors: wrap in try-catch, return 500 with apiError on database failures. Log errors for monitoring.

15. Export GET handler for Next.js App Router.

16. Add JSDoc comments explaining endpoint purpose, aggregation logic, and response structure.

17. Follow established patterns from other analytics endpoints for consistency.