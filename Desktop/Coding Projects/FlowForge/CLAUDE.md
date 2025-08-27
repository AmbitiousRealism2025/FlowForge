# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowForge is an AI-productivity companion designed specifically for developers who practice "vibe coding" - using AI assistants to build software rather than writing code directly. The app focuses on tracking flow states, AI context health, and shipping velocity rather than traditional task completion metrics.

**Current Status**: Documentation and planning phase. No code implementation yet.

## Architecture & Technology Stack

### Target Tech Stack (From PRD)
- **Frontend**: Next.js 14+ App Router, React 18+, TypeScript 5+
- **Styling**: Tailwind CSS + Radix UI components  
- **State Management**: Zustand (client) + React Query (server state)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with multiple providers (Google, GitHub, Email)
- **Real-time**: WebSocket with Socket.io
- **Offline**: Service Workers + IndexedDB
- **PWA**: Progressive Web App → iOS/Android conversion

### Planned Project Structure
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
└── tests/                    # Test files
```

## Development Commands (Planned)

Once implemented, the following commands should be available:
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

## Core Domain Models

### Database Schema (Planned)
- **User**: Authentication, flow state tracking, ship streak
- **Project**: "Feels right" progress tracking, flexible ship targets, pivot counting
- **Session**: AI-assisted coding sessions with context health monitoring
- **Habit**: Vibe coder specific habits (Daily Ship, Context Refresh, Code Review, etc.)
- **Note**: Prompt patterns, golden code snippets, debug logs, model notes
- **AIContext**: AI model health monitoring and issue tracking
- **Analytics**: Time-series productivity and flow metrics

### Key Enums
- **FlowState**: BLOCKED, NEUTRAL, FLOWING, DEEP_FLOW
- **SessionType**: BUILDING, EXPLORING, DEBUGGING, SHIPPING
- **HabitCategory**: DAILY_SHIP, CONTEXT_REFRESH, CODE_REVIEW, BACKUP_CHECK, FLOW_BLOCK
- **NoteCategory**: PROMPT_PATTERN, GOLDEN_CODE, DEBUG_LOG, MODEL_NOTE, INSIGHT

## Implementation Phases

### Phase 1 (3 months): MVP Foundation
See `phase1_tasks/` directory for detailed 20-task breakdown:
1. **01_foundation_layer.md** (Tasks 1-3): Next.js setup, Prisma database, NextAuth authentication
2. **02_ui_ux_implementation.md** (Tasks 4-6): Design system, dashboard, session tracking  
3. **03_core_features.md** (Tasks 7-12): AI monitoring, projects, habits, notes, analytics, focus mode
4. **04_infrastructure_performance.md** (Tasks 13-20): APIs, real-time, PWA, testing, optimization

### Phase 2 (2 months): Mobile Optimization & PWA Enhancement
See `phase2_tasks/` directory for detailed 16-task breakdown:
1. **01_mobile_responsive_design.md** (Tasks 21-24): Touch optimization, responsive layouts, haptic feedback
2. **02_pwa_native_features.md** (Tasks 25-28): Push notifications, background sync, offline storage
3. **03_performance_mobile.md** (Tasks 29-32): Mobile optimization, battery efficiency, memory management
4. **04_app_store_preparation.md** (Tasks 33-36): Capacitor integration, native packaging, store submission

### Phase 3 (3 months): Advanced Features & Scale
See `phase3_tasks/` directory for detailed 16-task breakdown:
1. **01_advanced_analytics.md** (Tasks 37-40): ML recommendations, pattern recognition, predictive analytics
2. **02_integrations_ecosystem.md** (Tasks 41-44): Extended MCP servers, calendar, version control, communication
3. **03_collaboration_features.md** (Tasks 45-48): Team dashboards, manager analytics, enterprise features
4. **04_scale_production.md** (Tasks 49-52): Performance at scale, security, monitoring, CI/CD

### Key Design Principles
- **"Ambient Intelligence"**: Flow state protection, non-intrusive interactions
- **Vibe-Centric Design**: Emotional state awareness and celebration  
- **AI-Context Awareness**: Deep integration with AI development workflows
- **Mobile-First**: Touch-optimized responsive design for PWA→mobile conversion

## MCP Integration Strategy

FlowForge will integrate with Model Context Protocol (MCP) servers for:
- **Claude Desktop**: Context health monitoring and session tracking
- **VS Code**: Code context and workspace metrics  
- **Cursor**: AI context and productivity metrics

## Development Notes

### When Working on FlowForge:
1. **Follow the PRD**: Detailed product requirements in `FlowForge_PRD_v1.0.md`
2. **Reference Task Documentation**: Complete implementation guides in `phase1_tasks/`
3. **"Vibe Coding" Focus**: Remember this is for AI-assisted developers, not traditional coding workflows
4. **Flow State Protection**: All features should enhance rather than disrupt creative flow
5. **Shipping Over Tasks**: Celebrate deployment frequency over task completion

### Color Palette
```css
--flow-green: #00D9A5;      /* Active, productive flow */
--caution-amber: #FFB800;   /* Context warnings */
--stuck-red: #FF4757;       /* Blocked states */
--claude-purple: #7C3AED;   /* AI model indicators */
--neutral-slate: #2F3542;   /* Text and backgrounds */
```

### Success Metrics
- 70%+ daily active usage
- <2s load time performance  
- 70%+ test coverage
- Mobile-ready PWA functionality

## Sequential Task Implementation

**Total Tasks**: 52 tasks across 3 phases (8-month timeline)

### Task Numbering & Sequence
- **Phase 1**: Tasks 1-20 (MVP Foundation) 
- **Phase 2**: Tasks 21-36 (Mobile & PWA)
- **Phase 3**: Tasks 37-52 (Advanced & Scale)

Each phase uses sequential file naming (01_, 02_, 03_, 04_) to ensure proper implementation order.

### Current Status
All task documentation complete. **Phase 1 and Phase 2 failing tests created** using TDD approach. Ready to begin implementation starting with `phase1_tasks/01_foundation_layer.md`.

### Development Commands (Planned)
Once Phase 1 is implemented:
```bash
npm run dev              # Development server
npm run build           # Production build  
npm run db:migrate      # Database migrations
npm run test            # Unit tests
npm run test:e2e        # End-to-end tests
npm run build:pwa       # PWA build (Phase 2)
npm run build:native    # Native app build (Phase 2)
```

## Conversation History Management

### Compaction Protocol
When conversations reach token limits, use Claude Code's `/compact` command to create summaries. After compaction:

1. **Create Summary**: Add numbered summary file to `conversation_history/` directory
2. **File Naming**: Use sequential numbering: `01_`, `02_`, `03_`, etc.
3. **Content**: Include key accomplishments, technical decisions, files modified, and next steps
4. **Purpose**: Maintain context continuity across conversation sessions

**Current Summaries**:
- `conversation_history/01_task_organization_summary.md`: Complete task organization system implementation
- `conversation_history/02_phase1_tests_creation_summary.md`: Phase 1 comprehensive test suite creation (TDD)

## Coding Agent & Testing Cycle Methodology

### Overview
FlowForge uses a hybrid development approach combining external coding agents for implementation with Claude Code for comprehensive testing validation. This methodology ensures systematic development with rigorous quality gates.

### Development Workflow

#### **Phase Structure**
Each phase contains **4 task subgroups** with clear implementation boundaries:
- **Phase 1**: Foundation (1-3), UI/UX (4-6), Core Features (7-12), Infrastructure (13-20)
- **Phase 2**: Mobile Design (21-24), PWA Features (25-28), Performance (29-32), App Store (33-36) 
- **Phase 3**: Analytics (37-40), Integrations (41-44), Collaboration (45-48), Production Scale (49-52)

#### **Implementation Cycle**
1. **Coding Agent Implementation**
   - External coding agent implements one complete task subgroup
   - Follows Test-Driven Development using comprehensive failing test suites
   - Uses detailed task documentation and "Coding Agent Instructions" in each phase README
   - Stops after completing subgroup and waits for testing validation

2. **Testing Validation (Claude Code)**
   - Run comprehensive test suite for completed subgroup
   - Execute tests in separate/isolated environment
   - Validate functionality, performance, and FlowForge-specific requirements
   - Identify failing tests and provide specific feedback

3. **Iterative Refinement**
   - Coding agent addresses failing test feedback
   - Makes targeted adjustments based on test failures
   - Repeats until all tests pass for current subgroup

4. **Subgroup Completion Gate**
   - All tests must pass before proceeding to next subgroup
   - Performance benchmarks must be met
   - FlowForge design principles validated
   - Quality gates confirmed

#### **Phase Completion Gate**
- Complete testing of all 4 subgroups within phase
- Integration testing across subgroups
- End-to-end user journey validation
- Performance and security audit
- **Phase boundary**: No Phase N+1 work begins until Phase N fully tested and validated

### Test-Driven Development Approach

#### **Comprehensive Failing Test Suites**
- **400+ failing tests** across all phases guide implementation
- Tests define expected functionality before code is written
- FlowForge-specific scenarios: flow states, AI context health, vibe coding patterns
- Enterprise requirements: security, compliance, scalability

#### **Test File Structure**
```
phase1_tasks/phase1_tests/
├── 01_foundation_layer_tests.ts       # Tasks 1-3
├── 02_ui_ux_implementation_tests.ts   # Tasks 4-6  
├── 03_core_features_tests.ts          # Tasks 7-12
└── 04_infrastructure_performance_tests.ts # Tasks 13-20

phase2_tasks/phase2_tests/
├── 01_mobile_responsive_design_tests.ts   # Tasks 21-24
├── 02_pwa_native_features_tests.ts        # Tasks 25-28
├── 03_performance_mobile_tests.ts         # Tasks 29-32
└── 04_app_store_preparation_tests.ts      # Tasks 33-36

phase3_tasks/phase3_tests/
├── 01_advanced_analytics_tests.ts         # Tasks 37-40
├── 02_integrations_ecosystem_tests.ts     # Tasks 41-44
├── 03_collaboration_features_tests.ts     # Tasks 45-48
└── 04_scale_production_tests.ts           # Tasks 49-52
```

#### **Testing Standards**
- **Jest Framework**: TypeScript, comprehensive mocking, integration testing
- **Performance Validation**: Load times, responsiveness, memory usage
- **Mobile Testing**: Touch interactions, gestures, offline functionality
- **Security Testing**: Authentication, authorization, data protection
- **Accessibility Testing**: WCAG 2.1 compliance, screen reader compatibility

### Quality Assurance Protocol

#### **FlowForge-Specific Validation**
- **Flow State Protection**: Non-intrusive interactions, intelligent filtering
- **AI Context Health**: Real-time monitoring, degradation detection
- **Vibe Coding Patterns**: Celebration systems, ambient intelligence
- **Mobile-First**: Touch optimization, performance benchmarks
- **Privacy-First**: Data encryption, user consent, compliance

#### **Performance Benchmarks**
- **Phase 1**: <2s load times, >90 Lighthouse scores, >70% test coverage
- **Phase 2**: <3s mobile load, <16ms touch response, 90%+ offline functionality
- **Phase 3**: Enterprise scale, ML model performance, security compliance

#### **Deployment Readiness**
- All tests passing across all phases
- Performance benchmarks achieved
- Security audit completed
- User acceptance testing successful
- Production monitoring configured

### Benefits of This Methodology

#### **Quality Assurance**
- Systematic validation prevents regression
- Comprehensive test coverage ensures reliability
- Performance benchmarks maintain user experience
- Security testing protects user data

#### **Development Efficiency**
- Clear task boundaries reduce scope creep
- TDD approach guides implementation direction
- Automated testing reduces manual validation effort
- Iterative refinement enables continuous improvement

#### **FlowForge Alignment**
- Design principles validated at each step
- User experience consistency maintained
- AI-specific requirements thoroughly tested
- Mobile and enterprise readiness confirmed

### Implementation Status
- **Test Suites**: ✅ Complete (400+ comprehensive failing tests)
- **Task Documentation**: ✅ Complete (52 tasks across 3 phases)
- **Coding Agent Instructions**: ✅ Complete (all phase READMEs updated)
- **Quality Gates**: ✅ Defined (performance, security, functionality benchmarks)
- **Ready for Development**: ✅ Phase 1 implementation can begin