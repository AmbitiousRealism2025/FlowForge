# FlowForge - AI Productivity Companion

> Track flow states, AI context health, and shipping velocity for vibe coding developers

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.1-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What is FlowForge?

FlowForge is a productivity companion designed specifically for AI-assisted developers who practice "vibe coding" - using AI conversations to build software rather than writing code directly. Unlike traditional task managers, FlowForge focuses on:

- **Flow State Tracking**: Monitor and protect your creative flow
- **AI Context Health**: Keep AI conversations fresh and productive
- **Ship Velocity**: Celebrate deployments over task completion
- **Vibe-Centric Design**: Emotional state awareness and gentle nudges

## ✨ Core Features

### Dashboard
- Today's focus (single main objective, not a task list)
- Active AI session with context health indicator
- Ship streak (consecutive days with deployments)
- Vibe meter (Green/Yellow/Red flow state)
- Quick capture for ideas

### Session Management
- Track AI-assisted coding sessions
- Monitor AI context health in real-time
- Session types: Building, Exploring, Debugging, Shipping
- Checkpoint notes for preserving session state

### Project Tracking
- "Feels right" progress indicators (not percentages)
- Flexible ship targets (not rigid deadlines)
- Stack notes for optimal AI tools per project
- Pivot counter (celebrates direction changes)

### Habit Tracking
- Daily Ship streak
- Context Refresh reminders
- Code Review tracking
- Backup Check verification
- Flow Block protection

### Notes System
- Prompt patterns (successful AI conversation templates)
- Golden code snippets
- Debug logs and problem-solving history
- Model effectiveness notes

### Analytics
- Ship rate (deployment frequency)
- Flow score (quality creative hours)
- Model performance comparison
- Best shipping times

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flowforge.git
cd flowforge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your database credentials and OAuth keys
```

4. Initialize the database:
```bash
npm run db:migrate
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠 Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript 5+
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: Zustand (client) + React Query (server state)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Google, GitHub, Email)
- **Real-time**: WebSocket with Socket.io
- **Offline**: Service Workers + IndexedDB
- **PWA**: Progressive Web App with Capacitor.js for native apps
- **Testing**: Jest (unit) + Playwright (e2e)

## 📁 Project Structure

```
flowforge/
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
└── Desktop/                  # Documentation and planning
```

## 🎨 Design Philosophy

**Ambient Intelligence**: FlowForge should feel like a gentle, intelligent companion that enhances flow without disrupting it.

Key principles:
- **Flow State Protection**: Non-intrusive, gentle interactions
- **Vibe-Centric Design**: Emotional state awareness and celebration
- **AI-Context Awareness**: Deep integration with AI development workflows
- **Mobile-First**: Touch-optimized responsive design

## 📊 Development Roadmap

### Phase 1: MVP Foundation (Current)
Tasks 1-20 across 4 sequential groups:
1. **Foundation Layer** (Tasks 1-3): Next.js setup, database, auth
2. **UI/UX Implementation** (Tasks 4-6): Design system, dashboard
3. **Core Features** (Tasks 7-12): AI monitoring, projects, habits, notes, analytics
4. **Infrastructure** (Tasks 13-20): APIs, real-time, PWA, testing

### Phase 2: Mobile Optimization
Tasks 21-36: Touch optimization, PWA features, performance, app store preparation

### Phase 3: Advanced Features
Tasks 37-52: ML analytics, integrations, collaboration, enterprise features

See `Desktop/Coding Projects/FlowForge/` for detailed task documentation.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📝 Available Scripts

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript type checking
npm run db:migrate      # Run Prisma migrations
npm run db:seed         # Seed database with demo data
npm run db:studio       # Open Prisma Studio
npm run test            # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run build:pwa       # Build PWA with service worker
```

## 🌟 Success Metrics (Phase 1)

- 70%+ daily active usage
- <2s load time performance
- 70%+ test coverage
- Mobile-ready PWA functionality

## 🤝 Contributing

This project is in active development. Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: See `Desktop/Coding Projects/FlowForge/` for detailed docs
- **PRD**: `Desktop/Coding Projects/FlowForge/FlowForge_PRD_v1.0.md`
- **Claude Guide**: `Claude.md` in repository root

## 💬 Support

For questions and support, please open an issue in the GitHub repository.

---

Built with ❤️ for vibe coders by vibe coders
