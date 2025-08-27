# Infrastructure & Performance Tasks (13-20)
**Production Readiness & Optimization**

## Overview

The Infrastructure & Performance layer transforms FlowForge from a functional MVP into a production-ready application. These tasks implement comprehensive API architecture, real-time features, PWA capabilities, testing frameworks, and performance optimizations necessary for deployment.

**Timeline**: Month 3, Week 1-4  
**Dependencies**: All previous tasks (1-12)  
**Focus**: Scalability, reliability, and deployment readiness

---

## Task 13: Create Comprehensive API Routes 🔌

### Objective
Build complete RESTful API architecture for all FlowForge features including authentication, session management, project CRUD, habit tracking, notes operations, AI context updates, and analytics endpoints with proper validation and error handling.

### API Architecture

#### API Route Structure
```
/api/
├── auth/
│   └── [...nextauth]/           # NextAuth.js authentication
├── users/
│   ├── profile/                 # User profile management
│   └── preferences/             # User settings
├── sessions/
│   ├── route.ts                 # Session CRUD
│   ├── [id]/
│   │   ├── route.ts            # Individual session
│   │   └── checkpoint/         # Session checkpoints
│   └── active/                 # Current active sessions
├── projects/
│   ├── route.ts                # Project CRUD
│   ├── [id]/
│   │   ├── route.ts            # Individual project
│   │   ├── feeling/            # Feels-right score updates
│   │   ├── pivot/              # Pivot recording
│   │   └── analytics/          # Project analytics
│   └── templates/              # Project templates
├── habits/
│   ├── route.ts                # Habit CRUD
│   ├── [id]/
│   │   ├── route.ts            # Individual habit
│   │   ├── complete/           # Mark habit complete
│   │   └── streak/             # Streak management
│   └── analytics/              # Habit analytics
├── notes/
│   ├── route.ts                # Note CRUD
│   ├── search/                 # Full-text search
│   ├── tags/                   # Tag management
│   └── templates/              # Note templates
├── ai-context/
│   ├── health/                 # Context health status
│   ├── update/                 # MCP metric updates
│   └── refresh/                # Context refresh
├── analytics/
│   ├── dashboard/              # Dashboard analytics
│   ├── insights/               # AI-generated insights
│   └── export/                 # Data export
├── focus/
│   ├── start/                  # Start focus mode
│   ├── break/                  # Break management
│   └── ambient/                # Ambient sounds
└── system/
    ├── health/                 # System health check
    └── metrics/                # Performance metrics
```

#### Base API Architecture
```typescript
// src/lib/api-base.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { db } from '@/lib/db'

export interface ApiError {
  error: string
  message?: string
  details?: any
}

export interface ApiSuccess<T = any> {
  success: true
  data: T
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

export class ApiHandler {
  static async withAuth<T>(
    handler: (userId: string, request: NextRequest) => Promise<T>
  ) {
    return async (request: NextRequest) => {
      try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
          )
        }

        const result = await handler(session.user.id, request)
        return NextResponse.json({ success: true, data: result })
      } catch (error) {
        return this.handleError(error)
      }
    }
  }

  static async withValidation<T extends z.ZodType>(
    schema: T,
    handler: (data: z.infer<T>, request: NextRequest) => Promise<any>
  ) {
    return async (request: NextRequest) => {
      try {
        const body = await request.json()
        const validatedData = schema.parse(body)
        const result = await handler(validatedData, request)
        return NextResponse.json({ success: true, data: result })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: 'Validation Error',
              message: 'Invalid request data',
              details: error.errors
            },
            { status: 400 }
          )
        }
        return this.handleError(error)
      }
    }
  }

  static async handleError(error: any): Promise<NextResponse> {
    console.error('API Error:', error)

    // Database errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflict', message: 'Resource already exists' },
        { status: 409 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Not Found', message: 'Resource not found' },
        { status: 404 }
      )
    }

    // Generic errors
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Something went wrong'
      },
      { status: 500 }
    )
  }

  static paginate(
    page: number = 1,
    limit: number = 10,
    maxLimit: number = 100
  ) {
    const validPage = Math.max(1, page)
    const validLimit = Math.min(maxLimit, Math.max(1, limit))
    const skip = (validPage - 1) * validLimit

    return {
      skip,
      take: validLimit,
      pagination: {
        page: validPage,
        limit: validLimit
      }
    }
  }
}

// Rate limiting middleware
export class RateLimiter {
  private static requests = new Map<string, number[]>()

  static checkLimit(
    identifier: string,
    windowMs: number = 60000,
    maxRequests: number = 60
  ): boolean {
    const now = Date.now()
    const windowStart = now - windowMs

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [])
    }

    const requests = this.requests.get(identifier)!
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => time > windowStart)
    
    if (validRequests.length >= maxRequests) {
      return false
    }

    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    return true
  }
}
```

#### Sessions API Implementation
```typescript
// src/app/api/sessions/route.ts
import { NextRequest } from 'next/server'
import { ApiHandler, RateLimiter } from '@/lib/api-base'
import { z } from 'zod'
import { db } from '@/lib/db'

const createSessionSchema = z.object({
  type: z.enum(['building', 'exploring', 'debugging', 'shipping']),
  aiModel: z.enum(['claude', 'gpt', 'gemini', 'local']),
  projectId: z.string().optional(),
})

const updateSessionSchema = z.object({
  endedAt: z.string().datetime().optional(),
  duration: z.number().optional(),
  status: z.enum(['flowing', 'stuck', 'shipped', 'abandoned']).optional(),
  notes: z.string().optional(),
  contextHealth: z.number().min(0).max(100).optional(),
})

export const GET = ApiHandler.withAuth(async (userId: string, request: NextRequest) => {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const projectId = url.searchParams.get('projectId')
  const status = url.searchParams.get('status')

  const { skip, take, pagination } = ApiHandler.paginate(page, limit, 50)

  const where = {
    userId,
    ...(projectId && { projectId }),
    ...(status && { status }),
  }

  const [sessions, total] = await Promise.all([
    db.session.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      },
      orderBy: { startedAt: 'desc' },
      skip,
      take,
    }),
    db.session.count({ where }),
  ])

  return {
    sessions,
    meta: {
      pagination: {
        ...pagination,
        total,
        pages: Math.ceil(total / pagination.limit),
      }
    }
  }
})

export const POST = ApiHandler.withAuth(async (userId: string, request: NextRequest) => {
  // Rate limiting
  if (!RateLimiter.checkLimit(`sessions:${userId}`, 60000, 30)) {
    throw new Error('Rate limit exceeded')
  }

  const body = await request.json()
  const data = createSessionSchema.parse(body)

  // Check for existing active session
  const existingActive = await db.session.findFirst({
    where: { userId, isActive: true }
  })

  if (existingActive) {
    // End the existing session first
    await db.session.update({
      where: { id: existingActive.id },
      data: {
        isActive: false,
        endedAt: new Date(),
        status: 'abandoned'
      }
    })
  }

  const session = await db.session.create({
    data: {
      ...data,
      userId,
      startedAt: new Date(),
      isActive: true,
      aiContextHealth: 1.0,
    },
    include: {
      project: {
        select: { id: true, name: true, color: true }
      }
    }
  })

  // Update project's last worked timestamp
  if (data.projectId) {
    await db.project.update({
      where: { id: data.projectId, userId },
      data: { lastWorkedAt: new Date() }
    })
  }

  return session
})
```

#### Projects API Implementation  
```typescript
// src/app/api/projects/route.ts
import { NextRequest } from 'next/server'
import { ApiHandler } from '@/lib/api-base'
import { ProjectService, createProjectSchema } from '@/lib/projects'

export const GET = ApiHandler.withAuth(async (userId: string, request: NextRequest) => {
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')

  let projects = await ProjectService.getProjectsWithStats(userId)

  // Apply filters
  if (status && status !== 'all') {
    projects = projects.filter(p => p.status === status)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    projects = projects.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower)
    )
  }

  return projects
})

export const POST = ApiHandler.withAuth(async (userId: string, request: NextRequest) => {
  const body = await request.json()
  const data = createProjectSchema.parse(body)
  
  return await ProjectService.createProject(userId, data)
})
```

#### AI Context API Implementation
```typescript
// src/app/api/ai-context/update/route.ts
import { NextRequest } from 'next/server'
import { ApiHandler } from '@/lib/api-base'
import { AIContextMonitor } from '@/lib/ai-context-monitor'
import { z } from 'zod'

const updateContextSchema = z.object({
  contextType: z.enum(['claude_desktop', 'vscode', 'cursor']),
  metrics: z.object({
    conversationLength: z.number().optional(),
    contextSwitches: z.number().optional(),
    errorRate: z.number().optional(),
    responseLatency: z.number().optional(),
    memoryUsage: z.number().optional(),
    openFiles: z.number().optional(),
    activeTime: z.number().optional(),
  }),
})

export const POST = ApiHandler.withAuth(async (userId: string, request: NextRequest) => {
  const body = await request.json()
  const { contextType, metrics } = updateContextSchema.parse(body)

  const healthData = await AIContextMonitor.updateContextHealth(
    userId,
    contextType,
    metrics
  )

  // Trigger WebSocket update if health is critical
  if (healthData.healthScore < 30) {
    // Send real-time alert
    const { getServerSocket } = await import('@/lib/websocket-server')
    const io = getServerSocket()
    io.to(`user-${userId}`).emit('context-health-critical', {
      contextType,
      healthScore: healthData.healthScore,
      issues: healthData.issues,
      suggestions: healthData.suggestions
    })
  }

  return healthData
})
```

#### Analytics API Implementation
```typescript
// src/app/api/analytics/dashboard/route.ts
import { NextRequest } from 'next/server'
import { ApiHandler } from '@/lib/api-base'
import { AnalyticsService } from '@/lib/analytics'

export const GET = ApiHandler.withAuth(async (userId: string, request: NextRequest) => {
  const url = new URL(request.url)
  const period = url.searchParams.get('period') || '30d'
  
  const analytics = await AnalyticsService.getDashboardAnalytics(userId, period)
  
  return analytics
})

// src/app/api/analytics/insights/route.ts
export const GET = ApiHandler.withAuth(async (userId: string) => {
  const insights = await AnalyticsService.generateInsights(userId)
  return insights
})
```

### Implementation Steps

1. **Set up API Base Infrastructure**
   ```bash
   npm install express-rate-limit @types/express-rate-limit
   ```

2. **Implement Error Handling**
   - Centralized error handling system
   - Structured error responses
   - Logging integration

3. **Add Request Validation**
   - Zod schema validation for all endpoints
   - Input sanitization
   - Type-safe request/response handling

4. **Create Rate Limiting**
   - IP-based and user-based rate limiting
   - Different limits for different endpoint types
   - Grace period handling

5. **Build Comprehensive Test Suite**
   - Unit tests for all API handlers
   - Integration tests for complete flows
   - Error scenario testing

### Acceptance Criteria
- [ ] All API endpoints follow RESTful conventions
- [ ] Request/response validation working correctly
- [ ] Rate limiting prevents abuse
- [ ] Error handling provides helpful messages
- [ ] API documentation generated automatically
- [ ] Performance targets met (<100ms for simple operations)
- [ ] Security headers properly configured

### Testing Requirements
- [ ] Unit tests for all API handlers
- [ ] Integration tests with database
- [ ] Rate limiting tested under load
- [ ] Error scenarios properly handled
- [ ] API response schemas validated

---

## Task 14: Set Up WebSocket Real-Time Features ⚡

### Objective
Implement WebSocket connections for real-time session updates, AI context health monitoring, collaborative features, and live dashboard updates using Socket.io architecture.

### WebSocket Architecture

#### WebSocket Server Setup
```typescript
// src/lib/websocket-server.ts
import { Server as HttpServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface AuthenticatedSocket extends Socket {
  userId?: string
  userData?: any
}

let io: SocketIOServer | undefined

export function initSocketServer(httpServer: HttpServer) {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  })

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return next(new Error('Unauthorized'))
      }

      socket.userId = session.user.id
      socket.userData = session.user
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`)

    // Join user-specific room
    socket.join(`user-${socket.userId}`)

    // Session management events
    socket.on('session:start', handleSessionStart)
    socket.on('session:update', handleSessionUpdate) 
    socket.on('session:end', handleSessionEnd)
    socket.on('session:checkpoint', handleSessionCheckpoint)

    // Context health events
    socket.on('context:health-update', handleContextHealthUpdate)
    socket.on('context:refresh', handleContextRefresh)

    // Focus mode events
    socket.on('focus:start', handleFocusStart)
    socket.on('focus:break', handleFocusBreak)
    socket.on('focus:end', handleFocusEnd)

    // Project collaboration events
    socket.on('project:join', handleProjectJoin)
    socket.on('project:leave', handleProjectLeave)
    socket.on('project:update', handleProjectUpdate)

    // Disconnect handling
    socket.on('disconnect', handleDisconnect)
  })

  return io
}

export function getServerSocket() {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}

// Event handlers
async function handleSessionStart(data: any) {
  const socket = this as AuthenticatedSocket
  
  try {
    // Validate and save session
    const session = await db.session.create({
      data: {
        ...data,
        userId: socket.userId!,
        startedAt: new Date(),
        isActive: true,
      }
    })

    // Broadcast to user's other tabs/devices
    socket.to(`user-${socket.userId}`).emit('session:started', session)
    
    // Join session room for potential collaboration
    socket.join(`session-${session.id}`)

    socket.emit('session:start-success', session)
  } catch (error) {
    socket.emit('session:start-error', { error: error.message })
  }
}

async function handleSessionUpdate(data: {
  sessionId: string
  duration?: number
  contextHealth?: number
  status?: string
}) {
  const socket = this as AuthenticatedSocket
  
  try {
    const session = await db.session.update({
      where: { 
        id: data.sessionId,
        userId: socket.userId!
      },
      data: {
        duration: data.duration,
        aiContextHealth: data.contextHealth ? data.contextHealth / 100 : undefined,
        status: data.status,
      }
    })

    // Broadcast update to user's rooms
    io!.to(`user-${socket.userId}`).emit('session:updated', session)
    io!.to(`session-${data.sessionId}`).emit('session:progress', {
      sessionId: data.sessionId,
      duration: data.duration,
      contextHealth: data.contextHealth
    })
  } catch (error) {
    socket.emit('session:update-error', { error: error.message })
  }
}

async function handleSessionEnd(data: {
  sessionId: string
  status: string
  notes?: string
  outcome?: string
}) {
  const socket = this as AuthenticatedSocket
  
  try {
    const session = await db.session.update({
      where: { 
        id: data.sessionId,
        userId: socket.userId!
      },
      data: {
        endedAt: new Date(),
        isActive: false,
        status: data.status,
        notes: data.notes,
      }
    })

    // Update analytics
    await recordSessionAnalytics(socket.userId!, session)

    // Leave session room
    socket.leave(`session-${data.sessionId}`)

    // Broadcast session end
    io!.to(`user-${socket.userId}`).emit('session:ended', {
      sessionId: data.sessionId,
      status: data.status,
      duration: session.duration
    })

    socket.emit('session:end-success', session)
  } catch (error) {
    socket.emit('session:end-error', { error: error.message })
  }
}

async function handleContextHealthUpdate(data: {
  contextType: string
  healthScore: number
  issues: string[]
  suggestions: string[]
}) {
  const socket = this as AuthenticatedSocket
  
  // Update context health in database
  await db.aIContext.upsert({
    where: {
      userId_contextType: {
        userId: socket.userId!,
        contextType: data.contextType
      }
    },
    update: {
      healthScore: data.healthScore / 100,
      issues: data.issues,
      suggestions: data.suggestions,
      lastActivityAt: new Date(),
    },
    create: {
      userId: socket.userId!,
      contextType: data.contextType,
      healthScore: data.healthScore / 100,
      issues: data.issues,
      suggestions: data.suggestions,
    }
  })

  // Broadcast to user's devices
  io!.to(`user-${socket.userId}`).emit('context:health-changed', data)

  // Send alerts for critical health
  if (data.healthScore < 30) {
    io!.to(`user-${socket.userId}`).emit('context:health-critical', {
      contextType: data.contextType,
      healthScore: data.healthScore,
      suggestions: data.suggestions
    })
  }
}

async function handleFocusStart(data: {
  duration: number
  type: 'pomodoro' | 'deep-work' | 'creative'
  ambientSound?: string
}) {
  const socket = this as AuthenticatedSocket
  
  // Record focus session start
  await db.analytics.create({
    data: {
      userId: socket.userId!,
      date: new Date(),
      metric: 'focus_session_start',
      value: data.duration,
      metadata: data
    }
  })

  // Broadcast focus start
  io!.to(`user-${socket.userId}`).emit('focus:started', {
    startedAt: new Date(),
    duration: data.duration,
    type: data.type
  })
}

async function handleDisconnect() {
  const socket = this as AuthenticatedSocket
  console.log(`User ${socket.userId} disconnected`)
  
  // Handle any cleanup needed
  await cleanupUserSockets(socket.userId!)
}

async function recordSessionAnalytics(userId: string, session: any) {
  const analytics = [
    {
      userId,
      date: new Date(),
      metric: 'session_duration',
      value: session.duration || 0,
      metadata: { type: session.type, status: session.status }
    },
    {
      userId,
      date: new Date(),
      metric: 'session_count',
      value: 1,
      metadata: { type: session.type, status: session.status }
    }
  ]

  await db.analytics.createMany({ data: analytics })
}

async function cleanupUserSockets(userId: string) {
  // End any active sessions that weren't properly closed
  await db.session.updateMany({
    where: { 
      userId,
      isActive: true,
      endedAt: null
    },
    data: {
      isActive: false,
      endedAt: new Date(),
      status: 'abandoned'
    }
  })
}
```

#### Client-Side WebSocket Hook
```typescript
// src/hooks/use-websocket.ts
'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import io, { Socket } from 'socket.io-client'

interface WebSocketEvents {
  'session:started': (session: any) => void
  'session:updated': (session: any) => void
  'session:ended': (data: any) => void
  'context:health-changed': (data: any) => void
  'context:health-critical': (data: any) => void
  'focus:started': (data: any) => void
  'focus:ended': (data: any) => void
  'project:updated': (project: any) => void
}

export function useWebSocket() {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const eventListeners = useRef<Map<string, Function[]>>(new Map())
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (status === 'loading' || !session?.user) return

    initializeSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [session, status])

  const initializeSocket = () => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SITE_URL!, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
      setConnectionError(null)
      reconnectAttempts.current = 0
      console.log('WebSocket connected')
    })

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false)
      console.log('WebSocket disconnected:', reason)
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        setTimeout(() => {
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++
            socketInstance.connect()
          }
        }, 1000 * Math.pow(2, reconnectAttempts.current))
      }
    })

    socketInstance.on('connect_error', (error) => {
      setConnectionError(error.message)
      console.error('WebSocket connection error:', error)
    })

    // Set up event forwarding
    socketInstance.onAny((eventName, ...args) => {
      const listeners = eventListeners.current.get(eventName) || []
      listeners.forEach(listener => listener(...args))
    })

    setSocket(socketInstance)
  }

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
      return true
    }
    return false
  }

  const on = <K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K]
  ) => {
    const eventName = event as string
    if (!eventListeners.current.has(eventName)) {
      eventListeners.current.set(eventName, [])
    }
    eventListeners.current.get(eventName)!.push(handler)

    // Return cleanup function
    return () => {
      const listeners = eventListeners.current.get(eventName) || []
      const index = listeners.indexOf(handler)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  const off = (event: string, handler?: Function) => {
    if (handler) {
      const listeners = eventListeners.current.get(event) || []
      const index = listeners.indexOf(handler)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    } else {
      eventListeners.current.delete(event)
    }
  }

  return {
    socket,
    isConnected,
    connectionError,
    emit,
    on,
    off,
  }
}
```

#### Real-Time Dashboard Updates
```typescript
// src/components/dashboard/real-time-dashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/use-websocket'
import { ActiveSession } from './active-session'
import { AIContextHealth } from './ai-context-health'
import { ProjectCard } from '../projects/project-card'
import { toast } from 'sonner'

interface RealTimeDashboardProps {
  initialData: {
    activeSession?: any
    projects: any[]
    contextHealth: any[]
  }
}

export function RealTimeDashboard({ initialData }: RealTimeDashboardProps) {
  const [activeSession, setActiveSession] = useState(initialData.activeSession)
  const [projects, setProjects] = useState(initialData.projects)
  const [contextHealth, setContextHealth] = useState(initialData.contextHealth)
  
  const { isConnected, on, emit } = useWebSocket()

  useEffect(() => {
    if (!isConnected) return

    // Set up event listeners
    const unsubscribers = [
      on('session:started', (session) => {
        setActiveSession(session)
        toast.success('Session started successfully')
      }),

      on('session:updated', (session) => {
        setActiveSession(session)
      }),

      on('session:ended', (data) => {
        setActiveSession(null)
        toast.success(`Session ended: ${data.status}`)
      }),

      on('context:health-changed', (healthData) => {
        setContextHealth(prev => 
          prev.map(ctx => 
            ctx.contextType === healthData.contextType
              ? { ...ctx, ...healthData }
              : ctx
          )
        )
      }),

      on('context:health-critical', (data) => {
        toast.error(
          `${data.contextType} context health is critical (${data.healthScore}%)`,
          {
            description: data.suggestions[0],
            action: {
              label: 'Refresh Context',
              onClick: () => emit('context:refresh', { contextType: data.contextType })
            }
          }
        )
      }),

      on('project:updated', (updatedProject) => {
        setProjects(prev =>
          prev.map(p => p.id === updatedProject.id ? updatedProject : p)
        )
      }),
    ]

    // Cleanup listeners on unmount
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [isConnected, on, emit])

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm text-yellow-800">
              Reconnecting to real-time updates...
            </span>
          </div>
        </div>
      )}

      {/* Active Session */}
      {activeSession && (
        <ActiveSession 
          session={activeSession}
          onUpdate={(updates) => emit('session:update', updates)}
          onEnd={(status, notes) => emit('session:end', { 
            sessionId: activeSession.id, 
            status, 
            notes 
          })}
        />
      )}

      {/* AI Context Health */}
      <AIContextHealth 
        contexts={contextHealth}
        onRefresh={(contextType) => emit('context:refresh', { contextType })}
      />

      {/* Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onUpdate={(updates) => emit('project:update', { 
              projectId: project.id, 
              ...updates 
            })}
          />
        ))}
      </div>
    </div>
  )
}
```

### Implementation Steps

1. **Set up Socket.IO Server**
   ```bash
   npm install socket.io @types/socket.io
   ```

2. **Create WebSocket Event Architecture**
   - Define all real-time events
   - Implement authentication middleware
   - Set up room management

3. **Build Client-Side Integration**
   - WebSocket hook with auto-reconnection
   - Event listener management
   - Error handling and retry logic

4. **Implement Real-Time Features**
   - Live session updates
   - Context health monitoring
   - Project collaboration
   - Focus mode synchronization

5. **Add Connection Management**
   - Automatic reconnection
   - Offline/online state handling
   - Connection quality monitoring

### Acceptance Criteria
- [ ] WebSocket connections stable and auto-reconnect
- [ ] Real-time updates work across browser tabs
- [ ] Session data synchronized instantly
- [ ] Context health alerts delivered immediately
- [ ] Connection state properly communicated to users
- [ ] Performance remains smooth with real-time updates
- [ ] WebSocket events properly authenticated and authorized

### Testing Requirements
- [ ] WebSocket connection reliability tested
- [ ] Real-time synchronization verified across devices
- [ ] Reconnection logic tested with network interruptions
- [ ] Event delivery and ordering validated
- [ ] Memory leak testing for long-running connections

---

## Task 15: Implement PWA Offline Functionality 📱

### Objective
Build comprehensive Progressive Web App offline capabilities with service workers, IndexedDB local storage, background sync for critical operations, and conflict resolution strategies for seamless online/offline transitions.

### PWA Architecture

#### Service Worker Implementation
```typescript
// public/sw.js
const CACHE_NAME = 'flowforge-v1.0.0'
const DYNAMIC_CACHE = 'flowforge-dynamic-v1.0.0'

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  // Critical app shell - cache first
  SHELL: [
    '/',
    '/dashboard',
    '/projects',
    '/habits',
    '/notes',
    '/analytics'
  ],
  
  // Static assets - cache first with network fallback
  STATIC: [
    '/manifest.json',
    '/icons/',
    '/_next/static/',
    '/images/'
  ],
  
  // API routes - network first with cache fallback
  API: [
    '/api/sessions',
    '/api/projects', 
    '/api/habits',
    '/api/notes',
    '/api/ai-context'
  ],
  
  // Never cache
  NEVER_CACHE: [
    '/api/auth',
    '/api/webhooks',
    '/api/payments'
  ]
}

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell')
        return cache.addAll(CACHE_STRATEGIES.SHELL)
      })
      .then(() => {
        console.log('Service Worker: Skip Waiting')
        return self.skipWaiting()
      })
  )
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting Old Cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Claiming Clients')
      return self.clients.claim()
    })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip external requests  
  if (!url.origin.includes(self.location.origin)) return

  // Never cache certain routes
  if (CACHE_STRATEGIES.NEVER_CACHE.some(path => url.pathname.startsWith(path))) {
    return
  }

  // Handle different request types
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
  } else if (CACHE_STRATEGIES.STATIC.some(path => url.pathname.startsWith(path))) {
    event.respondWith(cacheFirstStrategy(request))
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request))
  }
})

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Cache-first strategy failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network request failed, trying cache:', request.url)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      // Add offline indicator to response
      const responseData = await cachedResponse.json()
      const offlineResponse = {
        ...responseData,
        _offline: true,
        _cachedAt: new Date().toISOString()
      }
      
      return new Response(JSON.stringify(offlineResponse), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Return meaningful offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection',
        _offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Stale-while-revalidate for app pages
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  const networkResponsePromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => null)

  return cachedResponse || await networkResponsePromise || 
         await cache.match('/') || 
         new Response('Offline', { status: 503 })
}

// Background sync for queued actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background Sync', event.tag)
  
  switch (event.tag) {
    case 'session-sync':
      event.waitUntil(syncSessions())
      break
    case 'notes-sync':
      event.waitUntil(syncNotes())
      break
    case 'habits-sync':
      event.waitUntil(syncHabits())
      break
    case 'projects-sync':
      event.waitUntil(syncProjects())
      break
  }
})

async function syncSessions() {
  try {
    const db = await openOfflineDB()
    const pendingSessions = await db.getAll('pendingSessions')
    
    for (const session of pendingSessions) {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session.data)
        })
        
        if (response.ok) {
          await db.delete('pendingSessions', session.id)
          console.log('Session synced:', session.id)
        }
      } catch (error) {
        console.error('Failed to sync session:', error)
      }
    }
  } catch (error) {
    console.error('Session sync failed:', error)
  }
}

// IndexedDB helper functions
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FlowForgeOffline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create object stores
      if (!db.objectStoreNames.contains('pendingSessions')) {
        const sessionStore = db.createObjectStore('pendingSessions', { keyPath: 'id' })
        sessionStore.createIndex('timestamp', 'timestamp')
      }
      
      if (!db.objectStoreNames.contains('pendingNotes')) {
        const notesStore = db.createObjectStore('pendingNotes', { keyPath: 'id' })
        notesStore.createIndex('timestamp', 'timestamp')
      }
      
      if (!db.objectStoreNames.contains('pendingHabits')) {
        const habitsStore = db.createObjectStore('pendingHabits', { keyPath: 'id' })
        habitsStore.createIndex('timestamp', 'timestamp')
      }
      
      if (!db.objectStoreNames.contains('offlineData')) {
        const dataStore = db.createObjectStore('offlineData', { keyPath: 'key' })
        dataStore.createIndex('lastModified', 'lastModified')
      }
    }
  })
}
```

#### Offline Data Management Hook
```typescript
// src/hooks/use-offline-storage.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNetworkStatus } from '@/hooks/use-network-status'

interface OfflineItem {
  id: string
  type: 'session' | 'note' | 'habit' | 'project'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retry: number
}

interface OfflineStorage {
  addItem: (item: Omit<OfflineItem, 'id' | 'timestamp' | 'retry'>) => Promise<void>
  getItems: (type?: string) => Promise<OfflineItem[]>
  removeItem: (id: string) => Promise<void>
  syncAll: () => Promise<void>
  getStorageSize: () => Promise<number>
  clearAll: () => Promise<void>
}

export function useOfflineStorage(): OfflineStorage {
  const { isOnline } = useNetworkStatus()
  const [db, setDb] = useState<IDBDatabase | null>(null)
  const [syncInProgress, setSyncInProgress] = useState(false)

  useEffect(() => {
    initDB()
  }, [])

  useEffect(() => {
    if (isOnline && !syncInProgress) {
      syncAll()
    }
  }, [isOnline])

  const initDB = async () => {
    try {
      const database = await openOfflineDB()
      setDb(database)
    } catch (error) {
      console.error('Failed to initialize offline database:', error)
    }
  }

  const openOfflineDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FlowForgeOffline', 2)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Offline queue store
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id' })
          queueStore.createIndex('type', 'type')
          queueStore.createIndex('timestamp', 'timestamp')
        }
        
        // Cached data store
        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' })
          cacheStore.createIndex('lastModified', 'lastModified')
          cacheStore.createIndex('type', 'type')
        }
        
        // User preferences for offline mode
        if (!db.objectStoreNames.contains('offlinePreferences')) {
          db.createObjectStore('offlinePreferences', { keyPath: 'key' })
        }
      }
    })
  }

  const addItem = useCallback(async (item: Omit<OfflineItem, 'id' | 'timestamp' | 'retry'>) => {
    if (!db) return

    const offlineItem: OfflineItem = {
      ...item,
      id: generateOfflineId(),
      timestamp: Date.now(),
      retry: 0
    }

    const transaction = db.transaction(['offlineQueue'], 'readwrite')
    const store = transaction.objectStore('offlineQueue')
    
    try {
      await store.add(offlineItem)
      console.log('Added item to offline queue:', offlineItem)
      
      // Register for background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register(`${item.type}-sync`)
      }
    } catch (error) {
      console.error('Failed to add item to offline queue:', error)
    }
  }, [db])

  const getItems = useCallback(async (type?: string): Promise<OfflineItem[]> => {
    if (!db) return []

    const transaction = db.transaction(['offlineQueue'], 'readonly')
    const store = transaction.objectStore('offlineQueue')
    
    try {
      if (type) {
        const index = store.index('type')
        const result = await index.getAll(type)
        return result
      } else {
        const result = await store.getAll()
        return result
      }
    } catch (error) {
      console.error('Failed to get offline items:', error)
      return []
    }
  }, [db])

  const removeItem = useCallback(async (id: string) => {
    if (!db) return

    const transaction = db.transaction(['offlineQueue'], 'readwrite')
    const store = transaction.objectStore('offlineQueue')
    
    try {
      await store.delete(id)
      console.log('Removed item from offline queue:', id)
    } catch (error) {
      console.error('Failed to remove offline item:', error)
    }
  }, [db])

  const syncAll = useCallback(async () => {
    if (!db || !isOnline || syncInProgress) return

    setSyncInProgress(true)
    
    try {
      const items = await getItems()
      console.log(`Syncing ${items.length} offline items`)

      for (const item of items) {
        try {
          const success = await syncItem(item)
          if (success) {
            await removeItem(item.id)
          } else {
            // Increment retry count
            await updateRetryCount(item.id, item.retry + 1)
          }
        } catch (error) {
          console.error('Failed to sync item:', item.id, error)
          await updateRetryCount(item.id, item.retry + 1)
        }
      }
    } catch (error) {
      console.error('Sync all failed:', error)
    } finally {
      setSyncInProgress(false)
    }
  }, [db, isOnline, syncInProgress, getItems, removeItem])

  const syncItem = async (item: OfflineItem): Promise<boolean> => {
    const endpoint = getEndpointForType(item.type)
    const method = getMethodForAction(item.action)
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data)
      })

      if (response.ok) {
        console.log(`Successfully synced ${item.type} ${item.action}:`, item.id)
        return true
      } else {
        console.error(`Failed to sync ${item.type}:`, response.statusText)
        return false
      }
    } catch (error) {
      console.error(`Network error syncing ${item.type}:`, error)
      return false
    }
  }

  const updateRetryCount = async (id: string, retryCount: number) => {
    if (!db) return

    const transaction = db.transaction(['offlineQueue'], 'readwrite')
    const store = transaction.objectStore('offlineQueue')
    
    try {
      const item = await store.get(id)
      if (item) {
        item.retry = retryCount
        await store.put(item)
      }
    } catch (error) {
      console.error('Failed to update retry count:', error)
    }
  }

  const getStorageSize = useCallback(async (): Promise<number> => {
    if (!navigator.storage || !navigator.storage.estimate) {
      return 0
    }

    try {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    } catch (error) {
      console.error('Failed to get storage estimate:', error)
      return 0
    }
  }, [])

  const clearAll = useCallback(async () => {
    if (!db) return

    const transaction = db.transaction(['offlineQueue', 'cachedData'], 'readwrite')
    
    try {
      await transaction.objectStore('offlineQueue').clear()
      await transaction.objectStore('cachedData').clear()
      console.log('Cleared all offline data')
    } catch (error) {
      console.error('Failed to clear offline data:', error)
    }
  }, [db])

  return {
    addItem,
    getItems,
    removeItem,
    syncAll,
    getStorageSize,
    clearAll
  }
}

// Utility functions
function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getEndpointForType(type: string): string {
  const endpoints = {
    session: '/api/sessions',
    note: '/api/notes',
    habit: '/api/habits',
    project: '/api/projects'
  }
  return endpoints[type] || '/api/generic'
}

function getMethodForAction(action: string): string {
  const methods = {
    create: 'POST',
    update: 'PUT',
    delete: 'DELETE'
  }
  return methods[action] || 'POST'
}
```

#### Network Status Hook
```typescript
// src/hooks/use-network-status.ts
'use client'

import { useState, useEffect } from 'react'

interface NetworkStatus {
  isOnline: boolean
  connectionType: string
  effectiveType: string
  downlink: number
  rtt: number
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  })

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      setStatus({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      })
    }

    const handleOnline = () => {
      updateNetworkStatus()
      console.log('Network: Online')
    }

    const handleOffline = () => {
      updateNetworkStatus()
      console.log('Network: Offline')
    }

    const handleConnectionChange = () => {
      updateNetworkStatus()
    }

    // Set initial status
    updateNetworkStatus()

    // Listen for network changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  return status
}
```

#### Offline-First Component Architecture
```typescript
// src/components/offline/offline-indicator.tsx
'use client'

import { useNetworkStatus } from '@/hooks/use-network-status'
import { useOfflineStorage } from '@/hooks/use-offline-storage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WifiOff, Wifi, Sync, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export function OfflineIndicator() {
  const { isOnline, effectiveType } = useNetworkStatus()
  const { getItems, syncAll } = useOfflineStorage()
  const [pendingItems, setPendingItems] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    updatePendingCount()
    const interval = setInterval(updatePendingCount, 5000)
    return () => clearInterval(interval)
  }, [])

  const updatePendingCount = async () => {
    try {
      const items = await getItems()
      setPendingItems(items.length)
    } catch (error) {
      console.error('Failed to get pending items:', error)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncAll()
      await updatePendingCount()
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  if (isOnline && pendingItems === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <Wifi className="w-4 h-4" />
        <span>Online</span>
        {effectiveType !== 'unknown' && (
          <Badge variant="outline" className="text-xs">
            {effectiveType}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {!isOnline ? (
        <div className="flex items-center space-x-2 text-red-600">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm">Offline</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2 text-orange-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Syncing...</span>
        </div>
      )}

      {pendingItems > 0 && (
        <>
          <Badge variant="outline" className="text-xs">
            {pendingItems} pending
          </Badge>
          
          {isOnline && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              <Sync className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </>
      )}
    </div>
  )
}
```

### Implementation Steps

1. **Set up Service Worker**
   ```bash
   npm install workbox-webpack-plugin
   ```

2. **Configure PWA Manifest**
   - Complete manifest.json with offline capabilities
   - Icon sets for all device sizes
   - Proper scope and start URL configuration

3. **Implement IndexedDB Storage**
   - Offline queue for user actions
   - Cached data for read operations
   - Conflict resolution strategies

4. **Build Sync Infrastructure**
   - Background sync registration
   - Retry logic with exponential backoff
   - Conflict resolution for simultaneous edits

5. **Create Offline UI**
   - Network status indicators
   - Offline mode notifications
   - Sync progress feedback

### Acceptance Criteria
- [ ] App works completely offline for core features
- [ ] Service worker caches critical resources
- [ ] IndexedDB stores user actions when offline
- [ ] Background sync works when connection restored
- [ ] Conflict resolution handles simultaneous edits
- [ ] Offline indicators clearly show connection status
- [ ] PWA installable on mobile devices
- [ ] Performance maintained in offline mode

### Testing Requirements
- [ ] Offline functionality tested across all browsers
- [ ] Service worker updates handled gracefully
- [ ] IndexedDB performance tested with large datasets
- [ ] Background sync tested with various network conditions
- [ ] Conflict resolution scenarios validated

---

*[Continue with remaining tasks 16-20 following the same detailed format]*

This comprehensive infrastructure layer provides FlowForge with enterprise-grade reliability, performance, and offline capabilities necessary for production deployment. The remaining tasks (16-20) would cover responsive navigation, testing frameworks, performance optimization, and development workflow setup with equal detail.

Would you like me to complete the remaining infrastructure tasks (16-20) in the same detailed format?