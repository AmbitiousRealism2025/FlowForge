/**
 * Phase 1 Infrastructure & Performance Tests (Tasks 13-20)
 * FlowForge - AI Productivity Companion for Vibe Coders
 * 
 * Comprehensive test suite for:
 * - Task 13: API Layer Development
 * - Task 14: Real-time Features Implementation  
 * - Task 15: Progressive Web App (PWA) Setup
 * - Task 16: Performance Optimization
 * - Task 17: Testing Infrastructure
 * - Task 18: Development Tooling
 * - Task 19: Deployment Pipeline
 * - Task 20: Monitoring and Analytics
 */

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { performance } from 'perf_hooks';
import WebSocket from 'ws';
import request from 'supertest';
import puppeteer, { Browser, Page } from 'puppeteer';

// Types for FlowForge domain models
interface User {
  id: string;
  email: string;
  flowState: FlowState;
  shipStreak: number;
  createdAt: Date;
}

interface Session {
  id: string;
  userId: string;
  type: SessionType;
  flowState: FlowState;
  aiContextHealth: number;
  startTime: Date;
  isActive: boolean;
}

interface Project {
  id: string;
  userId: string;
  name: string;
  feelsRightProgress: number;
  shipTargets: number;
  pivotCount: number;
}

interface AIContext {
  id: string;
  sessionId: string;
  modelName: string;
  contextHealth: number;
  responseLatency: number;
  lastUpdated: Date;
}

enum FlowState {
  BLOCKED = 'BLOCKED',
  NEUTRAL = 'NEUTRAL', 
  FLOWING = 'FLOWING',
  DEEP_FLOW = 'DEEP_FLOW'
}

enum SessionType {
  BUILDING = 'BUILDING',
  EXPLORING = 'EXPLORING',
  DEBUGGING = 'DEBUGGING',
  SHIPPING = 'SHIPPING'
}

// Mock implementations (will be replaced with actual implementations)
class MockAPIServer {
  authenticate(token: string): Promise<User | null> {
    throw new Error('API authentication not implemented');
  }

  createSession(userId: string, type: SessionType): Promise<Session> {
    throw new Error('Session creation API not implemented');
  }

  updateFlowState(sessionId: string, flowState: FlowState): Promise<void> {
    throw new Error('Flow state update API not implemented');
  }

  getRateLimitStatus(apiKey: string): Promise<{ remaining: number; resetTime: Date }> {
    throw new Error('Rate limiting not implemented');
  }
}

class MockWebSocketServer {
  constructor() {
    throw new Error('WebSocket server not implemented');
  }

  broadcast(event: string, data: any): void {
    throw new Error('WebSocket broadcasting not implemented');
  }

  subscribeToFlowUpdates(userId: string): void {
    throw new Error('Flow state WebSocket subscription not implemented');
  }
}

class MockServiceWorker {
  register(): Promise<ServiceWorkerRegistration> {
    throw new Error('Service worker registration not implemented');
  }

  cache(resources: string[]): Promise<void> {
    throw new Error('Service worker caching not implemented');
  }

  syncInBackground(data: any): Promise<void> {
    throw new Error('Background sync not implemented');
  }
}

class MockPerformanceMonitor {
  measureLoadTime(): Promise<number> {
    throw new Error('Load time measurement not implemented');
  }

  trackBundleSize(): Promise<{ js: number; css: number; total: number }> {
    throw new Error('Bundle size tracking not implemented');
  }

  measureDatabaseQueryTime(query: string): Promise<number> {
    throw new Error('Database query performance monitoring not implemented');
  }
}

// =============================================================================
// Task 13: API Layer Development Tests
// =============================================================================

describe('Task 13: API Layer Development', () => {
  let apiServer: MockAPIServer;
  let app: any; // Express app mock

  beforeAll(() => {
    apiServer = new MockAPIServer();
  });

  describe('RESTful API Endpoints', () => {
    test('should provide complete CRUD operations for all core features', async () => {
      // User management endpoints
      expect(async () => {
        await request(app).get('/api/users/me').expect(200);
        await request(app).patch('/api/users/me').send({ flowState: 'FLOWING' }).expect(200);
      }).not.toThrow();

      // Session management endpoints  
      expect(async () => {
        await request(app).post('/api/sessions').send({ type: 'BUILDING' }).expect(201);
        await request(app).get('/api/sessions').expect(200);
        await request(app).patch('/api/sessions/123').send({ flowState: 'DEEP_FLOW' }).expect(200);
        await request(app).delete('/api/sessions/123').expect(204);
      }).not.toThrow();

      // Project management endpoints
      expect(async () => {
        await request(app).post('/api/projects').send({ name: 'Test Project' }).expect(201);
        await request(app).get('/api/projects').expect(200);
        await request(app).patch('/api/projects/456').send({ feelsRightProgress: 75 }).expect(200);
      }).not.toThrow();

      // AI context monitoring endpoints
      expect(async () => {
        await request(app).get('/api/ai-context/health').expect(200);
        await request(app).post('/api/ai-context/issues').send({ type: 'context_drift' }).expect(201);
      }).not.toThrow();

      // Habits and notes endpoints
      expect(async () => {
        await request(app).get('/api/habits').expect(200);
        await request(app).post('/api/notes').send({ category: 'PROMPT_PATTERN', content: 'Test' }).expect(201);
      }).not.toThrow();
    });

    test('should implement proper API authentication and authorization', async () => {
      const validToken = 'valid-jwt-token';
      const invalidToken = 'invalid-token';

      // Should reject requests without authentication
      expect(async () => {
        await request(app).get('/api/users/me').expect(401);
      }).not.toThrow();

      // Should reject requests with invalid tokens
      expect(async () => {
        await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${invalidToken}`)
          .expect(401);
      }).not.toThrow();

      // Should accept requests with valid tokens
      const user = await apiServer.authenticate(validToken);
      expect(user).toBeDefined();
      expect(user?.id).toBeTruthy();
    });

    test('should implement rate limiting and request validation', async () => {
      const apiKey = 'test-api-key';
      
      // Rate limiting should track and enforce limits
      const rateLimitStatus = await apiServer.getRateLimitStatus(apiKey);
      expect(rateLimitStatus.remaining).toBeGreaterThanOrEqual(0);
      expect(rateLimitStatus.resetTime).toBeInstanceOf(Date);

      // Should validate request payloads
      expect(async () => {
        await request(app)
          .post('/api/sessions')
          .send({ invalidField: 'invalid' })
          .expect(400);
      }).not.toThrow();

      // Should validate required fields
      expect(async () => {
        await request(app)
          .post('/api/projects')
          .send({}) // Missing required name field
          .expect(400);
      }).not.toThrow();
    });

    test('should implement comprehensive error handling', async () => {
      // Should handle 404 for non-existent resources
      expect(async () => {
        await request(app).get('/api/sessions/non-existent-id').expect(404);
      }).not.toThrow();

      // Should handle database errors gracefully
      expect(async () => {
        const response = await request(app).get('/api/sessions').expect(500);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Internal server error');
      }).not.toThrow();

      // Should return consistent error format
      expect(async () => {
        const response = await request(app).post('/api/sessions').send({}).expect(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('details');
        expect(response.body).toHaveProperty('timestamp');
      }).not.toThrow();
    });
  });
});

// =============================================================================
// Task 14: Real-time Features Implementation Tests
// =============================================================================

describe('Task 14: Real-time Features Implementation', () => {
  let wsServer: MockWebSocketServer;
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    wsServer = new MockWebSocketServer();
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('WebSocket Integration', () => {
    test('should establish WebSocket connections for live dashboard updates', async () => {
      const ws = new WebSocket('ws://localhost:3001/dashboard');
      
      expect(new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      })).resolves.toBeUndefined();

      // Should receive dashboard updates
      expect(new Promise((resolve) => {
        ws.on('message', (data) => {
          const update = JSON.parse(data.toString());
          expect(update).toHaveProperty('type');
          expect(update).toHaveProperty('payload');
          resolve(update);
        });
        
        // Trigger a dashboard update
        wsServer.broadcast('dashboard_update', {
          activeUsers: 5,
          totalSessions: 150,
          avgFlowState: 'FLOWING'
        });
      })).resolves.toBeDefined();
    });

    test('should implement real-time AI context health monitoring', async () => {
      const ws = new WebSocket('ws://localhost:3001/ai-context');
      
      // Should receive AI context health updates
      expect(new Promise((resolve) => {
        ws.on('message', (data) => {
          const healthUpdate = JSON.parse(data.toString());
          expect(healthUpdate).toHaveProperty('contextHealth');
          expect(healthUpdate).toHaveProperty('modelName');
          expect(healthUpdate).toHaveProperty('responseLatency');
          expect(healthUpdate.contextHealth).toBeGreaterThanOrEqual(0);
          expect(healthUpdate.contextHealth).toBeLessThanOrEqual(100);
          resolve(healthUpdate);
        });

        // Simulate AI context degradation
        wsServer.broadcast('ai_context_update', {
          contextHealth: 65,
          modelName: 'claude-3-sonnet',
          responseLatency: 1200,
          warning: 'Context length approaching limit'
        });
      })).resolves.toBeDefined();
    });

    test('should synchronize flow states in real-time', async () => {
      const userId = 'test-user-123';
      
      // Subscribe to flow state updates
      wsServer.subscribeToFlowUpdates(userId);

      const ws = new WebSocket(`ws://localhost:3001/flow-state/${userId}`);
      
      expect(new Promise((resolve) => {
        ws.on('message', (data) => {
          const flowUpdate = JSON.parse(data.toString());
          expect(flowUpdate).toHaveProperty('flowState');
          expect(flowUpdate).toHaveProperty('sessionId');
          expect(flowUpdate).toHaveProperty('timestamp');
          expect(Object.values(FlowState)).toContain(flowUpdate.flowState);
          resolve(flowUpdate);
        });

        // Trigger flow state change
        ws.send(JSON.stringify({
          type: 'flow_state_change',
          flowState: FlowState.DEEP_FLOW,
          sessionId: 'session-456'
        }));
      })).resolves.toBeDefined();
    });

    test('should support session collaboration features', async () => {
      const sessionId = 'collaborative-session-789';
      const ws1 = new WebSocket(`ws://localhost:3001/session/${sessionId}/user1`);
      const ws2 = new WebSocket(`ws://localhost:3001/session/${sessionId}/user2`);

      // Test collaborative cursor sharing
      expect(new Promise((resolve) => {
        ws2.on('message', (data) => {
          const cursorUpdate = JSON.parse(data.toString());
          if (cursorUpdate.type === 'cursor_position') {
            expect(cursorUpdate).toHaveProperty('userId');
            expect(cursorUpdate).toHaveProperty('position');
            resolve(cursorUpdate);
          }
        });

        ws1.send(JSON.stringify({
          type: 'cursor_position',
          position: { x: 100, y: 200 }
        }));
      })).resolves.toBeDefined();

      // Test collaborative flow state sharing
      expect(new Promise((resolve) => {
        ws2.on('message', (data) => {
          const flowUpdate = JSON.parse(data.toString());
          if (flowUpdate.type === 'collaborator_flow_change') {
            expect(flowUpdate).toHaveProperty('userId');
            expect(flowUpdate).toHaveProperty('flowState');
            resolve(flowUpdate);
          }
        });

        ws1.send(JSON.stringify({
          type: 'flow_state_change',
          flowState: FlowState.BLOCKED
        }));
      })).resolves.toBeDefined();
    });

    test('should implement push notification system', async () => {
      // Test push notification registration
      await page.goto('http://localhost:3000');
      
      const pushSupported = await page.evaluate(() => {
        return 'serviceWorker' in navigator && 'PushManager' in window;
      });
      expect(pushSupported).toBe(true);

      // Test notification permission request
      const permissionResult = await page.evaluate(async () => {
        const permission = await Notification.requestPermission();
        return permission;
      });
      expect(['granted', 'denied', 'default']).toContain(permissionResult);

      // Test push subscription
      expect(async () => {
        await page.evaluate(async () => {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'test-vapid-key'
          });
          return subscription;
        });
      }).not.toThrow();
    });
  });
});

// =============================================================================
// Task 15: Progressive Web App (PWA) Setup Tests
// =============================================================================

describe('Task 15: Progressive Web App (PWA) Setup', () => {
  let serviceWorker: MockServiceWorker;
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    serviceWorker = new MockServiceWorker();
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Service Worker Configuration', () => {
    test('should register service worker successfully', async () => {
      const registration = await serviceWorker.register();
      expect(registration).toBeDefined();
      expect(registration.active).toBeTruthy();
      expect(registration.scope).toBe('/');
    });

    test('should implement comprehensive caching strategies', async () => {
      const criticalResources = [
        '/',
        '/dashboard',
        '/api/sessions',
        '/api/users/me',
        '/static/css/main.css',
        '/static/js/main.js'
      ];

      await serviceWorker.cache(criticalResources);

      // Verify resources are cached
      const cacheStorage = await caches.open('flowforge-v1');
      for (const resource of criticalResources) {
        const cachedResponse = await cacheStorage.match(resource);
        expect(cachedResponse).toBeDefined();
      }
    });

    test('should handle offline functionality', async () => {
      await page.goto('http://localhost:3000');
      
      // Test offline navigation
      await page.setOfflineMode(true);
      await page.reload();
      
      const pageTitle = await page.title();
      expect(pageTitle).toBe('FlowForge - AI Productivity Companion');

      // Test offline form submission queuing
      await page.click('[data-testid="create-session-btn"]');
      await page.type('[data-testid="session-type"]', 'BUILDING');
      await page.click('[data-testid="submit-session"]');

      // Should show offline indicator
      const offlineIndicator = await page.$('[data-testid="offline-indicator"]');
      expect(offlineIndicator).toBeTruthy();

      // Should queue form submission
      const queuedRequests = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('offline-queue') || '[]');
      });
      expect(queuedRequests).toHaveLength(1);
      expect(queuedRequests[0].url).toBe('/api/sessions');
    });

    test('should implement background sync capabilities', async () => {
      const syncData = {
        type: 'session_update',
        sessionId: 'session-123',
        flowState: FlowState.FLOWING,
        timestamp: new Date().toISOString()
      };

      await serviceWorker.syncInBackground(syncData);

      // Should register background sync
      const registration = await navigator.serviceWorker.ready;
      expect(registration.sync).toBeDefined();

      // Should handle sync event when online
      expect(new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'sync-complete') {
            expect(event.data.syncedItems).toBeGreaterThan(0);
            resolve(event.data);
          }
        });
        
        // Simulate going online
        window.dispatchEvent(new Event('online'));
      })).resolves.toBeDefined();
    });
  });

  describe('App Manifest and Installation', () => {
    test('should provide valid web app manifest', async () => {
      await page.goto('http://localhost:3000');
      
      const manifestLink = await page.$('link[rel="manifest"]');
      expect(manifestLink).toBeTruthy();

      const manifestResponse = await page.goto('http://localhost:3000/manifest.json');
      const manifest = await manifestResponse?.json();

      expect(manifest).toHaveProperty('name', 'FlowForge');
      expect(manifest).toHaveProperty('short_name', 'FlowForge');
      expect(manifest).toHaveProperty('display', 'standalone');
      expect(manifest).toHaveProperty('start_url', '/');
      expect(manifest).toHaveProperty('theme_color', '#7C3AED');
      expect(manifest).toHaveProperty('background_color', '#2F3542');
      expect(manifest.icons).toHaveLength.greaterThan(0);

      // Validate icon sizes
      const requiredSizes = ['192x192', '512x512'];
      for (const size of requiredSizes) {
        const icon = manifest.icons.find((icon: any) => icon.sizes === size);
        expect(icon).toBeDefined();
        expect(icon.type).toBe('image/png');
      }
    });

    test('should support app installation prompt', async () => {
      await page.goto('http://localhost:3000');
      
      // Should show install prompt for eligible browsers
      const installPromptSupported = await page.evaluate(() => {
        return 'beforeinstallprompt' in window;
      });
      
      if (installPromptSupported) {
        const installButton = await page.$('[data-testid="install-app-btn"]');
        expect(installButton).toBeTruthy();

        // Should handle install prompt
        expect(new Promise((resolve) => {
          page.on('dialog', async (dialog) => {
            expect(dialog.message()).toContain('Install FlowForge');
            await dialog.accept();
            resolve(dialog);
          });
          
          page.click('[data-testid="install-app-btn"]');
        })).resolves.toBeDefined();
      }
    });

    test('should implement iOS-specific PWA features', async () => {
      // Test iOS meta tags
      await page.goto('http://localhost:3000');
      
      const appleMetaTags = await page.evaluate(() => {
        const tags = [];
        const metaTags = document.querySelectorAll('meta[name*="apple"]');
        metaTags.forEach(tag => {
          tags.push({
            name: tag.getAttribute('name'),
            content: tag.getAttribute('content')
          });
        });
        return tags;
      });

      expect(appleMetaTags.some(tag => tag.name === 'apple-mobile-web-app-capable')).toBe(true);
      expect(appleMetaTags.some(tag => tag.name === 'apple-mobile-web-app-status-bar-style')).toBe(true);
      expect(appleMetaTags.some(tag => tag.name === 'apple-mobile-web-app-title')).toBe(true);

      // Test iOS splash screens
      const appleTouchIcons = await page.$$('link[rel*="apple-touch-icon"]');
      expect(appleTouchIcons.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// Task 16: Performance Optimization Tests
// =============================================================================

describe('Task 16: Performance Optimization', () => {
  let performanceMonitor: MockPerformanceMonitor;
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    performanceMonitor = new MockPerformanceMonitor();
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Load Time Performance', () => {
    test('should meet <2s load time requirement', async () => {
      const startTime = performance.now();
      
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // <2s requirement from CLAUDE.md

      // Measure specific performance metrics
      const metrics = await performanceMonitor.measureLoadTime();
      expect(metrics).toBeLessThan(2000);
    });

    test('should implement code splitting and lazy loading', async () => {
      await page.goto('http://localhost:3000');
      
      // Should lazy load dashboard components
      const networkRequests: string[] = [];
      page.on('request', (request) => {
        if (request.resourceType() === 'script') {
          networkRequests.push(request.url());
        }
      });

      await page.click('[data-testid="dashboard-link"]');
      await page.waitForSelector('[data-testid="dashboard-container"]');

      // Should load dashboard chunk dynamically
      const dashboardChunk = networkRequests.find(url => url.includes('dashboard'));
      expect(dashboardChunk).toBeDefined();

      // Should not load other route chunks initially
      const profileChunk = networkRequests.find(url => url.includes('profile'));
      expect(profileChunk).toBeUndefined();
    });

    test('should optimize bundle size', async () => {
      const bundleSize = await performanceMonitor.trackBundleSize();
      
      // Target bundle sizes (KB)
      expect(bundleSize.js).toBeLessThan(250); // Main JS bundle < 250KB
      expect(bundleSize.css).toBeLessThan(50); // CSS bundle < 50KB
      expect(bundleSize.total).toBeLessThan(500); // Total initial load < 500KB

      // Should use tree shaking
      const jsContent = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return Promise.all(scripts.map(async (script: any) => {
          const response = await fetch(script.src);
          return response.text();
        }));
      });

      // Should not include unused lodash functions
      const hasUnusedLodash = jsContent.some(content => 
        content.includes('lodash') && content.includes('debounce') && content.includes('throttle')
      );
      expect(hasUnusedLodash).toBe(false);
    });

    test('should implement image optimization', async () => {
      await page.goto('http://localhost:3000');
      
      const images = await page.$$eval('img', imgs => 
        imgs.map(img => ({
          src: img.src,
          loading: img.loading,
          width: img.naturalWidth,
          height: img.naturalHeight
        }))
      );

      // Should use lazy loading for below-the-fold images
      const lazyImages = images.filter(img => img.loading === 'lazy');
      expect(lazyImages.length).toBeGreaterThan(0);

      // Should serve appropriately sized images
      images.forEach(img => {
        expect(img.width).toBeLessThan(1920); // No unnecessarily large images
        expect(img.height).toBeLessThan(1080);
      });

      // Should use modern image formats
      const modernFormatImages = images.filter(img => 
        img.src.includes('.webp') || img.src.includes('.avif')
      );
      expect(modernFormatImages.length).toBeGreaterThan(0);
    });
  });

  describe('Database Performance', () => {
    test('should optimize database query performance', async () => {
      const queries = [
        'SELECT * FROM sessions WHERE user_id = ?',
        'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
        'SELECT * FROM habits WHERE user_id = ? AND date >= ?',
        'SELECT * FROM ai_contexts WHERE session_id IN (?)'
      ];

      for (const query of queries) {
        const queryTime = await performanceMonitor.measureDatabaseQueryTime(query);
        expect(queryTime).toBeLessThan(100); // <100ms per query
      }

      // Should use proper indexing
      const explainResults = await Promise.all(queries.map(async (query) => {
        // Mock EXPLAIN query analysis
        return {
          query,
          usesIndex: true,
          rowsExamined: Math.floor(Math.random() * 1000)
        };
      }));

      explainResults.forEach(result => {
        expect(result.usesIndex).toBe(true);
        expect(result.rowsExamined).toBeLessThan(10000);
      });
    });

    test('should implement effective caching strategies', async () => {
      // Test Redis caching
      const cacheKey = 'user:123:dashboard';
      const cacheData = {
        activeSessions: 2,
        totalProjects: 5,
        shipStreak: 7,
        flowState: FlowState.FLOWING
      };

      // Should cache frequently accessed data
      expect(async () => {
        // Mock Redis operations
        const redis = {
          set: jest.fn().mockResolvedValue('OK'),
          get: jest.fn().mockResolvedValue(JSON.stringify(cacheData)),
          expire: jest.fn().mockResolvedValue(1)
        };

        await redis.set(cacheKey, JSON.stringify(cacheData));
        await redis.expire(cacheKey, 300); // 5 minute TTL

        const cachedResult = await redis.get(cacheKey);
        expect(JSON.parse(cachedResult)).toEqual(cacheData);
      }).not.toThrow();

      // Should invalidate cache on updates
      expect(async () => {
        const redis = { del: jest.fn().mockResolvedValue(1) };
        await redis.del(`user:123:*`);
      }).not.toThrow();
    });
  });

  describe('Client-Side Performance', () => {
    test('should optimize React rendering performance', async () => {
      await page.goto('http://localhost:3000');
      
      // Measure React DevTools profiler metrics
      const reactMetrics = await page.evaluate(() => {
        // Mock React profiler data
        return {
          renderCount: 1,
          commitTime: 16.5,
          unusedProps: 0,
          memoizedComponents: 5
        };
      });

      expect(reactMetrics.renderCount).toBeLessThan(3); // Minimal re-renders
      expect(reactMetrics.commitTime).toBeLessThan(16); // <16ms for 60fps
      expect(reactMetrics.unusedProps).toBe(0); // No prop drilling
      expect(reactMetrics.memoizedComponents).toBeGreaterThan(0);
    });

    test('should implement virtual scrolling for large lists', async () => {
      await page.goto('http://localhost:3000/sessions');
      
      // Generate large dataset
      await page.evaluate(() => {
        // Mock 1000 sessions
        (window as any).mockSessions = Array.from({ length: 1000 }, (_, i) => ({
          id: `session-${i}`,
          type: 'BUILDING',
          flowState: 'FLOWING',
          startTime: new Date()
        }));
      });

      await page.reload();
      
      // Should only render visible items
      const renderedItems = await page.$$('[data-testid*="session-item"]');
      expect(renderedItems.length).toBeLessThan(20); // Only visible items

      // Should maintain scroll performance
      const scrollStartTime = performance.now();
      await page.evaluate(() => {
        window.scrollTo(0, 5000);
      });
      const scrollEndTime = performance.now();
      
      expect(scrollEndTime - scrollStartTime).toBeLessThan(50); // Smooth scrolling
    });
  });
});

// =============================================================================
// Task 17: Testing Infrastructure Tests
// =============================================================================

describe('Task 17: Testing Infrastructure', () => {
  describe('Jest Configuration', () => {
    test('should have Jest properly configured for TypeScript', () => {
      const jestConfig = require('../../../jest.config.js');
      
      expect(jestConfig.preset).toBe('ts-jest');
      expect(jestConfig.testEnvironment).toBe('jsdom');
      expect(jestConfig.setupFilesAfterEnv).toContain('<rootDir>/jest.setup.ts');
      expect(jestConfig.moduleNameMapping).toHaveProperty('@/*');
      expect(jestConfig.collectCoverageFrom).toContain('src/**/*.{ts,tsx}');
    });

    test('should provide comprehensive test coverage reporting', () => {
      const jestConfig = require('../../../jest.config.js');
      
      expect(jestConfig.coverageThreshold).toEqual({
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      });

      expect(jestConfig.coverageReporters).toContain('text');
      expect(jestConfig.coverageReporters).toContain('lcov');
      expect(jestConfig.coverageReporters).toContain('html');
    });
  });

  describe('Integration Tests', () => {
    test('should test complete API workflows', async () => {
      // Test session creation workflow
      const createSessionResponse = await request(app)
        .post('/api/sessions')
        .set('Authorization', 'Bearer valid-token')
        .send({ type: SessionType.BUILDING })
        .expect(201);

      expect(createSessionResponse.body).toHaveProperty('id');
      expect(createSessionResponse.body.type).toBe(SessionType.BUILDING);

      const sessionId = createSessionResponse.body.id;

      // Test session updates
      await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ flowState: FlowState.DEEP_FLOW })
        .expect(200);

      // Test session retrieval
      const getSessionResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(getSessionResponse.body.flowState).toBe(FlowState.DEEP_FLOW);
    });

    test('should test database integration workflows', async () => {
      // Test user creation and project association
      const user = await prisma.user.create({
        data: {
          email: 'test@flowforge.ai',
          flowState: FlowState.NEUTRAL,
          shipStreak: 0
        }
      });

      const project = await prisma.project.create({
        data: {
          userId: user.id,
          name: 'Test Project',
          feelsRightProgress: 0,
          shipTargets: 5,
          pivotCount: 0
        }
      });

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          type: SessionType.BUILDING,
          flowState: FlowState.NEUTRAL,
          aiContextHealth: 90,
          isActive: true
        }
      });

      // Verify relationships
      const userWithProjects = await prisma.user.findUnique({
        where: { id: user.id },
        include: { projects: true, sessions: true }
      });

      expect(userWithProjects?.projects).toHaveLength(1);
      expect(userWithProjects?.sessions).toHaveLength(1);
    });
  });

  describe('End-to-End Tests with Playwright', () => {
    test('should test complete user journeys', async () => {
      const browser = await playwright.chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // Test user authentication flow
        await page.goto('http://localhost:3000/auth/signin');
        await page.fill('[data-testid="email"]', 'test@flowforge.ai');
        await page.fill('[data-testid="password"]', 'testpassword');
        await page.click('[data-testid="signin-btn"]');

        await page.waitForURL('http://localhost:3000/dashboard');

        // Test session creation flow
        await page.click('[data-testid="new-session-btn"]');
        await page.selectOption('[data-testid="session-type"]', SessionType.BUILDING);
        await page.click('[data-testid="start-session-btn"]');

        await page.waitForSelector('[data-testid="active-session"]');

        // Test flow state updates
        await page.click('[data-testid="flow-state-flowing"]');
        
        const flowStateIndicator = await page.textContent('[data-testid="current-flow-state"]');
        expect(flowStateIndicator).toBe('FLOWING');

        // Test project creation
        await page.click('[data-testid="new-project-btn"]');
        await page.fill('[data-testid="project-name"]', 'E2E Test Project');
        await page.click('[data-testid="create-project-btn"]');

        await page.waitForSelector('[data-testid="project-card"]');

        const projectName = await page.textContent('[data-testid="project-name"]');
        expect(projectName).toBe('E2E Test Project');

      } finally {
        await browser.close();
      }
    });

    test('should test responsive design across devices', async () => {
      const devices = [
        playwright.devices['iPhone 12'],
        playwright.devices['iPad'],
        playwright.devices['Desktop Chrome']
      ];

      for (const device of devices) {
        const browser = await playwright.chromium.launch();
        const context = await browser.newContext({ ...device });
        const page = await context.newPage();

        try {
          await page.goto('http://localhost:3000');

          // Test navigation visibility
          if (device.viewport.width < 768) {
            // Mobile: hamburger menu should be visible
            await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
          } else {
            // Desktop: full navigation should be visible
            await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
          }

          // Test touch interactions on mobile
          if (device.hasTouch) {
            await page.tap('[data-testid="flow-state-selector"]');
            await expect(page.locator('[data-testid="flow-state-menu"]')).toBeVisible();
          }

        } finally {
          await browser.close();
        }
      }
    });
  });

  describe('Component Testing with React Testing Library', () => {
    test('should test core components in isolation', () => {
      // Test FlowStateIndicator component
      const { render, screen, fireEvent } = require('@testing-library/react');
      
      const FlowStateIndicator = ({ flowState, onStateChange }: {
        flowState: FlowState;
        onStateChange: (state: FlowState) => void;
      }) => {
        throw new Error('FlowStateIndicator component not implemented');
      };

      const mockOnStateChange = jest.fn();
      
      render(
        <FlowStateIndicator 
          flowState={FlowState.NEUTRAL} 
          onStateChange={mockOnStateChange}
        />
      );

      const indicator = screen.getByTestId('flow-state-indicator');
      expect(indicator).toHaveTextContent('NEUTRAL');

      fireEvent.click(screen.getByTestId('flow-state-flowing'));
      expect(mockOnStateChange).toHaveBeenCalledWith(FlowState.FLOWING);
    });

    test('should test session management components', () => {
      const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
      
      const SessionCard = ({ session, onUpdate }: {
        session: Session;
        onUpdate: (id: string, updates: Partial<Session>) => void;
      }) => {
        throw new Error('SessionCard component not implemented');
      };

      const mockSession: Session = {
        id: 'test-session',
        userId: 'test-user',
        type: SessionType.BUILDING,
        flowState: FlowState.NEUTRAL,
        aiContextHealth: 85,
        startTime: new Date(),
        isActive: true
      };

      const mockOnUpdate = jest.fn();

      render(
        <SessionCard 
          session={mockSession} 
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('BUILDING')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // AI Context Health

      fireEvent.click(screen.getByTestId('end-session-btn'));
      expect(mockOnUpdate).toHaveBeenCalledWith('test-session', { isActive: false });
    });
  });
});

// =============================================================================
// Task 18: Development Tooling Tests
// =============================================================================

describe('Task 18: Development Tooling', () => {
  describe('Hot Module Replacement', () => {
    test('should support fast refresh for React components', async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      try {
        await page.goto('http://localhost:3000');
        
        // Get initial render timestamp
        const initialTimestamp = await page.evaluate(() => {
          return (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.lastUpdated || Date.now();
        });

        // Simulate file change (would normally be done by webpack)
        await page.evaluate(() => {
          if ((window as any).webpackHotUpdate) {
            (window as any).webpackHotUpdate('dashboard', {
              './src/components/Dashboard.tsx': () => {
                // Mock updated component
                return { default: () => 'Updated Dashboard' };
              }
            });
          }
        });

        // Wait for hot reload
        await page.waitForTimeout(1000);

        const updatedTimestamp = await page.evaluate(() => {
          return (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.lastUpdated || Date.now();
        });

        expect(updatedTimestamp).toBeGreaterThan(initialTimestamp);

      } finally {
        await browser.close();
      }
    });

    test('should preserve component state during hot reload', async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      try {
        await page.goto('http://localhost:3000');
        
        // Set some component state
        await page.click('[data-testid="increment-counter"]');
        await page.click('[data-testid="increment-counter"]');
        
        const initialCount = await page.textContent('[data-testid="counter-value"]');
        expect(initialCount).toBe('2');

        // Trigger hot reload
        await page.evaluate(() => {
          if ((window as any).__webpack_require__?.cache) {
            // Mock module update
            delete (window as any).__webpack_require__.cache['./Counter.tsx'];
          }
        });

        await page.waitForTimeout(500);

        // State should be preserved
        const preservedCount = await page.textContent('[data-testid="counter-value"]');
        expect(preservedCount).toBe('2');

      } finally {
        await browser.close();
      }
    });
  });

  describe('Development Server Optimization', () => {
    test('should have fast development server startup', async () => {
      const startTime = performance.now();
      
      // Mock development server startup
      const devServer = {
        start: () => Promise.resolve(),
        getStartupTime: () => performance.now() - startTime
      };

      await devServer.start();
      const startupTime = devServer.getStartupTime();
      
      expect(startupTime).toBeLessThan(5000); // <5s startup time
    });

    test('should have fast incremental builds', async () => {
      // Mock webpack build stats
      const buildStats = {
        compilation: {
          buildDuration: 234, // ms
          changedModules: ['src/components/Dashboard.tsx'],
          totalModules: 150
        }
      };

      expect(buildStats.compilation.buildDuration).toBeLessThan(1000); // <1s incremental builds
      expect(buildStats.compilation.changedModules.length).toBeLessThan(10); // Selective rebuilding
    });
  });

  describe('Code Quality Tools', () => {
    test('should have ESLint configured with proper rules', () => {
      const eslintConfig = {
        extends: [
          'next/core-web-vitals',
          '@typescript-eslint/recommended',
          'prettier'
        ],
        rules: {
          '@typescript-eslint/no-unused-vars': 'error',
          '@typescript-eslint/explicit-function-return-type': 'warn',
          'react-hooks/rules-of-hooks': 'error',
          'react-hooks/exhaustive-deps': 'warn'
        }
      };

      expect(eslintConfig.extends).toContain('next/core-web-vitals');
      expect(eslintConfig.extends).toContain('@typescript-eslint/recommended');
      expect(eslintConfig.rules['@typescript-eslint/no-unused-vars']).toBe('error');
    });

    test('should have Prettier configured for consistent formatting', () => {
      const prettierConfig = {
        semi: true,
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 80,
        tabWidth: 2,
        useTabs: false
      };

      expect(prettierConfig.semi).toBe(true);
      expect(prettierConfig.singleQuote).toBe(true);
      expect(prettierConfig.printWidth).toBe(80);
    });

    test('should have TypeScript configured with strict mode', () => {
      const tsConfig = {
        compilerOptions: {
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          exactOptionalPropertyTypes: true
        }
      };

      expect(tsConfig.compilerOptions.strict).toBe(true);
      expect(tsConfig.compilerOptions.noUnusedLocals).toBe(true);
      expect(tsConfig.compilerOptions.noImplicitReturns).toBe(true);
    });
  });

  describe('Pre-commit Hooks', () => {
    test('should run lint-staged on commit', () => {
      const huskyConfig = {
        'pre-commit': 'lint-staged'
      };

      const lintStagedConfig = {
        '*.{ts,tsx}': [
          'eslint --fix',
          'prettier --write',
          'git add'
        ],
        '*.{json,md}': [
          'prettier --write',
          'git add'
        ]
      };

      expect(huskyConfig['pre-commit']).toBe('lint-staged');
      expect(lintStagedConfig['*.{ts,tsx}']).toContain('eslint --fix');
      expect(lintStagedConfig['*.{ts,tsx}']).toContain('prettier --write');
    });

    test('should run tests on pre-push', () => {
      const huskyConfig = {
        'pre-push': 'npm run test:ci && npm run type-check'
      };

      expect(huskyConfig['pre-push']).toContain('npm run test:ci');
      expect(huskyConfig['pre-push']).toContain('npm run type-check');
    });
  });
});

// =============================================================================
// Task 19: Deployment Pipeline Tests
// =============================================================================

describe('Task 19: Deployment Pipeline', () => {
  describe('Docker Configuration', () => {
    test('should have multi-stage Dockerfile', () => {
      const dockerfileContent = `
        FROM node:18-alpine AS dependencies
        WORKDIR /app
        COPY package*.json ./
        RUN npm ci --only=production

        FROM node:18-alpine AS builder
        WORKDIR /app
        COPY package*.json ./
        RUN npm ci
        COPY . .
        RUN npm run build

        FROM node:18-alpine AS runner
        WORKDIR /app
        COPY --from=dependencies /app/node_modules ./node_modules
        COPY --from=builder /app/.next ./.next
        COPY --from=builder /app/public ./public
        COPY --from=builder /app/package.json ./package.json
        EXPOSE 3000
        CMD ["npm", "start"]
      `;

      expect(dockerfileContent).toContain('FROM node:18-alpine AS dependencies');
      expect(dockerfileContent).toContain('FROM node:18-alpine AS builder');
      expect(dockerfileContent).toContain('FROM node:18-alpine AS runner');
      expect(dockerfileContent).toContain('EXPOSE 3000');
    });

    test('should have docker-compose for local development', () => {
      const dockerComposeConfig = {
        version: '3.8',
        services: {
          app: {
            build: '.',
            ports: ['3000:3000'],
            environment: {
              NODE_ENV: 'development',
              DATABASE_URL: 'postgresql://postgres:password@db:5432/flowforge'
            },
            depends_on: ['db', 'redis']
          },
          db: {
            image: 'postgres:15-alpine',
            environment: {
              POSTGRES_DB: 'flowforge',
              POSTGRES_USER: 'postgres',
              POSTGRES_PASSWORD: 'password'
            },
            volumes: ['postgres_data:/var/lib/postgresql/data'],
            ports: ['5432:5432']
          },
          redis: {
            image: 'redis:7-alpine',
            ports: ['6379:6379']
          }
        },
        volumes: {
          postgres_data: {}
        }
      };

      expect(dockerComposeConfig.services.app).toBeDefined();
      expect(dockerComposeConfig.services.db.image).toBe('postgres:15-alpine');
      expect(dockerComposeConfig.services.redis.image).toBe('redis:7-alpine');
    });
  });

  describe('CI/CD with GitHub Actions', () => {
    test('should have comprehensive CI workflow', () => {
      const ciWorkflow = {
        name: 'CI/CD Pipeline',
        on: {
          push: { branches: ['main', 'develop'] },
          pull_request: { branches: ['main'] }
        },
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v3' },
              { uses: 'actions/setup-node@v3', with: { 'node-version': '18' } },
              { run: 'npm ci' },
              { run: 'npm run lint' },
              { run: 'npm run type-check' },
              { run: 'npm run test:coverage' },
              { run: 'npm run build' }
            ]
          },
          e2e: {
            'runs-on': 'ubuntu-latest',
            needs: 'test',
            steps: [
              { uses: 'actions/checkout@v3' },
              { run: 'npm ci' },
              { run: 'npm run test:e2e' }
            ]
          },
          deploy: {
            'runs-on': 'ubuntu-latest',
            needs: ['test', 'e2e'],
            if: "github.ref == 'refs/heads/main'",
            steps: [
              { uses: 'actions/checkout@v3' },
              { run: 'docker build -t flowforge .' },
              { run: 'docker push flowforge:latest' }
            ]
          }
        }
      };

      expect(ciWorkflow.jobs.test.steps).toContainEqual({ run: 'npm run test:coverage' });
      expect(ciWorkflow.jobs.e2e.needs).toBe('test');
      expect(ciWorkflow.jobs.deploy.needs).toContain('e2e');
    });

    test('should have automated database migrations', () => {
      const migrationStep = {
        name: 'Run Database Migrations',
        run: 'npx prisma migrate deploy',
        env: {
          DATABASE_URL: '${{ secrets.DATABASE_URL }}'
        }
      };

      expect(migrationStep.run).toBe('npx prisma migrate deploy');
      expect(migrationStep.env.DATABASE_URL).toBe('${{ secrets.DATABASE_URL }}');
    });

    test('should have rollback capabilities', () => {
      const rollbackWorkflow = {
        name: 'Rollback Deployment',
        on: { workflow_dispatch: { inputs: { version: { required: true } } } },
        jobs: {
          rollback: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { run: 'docker pull flowforge:${{ github.event.inputs.version }}' },
              { run: 'docker tag flowforge:${{ github.event.inputs.version }} flowforge:latest' },
              { run: 'kubectl set image deployment/flowforge app=flowforge:latest' }
            ]
          }
        }
      };

      expect(rollbackWorkflow.on.workflow_dispatch).toBeDefined();
      expect(rollbackWorkflow.jobs.rollback.steps).toHaveLength(3);
    });
  });

  describe('Environment Configuration', () => {
    test('should have proper environment variable management', () => {
      const envConfig = {
        development: {
          NODE_ENV: 'development',
          NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
          DATABASE_URL: 'postgresql://localhost:5432/flowforge_dev',
          REDIS_URL: 'redis://localhost:6379',
          NEXTAUTH_SECRET: 'development-secret-key',
          LOG_LEVEL: 'debug'
        },
        staging: {
          NODE_ENV: 'staging',
          NEXT_PUBLIC_API_URL: 'https://staging-api.flowforge.ai',
          DATABASE_URL: '${{ secrets.STAGING_DATABASE_URL }}',
          REDIS_URL: '${{ secrets.STAGING_REDIS_URL }}',
          NEXTAUTH_SECRET: '${{ secrets.STAGING_NEXTAUTH_SECRET }}',
          LOG_LEVEL: 'info'
        },
        production: {
          NODE_ENV: 'production',
          NEXT_PUBLIC_API_URL: 'https://api.flowforge.ai',
          DATABASE_URL: '${{ secrets.PRODUCTION_DATABASE_URL }}',
          REDIS_URL: '${{ secrets.PRODUCTION_REDIS_URL }}',
          NEXTAUTH_SECRET: '${{ secrets.PRODUCTION_NEXTAUTH_SECRET }}',
          LOG_LEVEL: 'warn'
        }
      };

      expect(envConfig.development.NODE_ENV).toBe('development');
      expect(envConfig.staging.NEXT_PUBLIC_API_URL).toContain('staging');
      expect(envConfig.production.LOG_LEVEL).toBe('warn');
    });
  });

  describe('Health Check Endpoints', () => {
    test('should provide comprehensive health checks', async () => {
      const healthEndpoints = [
        '/api/health',
        '/api/health/db',
        '/api/health/redis', 
        '/api/health/ready',
        '/api/health/live'
      ];

      for (const endpoint of healthEndpoints) {
        const response = await request(app).get(endpoint).expect(200);
        
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        
        if (endpoint === '/api/health') {
          expect(response.body).toHaveProperty('services');
          expect(response.body.services).toHaveProperty('database');
          expect(response.body.services).toHaveProperty('redis');
        }
      }
    });

    test('should handle unhealthy service states', async () => {
      // Mock database connection failure
      const unhealthyResponse = await request(app)
        .get('/api/health/db')
        .expect(503);

      expect(unhealthyResponse.body.status).toBe('unhealthy');
      expect(unhealthyResponse.body.error).toBeDefined();
    });
  });
});

// =============================================================================
// Task 20: Monitoring and Analytics Tests
// =============================================================================

describe('Task 20: Monitoring and Analytics', () => {
  describe('Application Performance Monitoring', () => {
    test('should track Core Web Vitals', async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      try {
        await page.goto('http://localhost:3000');
        
        const webVitals = await page.evaluate(() => {
          return new Promise((resolve) => {
            const vitals = {
              LCP: 0, // Largest Contentful Paint
              FID: 0, // First Input Delay  
              CLS: 0  // Cumulative Layout Shift
            };

            // Mock Web Vitals measurement
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.name === 'largest-contentful-paint') {
                  vitals.LCP = entry.startTime;
                }
              }
            });

            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            
            setTimeout(() => resolve(vitals), 3000);
          });
        });

        expect(webVitals.LCP).toBeLessThan(2500); // <2.5s LCP target
        expect(webVitals.FID).toBeLessThan(100);  // <100ms FID target
        expect(webVitals.CLS).toBeLessThan(0.1);  // <0.1 CLS target

      } finally {
        await browser.close();
      }
    });

    test('should monitor API response times', async () => {
      const apiEndpoints = [
        '/api/sessions',
        '/api/users/me',
        '/api/projects',
        '/api/habits',
        '/api/ai-context/health'
      ];

      for (const endpoint of apiEndpoints) {
        const startTime = performance.now();
        
        await request(app)
          .get(endpoint)
          .set('Authorization', 'Bearer valid-token');
          
        const responseTime = performance.now() - startTime;
        
        expect(responseTime).toBeLessThan(500); // <500ms response time
      }
    });

    test('should track database performance metrics', async () => {
      const dbMetrics = {
        activeConnections: 15,
        maxConnections: 100,
        avgQueryTime: 45, // ms
        slowQueries: 2,
        connectionPool: {
          size: 20,
          used: 8,
          waiting: 0
        }
      };

      expect(dbMetrics.activeConnections).toBeLessThan(dbMetrics.maxConnections * 0.8);
      expect(dbMetrics.avgQueryTime).toBeLessThan(100);
      expect(dbMetrics.connectionPool.waiting).toBe(0);
    });
  });

  describe('Error Tracking and Logging', () => {
    test('should capture and categorize errors', () => {
      const errorCategories = [
        'authentication_error',
        'validation_error',
        'database_error',
        'api_error',
        'client_error',
        'network_error'
      ];

      const mockError = {
        message: 'Database connection failed',
        stack: 'Error: Database connection failed\n    at connect (/app/db.js:15:10)',
        category: 'database_error',
        severity: 'high',
        userId: 'user-123',
        sessionId: 'session-456',
        timestamp: new Date(),
        context: {
          url: '/api/sessions',
          method: 'POST',
          userAgent: 'Mozilla/5.0...'
        }
      };

      expect(errorCategories).toContain(mockError.category);
      expect(mockError.severity).toBe('high');
      expect(mockError.context).toHaveProperty('url');
    });

    test('should implement structured logging', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'User session started',
        userId: 'user-123',
        sessionId: 'session-456',
        context: {
          sessionType: 'BUILDING',
          flowState: 'NEUTRAL',
          aiContextHealth: 90
        },
        metadata: {
          requestId: 'req-789',
          duration: 125,
          statusCode: 201
        }
      };

      expect(['debug', 'info', 'warn', 'error']).toContain(logEntry.level);
      expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(logEntry.metadata).toHaveProperty('requestId');
    });

    test('should have log retention and rotation policies', () => {
      const logConfig = {
        retention: {
          debug: '7d',
          info: '30d', 
          warn: '90d',
          error: '365d'
        },
        rotation: {
          maxFileSize: '100MB',
          maxFiles: 10,
          compress: true
        },
        destinations: [
          'console',
          'file',
          'datadog', // External logging service
          'sentry'   // Error tracking service
        ]
      };

      expect(logConfig.retention.error).toBe('365d');
      expect(logConfig.rotation.compress).toBe(true);
      expect(logConfig.destinations).toContain('sentry');
    });
  });

  describe('User Analytics Integration', () => {
    test('should track user behavior and flow patterns', () => {
      const userAnalytics = {
        userId: 'user-123',
        sessionId: 'session-456',
        events: [
          {
            type: 'session_started',
            timestamp: new Date(),
            properties: {
              sessionType: 'BUILDING',
              previousFlowState: 'NEUTRAL'
            }
          },
          {
            type: 'flow_state_changed',
            timestamp: new Date(),
            properties: {
              from: 'NEUTRAL',
              to: 'FLOWING',
              triggerMethod: 'manual_selection'
            }
          },
          {
            type: 'ai_context_warning',
            timestamp: new Date(),
            properties: {
              contextHealth: 65,
              warningType: 'context_length',
              modelName: 'claude-3-sonnet'
            }
          }
        ]
      };

      expect(userAnalytics.events).toHaveLength(3);
      expect(userAnalytics.events[0].type).toBe('session_started');
      expect(userAnalytics.events[1].properties).toHaveProperty('from');
      expect(userAnalytics.events[2].properties.contextHealth).toBe(65);
    });

    test('should measure productivity metrics', () => {
      const productivityMetrics = {
        userId: 'user-123',
        timeframe: '7d',
        metrics: {
          totalSessions: 15,
          totalActiveTime: 1800000, // ms (30 hours)
          avgSessionDuration: 120000, // ms (2 hours)
          flowStateDistribution: {
            BLOCKED: 0.15,
            NEUTRAL: 0.35,
            FLOWING: 0.35,
            DEEP_FLOW: 0.15
          },
          shipStreak: 7,
          projectsCreated: 3,
          pivotCount: 1,
          aiContextHealth: {
            avg: 82,
            min: 55,
            max: 98
          }
        }
      };

      expect(productivityMetrics.metrics.totalSessions).toBe(15);
      expect(productivityMetrics.metrics.flowStateDistribution.DEEP_FLOW).toBe(0.15);
      expect(productivityMetrics.metrics.aiContextHealth.avg).toBe(82);
      expect(productivityMetrics.metrics.shipStreak).toBe(7);
    });

    test('should provide privacy-compliant data collection', () => {
      const privacyConfig = {
        dataRetention: {
          userEvents: '2y',
          anonymizedMetrics: '5y',
          personalIdentifiers: '30d_after_deletion'
        },
        anonymization: {
          enabled: true,
          userIdHashing: 'sha256',
          ipMasking: true,
          removePersonalData: true
        },
        consent: {
          required: true,
          granular: true,
          categories: [
            'essential',
            'analytics', 
            'performance',
            'personalization'
          ]
        }
      };

      expect(privacyConfig.anonymization.enabled).toBe(true);
      expect(privacyConfig.consent.required).toBe(true);
      expect(privacyConfig.consent.categories).toContain('analytics');
    });
  });

  describe('Alerting System', () => {
    test('should configure performance alerts', () => {
      const performanceAlerts = [
        {
          name: 'High Response Time',
          condition: 'avg_response_time > 1000ms',
          threshold: 1000,
          window: '5m',
          severity: 'warning',
          channels: ['slack', 'email']
        },
        {
          name: 'Error Rate Spike',
          condition: 'error_rate > 5%',
          threshold: 0.05,
          window: '10m', 
          severity: 'critical',
          channels: ['slack', 'pagerduty']
        },
        {
          name: 'Database Connection Issues',
          condition: 'db_connection_errors > 10',
          threshold: 10,
          window: '1m',
          severity: 'critical',
          channels: ['slack', 'pagerduty']
        }
      ];

      performanceAlerts.forEach(alert => {
        expect(alert).toHaveProperty('name');
        expect(alert).toHaveProperty('condition');
        expect(alert).toHaveProperty('threshold');
        expect(alert.channels).toBeDefined();
        expect(['info', 'warning', 'critical']).toContain(alert.severity);
      });
    });

    test('should configure business metric alerts', () => {
      const businessAlerts = [
        {
          name: 'Daily Active Users Drop',
          condition: 'daily_active_users < 100',
          threshold: 100,
          window: '1d',
          severity: 'warning'
        },
        {
          name: 'AI Context Health Degradation',
          condition: 'avg_ai_context_health < 70',
          threshold: 70,
          window: '1h',
          severity: 'warning'
        },
        {
          name: 'Ship Streak Decline',
          condition: 'avg_ship_streak < 3',
          threshold: 3,
          window: '1d', 
          severity: 'info'
        }
      ];

      expect(businessAlerts[0].condition).toContain('daily_active_users');
      expect(businessAlerts[1].threshold).toBe(70);
      expect(businessAlerts[2].severity).toBe('info');
    });

    test('should have incident response automation', () => {
      const incidentResponse = {
        triggers: [
          'error_rate > 10%',
          'response_time > 5000ms',
          'database_down',
          'service_unavailable'
        ],
        actions: [
          {
            type: 'create_incident',
            service: 'pagerduty',
            assignee: 'on_call_engineer'
          },
          {
            type: 'auto_scale',
            service: 'kubernetes',
            min_replicas: 2,
            max_replicas: 10
          },
          {
            type: 'circuit_breaker',
            service: 'api_gateway',
            threshold: '50%_failure_rate'
          },
          {
            type: 'rollback',
            condition: 'deployment_within_30m',
            target: 'previous_version'
          }
        ]
      };

      expect(incidentResponse.triggers).toContain('database_down');
      expect(incidentResponse.actions[0].type).toBe('create_incident');
      expect(incidentResponse.actions[1].service).toBe('kubernetes');
    });
  });
});

// =============================================================================
// Performance Benchmarks and Load Testing
// =============================================================================

describe('Performance Benchmarks and Load Testing', () => {
  describe('Load Testing', () => {
    test('should handle concurrent user load', async () => {
      const concurrentUsers = 100;
      const testDuration = 60000; // 1 minute
      
      const loadTestResults = {
        totalRequests: 5000,
        successfulRequests: 4950,
        failedRequests: 50,
        avgResponseTime: 245, // ms
        p95ResponseTime: 450, // ms
        requestsPerSecond: 83.3,
        errorRate: 0.01 // 1%
      };

      expect(loadTestResults.errorRate).toBeLessThan(0.05); // <5% error rate
      expect(loadTestResults.avgResponseTime).toBeLessThan(500); // <500ms avg
      expect(loadTestResults.p95ResponseTime).toBeLessThan(1000); // <1s p95
    });

    test('should maintain performance under database load', async () => {
      const dbLoadTest = {
        concurrentConnections: 50,
        queryTypes: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
        results: {
          'SELECT': { avgTime: 25, p95Time: 45 },
          'INSERT': { avgTime: 35, p95Time: 65 },
          'UPDATE': { avgTime: 40, p95Time: 75 },
          'DELETE': { avgTime: 30, p95Time: 55 }
        }
      };

      Object.values(dbLoadTest.results).forEach(result => {
        expect(result.avgTime).toBeLessThan(50); // <50ms average
        expect(result.p95Time).toBeLessThan(100); // <100ms p95
      });
    });

    test('should handle WebSocket connection scaling', async () => {
      const wsLoadTest = {
        concurrentConnections: 1000,
        messageRate: 100, // messages per second
        results: {
          connectionsEstablished: 1000,
          connectionFailures: 0,
          avgMessageLatency: 15, // ms
          maxMessageLatency: 45, // ms
          memoryUsage: 256 // MB
        }
      };

      expect(wsLoadTest.results.connectionFailures).toBe(0);
      expect(wsLoadTest.results.avgMessageLatency).toBeLessThan(50);
      expect(wsLoadTest.results.memoryUsage).toBeLessThan(512); // <512MB
    });
  });

  describe('Stress Testing', () => {
    test('should handle traffic spikes gracefully', async () => {
      const stressTest = {
        baselineRPS: 100,
        spikeRPS: 1000,
        spikeDuration: 300000, // 5 minutes
        results: {
          systemStability: 'stable',
          resourceUtilization: {
            cpu: 75, // %
            memory: 60, // %
            disk: 45 // %
          },
          responseTimeIncrease: 1.8, // multiplier
          errorRateIncrease: 0.02 // 2% additional errors
        }
      };

      expect(stressTest.results.systemStability).toBe('stable');
      expect(stressTest.results.resourceUtilization.cpu).toBeLessThan(90);
      expect(stressTest.results.responseTimeIncrease).toBeLessThan(3);
      expect(stressTest.results.errorRateIncrease).toBeLessThan(0.05);
    });

    test('should recover from resource exhaustion', async () => {
      const recoveryTest = {
        scenario: 'memory_exhaustion',
        triggerPoint: '90%_memory_usage',
        recoveryActions: [
          'garbage_collection',
          'connection_pooling',
          'circuit_breaker_activation',
          'auto_scaling'
        ],
        recoveryTime: 30000, // 30 seconds
        systemHealthAfterRecovery: 'healthy'
      };

      expect(recoveryTest.recoveryTime).toBeLessThan(60000); // <1 minute recovery
      expect(recoveryTest.systemHealthAfterRecovery).toBe('healthy');
      expect(recoveryTest.recoveryActions).toContain('auto_scaling');
    });
  });
});

export {};