import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

/**
 * Phase 2 PWA Native Features Tests
 * 
 * These tests define the expected functionality for Tasks 25-28:
 * - Task 25: Push Notifications System
 * - Task 26: Background Sync & Offline Support
 * - Task 27: App Installation & Manifest
 * - Task 28: IndexedDB Local Storage
 * 
 * All tests are designed to FAIL initially to follow TDD approach.
 */

describe('Phase 2 PWA Native Features', () => {
  
  // Mock types for PWA APIs
  interface MockServiceWorkerRegistration {
    showNotification: jest.Mock;
    update: jest.Mock;
    unregister: jest.Mock;
    pushManager: {
      subscribe: jest.Mock;
      getSubscription: jest.Mock;
    };
    sync: {
      register: jest.Mock;
    };
    active: {
      postMessage: jest.Mock;
    } | null;
  }

  interface MockNotification {
    requestPermission: jest.Mock;
    permission: 'default' | 'granted' | 'denied';
  }

  interface MockBeforeInstallPromptEvent extends Event {
    prompt: jest.Mock;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  // Global mocks
  const mockServiceWorkerRegistration: MockServiceWorkerRegistration = {
    showNotification: jest.fn(),
    update: jest.fn(),
    unregister: jest.fn(),
    pushManager: {
      subscribe: jest.fn(),
      getSubscription: jest.fn(),
    },
    sync: {
      register: jest.fn(),
    },
    active: {
      postMessage: jest.fn(),
    },
  };

  const mockNotification: MockNotification = {
    requestPermission: jest.fn(),
    permission: 'default',
  };

  // Mock IndexedDB
  const mockIDBDatabase = {
    transaction: jest.fn(),
    close: jest.fn(),
    createObjectStore: jest.fn(),
  };

  const mockIDBTransaction = {
    objectStore: jest.fn(),
    oncomplete: null,
    onerror: null,
  };

  const mockIDBObjectStore = {
    add: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getAll: jest.fn(),
    createIndex: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset notification permission
    mockNotification.permission = 'default';
    // Reset online status
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          register: jest.fn(),
          ready: Promise.resolve(mockServiceWorkerRegistration),
          controller: null,
          addEventListener: jest.fn(),
        },
        onLine: true,
        storage: {
          estimate: jest.fn().mockResolvedValue({ quota: 1024 * 1024 * 1024, usage: 0 }),
        },
      },
      writable: true,
    });

    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
    });

    Object.defineProperty(global, 'indexedDB', {
      value: {
        open: jest.fn(),
        deleteDatabase: jest.fn(),
      },
      writable: true,
    });

    // Reset IndexedDB mocks
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
    global.indexedDB.open.mockImplementation(() => {
      const request = {
        onsuccess: null,
        onerror: null,
        result: mockIDBDatabase,
      };
      setTimeout(() => request.onsuccess?.({ target: request }), 0);
      return request;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===========================================
  // TASK 25: Push Notifications System
  // ===========================================

  describe('Task 25: Push Notifications System', () => {
    
    test('should request notification permission on first flow state change', async () => {
      // This will fail until NotificationService is implemented
      const mockNotificationService = {
        notifyFlowStateChange: jest.fn(),
        updateSettings: jest.fn(),
        setCurrentFlowState: jest.fn(),
      };

      mockNotification.requestPermission.mockResolvedValue('granted');

      await mockNotificationService.notifyFlowStateChange('DEEP_FLOW', 'NEUTRAL');

      expect(mockNotification.requestPermission).toHaveBeenCalled();
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Flow State: Deep Flow',
        expect.objectContaining({
          body: expect.stringContaining('entered deep flow'),
          icon: expect.stringContaining('flow-icon'),
          badge: expect.stringContaining('badge'),
          tag: 'flow-state-change',
          requireInteraction: false,
          silent: true, // Respect flow state - no sound interruption
        })
      );
    });

    test('should not send flow notifications if permission denied', async () => {
      const mockNotificationService = {
        notifyFlowStateChange: jest.fn(),
      };

      mockNotification.permission = 'denied';

      await mockNotificationService.notifyFlowStateChange('FLOWING', 'BLOCKED');

      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled();
    });

    test('should send critical context health alerts immediately', async () => {
      const mockNotificationService = {
        notifyContextHealth: jest.fn(),
      };

      mockNotification.permission = 'granted';

      await mockNotificationService.notifyContextHealth({
        level: 'CRITICAL',
        issue: 'TOKEN_LIMIT_EXCEEDED',
        contextId: 'claude-session-123',
        suggestion: 'Consider starting a new context',
      });

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Context Health Alert',
        expect.objectContaining({
          body: expect.stringContaining('Token limit exceeded'),
          icon: expect.stringContaining('warning'),
          tag: 'context-health-critical',
          requireInteraction: true,
          actions: expect.arrayContaining([
            expect.objectContaining({ action: 'new-context', title: 'New Context' }),
            expect.objectContaining({ action: 'dismiss', title: 'Dismiss' }),
          ]),
        })
      );
    });

    test('should batch non-critical context warnings', async () => {
      const mockNotificationService = {
        notifyContextHealth: jest.fn(),
      };

      mockNotification.permission = 'granted';

      // Send multiple warning-level alerts
      await mockNotificationService.notifyContextHealth({
        level: 'WARNING',
        issue: 'CONTEXT_DRIFT',
        contextId: 'claude-session-123',
      });

      await mockNotificationService.notifyContextHealth({
        level: 'WARNING',
        issue: 'MEMORY_DEGRADATION',
        contextId: 'claude-session-123',
      });

      // Should batch and send after delay
      await new Promise(resolve => setTimeout(resolve, 5100)); // Wait for batch delay

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Context Health Summary',
        expect.objectContaining({
          body: expect.stringContaining('2 context issues detected'),
          tag: 'context-health-batch',
        })
      );
    });

    test('should celebrate coding session milestones', async () => {
      const mockNotificationService = {
        notifySessionMilestone: jest.fn(),
      };

      mockNotification.permission = 'granted';

      await mockNotificationService.notifySessionMilestone({
        type: 'FLOW_DURATION',
        milestone: '30_MINUTES_DEEP_FLOW',
        sessionId: 'session-123',
        achievement: '30 minutes of uninterrupted deep flow',
      });

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Flow Achievement! 🌊',
        expect.objectContaining({
          body: '30 minutes of uninterrupted deep flow',
          icon: expect.stringContaining('achievement'),
          tag: 'session-milestone',
          requireInteraction: false,
          actions: expect.arrayContaining([
            expect.objectContaining({ action: 'share', title: 'Share' }),
            expect.objectContaining({ action: 'continue', title: 'Keep Going' }),
          ]),
        })
      );
    });

    test('should defer non-critical notifications during active coding', async () => {
      const mockNotificationService = {
        setSessionActivity: jest.fn(),
        scheduleNotification: jest.fn(),
      };

      mockNotification.permission = 'granted';

      // Simulate active coding session
      await mockNotificationService.setSessionActivity({
        isActive: true,
        lastActivity: Date.now(),
        flowState: 'FLOWING'
      });

      await mockNotificationService.scheduleNotification({
        priority: 'LOW',
        type: 'CONTEXT_SUGGESTION',
        content: {
          title: 'Context Optimization Available',
          body: 'Consider refreshing your AI context',
        },
      });

      // Should not send immediately
      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled();

      // Should schedule for later
      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith(
        'deferred-notifications'
      );
    });

    test('should not include sensitive code content in notifications', async () => {
      const mockNotificationService = {
        notifyContextHealth: jest.fn(),
      };

      mockNotification.permission = 'granted';

      await mockNotificationService.notifyContextHealth({
        level: 'WARNING',
        issue: 'CODE_CONTEXT_LARGE',
        contextId: 'claude-session-123',
        codeSnippet: 'const apiKey = "secret-key-12345"',
        suggestion: 'Consider breaking down the context',
      });

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.not.stringContaining('secret-key-12345'),
          body: expect.not.stringContaining('const apiKey'),
        })
      );
    });
  });

  // ===========================================
  // TASK 26: Background Sync & Offline Support
  // ===========================================

  describe('Task 26: Background Sync & Offline Support', () => {
    
    test('should register service worker on app initialization', async () => {
      const mockPWAService = {
        initialize: jest.fn(),
      };

      await mockPWAService.initialize();

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
        '/sw.js',
        expect.objectContaining({
          scope: '/',
          updateViaCache: 'none',
        })
      );
    });

    test('should handle service worker update available', async () => {
      const mockPWAService = {
        onUpdateAvailable: jest.fn(),
        handleServiceWorkerUpdate: jest.fn(),
      };

      const updateCallback = jest.fn();
      await mockPWAService.onUpdateAvailable(updateCallback);

      // Simulate update available
      const registration = await navigator.serviceWorker.ready;
      registration.update.mockResolvedValue(registration);

      // Mock the update event
      const updateEvent = new Event('updatefound');
      await mockPWAService.handleServiceWorkerUpdate(updateEvent);

      expect(updateCallback).toHaveBeenCalledWith({
        type: 'UPDATE_AVAILABLE',
        registration,
        newWorker: expect.any(Object),
      });
    });

    test('should queue data for background sync when offline', async () => {
      const mockBackgroundSyncService = {
        queueForSync: jest.fn(),
      };

      await mockBackgroundSyncService.queueForSync({
        type: 'SESSION_UPDATE',
        data: {
          sessionId: 'session-123',
          flowState: 'FLOWING',
          duration: 1800000, // 30 minutes
          timestamp: Date.now(),
        },
        priority: 'HIGH',
      });

      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith(
        'session-update-session-123'
      );
    });

    test('should sync flow state changes when coming back online', async () => {
      const mockBackgroundSyncService = {
        queueForSync: jest.fn(),
      };

      // Simulate offline mode
      Object.defineProperty(navigator, 'onLine', { value: false });

      // Queue multiple flow state changes while offline
      await mockBackgroundSyncService.queueForSync({
        type: 'FLOW_STATE_CHANGE',
        data: { from: 'NEUTRAL', to: 'FLOWING', timestamp: Date.now() - 300000 },
      });

      await mockBackgroundSyncService.queueForSync({
        type: 'FLOW_STATE_CHANGE',
        data: { from: 'FLOWING', to: 'DEEP_FLOW', timestamp: Date.now() - 150000 },
      });

      // Come back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      // Should trigger batch sync
      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith(
        'batch-flow-state-changes'
      );
    });

    test('should continue tracking flow state while offline', async () => {
      const mockOfflineTracker = {
        startSession: jest.fn(),
        updateFlowState: jest.fn(),
        getQueuedChanges: jest.fn(),
      };

      // Go offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      await mockOfflineTracker.startSession({
        sessionId: 'offline-session-123',
        projectId: 'project-456',
        initialFlowState: 'NEUTRAL',
      });

      // Track flow state changes offline
      await mockOfflineTracker.updateFlowState('FLOWING');
      await mockOfflineTracker.updateFlowState('DEEP_FLOW');

      // Should queue all changes for sync
      const queuedData = await mockOfflineTracker.getQueuedChanges();
      expect(queuedData).toHaveLength(2);
      expect(queuedData[0].flowState).toBe('FLOWING');
      expect(queuedData[1].flowState).toBe('DEEP_FLOW');
    });

    test('should implement intelligent cache eviction based on usage', async () => {
      const mockCacheManager = {
        initialize: jest.fn(),
        set: jest.fn(),
        evictIfNeeded: jest.fn(),
      };

      await mockCacheManager.initialize({
        maxCacheSize: 50 * 1024 * 1024, // 50MB
        evictionStrategy: 'LRU_WITH_PRIORITY',
      });

      // Add various cached items
      await mockCacheManager.set('session-data-123', { priority: 'HIGH', size: 1024 });
      await mockCacheManager.set('ui-assets-v1', { priority: 'MEDIUM', size: 5 * 1024 * 1024 });
      await mockCacheManager.set('old-analytics', { priority: 'LOW', size: 10 * 1024 * 1024 });

      // Simulate cache pressure
      const evictionResult = await mockCacheManager.evictIfNeeded(45 * 1024 * 1024);

      expect(evictionResult.evicted).toContain('old-analytics');
      expect(evictionResult.evicted).not.toContain('session-data-123');
      expect(evictionResult.freedSpace).toBeGreaterThan(10 * 1024 * 1024);
    });

    test('should adapt behavior based on connection quality', async () => {
      const mockNetworkManager = {
        initialize: jest.fn(),
        getConnectionAdaptations: jest.fn(),
      };

      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 2000,
          saveData: true,
        },
      });

      await mockNetworkManager.initialize();
      const adaptations = await mockNetworkManager.getConnectionAdaptations();

      expect(adaptations.reducedImageQuality).toBe(true);
      expect(adaptations.deferNonCriticalSync).toBe(true);
      expect(adaptations.compressData).toBe(true);
      expect(adaptations.batchRequests).toBe(true);
    });
  });

  // ===========================================
  // TASK 27: App Installation & Manifest
  // ===========================================

  describe('Task 27: App Installation & Manifest', () => {
    
    test('should generate valid manifest.json with FlowForge branding', async () => {
      const mockManifestService = {
        generateManifest: jest.fn(),
      };

      const manifest = await mockManifestService.generateManifest();

      expect(manifest).toMatchObject({
        name: 'FlowForge - AI Developer Companion',
        short_name: 'FlowForge',
        description: 'Track your flow state and AI context health while vibe coding',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#00D9A5',
        background_color: '#1a202c',
        scope: '/',
        categories: ['productivity', 'developer-tools', 'utilities'],
      });

      expect(manifest.icons).toHaveLength(6);
      expect(manifest.icons[0]).toMatchObject({
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any',
      });

      expect(manifest.shortcuts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Quick Flow Check',
            url: '/flow-state',
            description: 'Check your current flow state',
          }),
          expect.objectContaining({
            name: 'Context Health',
            url: '/context-health',
            description: 'Monitor AI context health',
          }),
        ])
      );
    });

    test('should detect install prompt availability', async () => {
      const mockInstallService = {
        initialize: jest.fn(),
        canInstall: jest.fn(),
        getInstallPrompt: jest.fn(),
      };

      const mockPromptEvent: MockBeforeInstallPromptEvent = {
        ...new Event('beforeinstallprompt'),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      await mockInstallService.initialize();

      // Simulate beforeinstallprompt event
      window.dispatchEvent(mockPromptEvent);

      const canInstall = await mockInstallService.canInstall();
      expect(canInstall).toBe(true);
      expect(mockInstallService.getInstallPrompt()).toBe(mockPromptEvent);
    });

    test('should handle installation flow with user confirmation', async () => {
      const mockInstallService = {
        setInstallPrompt: jest.fn(),
        promptInstall: jest.fn(),
      };

      const mockPromptEvent: MockBeforeInstallPromptEvent = {
        ...new Event('beforeinstallprompt'),
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      await mockInstallService.setInstallPrompt(mockPromptEvent);

      const result = await mockInstallService.promptInstall();

      expect(mockPromptEvent.prompt).toHaveBeenCalled();
      expect(result.outcome).toBe('accepted');
      expect(result.installed).toBe(true);
    });

    test('should generate all required icon sizes', async () => {
      const mockIconService = {
        getIconPath: jest.fn(),
        getMaskableIcons: jest.fn(),
      };

      const requiredSizes = [72, 96, 128, 144, 152, 192, 384, 512];

      for (const size of requiredSizes) {
        const iconPath = await mockIconService.getIconPath(size);
        expect(iconPath).toBe(`/icons/icon-${size}x${size}.png`);
      }

      const maskableIcons = await mockIconService.getMaskableIcons();
      expect(maskableIcons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            src: '/icons/maskable-icon-192x192.png',
            sizes: '192x192',
            purpose: 'maskable',
          }),
          expect.objectContaining({
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            purpose: 'maskable',
          }),
        ])
      );
    });

    test('should configure splash screens for different device sizes', async () => {
      const mockSplashScreenService = {
        generateSplashScreens: jest.fn(),
      };

      const splashConfigs = await mockSplashScreenService.generateSplashScreens();

      expect(splashConfigs).toEqual(
        expect.arrayContaining([
          // iPhone sizes
          expect.objectContaining({
            media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
            href: '/splash/iPhone14-splash.png',
          }),
          // iPad sizes
          expect.objectContaining({
            media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2)',
            href: '/splash/iPad-splash.png',
          }),
          // Android sizes
          expect.objectContaining({
            media: '(device-width: 360px) and (device-height: 800px)',
            href: '/splash/android-splash.png',
          }),
        ])
      );
    });

    test('should apply iOS-specific PWA optimizations', async () => {
      const mockPlatformService = {
        getIOSOptimizations: jest.fn(),
      };

      const iosOptimizations = await mockPlatformService.getIOSOptimizations();

      expect(iosOptimizations.metaTags).toEqual(
        expect.arrayContaining([
          '<meta name="apple-mobile-web-app-capable" content="yes">',
          '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
          '<meta name="apple-mobile-web-app-title" content="FlowForge">',
        ])
      );

      expect(iosOptimizations.touchIconSizes).toEqual([57, 60, 72, 76, 114, 120, 144, 152, 180]);
      expect(iosOptimizations.viewportFix).toContain('viewport-fit=cover');
    });
  });

  // ===========================================
  // TASK 28: IndexedDB Local Storage
  // ===========================================

  describe('Task 28: IndexedDB Local Storage', () => {
    
    test('should initialize IndexedDB with FlowForge schema', async () => {
      const mockIndexedDBService = {
        initialize: jest.fn(),
      };

      await mockIndexedDBService.initialize();

      expect(global.indexedDB.open).toHaveBeenCalledWith('FlowForgeDB', 1);
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('sessions', {
        keyPath: 'sessionId',
        autoIncrement: false,
      });
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('flowStates', {
        keyPath: 'id',
        autoIncrement: true,
      });
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('contextHealth', {
        keyPath: 'contextId',
      });
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('projects', {
        keyPath: 'projectId',
      });
      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('notes', {
        keyPath: 'noteId',
      });
    });

    test('should store session data with proper indexing', async () => {
      const mockIndexedDBService = {
        initialize: jest.fn(),
        storeSession: jest.fn(),
      };

      await mockIndexedDBService.initialize();

      const sessionData = {
        sessionId: 'session-123',
        startTime: Date.now(),
        projectId: 'project-456',
        flowState: 'FLOWING',
        duration: 1800000, // 30 minutes
        contextId: 'claude-session-789',
        metadata: {
          gitBranch: 'feature/pwa-storage',
          lastCommit: 'abc123',
        },
      };

      mockIDBObjectStore.add.mockImplementation((data) => ({
        onsuccess: () => {},
        onerror: () => {},
      }));

      await mockIndexedDBService.storeSession(sessionData);

      expect(mockIDBTransaction.objectStore).toHaveBeenCalledWith('sessions');
      expect(mockIDBObjectStore.add).toHaveBeenCalledWith(sessionData);
    });

    test('should cache active session data for quick access', async () => {
      const mockSessionCacheService = {
        initialize: jest.fn(),
        cacheActiveSession: jest.fn(),
        getActiveSession: jest.fn(),
      };

      await mockSessionCacheService.initialize();

      const activeSession = {
        sessionId: 'active-123',
        startTime: Date.now(),
        flowState: 'DEEP_FLOW',
        isActive: true,
        lastActivity: Date.now(),
      };

      await mockSessionCacheService.cacheActiveSession(activeSession);

      // Should be available in memory cache
      const cached = await mockSessionCacheService.getActiveSession();
      expect(cached.sessionId).toBe('active-123');
      expect(cached.flowState).toBe('DEEP_FLOW');

      // Should persist to IndexedDB
      expect(mockIDBObjectStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          ...activeSession,
          cached: true,
          cacheTimestamp: expect.any(Number),
        })
      );
    });

    test('should queue data changes for sync when offline', async () => {
      const mockOfflineDataService = {
        initialize: jest.fn(),
        queueChange: jest.fn(),
        getPendingChanges: jest.fn(),
      };

      await mockOfflineDataService.initialize();

      // Go offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      const changes = [
        {
          type: 'FLOW_STATE_UPDATE',
          sessionId: 'session-123',
          data: { flowState: 'DEEP_FLOW', timestamp: Date.now() },
        },
        {
          type: 'PROJECT_UPDATE',
          projectId: 'project-456',
          data: { lastActive: Date.now(), shipStreak: 5 },
        },
      ];

      for (const change of changes) {
        await mockOfflineDataService.queueChange(change);
      }

      const pendingChanges = await mockOfflineDataService.getPendingChanges();
      expect(pendingChanges).toHaveLength(2);
      expect(pendingChanges[0].type).toBe('FLOW_STATE_UPDATE');
      expect(pendingChanges[0].queued).toBe(true);
    });

    test('should monitor storage quota usage', async () => {
      const mockStorageQuotaService = {
        initialize: jest.fn(),
        getQuotaInfo: jest.fn(),
      };

      navigator.storage.estimate.mockResolvedValue({
        quota: 1024 * 1024 * 1024, // 1GB
        usage: 512 * 1024 * 1024,  // 512MB
      });

      await mockStorageQuotaService.initialize();
      const quotaInfo = await mockStorageQuotaService.getQuotaInfo();

      expect(quotaInfo.totalQuota).toBe(1024 * 1024 * 1024);
      expect(quotaInfo.usedSpace).toBe(512 * 1024 * 1024);
      expect(quotaInfo.remainingSpace).toBe(512 * 1024 * 1024);
      expect(quotaInfo.usagePercentage).toBe(50);
    });

    test('should implement intelligent data cleanup when quota is low', async () => {
      const mockStorageQuotaService = {
        initialize: jest.fn(),
        performIntelligentCleanup: jest.fn(),
      };

      // Mock low storage
      navigator.storage.estimate.mockResolvedValue({
        quota: 1024 * 1024 * 1024, // 1GB
        usage: 950 * 1024 * 1024,  // 950MB (93% full)
      });

      await mockStorageQuotaService.initialize();

      const cleanupResult = await mockStorageQuotaService.performIntelligentCleanup();

      expect(cleanupResult.triggered).toBe(true);
      expect(cleanupResult.cleanupActions).toEqual(
        expect.arrayContaining([
          'REMOVE_OLD_SESSIONS',
          'COMPRESS_ANALYTICS_DATA',
          'CLEAR_UNUSED_CACHE',
        ])
      );
      expect(cleanupResult.spaceFreed).toBeGreaterThan(50 * 1024 * 1024); // At least 50MB
    });

    test('should encrypt sensitive data before storage', async () => {
      const mockSecureStorageService = {
        initialize: jest.fn(),
        storeSecureData: jest.fn(),
      };

      await mockSecureStorageService.initialize({
        encryptionKey: 'user-derived-key',
        algorithm: 'AES-GCM',
      });

      const sensitiveData = {
        sessionId: 'session-123',
        contextData: 'const apiKey = "secret-key-12345"',
        gitCredentials: { token: 'github-token-xyz' },
        notes: 'Personal development notes with sensitive info',
      };

      await mockSecureStorageService.storeSecureData('sensitive-session', sensitiveData);

      // Should store encrypted data
      expect(mockIDBObjectStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sensitive-session',
          encrypted: true,
          data: expect.not.stringContaining('secret-key-12345'),
          iv: expect.any(String),
        })
      );
    });

    test('should implement data retention policies', async () => {
      const mockDataRetentionService = {
        initialize: jest.fn(),
        applyRetentionPolicies: jest.fn(),
      };

      await mockDataRetentionService.initialize({
        policies: {
          sessionData: { retentionDays: 90 },
          analyticsData: { retentionDays: 365 },
          contextHealth: { retentionDays: 30 },
          personalNotes: { retentionDays: -1 }, // Keep forever
        },
      });

      // Mock old data
      const oldSessionData = {
        sessionId: 'old-session',
        timestamp: Date.now() - (95 * 24 * 60 * 60 * 1000), // 95 days old
      };

      const recentAnalytics = {
        id: 'analytics-1',
        timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days old
      };

      mockIDBObjectStore.getAll.mockResolvedValue([oldSessionData, recentAnalytics]);

      const cleanupResult = await mockDataRetentionService.applyRetentionPolicies();

      expect(cleanupResult.sessionsRemoved).toBe(1); // Old session deleted
      expect(cleanupResult.analyticsRemoved).toBe(0); // Recent analytics kept
      expect(mockIDBObjectStore.delete).toHaveBeenCalledWith('old-session');
    });
  });
});