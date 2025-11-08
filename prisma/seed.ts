import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@flowforge.app' },
    update: {},
    create: {
      email: 'demo@flowforge.app',
      name: 'Demo Vibe Coder',
      flowState: 'FLOWING',
      shipStreak: 7,
      timezone: 'America/Los_Angeles',
    },
  })

  console.log('✅ Created demo user:', demoUser.email)

  // Create demo projects
  const demoProjects = await Promise.all([
    prisma.project.create({
      data: {
        userId: demoUser.id,
        name: 'FlowForge MVP',
        description: 'Building the AI productivity companion',
        feelsRightScore: 4,
        shipTarget: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        stackNotes: 'Next.js 14, Prisma, PostgreSQL, Radix UI',
        pivotCount: 2,
      },
    }),
    prisma.project.create({
      data: {
        userId: demoUser.id,
        name: 'Personal Portfolio',
        description: 'Showcasing my vibe coding projects',
        feelsRightScore: 3,
        stackNotes: 'Next.js, Tailwind, Vercel',
      },
    }),
  ])

  console.log('✅ Created demo projects:', demoProjects.length)

  // Create demo habits
  const demoHabits = await Promise.all([
    prisma.habit.create({
      data: {
        userId: demoUser.id,
        name: 'Daily Ship',
        category: 'DAILY_SHIP',
        streakCount: 7,
        targetFrequency: 1,
        lastCompletedAt: new Date(),
      },
    }),
    prisma.habit.create({
      data: {
        userId: demoUser.id,
        name: 'Context Refresh',
        category: 'CONTEXT_REFRESH',
        streakCount: 5,
        targetFrequency: 2,
        lastCompletedAt: new Date(),
      },
    }),
    prisma.habit.create({
      data: {
        userId: demoUser.id,
        name: 'Code Review',
        category: 'CODE_REVIEW',
        streakCount: 3,
        targetFrequency: 1,
      },
    }),
  ])

  console.log('✅ Created demo habits:', demoHabits.length)

  // Create demo notes
  const demoNotes = await Promise.all([
    prisma.note.create({
      data: {
        userId: demoUser.id,
        title: 'Effective Prompt Pattern for Auth',
        content: 'When implementing auth with NextAuth: "Set up NextAuth.js with Google and GitHub providers, include session callbacks for user metadata, and protect API routes with getServerSession"',
        category: 'PROMPT_PATTERN',
        tags: ['auth', 'nextauth', 'security'],
        isTemplate: true,
        projectId: demoProjects[0].id,
      },
    }),
    prisma.note.create({
      data: {
        userId: demoUser.id,
        title: 'Golden Code: Zustand Store Pattern',
        content: 'import { create } from "zustand"\n\nexport const useStore = create((set) => ({\n  count: 0,\n  increment: () => set((state) => ({ count: state.count + 1 }))\n}))',
        category: 'GOLDEN_CODE',
        tags: ['zustand', 'state-management', 'react'],
        isTemplate: true,
      },
    }),
  ])

  console.log('✅ Created demo notes:', demoNotes.length)

  // Create demo AI context
  const aiContext = await prisma.aIContext.create({
    data: {
      userId: demoUser.id,
      modelName: 'Claude 3.5 Sonnet',
      contextHealth: 85,
      conversationCount: 42,
      lastRefreshedAt: new Date(),
    },
  })

  console.log('✅ Created AI context tracking')

  // Create analytics records for the past week
  const now = new Date()
  const analyticsRecords = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    analyticsRecords.push({
      userId: demoUser.id,
      date,
      shipCount: Math.floor(Math.random() * 3) + 1,
      flowScore: Math.floor(Math.random() * 40) + 60,
      codingMinutes: Math.floor(Math.random() * 180) + 120,
      contextRefreshes: Math.floor(Math.random() * 2),
    })
  }

  await prisma.analytics.createMany({
    data: analyticsRecords,
  })

  console.log('✅ Created analytics records:', analyticsRecords.length)

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
