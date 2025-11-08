I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase has solid foundations with Next.js 14 App Router, NextAuth v5, Prisma ORM, and all required dependencies installed. The Prisma Project model includes feelsRightScore (Int, default 50), pivotCount (Int, default 0), shipTarget (DateTime?), stackNotes (Text?), and isActive (Boolean, default true). The master plan specifies a 1-5 scale for feelsRightScore with emoji indicators, which conflicts with the Prisma default of 50. No UI components, stores, services, or API routes exist yet. The types/index.ts has basic interfaces but needs project-specific extensions. The utils.ts has minimal utilities (cn, formatDuration, getFlowStateColor) and needs project helpers. Custom Tailwind colors (flow-green, caution-amber, stuck-red, claude-purple) are defined for consistent theming.

### Approach

Implement Phase 1.5 Project Management by creating the projects page with grid/list view, filters, and sorting; building four core components (ProjectCard, FeelsRightSlider, CreateProjectDialog, PivotCounter); implementing projectService for business logic; and extending types/utilities for project-specific needs. The approach addresses the feelsRightScore scale discrepancy by storing 1-5 in the database (updating Prisma default) and using emoji indicators in the UI. Components will use Radix UI primitives, React Query for server state, and follow established patterns from the master plan. The momentum calculation (🔥 Hot, ⚡ Active, 💤 Quiet) will be based on most recent session activity timestamps.

### Reasoning

I explored the codebase and found it's in early implementation stages with only basic setup (auth, prisma, providers). No previous phases (sessions, dashboard, API routes) have been implemented yet. I reviewed the master plan specifications for projects, examined the Prisma schema to understand the Project model structure, confirmed all necessary dependencies are installed (Radix UI, React Query, Zustand, date-fns, Zod), and identified the feelsRightScore scale discrepancy between Prisma schema (default 50) and master plan (1-5 scale). The tailwind config shows custom FlowForge colors are defined, and the globals.css has basic styling setup.

## Mermaid Diagram

sequenceDiagram
    participant User
    participant ProjectsPage
    participant CreateProjectDialog
    participant ProjectCard
    participant FeelsRightSlider
    participant PivotCounter
    participant ProjectService
    participant ReactQuery
    participant API

    User->>ProjectsPage: Navigate to /projects
    ProjectsPage->>ReactQuery: useQuery(['projects', filters])
    ReactQuery->>ProjectService: fetchProjects(filters)
    ProjectService->>API: GET /api/projects?isActive=true&sort=momentum
    API-->>ProjectService: Return projects array
    ProjectService->>ProjectService: Calculate momentum for each project
    ProjectService-->>ReactQuery: Return ProjectWithStats[]
    ReactQuery-->>ProjectsPage: Projects data available
    ProjectsPage->>ProjectCard: Render project cards
    
    User->>ProjectsPage: Click "New Project"
    ProjectsPage->>CreateProjectDialog: Open dialog (isOpen=true)
    User->>CreateProjectDialog: Fill form (name, description, feels-right=3)
    User->>CreateProjectDialog: Click "Create Project"
    CreateProjectDialog->>ReactQuery: useMutation(createProject)
    ReactQuery->>ProjectService: createProject(data)
    ProjectService->>API: POST /api/projects
    API-->>ProjectService: Return created project
    ProjectService-->>ReactQuery: Project created
    ReactQuery->>ReactQuery: Invalidate ['projects'] query
    ReactQuery-->>CreateProjectDialog: Success
    CreateProjectDialog->>ProjectsPage: onProjectCreated callback
    CreateProjectDialog->>User: Show success toast, close dialog
    ProjectsPage->>ReactQuery: Refetch projects
    
    User->>ProjectCard: Adjust feels-right slider
    ProjectCard->>FeelsRightSlider: onChange(newValue)
    FeelsRightSlider->>FeelsRightSlider: Debounce 500ms
    FeelsRightSlider->>ReactQuery: useMutation(updateFeelsRightScore)
    ReactQuery->>ProjectService: updateFeelsRightScore(projectId, score)
    ProjectService->>API: PATCH /api/projects/{id}/feels-right
    API-->>ProjectService: Return updated project
    ProjectService-->>ReactQuery: Score updated
    ReactQuery->>ReactQuery: Invalidate ['projects'] query
    ReactQuery-->>FeelsRightSlider: Success
    FeelsRightSlider->>User: Show success toast
    
    User->>ProjectCard: Click "Record Pivot"
    ProjectCard->>PivotCounter: Open pivot dialog
    User->>PivotCounter: Enter optional notes
    User->>PivotCounter: Click "Record Pivot"
    PivotCounter->>ReactQuery: useMutation(recordPivot)
    ReactQuery->>ProjectService: recordPivot(projectId, notes)
    ProjectService->>API: POST /api/projects/{id}/pivot
    API-->>ProjectService: Return updated project (pivotCount++)
    ProjectService-->>ReactQuery: Pivot recorded
    ReactQuery->>ReactQuery: Invalidate ['projects'] query
    ReactQuery-->>PivotCounter: Success
    PivotCounter->>User: Show celebration toast, close dialog
    
    User->>ProjectsPage: Change filter (Active only)
    ProjectsPage->>ProjectsPage: Update filters state
    ProjectsPage->>ReactQuery: Refetch with new filters
    ReactQuery->>ProjectService: fetchProjects({isActive: true})
    ProjectService->>API: GET /api/projects?isActive=true
    API-->>ProjectService: Return filtered projects
    ProjectService-->>ReactQuery: Filtered data
    ReactQuery-->>ProjectsPage: Update display

## Proposed File Changes

### prisma/schema.prisma(MODIFY)

**Update Project model feelsRightScore default to align with 1-5 scale:**

1. Locate the Project model definition (lines 74-93).

2. Change line 79 from `feelsRightScore Int @default(50)` to `feelsRightScore Int @default(3)` to align with the master plan's 1-5 scale where 3 represents 'Okay' as the neutral starting point.

3. This change ensures new projects start with a neutral feels-right score rather than a percentage-based value.

4. After making this change, a database migration will be needed: `npx prisma migrate dev --name update_feels_right_default`.

5. This resolves the discrepancy between the Prisma schema and the master plan specifications.

### src/types/index.ts(MODIFY)

References: 

- prisma/schema.prisma(MODIFY)

**Extend types with project-specific interfaces and enums:**

1. Add Momentum type as union: `export type Momentum = 'HOT' | 'ACTIVE' | 'QUIET'` for project activity indicators.

2. Update the existing Project interface (lines 46-57) to ensure it matches the Prisma schema exactly, including the isActive field: add `isActive: boolean` property.

3. Add ProjectWithStats interface extending Project with calculated fields: `totalSessions: number`, `totalCodingMinutes: number`, `lastWorkedDate: Date | null`, `momentum: Momentum`.

4. Add ProjectFilters interface with optional fields: `isActive: boolean | null`, `sortBy: 'updatedAt' | 'feelsRightScore' | 'momentum' | null`, `search: string | null`.

5. Add ProjectStats interface for summary statistics: `activeProjectsCount: number`, `projectsShippedThisMonth: number`, `totalProjects: number`.

6. Add CreateProjectRequest interface: `name: string`, `description?: string`, `feelsRightScore?: number`, `shipTarget?: Date`, `stackNotes?: string`.

7. Add UpdateProjectRequest interface with all optional fields: `name?: string`, `description?: string`, `feelsRightScore?: number`, `shipTarget?: Date`, `stackNotes?: string`, `isActive?: boolean`.

8. Add FeelsRightScoreRequest interface: `score: number` (1-5 range).

9. Add RecordPivotRequest interface: `notes?: string` for optional pivot documentation.

10. Add component prop types: `ProjectCardProps` interface with `project: ProjectWithStats`, `onUpdate?: (project: Project) => void`, `onStartSession?: (projectId: string) => void`, `onDelete?: (projectId: string) => void`.

11. Add FeelsRightSliderProps interface: `projectId: string`, `initialValue: number`, `onChange: (value: number) => void`, `disabled?: boolean`.

12. Add CreateProjectDialogProps interface: `isOpen: boolean`, `onClose: () => void`, `onProjectCreated?: (project: Project) => void`.

13. Add PivotCounterProps interface: `projectId: string`, `currentCount: number`, `onPivotRecorded?: () => void`.

14. Export all new types and interfaces for use throughout the application.

### src/lib/utils.ts(MODIFY)

References: 

- src/types/index.ts(MODIFY)

**Add project-specific utility functions:**

1. Import necessary functions from date-fns: `import { format, formatDistanceToNow, differenceInDays, differenceInHours, parseISO, isAfter, isBefore } from 'date-fns'`.

2. Import Momentum type from `src/types/index.ts`.

3. Add getMomentumEmoji function: accepts `momentum: Momentum`, returns emoji string: 'HOT' → '🔥', 'ACTIVE' → '⚡', 'QUIET' → '💤'.

4. Add getMomentumLabel function: accepts `momentum: Momentum`, returns human-readable label: 'HOT' → 'Hot', 'ACTIVE' → 'Active', 'QUIET' → 'Quiet'.

5. Add getMomentumColor function: accepts `momentum: Momentum`, returns Tailwind color class: 'HOT' → 'text-red-500', 'ACTIVE' → 'text-yellow-500', 'QUIET' → 'text-gray-400'.

6. Add getFeelsRightEmoji function: accepts `score: number` (1-5), returns emoji: 1='😰', 2='😕', 3='😐', 4='😊', 5='🚀'. Include validation to clamp score between 1-5.

7. Add getFeelsRightLabel function: accepts `score: number` (1-5), returns descriptive label: 1='Struggling', 2='Uncertain', 3='Okay', 4='Good', 5='Nailing It'.

8. Add getFeelsRightColor function: accepts `score: number` (1-5), returns Tailwind color class: 1-2='text-stuck-red', 3='text-caution-amber', 4-5='text-flow-green'.

9. Add formatRelativeTime function: accepts `date: Date`, returns human-readable relative time string using formatDistanceToNow with addSuffix option (e.g., '2 hours ago', 'in 3 days'). Handle edge case for 'just now' (< 1 minute).

10. Add formatShipTarget function: accepts `shipTarget: Date | null`, returns formatted string. If null, return 'No target set'. If future date, return 'Ships in X days'. If past date, return 'Shipped X days ago'. Use differenceInDays for calculation.

11. Add truncateText function: accepts `text: string`, `maxLength: number`, `suffix: string = '...'`, returns truncated string. Used for project descriptions and notes previews.

12. Add validateFeelsRightScore function: accepts `score: number`, returns boolean indicating if score is valid integer between 1-5 inclusive.

13. Add slugify function: accepts `text: string`, returns URL-friendly slug (lowercase, hyphens, no special chars). Useful for project names in URLs (future enhancement).

14. Export all new utility functions for use in project components and services.

### src/lib/projectService.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create business logic service for project management operations:**

1. Import types from `src/types/index.ts`: Project, ProjectWithStats, Momentum, CreateProjectRequest, UpdateProjectRequest, FeelsRightScoreRequest, RecordPivotRequest.

2. Import utilities from `src/lib/utils.ts`: formatRelativeTime, formatShipTarget, getMomentumEmoji, getMomentumLabel, truncateText.

3. Import date utilities from date-fns: differenceInHours, differenceInDays.

4. Define API_BASE constant: `const API_BASE = '/api/projects'`.

5. Create fetchProjects async function: accepts optional filters (isActive, sortBy, search). Construct query params string. Make GET request to API_BASE with params. Return array of ProjectWithStats or throw error. Handle fetch errors with try-catch.

6. Create fetchProjectById async function: accepts projectId string. Make GET request to `${API_BASE}/${projectId}`. Return ProjectWithStats with calculated statistics or throw error.

7. Create createProject async function: accepts CreateProjectRequest data. Validate feelsRightScore is 1-5 if provided. Make POST request to API_BASE with data. Return created Project or throw error.

8. Create updateProject async function: accepts projectId string and UpdateProjectRequest data. Make PATCH request to `${API_BASE}/${projectId}` with data. Return updated Project or throw error.

9. Create updateFeelsRightScore async function: accepts projectId string and score number (1-5). Validate score using validateFeelsRightScore from utils. Make PATCH request to `${API_BASE}/${projectId}/feels-right` with score. Return updated Project or throw error.

10. Create recordPivot async function: accepts projectId string and optional notes string. Make POST request to `${API_BASE}/${projectId}/pivot` with notes. Return updated Project with incremented pivotCount or throw error.

11. Create deleteProject async function: accepts projectId string. Make DELETE request to `${API_BASE}/${projectId}` (soft delete by setting isActive=false). Return success boolean or throw error.

12. Create calculateMomentum function: accepts lastWorkedDate (Date | null). If null, return 'QUIET'. Calculate hours since last worked using differenceInHours. If < 24 hours, return 'HOT'. If < 168 hours (7 days), return 'ACTIVE'. Otherwise return 'QUIET'. This is a client-side calculation helper.

13. Create getProjectDuration function: accepts totalCodingMinutes number. Format using formatDuration from utils (convert minutes to seconds first). Return formatted string like '15h 30m'.

14. Create formatProjectStats function: accepts ProjectWithStats. Return formatted object with: durationFormatted (string), momentumEmoji (string), momentumLabel (string), lastWorkedFormatted (string), shipTargetFormatted (string). Used by ProjectCard for display.

15. Create sortProjectsByMomentum function: accepts projects array. Sort by momentum priority: HOT first, then ACTIVE, then QUIET. Within same momentum, sort by updatedAt descending. Return sorted array. This is a client-side helper for when API doesn't support momentum sorting.

16. Create validateProjectData function: accepts project data object. Validate required fields (name non-empty), feelsRightScore is 1-5 if present, shipTarget is valid date if present. Return object with isValid boolean and errors string array.

17. Add error handling utility: create handleProjectError function that accepts error (unknown) and returns formatted error message string. Handle fetch errors, validation errors, and API error responses consistently.

18. Export all functions as named exports for use in components and hooks.

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

11. Export Button component and buttonVariants for external use in other components.

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

10. Export Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter as named exports for use in project components.

### src/hooks/useToast.ts(NEW)

**Create custom toast notification hook using Radix Toast:**

1. Mark as 'use client' for client-side state management.

2. Import useState, useCallback from 'react'.

3. Define ToastType as union: `type ToastType = 'success' | 'error' | 'info' | 'warning'`.

4. Define Toast interface with properties: `id: string`, `message: string`, `type: ToastType`, `duration?: number`.

5. Create useToast hook that manages toast state internally with useState holding array of Toast objects.

6. Implement addToast function using useCallback: accepts message (string), type (ToastType), duration (number, default 5000). Generate unique id using `Date.now() + Math.random()`. Add toast to state array. Set timeout to remove toast after duration.

7. Implement removeToast function using useCallback: accepts id (string), filters toast from state array.

8. Return object with toast helper functions: `success: (message: string, duration?: number) => void`, `error: (message: string, duration?: number) => void`, `info: (message: string, duration?: number) => void`, `warning: (message: string, duration?: number) => void`, and `toasts` array for rendering.

9. Each helper function calls addToast with appropriate type.

10. Export useToast hook for use in components. Components will need to render Toast.Provider and Toast.Viewport in their tree, with individual Toast.Root elements for each toast in the array (implementation in Providers component).

### src/components/projects/ProjectCard.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)
- src/components/ui/Card.tsx(NEW)
- src/components/ui/Button.tsx(NEW)

**Create visual project card component with feels-right slider and momentum indicator:**

1. Mark as 'use client' for interactive functionality.

2. Import Card, CardHeader, CardTitle, CardContent, CardFooter from `src/components/ui/Card.tsx`.

3. Import Button from `src/components/ui/Button.tsx`.

4. Import DropdownMenu components from '@radix-ui/react-dropdown-menu' for action menu.

5. Import ProjectCardProps, ProjectWithStats from `src/types/index.ts`.

6. Import utilities from `src/lib/utils.ts`: getMomentumEmoji, getMomentumLabel, getMomentumColor, getFeelsRightEmoji, getFeelsRightLabel, formatRelativeTime, formatShipTarget, truncateText.

7. Import icons from 'lucide-react': MoreVertical, Play, Edit, Archive, TrendingUp, Calendar, Clock.

8. Import FeelsRightSlider from `src/components/projects/FeelsRightSlider.tsx`.

9. Import PivotCounter from `src/components/projects/PivotCounter.tsx`.

10. Accept props from ProjectCardProps interface: project, onUpdate, onStartSession, onDelete.

11. Render Card component with hover effect (hover:shadow-md transition-shadow) and cursor-pointer if onUpdate is provided.

12. In CardHeader, display project name prominently as CardTitle. Show momentum indicator badge with emoji and label using getMomentumEmoji and getMomentumLabel, styled with getMomentumColor.

13. Show project description if present, truncated to 100 characters using truncateText, with muted text color.

14. In CardContent, render FeelsRightSlider component passing projectId, initialValue (project.feelsRightScore), and onChange handler that calls onUpdate.

15. Display ship target date if present using formatShipTarget, with Calendar icon. Style as flexible target, not rigid deadline (use muted colors, 'Target: ...' label).

16. Show last worked timestamp using formatRelativeTime with project.lastWorkedDate, with Clock icon. If null, show 'Never worked on'.

17. Display total coding time using project.totalCodingMinutes formatted as hours/minutes (e.g., '15h 30m'), with TrendingUp icon.

18. In CardFooter, render PivotCounter component passing projectId, currentCount (project.pivotCount), and onPivotRecorded callback.

19. Render DropdownMenu trigger button (MoreVertical icon) in top-right corner of card header.

20. In DropdownMenuContent, add menu items: 'Start Session' (calls onStartSession with projectId, shows Play icon), 'Edit Project' (calls onUpdate, shows Edit icon), 'Archive Project' (calls onDelete with confirmation, shows Archive icon).

21. Apply color coding to card border based on momentum: red border for HOT, yellow for ACTIVE, gray for QUIET (use border-l-4 for accent).

22. Make entire card clickable to call onUpdate if provided, with proper hover states.

23. Use consistent Tailwind styling with proper spacing (p-4, gap-3) and responsive design.

### src/components/projects/FeelsRightSlider.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)
- src/lib/projectService.ts(NEW)
- src/hooks/useToast.ts(NEW)

**Create interactive slider for subjective progress indicator (1-5 scale):**

1. Mark as 'use client' for interactive slider functionality.

2. Import useState, useEffect from 'react'.

3. Import Slider from '@radix-ui/react-slider' for the slider component.

4. Import Tooltip, TooltipTrigger, TooltipContent, TooltipProvider from '@radix-ui/react-tooltip' for explanatory tooltip.

5. Import useMutation, useQueryClient from '@tanstack/react-query' for updating feels-right score.

6. Import FeelsRightSliderProps from `src/types/index.ts`.

7. Import utilities from `src/lib/utils.ts`: getFeelsRightEmoji, getFeelsRightLabel, getFeelsRightColor, validateFeelsRightScore.

8. Import updateFeelsRightScore from `src/lib/projectService.ts`.

9. Import useToast from `src/hooks/useToast.ts` for success/error notifications.

10. Import HelpCircle icon from 'lucide-react' for tooltip trigger.

11. Accept props from FeelsRightSliderProps: projectId, initialValue, onChange, disabled.

12. Manage local state for current value with useState, initialized to initialValue.

13. Create useMutation for updating feels-right score: calls updateFeelsRightScore from projectService, on success invalidates projects query, shows success toast, calls onChange prop.

14. Implement debounced update: use useEffect with setTimeout to delay API call by 500ms after user stops sliding. This prevents excessive API calls during sliding.

15. Render container div with label 'How does this feel?' and HelpCircle icon that triggers tooltip.

16. In TooltipContent, explain: 'This is your subjective feeling about the project, not objective completion. 1=Struggling, 5=Nailing It'.

17. Display current score prominently with emoji and label using getFeelsRightEmoji and getFeelsRightLabel, styled with getFeelsRightColor.

18. Render Radix Slider component with: min={1}, max={5}, step={1}, value={[currentValue]}, onValueChange handler that updates local state.

19. Style slider track with gradient from stuck-red (left) through caution-amber (middle) to flow-green (right) to visually represent the scale.

20. Display visual markers at each integer position (1-5) with small dots or emoji indicators.

21. Show loading state during mutation with disabled slider and opacity reduction.

22. Apply consistent Tailwind styling with proper spacing and responsive design.

23. Ensure slider is keyboard accessible (built into Radix Slider) with arrow key support.

### src/components/projects/CreateProjectDialog.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/projectService.ts(NEW)
- src/lib/utils.ts(MODIFY)
- src/hooks/useToast.ts(NEW)
- src/components/ui/Button.tsx(NEW)

**Create modal dialog for creating new projects:**

1. Mark as 'use client' for interactive form functionality.

2. Import useState from 'react' for form state management.

3. Import Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter from '@radix-ui/react-dialog'.

4. Import Button from `src/components/ui/Button.tsx`.

5. Import Label from '@radix-ui/react-label' for form labels.

6. Import useMutation, useQueryClient from '@tanstack/react-query' for creating projects.

7. Import CreateProjectDialogProps, CreateProjectRequest from `src/types/index.ts`.

8. Import createProject from `src/lib/projectService.ts`.

9. Import useToast from `src/hooks/useToast.ts` for notifications.

10. Import Calendar icon from 'lucide-react'.

11. Accept props from CreateProjectDialogProps: isOpen, onClose, onProjectCreated.

12. Manage form state with useState: name (string), description (string), feelsRightScore (number, default 3), shipTarget (string for date input), stackNotes (string).

13. Create useMutation for creating project: calls createProject from projectService, on success invalidates projects query, shows success toast, calls onProjectCreated callback, resets form, closes dialog.

14. Render Dialog with open={isOpen} and onOpenChange={onClose}.

15. In DialogHeader, show DialogTitle 'Create New Project' and DialogDescription 'Start tracking a new project with subjective progress indicators'.

16. Create form with fields: Project Name (required text input with placeholder 'My Awesome Project'), Description (optional textarea with placeholder 'What are you building?'), Initial Feels Right Score (radio buttons or segmented control for 1-5 with emoji indicators, default 3), Ship Target (optional date picker input), Stack Notes (optional textarea with placeholder 'Document your optimal AI tools and approaches').

17. For the feels-right score selector, display all 5 options with emoji and label using getFeelsRightEmoji and getFeelsRightLabel from utils.

18. Validate form: name must be non-empty, feelsRightScore must be 1-5, shipTarget must be valid date if provided.

19. In DialogFooter, add Cancel button (calls onClose, variant='outline') and Create Project button (calls mutation, disabled if name empty or mutation loading, shows loading state with spinner).

20. Handle form submission: prevent default, validate inputs, call mutation with form data.

21. Show validation errors inline below each field with red text.

22. Apply consistent Tailwind styling with proper spacing (gap-4 for form fields) and focus states.

23. Reset form state when dialog closes or after successful creation.

### src/components/projects/PivotCounter.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/projectService.ts(NEW)
- src/hooks/useToast.ts(NEW)
- src/components/ui/Button.tsx(NEW)

**Create component for displaying and recording project pivots:**

1. Mark as 'use client' for interactive button functionality.

2. Import useState from 'react' for managing notes dialog state.

3. Import Button from `src/components/ui/Button.tsx`.

4. Import Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter from '@radix-ui/react-dialog' for optional notes input.

5. Import useMutation, useQueryClient from '@tanstack/react-query' for recording pivots.

6. Import PivotCounterProps from `src/types/index.ts`.

7. Import recordPivot from `src/lib/projectService.ts`.

8. Import useToast from `src/hooks/useToast.ts` for celebration notifications.

9. Import RotateCcw, Plus icons from 'lucide-react'.

10. Accept props from PivotCounterProps: projectId, currentCount, onPivotRecorded.

11. Manage state for dialog open (boolean) and pivot notes (string).

12. Create useMutation for recording pivot: calls recordPivot from projectService, on success invalidates projects query, shows celebration toast with positive message like '🔄 Pivot recorded! Exploration is progress!', calls onPivotRecorded callback, closes dialog, resets notes.

13. Render container with RotateCcw icon and current pivot count displayed prominently.

14. Frame pivots positively: if count is 0, show 'No pivots yet'. If count > 0, show '🔄 {count} Pivot{s}' or '🔄 Exploring ({count} pivots)'.

15. Include 'Record Pivot' button (Plus icon, variant='outline', size='sm') that opens dialog.

16. In Dialog, show DialogTitle 'Record a Pivot' and optional textarea for notes with placeholder 'What changed and why? (optional)'.

17. In DialogFooter, add Cancel button and 'Record Pivot' button (calls mutation, shows loading state).

18. Show brief animation when pivot is recorded: use Tailwind animate-pulse or custom animation for 1 second.

19. Display pivot count with badge styling (rounded-full, bg-primary/10, text-primary, px-2 py-1).

20. Consider adding tooltip explaining that pivots celebrate direction changes as positive exploration, not failure.

21. Apply consistent Tailwind styling with proper spacing and colors.

22. Ensure button has minimum 44px touch target for mobile accessibility.

### src/app/(dashboard)/projects/page.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/projectService.ts(NEW)
- src/hooks/useToast.ts(NEW)
- src/components/ui/Button.tsx(NEW)
- src/components/ui/Card.tsx(NEW)
- src/components/projects/ProjectCard.tsx(NEW)
- src/components/projects/CreateProjectDialog.tsx(NEW)

**Create projects page with grid/list view, filters, and summary stats:**

1. Mark as 'use client' for interactive filtering and state management.

2. Import useState from 'react' for filter state management.

3. Import useQuery, useMutation, useQueryClient from '@tanstack/react-query' for data fetching.

4. Import Button from `src/components/ui/Button.tsx`.

5. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

6. Import Select, SelectTrigger, SelectValue, SelectContent, SelectItem from '@radix-ui/react-select' for filter dropdowns.

7. Import ProjectCard from `src/components/projects/ProjectCard.tsx`.

8. Import CreateProjectDialog from `src/components/projects/CreateProjectDialog.tsx`.

9. Import ProjectFilters, ProjectStats, ProjectWithStats from `src/types/index.ts`.

10. Import fetchProjects, deleteProject, calculateMomentum from `src/lib/projectService.ts`.

11. Import useToast from `src/hooks/useToast.ts`.

12. Import icons from 'lucide-react': Plus, Filter, Search, FolderKanban, TrendingUp, Package.

13. Manage state: filters (ProjectFilters with isActive, sortBy, search), isDialogOpen (boolean), searchInput (string for debounced search).

14. Create useQuery to fetch projects: calls fetchProjects with current filters. Query key should include filter values: ['projects', filters]. Enable refetchOnMount and staleTime of 30 seconds.

15. Create useMutation for deleting projects: calls deleteProject, on success invalidates projects query, shows success toast.

16. Calculate summary statistics from fetched projects: activeProjectsCount (count where isActive=true), projectsShippedThisMonth (count where shipTarget is this month and in past), totalProjects (total count).

17. Render page header with title 'Projects' and 'New Project' button (Plus icon, opens CreateProjectDialog).

18. Display summary statistics cards in a grid (3 columns on desktop, 1 on mobile): Active Projects (FolderKanban icon, count), Projects Shipped This Month (Package icon, count), Total Coding Time (TrendingUp icon, sum of all project coding minutes formatted).

19. Render filter section with: Search input (debounced, updates filters.search after 300ms), Status filter Select (All, Active, Archived), Sort By Select (Recent Activity, Feels Right Score, Momentum).

20. Map projects data to ProjectCard components in responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6). Pass project object and callback handlers: onUpdate (refetch query), onStartSession (navigate to sessions or show toast 'Coming soon'), onDelete (show confirmation dialog then call delete mutation).

21. Implement loading skeleton states while projects query is loading: render 6 placeholder cards with animated pulse (bg-gray-200 animate-pulse rounded-lg h-64).

22. Show empty state when no projects exist: centered message with FolderKanban icon, 'No projects yet', encouraging text 'Create your first project to start tracking progress', and 'Create Project' button.

23. Show empty state when filters return no results: 'No projects match your filters' message with 'Clear Filters' button that resets filters.

24. Render CreateProjectDialog with isOpen state, onClose handler, onProjectCreated callback that refetches projects query.

25. Handle delete confirmation: use browser confirm() or create custom confirmation dialog before calling delete mutation.

26. Apply responsive layout: proper padding (p-4 md:p-6 lg:p-8), responsive grid columns, mobile-friendly filter controls.

27. Use consistent Tailwind styling with proper spacing, hover states, and transitions.

28. Ensure all interactive elements have proper focus states for accessibility.