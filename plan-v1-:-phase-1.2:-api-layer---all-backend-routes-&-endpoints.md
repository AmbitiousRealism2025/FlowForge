I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase has a solid foundation with Next.js 14 App Router, Prisma ORM with comprehensive schema (User, Project, CodingSession, Note, Analytics, Habit models), and NextAuth v5 configured. The API directory currently only contains the NextAuth route handler. The master plan provides detailed specifications for each endpoint including authentication, validation, pagination, and caching requirements. Types and utilities from Phase 1.1 will provide the foundation for API request/response contracts. The API layer needs consistent patterns for auth checks, error handling, validation, and response formatting across all endpoints.

### Approach

Implement a comprehensive API layer for FlowForge with 15 route handlers organized by domain (dashboard, sessions, projects, notes, analytics). Create shared utilities for authentication, validation, error handling, and pagination to ensure consistency. Use NextAuth `getServerSession` for auth, Zod for validation, Prisma for database operations, and implement proper error handling with structured responses. Follow Next.js 14 App Router patterns with route.ts files exporting GET/POST/PATCH/DELETE handlers.

### Reasoning

I explored the existing codebase structure, read the Prisma schema to understand all models and relationships, reviewed the auth configuration with NextAuth v5, examined the master plan for detailed endpoint specifications, researched Next.js 14 API route patterns and best practices for Zod validation and pagination, and confirmed all necessary dependencies (Zod, Prisma, NextAuth) are installed and configured.

## Mermaid Diagram

sequenceDiagram
    participant Client
    participant API Route
    participant Auth Utils
    participant Validation
    participant Prisma DB
    participant Response Utils

    Client->>API Route: HTTP Request (GET/POST/PATCH/DELETE)
    API Route->>Auth Utils: getServerSession(authOptions)
    Auth Utils-->>API Route: session or null
    
    alt Not Authenticated
        API Route->>Response Utils: apiError(401)
        Response Utils-->>Client: 401 Unauthorized
    else Authenticated
        API Route->>API Route: parseJsonBody() / parsePaginationParams()
        API Route->>Validation: schema.safeParse(data)
        
        alt Validation Failed
            Validation-->>API Route: ZodError
            API Route->>Response Utils: handleZodError()
            Response Utils-->>Client: 422 Validation Error
        else Validation Passed
            API Route->>Prisma DB: Query/Mutation
            
            alt Database Error
                Prisma DB-->>API Route: PrismaError
                API Route->>Response Utils: handlePrismaError()
                Response Utils-->>Client: 404/409/500 Error
            else Success
                Prisma DB-->>API Route: Data
                API Route->>Response Utils: apiResponse() / buildPaginatedResponse()
                Response Utils-->>Client: 200/201 Success with Data
            end
        end
    end

## Proposed File Changes

### src/lib/api-utils.ts(NEW)

References: 

- src/lib/auth.ts
- src/types/index.ts

**Create shared API utilities for consistent patterns across all route handlers:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, ZodError from 'zod', and ApiResponse/PaginatedResponse types from `src/types/index.ts`.

2. **Create withAuth higher-order function** - Accept handler function as parameter. Return async function that calls getServerSession(authOptions), checks if session exists, returns 401 JSON response if not authenticated, extracts userId from session.user.id, calls handler with userId and request, handles any errors. This wraps all protected routes with consistent auth checking.

3. **Create handleZodError function** - Accept ZodError parameter. Extract field errors using error.flatten(). Return structured error object with status 422, message 'Validation failed', and errors object mapping field names to error messages. Used for consistent validation error responses.

4. **Create handlePrismaError function** - Accept Prisma error parameter. Check error codes: P2002 (unique constraint) return 409 conflict, P2025 (record not found) return 404, P2003 (foreign key constraint) return 400. Return generic 500 for other errors. Map Prisma errors to appropriate HTTP status codes.

5. **Create apiResponse helper** - Accept data and optional status code. Return NextResponse.json with data and status. Simplifies response creation.

6. **Create apiError helper** - Accept message string, status code, and optional errors object. Return NextResponse.json with structured error format: { success: false, error: message, errors: {...} }. Ensures consistent error response shape.

7. **Create parsePaginationParams function** - Accept URLSearchParams. Extract page (default 1, min 1), limit (default 20, min 1, max 100). Calculate skip value as (page - 1) * limit. Return object with page, limit, skip. Used by all paginated endpoints.

8. **Create buildPaginatedResponse function** - Accept items array, total count, page, limit. Calculate hasMore as (page * limit) < total. Return PaginatedResponse object with success: true, data: { items, total, page, limit, hasMore }. Ensures consistent pagination response format.

9. **Create parseJsonBody function** - Accept Request object. Try to parse JSON body with request.json(). Catch errors and return null. Return parsed body or null. Handles malformed JSON gracefully.

10. **Export all utilities** - Export withAuth, handleZodError, handlePrismaError, apiResponse, apiError, parsePaginationParams, buildPaginatedResponse, parseJsonBody for use in route handlers.

### src/lib/validations.ts(NEW)

References: 

- src/types/index.ts

**Create Zod validation schemas for all API endpoints:**

1. **Import dependencies** - Import z from 'zod', and enums (SessionType, SessionStatus, NoteCategory) from `src/types/index.ts`.

2. **Create CreateSessionSchema** - Define schema with sessionType (z.nativeEnum(SessionType)), projectId (z.string().cuid().optional()), aiModelsUsed (z.array(z.string()).min(1).max(5)). Validates session creation requests.

3. **Create UpdateSessionSchema** - Define schema with all optional fields: durationSeconds (z.number().int().min(0).optional()), aiContextHealth (z.number().int().min(0).max(100).optional()), productivityScore (z.number().int().min(1).max(10).optional()), checkpointNotes (z.string().max(5000).optional()), sessionStatus (z.nativeEnum(SessionStatus).optional()). Validates session update requests.

4. **Create CheckpointSchema** - Define schema with checkpointText (z.string().min(1).max(2000)). Validates checkpoint note submissions.

5. **Create CreateProjectSchema** - Define schema with name (z.string().min(1).max(100)), description (z.string().max(500).optional()), feelsRightScore (z.number().int().min(1).max(5).default(3)), shipTarget (z.string().datetime().optional().transform to Date), stackNotes (z.string().max(2000).optional()). Validates project creation.

6. **Create UpdateProjectSchema** - Define schema with all optional fields: name, description, feelsRightScore, shipTarget, stackNotes, isActive (z.boolean().optional()). Validates project updates.

7. **Create FeelsRightScoreSchema** - Define schema with score (z.number().int().min(1).max(5)). Validates feels-right score updates.

8. **Create PivotSchema** - Define schema with notes (z.string().max(1000).optional()). Validates pivot recording.

9. **Create CreateNoteSchema** - Define schema with title (z.string().max(200).optional()), content (z.string().min(1).max(10000)), category (z.nativeEnum(NoteCategory)), tags (z.array(z.string()).max(20).default([])), sessionId (z.string().cuid().optional()), projectId (z.string().cuid().optional()). Validates note creation.

10. **Create UpdateNoteSchema** - Define schema with all optional fields: title, content, category, tags, isTemplate (z.boolean().optional()). Validates note updates.

11. **Create FocusTextSchema** - Define schema with focus (z.string().max(500)). Validates today's focus text updates.

12. **Create MarkShipSchema** - Define schema with notes (z.string().max(500).optional()). Validates ship marking requests.

13. **Export all schemas** - Export all validation schemas for use in route handlers.

### src/app/api/dashboard/focus/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)

**Create API route for today's focus text management:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, FocusTextSchema from `src/lib/validations.ts`, and utilities (apiResponse, apiError, parseJsonBody) from `src/lib/api-utils.ts`.

2. **Implement GET handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Query User model with prisma.user.findUnique where id equals session.user.id, select preferences field. Extract todaysFocus from preferences JSON (preferences?.todaysFocus or empty string). Return apiResponse with { focus: todaysFocus }. Handle errors with try-catch, return 500 on database errors.

3. **Implement PUT handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with FocusTextSchema.safeParse(body). Return 422 with validation errors if invalid. Update User record with prisma.user.update, merge new focus text into preferences JSON: { preferences: { ...currentPreferences, todaysFocus: validatedData.focus } }. Return apiResponse with updated focus text. Handle errors with try-catch.

4. **Export handlers** - Export GET and PUT as named exports for Next.js App Router.

### src/app/api/dashboard/stats/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/api-utils.ts(NEW)
- prisma/schema.prisma

**Create API route for aggregated dashboard statistics:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, startOfDay/endOfDay from 'date-fns', and utilities (apiResponse, apiError) from `src/lib/api-utils.ts`.

2. **Implement GET handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Execute parallel queries with Promise.all: (1) Find active session with prisma.codingSession.findFirst where userId and sessionStatus ACTIVE, include project relation. (2) Count active projects with prisma.project.count where userId and isActive true. (3) Query today's sessions with prisma.codingSession.findMany where userId and startedAt between startOfDay(now) and endOfDay(now), sum durationSeconds. (4) Query latest Analytics record with prisma.analytics.findFirst where userId, orderBy date desc, select shipStreak field (or calculate from consecutive records).

3. **Calculate statistics** - Aggregate results into DashboardStats object: activeSessionId (from query 1), activeProjectsCount (from query 2), todaysCodingMinutes (sum from query 3 divided by 60), shipStreak (from query 4 or User.shipStreak field), flowState (from User record). Return apiResponse with stats object.

4. **Implement caching** - Add Next.js revalidate option: export const revalidate = 60 to cache response for 60 seconds. Reduces database load for frequently accessed dashboard.

5. **Handle errors** - Wrap in try-catch, return 500 with apiError on database failures. Log errors for monitoring.

6. **Export handler** - Export GET as named export for Next.js App Router.

### src/app/api/sessions/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)
- src/types/index.ts

**Create API route for sessions list and creation:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, CreateSessionSchema from `src/lib/validations.ts`, SessionStatus from `src/types/index.ts`, and utilities (apiResponse, apiError, parseJsonBody, parsePaginationParams, buildPaginatedResponse, handleZodError) from `src/lib/api-utils.ts`.

2. **Implement GET handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse pagination params from URL searchParams with parsePaginationParams. Extract optional filters: sessionType, projectId, dateRange (startDate/endDate) from searchParams. Build Prisma where clause with userId and optional filters. Query sessions with prisma.codingSession.findMany with where, skip, take (limit), orderBy startedAt desc, include project and user relations. Query total count with prisma.codingSession.count with same where clause. Return buildPaginatedResponse with sessions, total, page, limit.

3. **Implement POST handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with CreateSessionSchema.safeParse(body). Return 422 with handleZodError if invalid. Create CodingSession with prisma.codingSession.create with data: userId from session, sessionType, projectId (optional), aiModelsUsed array, startedAt: new Date(), aiContextHealth: 100, sessionStatus: SessionStatus.ACTIVE, durationSeconds: 0. Return apiResponse with created session, status 201.

4. **Handle errors** - Wrap both handlers in try-catch. Use handlePrismaError for database errors. Return 500 with apiError for unexpected errors.

5. **Export handlers** - Export GET and POST as named exports for Next.js App Router.

### src/app/api/sessions/[id]/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)

**Create API route for individual session operations:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, UpdateSessionSchema from `src/lib/validations.ts`, and utilities (apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError) from `src/lib/api-utils.ts`.

2. **Implement GET handler** - Accept params object with id. Call getServerSession(authOptions) to authenticate. Return 401 if no session. Query session with prisma.codingSession.findUnique where id equals params.id, include project relation. Return 404 if not found. Check if session.userId equals session.user.id, return 403 if not owner. Return apiResponse with session data.

3. **Implement PATCH handler** - Accept params object with id. Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with UpdateSessionSchema.safeParse(body). Return 422 with handleZodError if invalid. Query existing session to verify ownership (same as GET). Return 404 if not found, 403 if not owner. Update session with prisma.codingSession.update where id, data with validated fields. If sessionStatus is COMPLETED or ABANDONED and endedAt not set, add endedAt: new Date(). Return apiResponse with updated session.

4. **Implement DELETE handler** - Accept params object with id. Call getServerSession(authOptions) to authenticate. Return 401 if no session. Query session to verify ownership. Return 404 if not found, 403 if not owner. Update session with prisma.codingSession.update to set sessionStatus: SessionStatus.ABANDONED, endedAt: new Date(). Return apiResponse with success message and status 200. Note: soft delete by marking abandoned rather than hard delete to preserve history.

5. **Handle errors** - Wrap all handlers in try-catch. Use handlePrismaError for database errors. Return 500 with apiError for unexpected errors.

6. **Export handlers** - Export GET, PATCH, and DELETE as named exports for Next.js App Router.

### src/app/api/sessions/[id]/checkpoint/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)

**Create API route for saving session checkpoint notes:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, CheckpointSchema from `src/lib/validations.ts`, and utilities (apiResponse, apiError, parseJsonBody, handleZodError) from `src/lib/api-utils.ts`.

2. **Implement POST handler** - Accept params object with id (session ID). Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with CheckpointSchema.safeParse(body). Return 422 with handleZodError if invalid. Query existing session with prisma.codingSession.findUnique where id equals params.id. Return 404 if not found. Check if session.userId equals session.user.id, return 403 if not owner.

3. **Append checkpoint to notes** - Get current checkpointNotes from session (may be null or existing string). Create timestamped checkpoint entry: format as JSON array if starting fresh, or append to existing array. Structure: [{ timestamp: ISO string, text: checkpointText }]. Update session with prisma.codingSession.update where id, data: { checkpointNotes: JSON.stringify(updatedCheckpoints) }. This preserves checkpoint history with timestamps.

4. **Return updated session** - Return apiResponse with updated session including new checkpoint. Status 201 for created checkpoint.

5. **Handle errors** - Wrap in try-catch. Use handlePrismaError for database errors. Return 500 with apiError for unexpected errors.

6. **Export handler** - Export POST as named export for Next.js App Router.

### src/app/api/projects/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)

**Create API route for projects list and creation:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, CreateProjectSchema from `src/lib/validations.ts`, and utilities (apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError) from `src/lib/api-utils.ts`.

2. **Implement GET handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Extract optional filters from searchParams: isActive (boolean), sortBy (updatedAt, feelsRightScore, momentum). Query projects with prisma.project.findMany where userId and optional isActive filter, include _count of codingSessions relation for momentum calculation, orderBy based on sortBy param (default updatedAt desc). For each project, calculate momentum: query most recent session, if within 24h set 'HOT', within 7 days set 'ACTIVE', else 'QUIET'. Return apiResponse with projects array including momentum indicators.

3. **Implement POST handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with CreateProjectSchema.safeParse(body). Return 422 with handleZodError if invalid. Create project with prisma.project.create with data: userId from session, name, description (optional), feelsRightScore (default 3), shipTarget (optional Date), stackNotes (optional), isActive: true, pivotCount: 0. Return apiResponse with created project, status 201.

4. **Handle errors** - Wrap both handlers in try-catch. Use handlePrismaError for database errors. Return 500 with apiError for unexpected errors.

5. **Export handlers** - Export GET and POST as named exports for Next.js App Router.

### src/app/api/projects/[id]/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)

**Create API route for individual project operations:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, UpdateProjectSchema from `src/lib/validations.ts`, and utilities (apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError) from `src/lib/api-utils.ts`.

2. **Implement GET handler** - Accept params object with id. Call getServerSession(authOptions) to authenticate. Return 401 if no session. Query project with prisma.project.findUnique where id equals params.id, include codingSessions relation with select for statistics (count, sum durationSeconds, max startedAt for last worked date). Return 404 if not found. Check if project.userId equals session.user.id, return 403 if not owner. Calculate statistics: totalSessions (count), totalCodingTime (sum), lastWorkedDate (max startedAt), momentum (based on lastWorkedDate). Return apiResponse with project and calculated stats.

3. **Implement PATCH handler** - Accept params object with id. Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with UpdateProjectSchema.safeParse(body). Return 422 with handleZodError if invalid. Query existing project to verify ownership. Return 404 if not found, 403 if not owner. Update project with prisma.project.update where id, data with validated fields. Return apiResponse with updated project.

4. **Implement DELETE handler** - Accept params object with id. Call getServerSession(authOptions) to authenticate. Return 401 if no session. Query project to verify ownership. Return 404 if not found, 403 if not owner. Soft delete by updating isActive to false with prisma.project.update where id, data: { isActive: false }. Return apiResponse with success message. Note: soft delete preserves project history and related sessions.

5. **Handle errors** - Wrap all handlers in try-catch. Use handlePrismaError for database errors. Return 500 with apiError for unexpected errors.

6. **Export handlers** - Export GET, PATCH, and DELETE as named exports for Next.js App Router.

### src/app/api/projects/[id]/feels-right/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)

**Create dedicated API route for updating feels-right score:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, FeelsRightScoreSchema from `src/lib/validations.ts`, and utilities (apiResponse, apiError, parseJsonBody, handleZodError) from `src/lib/api-utils.ts`.

2. **Implement PATCH handler** - Accept params object with id (project ID). Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with FeelsRightScoreSchema.safeParse(body). Return 422 with handleZodError if invalid (ensures score is 1-5). Query existing project to verify ownership with prisma.project.findUnique where id. Return 404 if not found. Check if project.userId equals session.user.id, return 403 if not owner.

3. **Update score and log to analytics** - Update project with prisma.project.update where id, data: { feelsRightScore: validatedData.score }. Optionally create Analytics record to track score changes over time: prisma.analytics.upsert where userId and date (today), update metadata JSON to include feelsRightScoreChanges array with { projectId, oldScore, newScore, timestamp }. This enables historical tracking of project sentiment.

4. **Return updated project** - Return apiResponse with updated project including new feelsRightScore. Status 200.

5. **Handle errors** - Wrap in try-catch. Use handlePrismaError for database errors. Return 500 with apiError for unexpected errors.

6. **Export handler** - Export PATCH as named export for Next.js App Router.

### src/app/api/projects/[id]/pivot/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)
- src/types/index.ts

**Create API route for recording project pivots:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, PivotSchema from `src/lib/validations.ts`, NoteCategory from `src/types/index.ts`, and utilities (apiResponse, apiError, parseJsonBody, handleZodError) from `src/lib/api-utils.ts`.

2. **Implement POST handler** - Accept params object with id (project ID). Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with PivotSchema.safeParse(body). Return 422 with handleZodError if invalid. Query existing project to verify ownership with prisma.project.findUnique where id. Return 404 if not found. Check if project.userId equals session.user.id, return 403 if not owner.

3. **Increment pivot count** - Update project with prisma.project.update where id, data: { pivotCount: { increment: 1 } }. This celebrates direction changes as positive exploration rather than failure.

4. **Create pivot note if provided** - If validatedData.notes exists, create Note record with prisma.note.create with data: userId from session, projectId, title: 'Pivot #${newPivotCount}', content: validatedData.notes, category: NoteCategory.INSIGHT, tags: ['pivot'], isTemplate: false. This documents pivot reasoning for future reference.

5. **Return updated project** - Return apiResponse with updated project including new pivotCount. Status 201 for created pivot record.

6. **Handle errors** - Wrap in try-catch. Use handlePrismaError for database errors. Return 500 with apiError for unexpected errors.

7. **Export handler** - Export POST as named export for Next.js App Router.

### src/app/api/notes/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)

**Create API route for notes list and creation:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, CreateNoteSchema from `src/lib/validations.ts`, and utilities (apiResponse, apiError, parseJsonBody, parsePaginationParams, buildPaginatedResponse, handleZodError, handlePrismaError) from `src/lib/api-utils.ts`.

2. **Implement GET handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse pagination params with parsePaginationParams. Extract optional filters from searchParams: category (NoteCategory enum), tags (comma-separated string to array), search (string for title/content search). Build Prisma where clause with userId and optional filters. For search, use OR with contains on title and content fields. For tags filter, use hasSome array operator. Query notes with prisma.note.findMany with where, skip, take, orderBy updatedAt desc, include session and project relations. Query total count with prisma.note.count with same where clause. Return buildPaginatedResponse with notes, total, page, limit.

3. **Implement POST handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with CreateNoteSchema.safeParse(body). Return 422 with handleZodError if invalid. If sessionId provided, verify session exists and belongs to user. If projectId provided, verify project exists and belongs to user. Create note with prisma.note.create with data: userId from session, title (optional), content, category, tags array, sessionId (optional), projectId (optional), isTemplate: false. Return apiResponse with created note, status 201.

4. **Handle errors** - Wrap both handlers in try-catch. Use handlePrismaError for database errors (foreign key violations for invalid sessionId/projectId). Return 500 with apiError for unexpected errors.

5. **Export handlers** - Export GET and POST as named exports for Next.js App Router.

### src/app/api/notes/[id]/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)

**Create API route for individual note operations:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, UpdateNoteSchema from `src/lib/validations.ts`, and utilities (apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError) from `src/lib/api-utils.ts`.

2. **Implement GET handler** - Accept params object with id. Call getServerSession(authOptions) to authenticate. Return 401 if no session. Query note with prisma.note.findUnique where id equals params.id, include session and project relations. Return 404 if not found. Check if note.userId equals session.user.id, return 403 if not owner. Return apiResponse with note data including relations.

3. **Implement PATCH handler** - Accept params object with id. Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with UpdateNoteSchema.safeParse(body). Return 422 with handleZodError if invalid. Query existing note to verify ownership. Return 404 if not found, 403 if not owner. Update note with prisma.note.update where id, data with validated fields (title, content, category, tags, isTemplate). Return apiResponse with updated note.

4. **Implement DELETE handler** - Accept params object with id. Call getServerSession(authOptions) to authenticate. Return 401 if no session. Query note to verify ownership. Return 404 if not found, 403 if not owner. Hard delete note with prisma.note.delete where id. Return apiResponse with success message. Status 200. Note: hard delete is appropriate for notes as they're user content without critical dependencies.

5. **Handle errors** - Wrap all handlers in try-catch. Use handlePrismaError for database errors. Return 500 with apiError for unexpected errors.

6. **Export handlers** - Export GET, PATCH, and DELETE as named exports for Next.js App Router.

### src/app/api/analytics/streak/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/api-utils.ts(NEW)
- prisma/schema.prisma

**Create API route for calculating ship streaks:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, startOfDay/subDays/differenceInDays from 'date-fns', and utilities (apiResponse, apiError) from `src/lib/api-utils.ts`.

2. **Implement GET handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Query User to get timezone field (default 'UTC' if not set). Query Analytics records with prisma.analytics.findMany where userId, orderBy date desc, select date and shipCount fields. This gets all analytics history for streak calculation.

3. **Calculate current streak** - Implement streak algorithm: start from today (normalized to user timezone), iterate backwards through consecutive days. For each day, check if Analytics record exists with shipCount > 0. Increment currentStreak for each consecutive day with ships. Break on first gap (missing record or shipCount = 0). Handle timezone correctly by normalizing dates to startOfDay in user's timezone.

4. **Calculate longest streak** - Iterate through entire analytics history. Track running streak and max streak. For each record with shipCount > 0, increment running streak. When gap found (shipCount = 0 or date gap > 1 day), compare running streak to max, update max if higher, reset running streak to 0. Return the maximum streak found.

5. **Get last ship date** - Find most recent Analytics record with shipCount > 0. Extract date field. Return as lastShipDate.

6. **Return streak data** - Return apiResponse with StreakData object: { currentStreak, longestStreak, lastShipDate }. Status 200.

7. **Implement caching** - Add export const revalidate = 60 to cache for 60 seconds. Streak calculations are expensive and don't need real-time updates.

8. **Handle errors** - Wrap in try-catch. Return 500 with apiError on database errors. Log errors for monitoring.

9. **Export handler** - Export GET as named export for Next.js App Router.

### src/app/api/analytics/ship/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/validations.ts(NEW)
- src/lib/api-utils.ts(NEW)
- prisma/schema.prisma

**Create API route for marking a ship today:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, MarkShipSchema from `src/lib/validations.ts`, startOfDay from 'date-fns', and utilities (apiResponse, apiError, parseJsonBody, handleZodError) from `src/lib/api-utils.ts`.

2. **Implement POST handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Parse request body with parseJsonBody. Validate with MarkShipSchema.safeParse(body). Return 422 with handleZodError if invalid. Query User to get timezone field (default 'UTC').

3. **Determine today's date** - Calculate today's date normalized to user's timezone using startOfDay. This ensures 'today' is based on user's local time, not server time. Critical for accurate streak tracking across timezones.

4. **Upsert analytics record** - Use prisma.analytics.upsert with where: { userId_date: { userId, date: todayDate } } (unique constraint on userId + date). On create: set userId, date, shipCount: 1, flowScore: 0, codingMinutes: 0, contextRefreshes: 0, metadata with optional notes. On update: increment shipCount by 1, merge notes into metadata if provided. This handles both first ship of day and subsequent ships.

5. **Update user streak** - After upsert, query recent Analytics records to recalculate current streak (same algorithm as streak endpoint). Update User.shipStreak field with prisma.user.update where id, data: { shipStreak: newStreakCount }. This keeps User.shipStreak in sync for quick dashboard access.

6. **Return updated data** - Return apiResponse with updated analytics record and new streak count. Status 201 if first ship of day, 200 if incrementing existing. Include flag indicating if this extended the streak for celebration triggers.

7. **Handle errors** - Wrap in try-catch. Use handlePrismaError for database errors. Return 500 with apiError for unexpected errors.

8. **Export handler** - Export POST as named export for Next.js App Router.

### src/app/api/analytics/weekly/route.ts(NEW)

References: 

- src/lib/auth.ts
- src/lib/prisma.ts
- src/lib/api-utils.ts(NEW)
- prisma/schema.prisma

**Create API route for weekly ship data visualization:**

1. **Import dependencies** - Import NextResponse from 'next/server', getServerSession from 'next-auth', authOptions from `src/lib/auth.ts`, prisma from `src/lib/prisma.ts`, startOfDay/subDays/format from 'date-fns', and utilities (apiResponse, apiError) from `src/lib/api-utils.ts`.

2. **Implement GET handler** - Call getServerSession(authOptions) to authenticate. Return 401 if no session. Query User to get timezone field (default 'UTC'). Calculate date range: today (normalized to user timezone) and 6 days ago (total 7 days). Use startOfDay and subDays to get exact range.

3. **Query analytics data** - Query Analytics records with prisma.analytics.findMany where userId and date between startDate and endDate (inclusive), orderBy date asc, select date and shipCount fields. This gets last 7 days of ship activity.

4. **Fill missing days** - Create array of all 7 dates in range. For each date, check if Analytics record exists. If exists, use actual shipCount. If missing, insert { date, shipCount: 0 } to ensure complete dataset for visualization. This prevents gaps in the chart.

5. **Format response** - Map each day to object with: date (ISO string), shipCount (number), dayOfWeek (string like 'Mon', 'Tue'). Use date-fns format function to get day abbreviation. Return array of 7 objects in chronological order.

6. **Return weekly data** - Return apiResponse with array of daily ship data. Status 200.

7. **Implement caching** - Add export const revalidate = 300 to cache for 5 minutes. Weekly data changes infrequently and doesn't need real-time updates.

8. **Handle errors** - Wrap in try-catch. Return 500 with apiError on database errors. Log errors for monitoring.

9. **Export handler** - Export GET as named export for Next.js App Router.