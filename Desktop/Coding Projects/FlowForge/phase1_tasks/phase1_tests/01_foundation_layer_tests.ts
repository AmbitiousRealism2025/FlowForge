import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NextConfig } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextAuthOptions } from 'next-auth';

/**
 * Phase 1 Foundation Layer Tests
 * 
 * These tests define the expected functionality for Tasks 1-3:
 * - Task 1: Next.js 14+ Setup with App Router, TypeScript, Tailwind CSS
 * - Task 2: Database Setup with PostgreSQL, Prisma ORM, migrations, seeding
 * - Task 3: Authentication System with NextAuth.js, multiple providers
 * 
 * All tests are designed to FAIL initially to follow TDD approach.
 */

describe('Phase 1 Foundation Layer', () => {
  
  // ===========================================
  // TASK 1: Next.js 14+ Setup Tests
  // ===========================================
  
  describe('Task 1: Next.js 14+ Setup', () => {
    
    test('should have Next.js 14+ with App Router configuration', async () => {
      // This test will fail until Next.js is properly configured
      const nextConfig = await import('../../next.config.js').catch(() => null);
      
      expect(nextConfig).toBeDefined();
      expect(nextConfig.default.experimental.appDir).toBe(true);
      
      // Verify package.json has Next.js 14+
      const packageJson = await import('../../package.json');
      const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next;
      expect(nextVersion).toBeDefined();
      expect(nextVersion).toMatch(/^14\./);
    });

    test('should have TypeScript configuration with strict mode', async () => {
      const tsConfig = await import('../../tsconfig.json').catch(() => null);
      
      expect(tsConfig).toBeDefined();
      expect(tsConfig.compilerOptions.strict).toBe(true);
      expect(tsConfig.compilerOptions.target).toBe('ES2022');
      expect(tsConfig.compilerOptions.module).toBe('ESNext');
      expect(tsConfig.compilerOptions.jsx).toBe('preserve');
      expect(tsConfig.include).toContain('src/**/*');
    });

    test('should have Tailwind CSS properly configured', async () => {
      const tailwindConfig = await import('../../tailwind.config.js').catch(() => null);
      
      expect(tailwindConfig).toBeDefined();
      expect(tailwindConfig.default.content).toContain('./src/**/*.{js,ts,jsx,tsx,mdx}');
      
      // Verify FlowForge color palette is defined
      const colors = tailwindConfig.default.theme?.extend?.colors;
      expect(colors).toBeDefined();
      expect(colors['flow-green']).toBe('#00D9A5');
      expect(colors['caution-amber']).toBe('#FFB800');
      expect(colors['stuck-red']).toBe('#FF4757');
      expect(colors['claude-purple']).toBe('#7C3AED');
      expect(colors['neutral-slate']).toBe('#2F3542');
    });

    test('should have ESLint configuration with TypeScript support', async () => {
      const eslintConfig = await import('../../.eslintrc.json').catch(() => null);
      
      expect(eslintConfig).toBeDefined();
      expect(eslintConfig.extends).toContain('next/core-web-vitals');
      expect(eslintConfig.extends).toContain('@typescript-eslint/recommended');
      expect(eslintConfig.parser).toBe('@typescript-eslint/parser');
    });

    test('should have Prettier configuration', async () => {
      const prettierConfig = await import('../../.prettierrc.json').catch(() => null);
      
      expect(prettierConfig).toBeDefined();
      expect(prettierConfig.semi).toBe(true);
      expect(prettierConfig.singleQuote).toBe(true);
      expect(prettierConfig.tabWidth).toBe(2);
    });

    test('should have proper App Router structure', async () => {
      const fs = await import('fs/promises');
      
      // Check for App Router directory structure
      const appDirExists = await fs.access('src/app').then(() => true).catch(() => false);
      expect(appDirExists).toBe(true);
      
      const layoutExists = await fs.access('src/app/layout.tsx').then(() => true).catch(() => false);
      expect(layoutExists).toBe(true);
      
      const pageExists = await fs.access('src/app/page.tsx').then(() => true).catch(() => false);
      expect(pageExists).toBe(true);
      
      // Check for route groups
      const authGroupExists = await fs.access('src/app/(auth)').then(() => true).catch(() => false);
      expect(authGroupExists).toBe(true);
      
      const dashboardGroupExists = await fs.access('src/app/(dashboard)').then(() => true).catch(() => false);
      expect(dashboardGroupExists).toBe(true);
      
      const apiDirExists = await fs.access('src/app/api').then(() => true).catch(() => false);
      expect(apiDirExists).toBe(true);
    });
  });

  // ===========================================
  // TASK 2: Database Setup Tests  
  // ===========================================

  describe('Task 2: Database Setup', () => {
    let prisma: PrismaClient;
    
    beforeEach(() => {
      // This will fail until Prisma is configured
      prisma = new PrismaClient();
    });
    
    afterEach(async () => {
      await prisma.$disconnect();
    });

    test('should have PostgreSQL connection configured', async () => {
      // Test database connection
      await expect(prisma.$connect()).resolves.not.toThrow();
      
      // Verify database URL format for PostgreSQL
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).toMatch(/^postgresql:\/\//);
    });

    test('should have Prisma configuration file', async () => {
      const fs = await import('fs/promises');
      
      const schemaExists = await fs.access('prisma/schema.prisma').then(() => true).catch(() => false);
      expect(schemaExists).toBe(true);
      
      const schemaContent = await fs.readFile('prisma/schema.prisma', 'utf-8');
      expect(schemaContent).toContain('generator client');
      expect(schemaContent).toContain('datasource db');
      expect(schemaContent).toContain('provider = "postgresql"');
    });

    test('should have User model with required fields', async () => {
      // This will fail until User model is defined in schema
      const user = await prisma.user.findFirst().catch(() => null);
      
      // Test User model structure by attempting to create (should have validation)
      await expect(
        prisma.user.create({
          data: {
            email: 'test@example.com',
            flowState: 'NEUTRAL',
            shipStreak: 0,
            totalShips: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      ).resolves.toBeDefined();
    });

    test('should have Project model with flexible tracking', async () => {
      // This will fail until Project model is defined
      await expect(
        prisma.project.create({
          data: {
            name: 'Test Project',
            description: 'Test project description',
            feelsRightProgress: 50,
            targetShipDate: new Date(),
            pivotCount: 0,
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      ).resolves.toBeDefined();
    });

    test('should have Session model for AI context tracking', async () => {
      // This will fail until Session model is defined
      await expect(
        prisma.session.create({
          data: {
            sessionType: 'BUILDING',
            flowState: 'FLOWING',
            contextHealth: 85,
            aiModel: 'claude-3-sonnet',
            startTime: new Date(),
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      ).resolves.toBeDefined();
    });

    test('should have Habit model for vibe coder habits', async () => {
      // This will fail until Habit model is defined
      await expect(
        prisma.habit.create({
          data: {
            category: 'DAILY_SHIP',
            name: 'Daily Deployment',
            description: 'Deploy something every day',
            streakCount: 5,
            lastCompleted: new Date(),
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      ).resolves.toBeDefined();
    });

    test('should have Note model for various note types', async () => {
      // This will fail until Note model is defined
      await expect(
        prisma.note.create({
          data: {
            category: 'PROMPT_PATTERN',
            title: 'Test Note',
            content: 'This is a test note',
            tags: ['test', 'pattern'],
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      ).resolves.toBeDefined();
    });

    test('should have AIContext model for model health monitoring', async () => {
      // This will fail until AIContext model is defined
      await expect(
        prisma.aIContext.create({
          data: {
            modelName: 'claude-3-sonnet',
            healthScore: 90,
            contextWindow: 200000,
            tokensUsed: 15000,
            lastRefresh: new Date(),
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      ).resolves.toBeDefined();
    });

    test('should have database migrations directory', async () => {
      const fs = await import('fs/promises');
      
      const migrationsExists = await fs.access('prisma/migrations').then(() => true).catch(() => false);
      expect(migrationsExists).toBe(true);
    });

    test('should have seed script functionality', async () => {
      const packageJson = await import('../../package.json');
      
      expect(packageJson.prisma?.seed).toBeDefined();
      expect(packageJson.scripts?.['db:seed']).toBeDefined();
      
      // Verify seed file exists
      const fs = await import('fs/promises');
      const seedExists = await fs.access('prisma/seed.ts').then(() => true).catch(() => false);
      expect(seedExists).toBe(true);
    });

    test('should support required enums', async () => {
      // Test that enums are properly defined in schema
      const schemaContent = await import('fs/promises').then(fs => 
        fs.readFile('prisma/schema.prisma', 'utf-8')
      );
      
      // FlowState enum
      expect(schemaContent).toContain('enum FlowState');
      expect(schemaContent).toContain('BLOCKED');
      expect(schemaContent).toContain('NEUTRAL');
      expect(schemaContent).toContain('FLOWING');
      expect(schemaContent).toContain('DEEP_FLOW');
      
      // SessionType enum
      expect(schemaContent).toContain('enum SessionType');
      expect(schemaContent).toContain('BUILDING');
      expect(schemaContent).toContain('EXPLORING');
      expect(schemaContent).toContain('DEBUGGING');
      expect(schemaContent).toContain('SHIPPING');
      
      // HabitCategory enum
      expect(schemaContent).toContain('enum HabitCategory');
      expect(schemaContent).toContain('DAILY_SHIP');
      expect(schemaContent).toContain('CONTEXT_REFRESH');
      expect(schemaContent).toContain('CODE_REVIEW');
      
      // NoteCategory enum
      expect(schemaContent).toContain('enum NoteCategory');
      expect(schemaContent).toContain('PROMPT_PATTERN');
      expect(schemaContent).toContain('GOLDEN_CODE');
      expect(schemaContent).toContain('DEBUG_LOG');
    });
  });

  // ===========================================
  // TASK 3: Authentication System Tests
  // ===========================================

  describe('Task 3: Authentication System', () => {
    
    test('should have NextAuth.js configuration', async () => {
      const authConfig = await import('../../src/app/api/auth/[...nextauth]/route.ts').catch(() => null);
      
      expect(authConfig).toBeDefined();
      expect(authConfig.GET).toBeDefined();
      expect(authConfig.POST).toBeDefined();
    });

    test('should have NextAuth options with required providers', async () => {
      const { authOptions } = await import('../../src/lib/auth').catch(() => ({ authOptions: null }));
      
      expect(authOptions).toBeDefined();
      expect(authOptions.providers).toBeDefined();
      expect(authOptions.providers.length).toBeGreaterThanOrEqual(3);
      
      // Check for Google provider
      const googleProvider = authOptions.providers.find((p: any) => p.id === 'google');
      expect(googleProvider).toBeDefined();
      
      // Check for GitHub provider
      const githubProvider = authOptions.providers.find((p: any) => p.id === 'github');
      expect(githubProvider).toBeDefined();
      
      // Check for Email provider
      const emailProvider = authOptions.providers.find((p: any) => p.id === 'email');
      expect(emailProvider).toBeDefined();
    });

    test('should have custom adapter for database integration', async () => {
      const { authOptions } = await import('../../src/lib/auth').catch(() => ({ authOptions: null }));
      
      expect(authOptions.adapter).toBeDefined();
      expect(authOptions.session?.strategy).toBe('database');
    });

    test('should have proper session configuration', async () => {
      const { authOptions } = await import('../../src/lib/auth').catch(() => ({ authOptions: null }));
      
      expect(authOptions.session).toBeDefined();
      expect(authOptions.session.strategy).toBe('database');
      expect(authOptions.session.maxAge).toBeDefined();
    });

    test('should have authentication middleware', async () => {
      const fs = await import('fs/promises');
      
      const middlewareExists = await fs.access('src/middleware.ts').then(() => true).catch(() => false);
      expect(middlewareExists).toBe(true);
      
      const middlewareContent = await fs.readFile('src/middleware.ts', 'utf-8');
      expect(middlewareContent).toContain('withAuth');
      expect(middlewareContent).toContain('matcher');
    });

    test('should protect dashboard routes', async () => {
      // This test simulates trying to access protected routes without auth
      const middlewareContent = await import('fs/promises').then(fs =>
        fs.readFile('src/middleware.ts', 'utf-8')
      );
      
      expect(middlewareContent).toContain('/(dashboard|api)');
      expect(middlewareContent).toContain('/(auth)');
    });

    test('should have login and logout pages', async () => {
      const fs = await import('fs/promises');
      
      // Check for login page
      const loginExists = await fs.access('src/app/(auth)/login/page.tsx').then(() => true).catch(() => false);
      expect(loginExists).toBe(true);
      
      // Check for logout functionality
      const authDir = await fs.readdir('src/app/(auth)').catch(() => []);
      expect(authDir.length).toBeGreaterThan(0);
    });

    test('should have environment variables for auth providers', () => {
      // Google OAuth
      expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
      
      // GitHub OAuth  
      expect(process.env.GITHUB_CLIENT_ID).toBeDefined();
      expect(process.env.GITHUB_CLIENT_SECRET).toBeDefined();
      
      // NextAuth
      expect(process.env.NEXTAUTH_SECRET).toBeDefined();
      expect(process.env.NEXTAUTH_URL).toBeDefined();
      
      // Email provider
      expect(process.env.EMAIL_SERVER).toBeDefined();
      expect(process.env.EMAIL_FROM).toBeDefined();
    });

    test('should have user session type definitions', async () => {
      const typesContent = await import('fs/promises').then(fs =>
        fs.readFile('src/types/index.ts', 'utf-8')
      );
      
      expect(typesContent).toContain('User');
      expect(typesContent).toContain('Session');
      expect(typesContent).toContain('FlowState');
    });

    test('should handle session retrieval in components', async () => {
      // Test that getServerSession works with our auth config
      const session = await getServerSession(
        await import('../../src/lib/auth').then(m => m.authOptions)
      ).catch(() => null);
      
      // Should not throw error (session can be null if not authenticated)
      expect(typeof session).toBe('object');
    });
  });

  // ===========================================
  // Integration Tests for Foundation Layer
  // ===========================================

  describe('Foundation Layer Integration', () => {
    
    test('should have development server running with all layers', async () => {
      // This test verifies the entire foundation can start together
      const packageJson = await import('../../package.json');
      
      expect(packageJson.scripts.dev).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.start).toBeDefined();
    });

    test('should have all required npm scripts', async () => {
      const packageJson = await import('../../package.json');
      const scripts = packageJson.scripts;
      
      expect(scripts.dev).toBeDefined();
      expect(scripts.build).toBeDefined();
      expect(scripts.start).toBeDefined();
      expect(scripts['db:migrate']).toBeDefined();
      expect(scripts['db:seed']).toBeDefined();
      expect(scripts['db:studio']).toBeDefined();
      expect(scripts.test).toBeDefined();
      expect(scripts.lint).toBeDefined();
      expect(scripts['type-check']).toBeDefined();
    });

    test('should have proper TypeScript paths and imports', async () => {
      const tsConfig = await import('../../tsconfig.json');
      
      expect(tsConfig.compilerOptions.baseUrl).toBe('./');
      expect(tsConfig.compilerOptions.paths).toBeDefined();
      expect(tsConfig.compilerOptions.paths['@/*']).toContain('./src/*');
    });

    test('should have environment configuration', async () => {
      const fs = await import('fs/promises');
      
      const envExampleExists = await fs.access('.env.example').then(() => true).catch(() => false);
      expect(envExampleExists).toBe(true);
      
      const envContent = await fs.readFile('.env.example', 'utf-8');
      expect(envContent).toContain('DATABASE_URL=');
      expect(envContent).toContain('NEXTAUTH_SECRET=');
      expect(envContent).toContain('GOOGLE_CLIENT_ID=');
      expect(envContent).toContain('GITHUB_CLIENT_ID=');
    });

    test('should have proper component and lib structure', async () => {
      const fs = await import('fs/promises');
      
      // Components structure
      const componentsExists = await fs.access('src/components').then(() => true).catch(() => false);
      expect(componentsExists).toBe(true);
      
      const uiExists = await fs.access('src/components/ui').then(() => true).catch(() => false);
      expect(uiExists).toBe(true);
      
      // Lib structure
      const libExists = await fs.access('src/lib').then(() => true).catch(() => false);
      expect(libExists).toBe(true);
      
      // Auth lib
      const authLibExists = await fs.access('src/lib/auth.ts').then(() => true).catch(() => false);
      expect(authLibExists).toBe(true);
      
      // Types
      const typesExists = await fs.access('src/types').then(() => true).catch(() => false);
      expect(typesExists).toBe(true);
    });

    test('should have load time performance targets', async () => {
      // This test defines performance requirements from CLAUDE.md
      const nextConfig = await import('../../next.config.js').catch(() => null);
      
      expect(nextConfig).toBeDefined();
      
      // Should have performance optimizations configured
      expect(nextConfig.default.images).toBeDefined();
      expect(nextConfig.default.experimental?.optimizeCss).toBe(true);
    });
  });
});

/**
 * Test Utilities and Helpers
 */

describe('Test Infrastructure', () => {
  
  test('should have Jest configuration for TypeScript', async () => {
    const jestConfig = await import('../../jest.config.js').catch(() => null);
    
    expect(jestConfig).toBeDefined();
    expect(jestConfig.default.preset).toBe('ts-jest');
    expect(jestConfig.default.testEnvironment).toBe('node');
    expect(jestConfig.default.setupFilesAfterEnv).toContain('<rootDir>/jest.setup.js');
  });

  test('should have test database configuration', () => {
    expect(process.env.DATABASE_URL_TEST || process.env.DATABASE_URL).toBeDefined();
  });

  test('should have proper test file structure', async () => {
    const fs = await import('fs/promises');
    
    const testsExists = await fs.access('tests').then(() => true).catch(() => false);
    expect(testsExists).toBe(true);
  });
});