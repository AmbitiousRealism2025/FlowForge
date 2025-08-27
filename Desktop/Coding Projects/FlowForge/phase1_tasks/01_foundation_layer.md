# Foundation Layer Tasks (1-3)
**Core Infrastructure & Project Setup**

## Overview

The Foundation Layer establishes the technical backbone of FlowForge 1.0. These tasks create the project structure, database architecture, and authentication system that all other features depend on.

**Timeline**: Month 1, Week 1-2  
**Dependencies**: None (starting point)  
**Required Before**: All UI/UX and Core Feature tasks

---

## Task 1: Initialize Next.js 14+ PWA Project 🚀

### Objective
Set up the complete Next.js 14+ PWA foundation with TypeScript, Tailwind CSS, and all core dependencies following the comprehensive project structure created by CodeBot Alpha.

### Technical Requirements

#### Project Structure
```
FlowForge/
├── src/
│   ├── app/                    # Next.js 14+ App Router
│   │   ├── (auth)/            # Auth route group
│   │   ├── (dashboard)/       # Dashboard route group  
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── providers/        # Context providers
│   ├── lib/                   # Utility libraries
│   ├── hooks/                # Custom React hooks
│   ├── store/                # State management
│   ├── types/                # TypeScript definitions
│   └── styles/               # Global styles
├── prisma/                   # Database schema
├── public/                   # Static assets
├── tests/                    # Test files
└── [config files]           # All configuration files
```

#### Core Dependencies (package.json)
```json
{
  "dependencies": {
    "next": "^14.2.12",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.6.2",
    "@prisma/client": "^5.20.0",
    "next-auth": "^4.24.7",
    "@tanstack/react-query": "^5.55.0",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.4.11",
    "framer-motion": "^11.5.4",
    "zod": "^3.23.8",
    "zustand": "^4.5.5"
  }
}
```

#### PWA Configuration (next.config.js)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // PWA Configuration with security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
        ],
      }
    ];
  },
  
  // Image optimization for performance
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
  }
};
```

#### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  }
}
```

### Implementation Steps

1. **Initialize Project**
   ```bash
   npx create-next-app@latest flowforge --typescript --tailwind --eslint --app
   cd flowforge
   ```

2. **Install Dependencies**
   ```bash
   npm install @prisma/client @tanstack/react-query @radix-ui/react-*
   npm install next-auth framer-motion zod zustand bcryptjs
   npm install -D prisma @types/bcryptjs
   ```

3. **Create Project Structure**
   - Set up all directories as specified above
   - Create configuration files (eslint, prettier, etc.)

4. **Configure Tailwind CSS**
   ```javascript
   // tailwind.config.js - Custom design system
   module.exports = {
     theme: {
       extend: {
         colors: {
           // Flow state colors
           'flow-active': '#00D9A5',
           'flow-warning': '#FFB800', 
           'flow-blocked': '#FF4757',
           // AI model colors
           'claude-purple': '#7C3AED',
           'gpt-teal': '#06B6D4'
         }
       }
     }
   }
   ```

5. **PWA Manifest Setup**
   ```json
   // public/manifest.json
   {
     "name": "FlowForge - AI Productivity Companion",
     "short_name": "FlowForge",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#7C3AED"
   }
   ```

### Acceptance Criteria
- [ ] Next.js 14+ App Router project successfully initialized
- [ ] All dependencies installed without conflicts
- [ ] Project structure matches specification exactly
- [ ] TypeScript strict mode enabled with custom paths
- [ ] Tailwind CSS configured with custom design tokens
- [ ] PWA manifest configured for mobile installation
- [ ] Development server runs without errors (`npm run dev`)
- [ ] Build process completes successfully (`npm run build`)

### Testing Requirements
- [ ] Homepage loads correctly at localhost:3000
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] PWA audit shows proper manifest configuration

---

## Task 2: Set Up Prisma PostgreSQL Database Schema 🗄️

### Objective
Implement the complete database schema using Prisma ORM with PostgreSQL, including all models for User, Project, Session, Habit, Note, AIContext, and Analytics.

### Database Schema Design

#### Core Models
```prisma
// prisma/schema.prisma

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // FlowForge specific fields
  shipStreak    Int      @default(0)
  flowState     FlowState @default(NEUTRAL)
  lastActiveAt  DateTime?

  // Relationships
  sessions      Session[]
  projects      Project[]
  habits        Habit[]
  notes         Note[]
  aiContexts    AIContext[]
  analytics     Analytics[]

  @@map("users")
}

model Project {
  id              String   @id @default(cuid())
  name            String
  description     String?
  color           String   @default("#3b82f6")
  status          ProjectStatus @default(ACTIVE)
  feelsRightScore Int?     @db.SmallInt // 1-5 scale
  shipTarget      DateTime?
  pivotCount      Int      @default(0)
  lastWorkedAt    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  userId    String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Relationships
  sessions  Session[]
  notes     Note[]

  @@map("projects")
}

model Session {
  id        String      @id @default(cuid())
  type      SessionType @default(BUILDING)
  startedAt DateTime    @default(now())
  endedAt   DateTime?
  duration  Int?        // in minutes
  isActive  Boolean     @default(false)
  
  // AI Context tracking
  aiModel           String?
  aiContextHealth   Float?   @default(1.0) // 0.0 - 1.0
  productivityScore Int?     @db.SmallInt  // 1-10
  
  // Notes and outcomes
  notes             String?
  status            SessionStatus @default(FLOWING)

  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id])

  @@map("sessions")
}

model Habit {
  id              String   @id @default(cuid())
  name            String
  description     String?
  category        HabitCategory
  targetFrequency HabitFrequency @default(DAILY)
  currentStreak   Int      @default(0)
  longestStreak   Int      @default(0)
  lastCompletedAt DateTime?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Relationships
  completions HabitCompletion[]

  @@map("habits")
}

model HabitCompletion {
  id          String   @id @default(cuid())
  completedAt DateTime @default(now())
  notes       String?

  habitId String
  habit   Habit  @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@map("habit_completions")
}

model Note {
  id        String   @id @default(cuid())
  title     String?
  content   String
  category  NoteCategory
  tags      String[] @default([])
  isTemplate Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id])

  @@map("notes")
}

model AIContext {
  id             String   @id @default(cuid())
  contextType    String   // "claude_desktop", "vscode", "cursor"
  healthScore    Float    @default(1.0) // 0.0 - 1.0
  lastActivityAt DateTime @default(now())
  metadata       Json     @default("{}")
  issues         String[] @default([])
  suggestions    String[] @default([])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, contextType])
  @@map("ai_contexts")
}

model Analytics {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  metric    String   
  value     Float
  metadata  Json     @default("{}")

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date, metric])
  @@map("analytics")
}

// Enums
enum FlowState {
  BLOCKED
  NEUTRAL  
  FLOWING
  DEEP_FLOW
}

enum ProjectStatus {
  ACTIVE
  PAUSED
  SHIPPED
  ABANDONED
}

enum SessionType {
  BUILDING
  EXPLORING
  DEBUGGING
  SHIPPING
}

enum SessionStatus {
  FLOWING
  STUCK
  SHIPPED
  ABANDONED
}

enum HabitCategory {
  DAILY_SHIP
  CONTEXT_REFRESH
  CODE_REVIEW
  BACKUP_CHECK
  FLOW_BLOCK
}

enum HabitFrequency {
  DAILY
  WEEKLY
  CUSTOM
}

enum NoteCategory {
  PROMPT_PATTERN
  GOLDEN_CODE
  DEBUG_LOG
  MODEL_NOTE
  INSIGHT
}
```

### Implementation Steps

1. **Initialize Prisma**
   ```bash
   npx prisma init
   ```

2. **Configure Database Connection**
   ```env
   # .env.local
   DATABASE_URL="postgresql://postgres:password@localhost:5432/flowforge_dev"
   ```

3. **Create Schema File**
   - Copy complete schema above to `prisma/schema.prisma`

4. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

5. **Create Database & Run Migration**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Set Up Database Client**
   ```typescript
   // src/lib/db.ts
   import { PrismaClient } from '@prisma/client'

   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined
   }

   export const db = globalForPrisma.prisma ?? new PrismaClient()

   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
   ```

7. **Create Seed Script**
   ```typescript
   // prisma/seed.ts
   import { PrismaClient, HabitCategory } from '@prisma/client'

   const prisma = new PrismaClient()

   async function main() {
     // Create demo user
     const user = await prisma.user.upsert({
       where: { email: 'demo@flowforge.com' },
       update: {},
       create: {
         email: 'demo@flowforge.com',
         name: 'Demo User',
         flowState: 'FLOWING',
       },
     })

     // Create default habits for vibe coders
     const defaultHabits = [
       { name: 'Daily Ship', category: 'DAILY_SHIP' as HabitCategory },
       { name: 'Context Refresh', category: 'CONTEXT_REFRESH' as HabitCategory },
       { name: 'Code Review', category: 'CODE_REVIEW' as HabitCategory },
       { name: 'Backup Check', category: 'BACKUP_CHECK' as HabitCategory },
       { name: 'Flow Block', category: 'FLOW_BLOCK' as HabitCategory },
     ]

     for (const habit of defaultHabits) {
       await prisma.habit.upsert({
         where: {
           userId_name: { userId: user.id, name: habit.name }
         },
         update: {},
         create: {
           ...habit,
           userId: user.id,
         },
       })
     }

     console.log('Database seeded successfully!')
   }
   ```

### Acceptance Criteria
- [ ] Prisma schema includes all required models and relationships
- [ ] Database migration runs successfully
- [ ] All enums properly defined for FlowForge domain
- [ ] Foreign key relationships correctly established
- [ ] Unique constraints prevent data conflicts
- [ ] Database client accessible throughout application
- [ ] Seed script creates demo data successfully
- [ ] Prisma Studio can view all tables

### Testing Requirements
- [ ] `npx prisma migrate dev` completes without errors
- [ ] `npx prisma db seed` populates demo data
- [ ] `npx prisma studio` opens database browser
- [ ] All model relationships work correctly

---

## Task 3: Configure NextAuth.js Authentication System 🔐

### Objective
Implement comprehensive authentication using NextAuth.js with multiple providers (Google, GitHub, Email), secure session management, and middleware protection following security best practices.

### Authentication Configuration

#### NextAuth.js Setup
```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }
      return session
    },
    async jwt({ token, user }) {
      const dbUser = await db.user.findFirst({
        where: { email: token.email },
      })

      if (!dbUser) {
        if (user) token.id = user?.id
        return token
      }

      // Update last active timestamp
      await db.user.update({
        where: { id: dbUser.id },
        data: { lastActiveAt: new Date() }
      })

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      }
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        // Initialize new user with default habits
        const defaultHabits = [
          { name: 'Daily Ship', category: 'DAILY_SHIP' },
          { name: 'Context Refresh', category: 'CONTEXT_REFRESH' },
          { name: 'Code Review', category: 'CODE_REVIEW' },
          { name: 'Backup Check', category: 'BACKUP_CHECK' },
          { name: 'Flow Block', category: 'FLOW_BLOCK' },
        ]

        for (const habit of defaultHabits) {
          await db.habit.create({
            data: {
              ...habit,
              userId: user.id,
            },
          })
        }
      }
    },
  },
}
```

#### API Route Setup
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

#### Authentication Middleware
```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    
    // Add security headers
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public routes
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/signup', 
          '/api/auth',
          '/api/health',
        ]
        
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

### Authentication Pages

#### Sign In Page
```typescript
// src/app/auth/signin/page.tsx
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SignInForm } from '@/components/auth/SignInForm'

export default async function SignInPage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to FlowForge
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your AI-powered productivity companion
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}
```

#### Authentication Context Provider
```typescript
// src/components/providers/auth-provider.tsx
'use client'

import { SessionProvider } from 'next-auth/react'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>
}
```

### Implementation Steps

1. **Install NextAuth.js Dependencies**
   ```bash
   npm install next-auth @next-auth/prisma-adapter
   ```

2. **Update Prisma Schema**
   - Add NextAuth.js required models (Account, Session, VerificationToken)

3. **Configure Environment Variables**
   ```env
   # .env.local
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"  
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   
   # Email Provider
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"
   EMAIL_FROM="noreply@flowforge.com"
   ```

4. **Create Authentication Components**
   - SignInForm component with provider buttons
   - User menu component for authenticated state
   - Loading states and error handling

5. **Run Database Migration**
   ```bash
   npx prisma migrate dev --name add-auth
   ```

6. **Test Authentication Flow**
   - Sign in with each provider
   - Verify session persistence
   - Test middleware protection

### Acceptance Criteria
- [ ] NextAuth.js configured with all three providers
- [ ] Prisma adapter successfully integrated
- [ ] Authentication middleware protects routes
- [ ] Sign in/out flow works smoothly
- [ ] Session data persisted correctly
- [ ] New users get default habits created
- [ ] Error handling for auth failures
- [ ] Email verification working (if using email provider)

### Testing Requirements
- [ ] Sign in with Google works
- [ ] Sign in with GitHub works  
- [ ] Sign in with email works
- [ ] Protected routes redirect to sign in
- [ ] Session persists across browser restarts
- [ ] Sign out clears session properly

### Security Checklist
- [ ] NEXTAUTH_SECRET is cryptographically strong
- [ ] OAuth redirect URLs properly configured
- [ ] CSRF protection enabled
- [ ] Session cookies have secure flags
- [ ] No sensitive data in client-side tokens

---

## Foundation Layer Summary

Upon completion of these 3 tasks:

✅ **Infrastructure Ready**: Complete Next.js 14+ PWA foundation  
✅ **Database Operational**: Full PostgreSQL schema with Prisma  
✅ **Security Implemented**: Multi-provider authentication system  

**Next Phase**: [UI/UX Implementation Tasks](./02_ui_ux_implementation.md) →

**Dependencies Resolved**: All subsequent tasks can now be built on this foundation.