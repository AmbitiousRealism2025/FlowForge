I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase has solid foundations with all necessary infrastructure in place. The Prisma Note model includes all required fields with proper relationships to User, CodingSession, and Project models. The NoteCategory enum is defined with five values matching the master plan specifications. Custom Tailwind colors are configured for consistent theming. The types/index.ts has basic Note interface and NoteCategory enum but needs extension for API request/response types and component props. The utils.ts has minimal utilities (cn, formatDuration, getFlowStateColor) and needs note-specific helpers. No UI components exist yet (Button, Card, Badge, Input, Textarea need to be created as reusable primitives). The providers setup includes React Query but needs toast notifications added. The master plan provides comprehensive specifications for all components, including UI patterns, data flows, and business logic requirements.

### Approach

Implement Phase 1.6 Notes System by creating a notes page with search, filtering, and category organization; building three core components (NoteCard, CreateNoteDialog, NoteEditor); implementing notesService for business logic; and extending types/utilities for note-specific operations. The approach follows established patterns: Radix UI for dialogs/dropdowns, React Query for server state, Tailwind for styling, and Zod for validation. Components will integrate with the notes API endpoints (to be created) and leverage the existing auth/prisma infrastructure. The five note categories (PROMPT_PATTERN, GOLDEN_CODE, DEBUG_LOG, MODEL_NOTE, INSIGHT) will have distinct icons and colors for visual organization. Markdown-aware editing will be lightweight (textarea with formatting helpers) to keep the MVP scope manageable.

### Reasoning

I explored the codebase structure and found it's in early implementation stages with only basic setup: Next.js 14 App Router, NextAuth v5 configured, Prisma schema complete with Note model and NoteCategory enum, all dependencies installed (Radix UI, React Query, Zustand, date-fns, Zod), custom Tailwind colors defined (flow-green, caution-amber, stuck-red, claude-purple), and basic type definitions. I reviewed the master plan specifications for detailed notes requirements, examined the Prisma Note model structure (title, content, category, tags, sessionId, projectId, isTemplate), confirmed the five note categories are defined in the schema, and verified that no UI components or services exist yet, providing a clean slate for implementation.

## Mermaid Diagram

sequenceDiagram
    participant User
    participant NotesPage
    participant CreateNoteDialog
    participant NoteEditor
    participant NoteCard
    participant NotesService
    participant ReactQuery
    participant API

    User->>NotesPage: Navigate to /notes
    NotesPage->>ReactQuery: useQuery(['notes', filters])
    ReactQuery->>NotesService: fetchNotes(filters, page, limit)
    NotesService->>API: GET /api/notes?category=&search=&page=1
    API-->>NotesService: Return paginated notes
    NotesService-->>ReactQuery: Return NoteWithRelations[]
    ReactQuery-->>NotesPage: Notes data available
    NotesPage->>NoteCard: Render note cards
    
    User->>NotesPage: Type in search input
    NotesPage->>NotesPage: Debounce 300ms
    NotesPage->>ReactQuery: Update filters, refetch
    ReactQuery->>NotesService: fetchNotes(filters with search)
    NotesService->>API: GET /api/notes?search=query
    API-->>NotesService: Return filtered notes
    NotesService-->>ReactQuery: Filtered results
    ReactQuery-->>NotesPage: Update display
    
    User->>NotesPage: Click "New Note"
    NotesPage->>CreateNoteDialog: Open dialog (isOpen=true)
    CreateNoteDialog->>NoteEditor: Render editor component
    User->>NoteEditor: Type content, select category
    NoteEditor->>NoteEditor: Auto-save draft to localStorage
    User->>NoteEditor: Click formatting button (Code Block)
    NoteEditor->>NoteEditor: Insert markdown syntax at cursor
    
    User->>CreateNoteDialog: Fill form (title, tags, associations)
    User->>CreateNoteDialog: Click "Create Note"
    CreateNoteDialog->>ReactQuery: useMutation(createNote)
    ReactQuery->>NotesService: createNote(data)
    NotesService->>API: POST /api/notes
    API-->>NotesService: Return created note
    NotesService-->>ReactQuery: Note created
    ReactQuery->>ReactQuery: Invalidate ['notes'] query
    ReactQuery-->>CreateNoteDialog: Success
    CreateNoteDialog->>NotesPage: onNoteCreated callback
    CreateNoteDialog->>User: Show success toast, close dialog
    NotesPage->>ReactQuery: Refetch notes
    
    User->>NoteCard: Click action menu
    User->>NoteCard: Select "Copy to Clipboard"
    NoteCard->>NoteCard: navigator.clipboard.writeText(content)
    NoteCard->>User: Show success toast
    
    User->>NoteCard: Select "Delete"
    NoteCard->>NotesPage: onDelete(noteId)
    NotesPage->>ReactQuery: useMutation(deleteNote)
    ReactQuery->>NotesService: deleteNote(noteId)
    NotesService->>API: DELETE /api/notes/{id}
    API-->>NotesService: Success
    NotesService-->>ReactQuery: Deleted
    ReactQuery->>ReactQuery: Invalidate ['notes'] query
    ReactQuery-->>NotesPage: Refetch notes
    NotesPage->>User: Show success toast
    
    User->>NotesPage: Click category filter
    NotesPage->>NotesPage: Update filters state
    NotesPage->>ReactQuery: Refetch with category filter
    ReactQuery->>NotesService: fetchNotes({category: GOLDEN_CODE})
    NotesService->>API: GET /api/notes?category=GOLDEN_CODE
    API-->>NotesService: Return filtered notes
    NotesService-->>ReactQuery: Category-filtered results
    ReactQuery-->>NotesPage: Update display

## Proposed File Changes

### src/types/index.ts(MODIFY)

References: 

- prisma/schema.prisma

**Extend types with note-specific interfaces and API types:**

1. Add NoteWithRelations interface extending Note with optional relations: `session?: { id: string, sessionType: SessionType }`, `project?: { id: string, name: string }` for displaying associated entities in NoteCard.

2. Add CreateNoteRequest interface with fields: `title?: string`, `content: string`, `category: NoteCategory`, `tags: string[]`, `sessionId?: string`, `projectId?: string`, `isTemplate?: boolean` for API POST requests.

3. Add UpdateNoteRequest interface with all optional fields: `title?: string`, `content?: string`, `category?: NoteCategory`, `tags?: string[]`, `isTemplate?: boolean` for API PATCH requests.

4. Add NoteFilters interface with optional fields: `category?: NoteCategory`, `tags?: string[]`, `search?: string`, `sessionId?: string`, `projectId?: string` for filtering notes.

5. Add PaginatedResponse<T> generic interface with fields: `items: T[]`, `total: number`, `page: number`, `limit: number`, `hasMore: boolean` for paginated API responses.

6. Add ApiResponse<T> generic interface with fields: `success: boolean`, `data?: T`, `error?: string`, `message?: string` for consistent API response shape.

7. Add component prop types: NoteCardProps interface with `note: NoteWithRelations`, `onEdit?: (note: Note) => void`, `onDelete?: (noteId: string) => void`, `onCopy?: (content: string) => void`.

8. Add CreateNoteDialogProps interface with `isOpen: boolean`, `onClose: () => void`, `onNoteCreated?: (note: Note) => void`, `initialSessionId?: string`, `initialProjectId?: string`.

9. Add NoteEditorProps interface with `value: string`, `onChange: (value: string) => void`, `category: NoteCategory`, `onCategoryChange: (category: NoteCategory) => void`, `placeholder?: string`, `autoFocus?: boolean`.

10. Export all new types and interfaces for use throughout the application.

### src/lib/utils.ts(MODIFY)

References: 

- src/types/index.ts(MODIFY)

**Add note-specific utility functions:**

1. Import necessary functions from date-fns: `import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'`.

2. Import NoteCategory from `src/types/index.ts`.

3. Add truncateText function: accepts `text: string`, `maxLength: number`, `suffix: string = '...'`, returns truncated string. Used by NoteCard for content previews.

4. Add formatRelativeTime function: accepts `date: Date`, returns human-readable relative time string using formatDistanceToNow with addSuffix option (e.g., '2 hours ago', 'just now'). Handle edge cases for 'just now' (< 1 minute).

5. Add getNoteCategoryIcon function: accepts `category: NoteCategory`, returns emoji string: PROMPT_PATTERN='💡', GOLDEN_CODE='⭐', DEBUG_LOG='🐛', MODEL_NOTE='🤖', INSIGHT='💭'.

6. Add getNoteCategoryLabel function: accepts `category: NoteCategory`, returns human-readable label: PROMPT_PATTERN='Prompt Pattern', GOLDEN_CODE='Golden Code', DEBUG_LOG='Debug Log', MODEL_NOTE='Model Note', INSIGHT='Insight'.

7. Add getNoteCategoryColor function: accepts `category: NoteCategory`, returns Tailwind color class: PROMPT_PATTERN='text-purple-500', GOLDEN_CODE='text-yellow-500', DEBUG_LOG='text-red-500', MODEL_NOTE='text-blue-500', INSIGHT='text-gray-500'.

8. Add getNoteCategoryBgColor function: accepts `category: NoteCategory`, returns Tailwind background color class: PROMPT_PATTERN='bg-purple-100 dark:bg-purple-900/20', GOLDEN_CODE='bg-yellow-100 dark:bg-yellow-900/20', DEBUG_LOG='bg-red-100 dark:bg-red-900/20', MODEL_NOTE='bg-blue-100 dark:bg-blue-900/20', INSIGHT='bg-gray-100 dark:bg-gray-900/20'.

9. Add parseTags function: accepts `tagsInput: string` (comma-separated), splits by comma, trims whitespace, filters empty strings, converts to lowercase, removes duplicates. Returns string array.

10. Add formatTags function: accepts `tags: string[]`, joins with comma and space. Returns formatted string for display.

11. Add validateNoteCategory function: accepts `category: string`, returns boolean indicating if value is valid NoteCategory enum value.

12. Export all new utility functions for use in note components and services.

### src/lib/notesService.ts(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)

**Create business logic service for notes CRUD operations:**

1. Import types from `src/types/index.ts`: Note, NoteWithRelations, NoteCategory, CreateNoteRequest, UpdateNoteRequest, NoteFilters, PaginatedResponse, ApiResponse.

2. Import utilities from `src/lib/utils.ts`: truncateText, formatRelativeTime, parseTags, formatTags, getNoteCategoryIcon, getNoteCategoryLabel, getNoteCategoryColor.

3. Define API_BASE constant: `const API_BASE = '/api/notes'`.

4. Create fetchNotes async function: accepts filters (NoteFilters), page (number, default 1), limit (number, default 20). Construct query params string from filters. Make GET request to API_BASE with params. Return PaginatedResponse<NoteWithRelations> or throw error. Handle fetch errors with try-catch.

5. Create fetchNoteById async function: accepts noteId (string). Make GET request to `${API_BASE}/${noteId}`. Return NoteWithRelations or throw error.

6. Create createNote async function: accepts CreateNoteRequest data. Validate category if provided. Make POST request to API_BASE with data. Return created Note or throw error.

7. Create updateNote async function: accepts noteId (string) and UpdateNoteRequest data. Make PATCH request to `${API_BASE}/${noteId}` with data. Return updated Note or throw error.

8. Create deleteNote async function: accepts noteId (string). Make DELETE request to `${API_BASE}/${noteId}`. Return success boolean or throw error.

9. Create searchNotes async function: accepts searchQuery (string), page (number), limit (number). Call fetchNotes with search filter. Return PaginatedResponse<NoteWithRelations>.

10. Create getNotesByCategory async function: accepts category (NoteCategory), page (number), limit (number). Call fetchNotes with category filter. Return PaginatedResponse<NoteWithRelations>.

11. Create getNotePreview function: accepts note (Note). Extract first 150 characters of content using truncateText. Return preview string with ellipsis if truncated.

12. Create formatNoteTimestamp function: accepts note (Note). If updated recently (< 24 hours), show relative time using formatRelativeTime. Otherwise show formatted date using format from date-fns. Return formatted string like 'Updated 2 hours ago' or 'Created Jan 15'.

13. Create extractCommonTags function: accepts notes (Note array). Aggregate all tags, count occurrences, return top 10 most common tags with counts. Return array of objects with `tag: string` and `count: number`. Used for tag filter suggestions.

14. Create groupNotesByCategory function: accepts notes (Note array). Group by category using Map. Return Map<NoteCategory, Note[]>. Used for category-based displays.

15. Create validateNoteData function: accepts note data object. Validate required fields: content must be non-empty, category must be valid NoteCategory, tags must be string array. Return object with `isValid: boolean` and `errors: string[]`.

16. Add error handling utility: create handleNoteError function that accepts error (unknown) and returns formatted error message string. Handle fetch errors, validation errors, and API error responses consistently.

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

10. Export Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter as named exports for use in note components.

### src/components/ui/Badge.tsx(NEW)

References: 

- src/lib/utils.ts(MODIFY)

**Create reusable Badge component for tags and categories:**

1. Import React, HTMLAttributes for type safety.

2. Import { cva, type VariantProps } from 'class-variance-authority' for variant management.

3. Import cn utility from `src/lib/utils.ts` for class merging.

4. Define badgeVariants using cva with base classes: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'.

5. Define variant options: default (border-transparent bg-primary text-primary-foreground hover:bg-primary/80), secondary (border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80), destructive (border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80), outline (text-foreground).

6. Create Badge component with props extending HTMLAttributes and VariantProps from badgeVariants.

7. Render as div element with badgeVariants applied, merge with custom className using cn.

8. Export Badge component and badgeVariants for use in NoteCard for displaying tags and categories.

### src/components/ui/Input.tsx(NEW)

References: 

- src/lib/utils.ts(MODIFY)

**Create reusable Input component for text inputs:**

1. Import React, forwardRef, InputHTMLAttributes for type safety.

2. Import cn utility from `src/lib/utils.ts` for class merging.

3. Create Input component using forwardRef with base classes: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'.

4. Accept className prop and merge with base classes using cn.

5. Forward ref to input element for form integration and focus management.

6. Export Input component for use in search fields, tag inputs, and form fields.

### src/components/ui/Textarea.tsx(NEW)

References: 

- src/lib/utils.ts(MODIFY)

**Create reusable Textarea component for multi-line text inputs:**

1. Import React, forwardRef, TextareaHTMLAttributes for type safety.

2. Import cn utility from `src/lib/utils.ts` for class merging.

3. Create Textarea component using forwardRef with base classes: 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'.

4. Accept className prop and merge with base classes using cn.

5. Forward ref to textarea element for form integration and focus management.

6. Export Textarea component for use in NoteEditor and CreateNoteDialog.

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

10. Export useToast hook for use in components. The Toaster component will be added to Providers to render toasts globally.

### src/components/notes/NoteCard.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)
- src/lib/notesService.ts(NEW)
- src/components/ui/Card.tsx(NEW)
- src/components/ui/Button.tsx(NEW)
- src/components/ui/Badge.tsx(NEW)

**Create card component for displaying individual notes:**

1. Mark as 'use client' for interactive menu functionality.

2. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

3. Import Button from `src/components/ui/Button.tsx`.

4. Import Badge from `src/components/ui/Badge.tsx`.

5. Import DropdownMenu components from '@radix-ui/react-dropdown-menu' for action menu.

6. Import NoteCardProps, NoteWithRelations from `src/types/index.ts`.

7. Import utilities from `src/lib/utils.ts`: getNoteCategoryIcon, getNoteCategoryLabel, getNoteCategoryColor, getNoteCategoryBgColor, truncateText, formatRelativeTime.

8. Import getNotePreview from `src/lib/notesService.ts`.

9. Import icons from 'lucide-react': MoreVertical, Edit, Trash2, Copy, ExternalLink.

10. Accept props from NoteCardProps interface: note, onEdit, onDelete, onCopy.

11. Render Card component with hover effect (hover:shadow-md transition-shadow) and cursor-pointer if onEdit is provided.

12. In CardHeader, display category badge with icon and label using getNoteCategoryIcon, getNoteCategoryLabel, and getNoteCategoryBgColor. Position in top-left corner.

13. Show note title if present as CardTitle, otherwise use first line of content (up to 50 chars) as heading.

14. In CardContent, display content preview using getNotePreview (first 150 characters). If truncated, show 'Read more' link.

15. Display tags as Badge components in a flex wrap container. Limit to first 5 tags with '+N more' indicator if more exist.

16. Show timestamps: 'Created {relative time}' and 'Updated {relative time}' if different from created. Use formatRelativeTime.

17. If note has session association, show session type badge with link icon. If project association, show project name with link icon.

18. Render DropdownMenu trigger button (MoreVertical icon) in top-right corner of card header.

19. In DropdownMenuContent, add menu items: Edit (calls onEdit with note), Delete (calls onDelete with noteId), Copy to Clipboard (calls onCopy with content, uses navigator.clipboard API).

20. Apply color coding to card border-left (border-l-4) based on category using getNoteCategoryColor.

21. Make card clickable to call onEdit if provided, with proper hover states and transitions.

22. Use consistent Tailwind styling with proper spacing (p-4, gap-3) and responsive design.

### src/components/notes/CreateNoteDialog.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/notesService.ts(NEW)
- src/lib/utils.ts(MODIFY)
- src/hooks/useToast.ts(NEW)
- src/components/ui/Button.tsx(NEW)
- src/components/ui/Input.tsx(NEW)

**Create modal dialog for creating new notes:**

1. Mark as 'use client' for interactive form functionality.

2. Import useState from 'react' for form state management.

3. Import Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter from '@radix-ui/react-dialog'.

4. Import Button from `src/components/ui/Button.tsx`.

5. Import Input from `src/components/ui/Input.tsx`.

6. Import Label from '@radix-ui/react-label' for form labels.

7. Import useMutation, useQueryClient, useQuery from '@tanstack/react-query' for creating notes and fetching associations.

8. Import CreateNoteDialogProps, CreateNoteRequest, NoteCategory from `src/types/index.ts`.

9. Import createNote from `src/lib/notesService.ts`.

10. Import utilities from `src/lib/utils.ts`: getNoteCategoryIcon, getNoteCategoryLabel, parseTags.

11. Import useToast from `src/hooks/useToast.ts` for notifications.

12. Import NoteEditor from `src/components/notes/NoteEditor.tsx`.

13. Import Select components from '@radix-ui/react-select' for project/session dropdowns.

14. Accept props from CreateNoteDialogProps: isOpen, onClose, onNoteCreated, initialSessionId, initialProjectId.

15. Manage form state with useState: title (string), content (string), category (NoteCategory, default INSIGHT), tags (string), sessionId (string | null, initialized from initialSessionId), projectId (string | null, initialized from initialProjectId).

16. Create useQuery to fetch active sessions from '/api/sessions?status=ACTIVE' for session dropdown (optional).

17. Create useQuery to fetch active projects from '/api/projects?isActive=true' for project dropdown (optional).

18. Create useMutation for creating note: calls createNote from notesService, on success invalidates notes query, shows success toast, calls onNoteCreated callback, resets form, closes dialog.

19. Render Dialog with open={isOpen} and onOpenChange={onClose}.

20. In DialogHeader, show DialogTitle 'Create New Note' and DialogDescription 'Capture ideas, code snippets, or insights'.

21. Create form with fields: Title (optional Input with placeholder 'Note title (optional)'), Category selector (radio buttons or segmented control showing all 5 categories with icons and labels), Content (NoteEditor component), Tags (Input with placeholder 'comma, separated, tags'), Session Association (optional Select dropdown), Project Association (optional Select dropdown).

22. For category selector, display all 5 options in a grid with icon, label, and color indicator using getNoteCategoryIcon and getNoteCategoryLabel.

23. Validate form: content must be non-empty. Show validation errors inline below fields with red text.

24. In DialogFooter, add Cancel button (calls onClose, variant='outline') and Create Note button (calls mutation, disabled if content empty or mutation loading, shows loading state with spinner).

25. Handle form submission: prevent default, validate inputs, parse tags using parseTags utility, call mutation with form data.

26. Apply consistent Tailwind styling with proper spacing (gap-4 for form fields) and focus states.

27. Reset form state when dialog closes or after successful creation.

### src/components/notes/NoteEditor.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/utils.ts(MODIFY)
- src/components/ui/Textarea.tsx(NEW)
- src/components/ui/Button.tsx(NEW)

**Create markdown-aware textarea component for note editing:**

1. Mark as 'use client' for interactive functionality.

2. Import useState, useEffect, useRef from 'react' for state and refs.

3. Import Textarea from `src/components/ui/Textarea.tsx`.

4. Import Button from `src/components/ui/Button.tsx`.

5. Import NoteEditorProps, NoteCategory from `src/types/index.ts`.

6. Import utilities from `src/lib/utils.ts`: getNoteCategoryIcon, getNoteCategoryLabel.

7. Import icons from 'lucide-react': Code, List, Bold, Italic, Link.

8. Accept props from NoteEditorProps: value, onChange, category, onCategoryChange, placeholder, autoFocus.

9. Manage local state for character count and save status (Saved, Saving, Unsaved).

10. Use useRef to store textarea element for programmatic focus and cursor position manipulation.

11. Implement auto-save to localStorage: use useEffect with debounced timer (500ms) to save draft. Key format: 'flowforge-note-draft-{timestamp}'. Clear draft on successful save.

12. Render category selector as radio buttons or segmented control above textarea. Show all 5 categories with icons using getNoteCategoryIcon and getNoteCategoryLabel. Call onCategoryChange when selection changes.

13. Render Textarea component with value and onChange props. Apply monospace font class (font-mono) for code-friendly editing. Set placeholder and autoFocus props.

14. Add formatting toolbar with quick action buttons: Code Block (inserts ```\n\n```), Bullet List (inserts - ), Bold (inserts **text**), Italic (inserts *text*), Link (inserts [text](url)). Each button inserts markdown syntax at cursor position.

15. Implement insertMarkdown helper function: accepts markdown string, gets current cursor position from textarea ref, inserts text at cursor, updates value via onChange, restores cursor position after insertion.

16. Display character count at bottom-right: 'X characters' with muted text color. Show warning color if approaching any limits.

17. Show save status indicator at bottom-left: 'Saved', 'Saving...', or 'Unsaved changes' with appropriate icon and color.

18. Apply consistent Tailwind styling with proper spacing and responsive design.

19. Ensure textarea has minimum height (min-h-[200px]) and can expand with content.

20. Add keyboard shortcuts: Cmd/Ctrl+B for bold, Cmd/Ctrl+I for italic, Cmd/Ctrl+K for link. Use useEffect with keydown event listener.

### src/app/(dashboard)/notes/page.tsx(NEW)

References: 

- src/types/index.ts(MODIFY)
- src/lib/notesService.ts(NEW)
- src/lib/utils.ts(MODIFY)
- src/hooks/useToast.ts(NEW)
- src/components/ui/Button.tsx(NEW)
- src/components/ui/Input.tsx(NEW)
- src/components/ui/Card.tsx(NEW)
- src/components/notes/NoteCard.tsx(NEW)
- src/components/notes/CreateNoteDialog.tsx(NEW)

**Create notes page with search, filtering, and category organization:**

1. Mark as 'use client' for interactive filtering and state management.

2. Import useState, useMemo from 'react' for state and computed values.

3. Import useQuery, useMutation, useQueryClient from '@tanstack/react-query' for data fetching.

4. Import Button from `src/components/ui/Button.tsx`.

5. Import Input from `src/components/ui/Input.tsx`.

6. Import Card, CardHeader, CardTitle, CardContent from `src/components/ui/Card.tsx`.

7. Import Select, SelectTrigger, SelectValue, SelectContent, SelectItem from '@radix-ui/react-select' for filter dropdowns.

8. Import NoteCard from `src/components/notes/NoteCard.tsx`.

9. Import CreateNoteDialog from `src/components/notes/CreateNoteDialog.tsx`.

10. Import NoteCategory, NoteFilters, NoteWithRelations from `src/types/index.ts`.

11. Import fetchNotes, deleteNote, extractCommonTags from `src/lib/notesService.ts`.

12. Import utilities from `src/lib/utils.ts`: getNoteCategoryIcon, getNoteCategoryLabel.

13. Import useToast from `src/hooks/useToast.ts`.

14. Import icons from 'lucide-react': Plus, Search, Filter, StickyNote, Tag.

15. Manage state: filters (NoteFilters with category, tags, search), isDialogOpen (boolean), page (number), limit (number, default 20), searchInput (string for debounced search).

16. Create useQuery to fetch notes: calls fetchNotes with current filters, page, limit. Query key should include filter values: ['notes', filters, page, limit]. Enable refetchOnMount and staleTime of 30 seconds.

17. Create useMutation for deleting notes: calls deleteNote, on success invalidates notes query, shows success toast.

18. Implement debounced search: use useEffect with setTimeout to update filters.search after 300ms of no typing in searchInput.

19. Use useMemo to extract common tags from fetched notes using extractCommonTags for tag filter suggestions.

20. Render page header with title 'Notes' and 'New Note' button (Plus icon, opens CreateNoteDialog).

21. Display summary statistics cards in a row: Total Notes (StickyNote icon, count), Notes This Week (count of notes created in last 7 days), Most Used Category (category with most notes).

22. Render filter section with: Search input (Search icon, debounced, updates searchInput state), Category filter Select (All Categories + all 5 categories with icons), Tag filter (show common tags as clickable badges, clicking adds to filter).

23. Map notes data to NoteCard components in responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6). Pass note object and callback handlers: onEdit (open dialog or navigate to edit view), onDelete (show confirmation then call delete mutation), onCopy (copy to clipboard and show toast).

24. Implement pagination controls at bottom: Previous/Next buttons, page number display, disable buttons appropriately based on hasMore from API response.

25. Show loading skeleton states while notes query is loading: render 6 placeholder cards with animated pulse (bg-gray-200 animate-pulse rounded-lg h-64).

26. Show empty state when no notes exist: centered message with StickyNote icon, 'No notes yet', encouraging text 'Create your first note to capture ideas', and 'Create Note' button.

27. Show empty state when filters return no results: 'No notes match your filters' message with 'Clear Filters' button that resets filters.

28. Render CreateNoteDialog with isOpen state, onClose handler, onNoteCreated callback that refetches notes query.

29. Handle copy to clipboard: use navigator.clipboard.writeText API, show success toast on success, error toast on failure.

30. Apply responsive layout: proper padding (p-4 md:p-6 lg:p-8), responsive grid columns, mobile-friendly filter controls.

31. Use consistent Tailwind styling with proper spacing, hover states, and transitions.

32. Ensure all interactive elements have proper focus states for accessibility.