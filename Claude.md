# Claude.md

This file provides guidance to Claude Code when working with the FlowForge project.

---

## 🚨 CRITICAL INSTRUCTIONS FOR CLAUDE CLOUD AGENT

**Before starting ANY work on this project, you MUST:**

1. **Read [STATUS.md](STATUS.md)** - This file tracks current implementation progress and tells you exactly what phase/task to work on next
2. **Read this CLAUDE.md file completely** - Understand the project structure and guidelines
3. **Follow the plan progression** - We are implementing in strict order:
   - **Completed Phases**:
     - Plan v1 - Phase 1.1 (Foundation Layer) ✅
     - Plan v1 - Phase 1.2 (API Layer) ✅
     - Plan v1 - Phase 1.3 (Dashboard & Layout) ✅
     - Plan v1 - Phase 1.4 (Session Management) ✅
     - Plan v1 - Phase 1.5 (Project Management) ✅
   - **Next Phase**: Plan v1 - Phase 1.6+ (Additional Features - TBD)
   - **Master Plan**: [plan-v1-:-master-plan-for-mvp.md](plan-v1-:-master-plan-for-mvp.md)

4. **Update STATUS.md** - After completing each file/task, update the STATUS.md to reflect progress

**Implementation Rules:**
- Follow the phase plan documents VERBATIM - they contain detailed implementation instructions
- Do NOT skip ahead to other phases
- Do NOT deviate from the specified architecture
- Complete ALL files in a task group before moving to the next group
- Test your implementations as you go
- Update STATUS.md after each completed file

---

## Project Overview

FlowForge is an AI productivity companion designed for developers who practice "vibe coding" - using AI assistants to build software. The app tracks flow states, AI context health, and shipping velocity rather than traditional task completion metrics.

**Current Status**: Phase 1.5 (Project Management) complete. Comprehensive project management system with feels-right tracking (1-5 scale with emoji indicators) and pivot counter celebrating direction changes. Implemented FeelsRightSlider with debounced updates, PivotCounter with celebration messaging, CreateProjectDialog for project creation, ProjectCard with momentum indicators and stats, and complete projects page with grid view, filters, sorting, and summary statistics. Extended types, utilities, and projectService for full CRUD operations. 8 files created/modified. Ready for next phase of feature development.

## Quick Reference

**Detailed Documentation**: See `/home/user/FlowForge/Desktop/Coding Projects/FlowForge/` for:
- `CLAUDE.md` - Comprehensive development guide
- `FlowForge_PRD_v1.0.md` - Complete product requirements
- `README.md` - Project overview
- `phase1_tasks/`, `phase2_tasks/`, `phase3_tasks/` - Implementation guides

## Technology Stack

- **Frontend**: Next.js 14+ App Router, React 18+, TypeScript 5+
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: Zustand (client) + React Query (server state)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with multiple providers
- **Real-time**: WebSocket with Socket.io
- **Offline**: Service Workers + IndexedDB
- **PWA**: Progressive Web App with Capacitor.js for native apps
- **Timezone Handling**: Luxon for timezone-aware date operations

## Project Structure

```
/home/user/FlowForge/
├── src/
│   ├── app/                    # Next.js 14+ App Router
│   │   ├── (auth)/            # Auth route group
│   │   ├── (dashboard)/       # Dashboard route group
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components (Radix)
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── providers/        # Context providers
│   ├── lib/                   # Utility libraries
│   ├── hooks/                # Custom React hooks
│   ├── store/                # Zustand state management
│   ├── types/                # TypeScript definitions
│   └── styles/               # Global styles
├── prisma/                   # Database schema & migrations
├── public/                   # Static assets
├── tests/                    # Test files
└── Desktop/                  # Documentation and planning files
```

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:migrate      # Run Prisma migrations
npm run db:seed         # Seed database with demo data
npm run db:studio       # Open Prisma Studio

# Testing
npm run test            # Run unit tests (Jest)
npm run test:e2e        # Run end-to-end tests (Playwright)
npm run type-check      # TypeScript type checking
npm run lint            # ESLint code linting

# PWA
npm run build:pwa       # Build PWA with service worker
```

## Development Workflow

### Phase 1 (Current): MVP Foundation
See `Desktop/Coding Projects/FlowForge/phase1_tasks/` for detailed tasks:
1. Foundation Layer (Tasks 1-3): Setup, database, auth
2. UI/UX Implementation (Tasks 4-6): Design system, dashboard
3. Core Features (Tasks 7-12): AI monitoring, projects, habits, notes, analytics, focus
4. Infrastructure (Tasks 13-20): APIs, real-time, PWA, testing, optimization

### Implementation Approach
- Test-Driven Development using comprehensive failing test suites
- Sequential task implementation (complete one subgroup before moving to next)
- Performance benchmarks: <2s load times, >90 Lighthouse scores, >70% test coverage
- Mobile-first responsive design

## Core Design Principles

- **Ambient Intelligence**: Flow state protection, non-intrusive interactions
- **Vibe-Centric Design**: Emotional state awareness and celebration
- **AI-Context Awareness**: Deep integration with AI development workflows
- **Mobile-First**: Touch-optimized responsive design

## Key Domain Models

- **User**: Flow state tracking, ship streak, authentication, timezone preferences
- **Project**: "Feels right" progress tracking, flexible ship targets
- **Session**: AI-assisted coding sessions with context health monitoring
- **Habit**: Vibe coder specific habits (Daily Ship, Context Refresh, etc.)
- **Note**: Prompt patterns, golden code snippets, debug logs
- **AIContext**: AI model health monitoring
- **Analytics**: Daily ship tracking with timezone-normalized dates (stored as UTC, represents user's local day start)

## Success Metrics (Phase 1)

- 70%+ daily active usage
- <2s load time performance
- 70%+ test coverage
- Mobile-ready PWA functionality

## When Working on FlowForge

1. **Follow TDD**: Use failing test suites in `Desktop/Coding Projects/FlowForge/phase*_tasks/phase*_tests/`
2. **Reference Documentation**: Check detailed task guides before implementing
3. **Vibe Coding Focus**: Remember this is for AI-assisted developers
4. **Flow State Protection**: All features should enhance, not disrupt creative flow
5. **Performance First**: Meet benchmarks at every step
6. **Timezone Handling**: Always use `getUserDayStart(timezone)` from `src/lib/timezone.ts` for date normalization
   - All `Analytics.date` values are stored normalized to user's day start (as UTC)
   - Use dates directly from DB for comparisons (already normalized)
   - Use `formatUserDate()` only for display purposes
7. **Git Workflow**:
   - Always work on feature branches, never directly on `master`
   - Use descriptive branch names: `feature/`, `fix/`, `refactor/`
   - Sync with master regularly using `git pull origin master --rebase`

## Color Palette

```css
--flow-green: #00D9A5;      /* Active, productive flow */
--caution-amber: #FFB800;   /* Context warnings */
--stuck-red: #FF4757;       /* Blocked states */
--claude-purple: #7C3AED;   /* AI model indicators */
--neutral-slate: #2F3542;   /* Text and backgrounds */
```

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment: Copy `.env.example` to `.env.local`
3. Initialize database: `npm run db:migrate && npm run db:seed`
4. Start development: `npm run dev`

For comprehensive details, always refer to the documentation in `Desktop/Coding Projects/FlowForge/`.
