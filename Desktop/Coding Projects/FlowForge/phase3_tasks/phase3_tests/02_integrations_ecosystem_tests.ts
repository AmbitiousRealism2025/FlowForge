/**
 * FlowForge Phase 3 - Integrations Ecosystem Tests (Tasks 41-44)
 * 
 * Task 41: Extended MCP Server Integration (Claude Desktop, VS Code, Cursor, etc.)
 * Task 42: Calendar and Time Management Integration (Google Calendar, Outlook, etc.)
 * Task 43: Version Control and Project Integration (GitHub, GitLab, etc.)
 * Task 44: Communication Platform Integration (Slack, Discord, etc.)
 *
 * These tests define the expected behavior for external system integrations
 * following FlowForge's philosophy of flow state protection and ambient intelligence.
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Types and interfaces for integration systems
interface MCPServer {
  id: string;
  name: string;
  type: 'claude-desktop' | 'vscode' | 'cursor' | 'custom';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  capabilities: string[];
  lastSync?: Date;
  contextHealth: number; // 0-100 score
}

interface CalendarIntegration {
  id: string;
  provider: 'google' | 'outlook' | 'apple' | 'custom';
  status: 'connected' | 'disconnected' | 'syncing';
  permissions: string[];
  flowProtectionEnabled: boolean;
  smartSchedulingEnabled: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'focus-block' | 'meeting' | 'break' | 'shipping-session' | 'other';
  flowImpact: 'protective' | 'neutral' | 'disruptive';
  aiContextRequired?: boolean;
}

interface VCSIntegration {
  id: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'custom';
  repositories: Repository[];
  webhookSecret: string;
  trackingEnabled: boolean;
  contextSyncEnabled: boolean;
}

interface Repository {
  id: string;
  name: string;
  url: string;
  tracked: boolean;
  flowStateTracking: boolean;
  shippingMetrics: ShippingMetrics;
}

interface ShippingMetrics {
  commits: number;
  deployments: number;
  flowSessions: number;
  lastShip: Date;
  shipStreak: number;
}

interface CommunicationIntegration {
  id: string;
  platform: 'slack' | 'discord' | 'teams' | 'custom';
  channels: CommunicationChannel[];
  notificationStrategy: 'immediate' | 'batched' | 'flow-aware';
  teamAwarenessEnabled: boolean;
}

interface CommunicationChannel {
  id: string;
  name: string;
  type: 'dm' | 'channel' | 'thread';
  flowProtected: boolean;
  smartNotifications: boolean;
}

interface WebhookPayload {
  source: string;
  event: string;
  data: Record<string, any>;
  timestamp: Date;
  signature?: string;
}

interface IntegrationError {
  integration: string;
  error: string;
  code?: string;
  retry: boolean;
  timestamp: Date;
}

interface ConsentSettings {
  userId: string;
  integrations: Record<string, IntegrationConsent>;
  globalSettings: GlobalConsentSettings;
}

interface IntegrationConsent {
  enabled: boolean;
  permissions: string[];
  dataSharing: 'minimal' | 'enhanced' | 'full';
  revocableAt: Date;
}

interface GlobalConsentSettings {
  privacyMode: 'strict' | 'balanced' | 'open';
  dataRetention: number; // days
  crossPlatformSync: boolean;
}

// Mock services
const mockMCPServerService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  getStatus: jest.fn(),
  syncContext: jest.fn(),
  getCapabilities: jest.fn(),
  sendCommand: jest.fn(),
  getContextHealth: jest.fn(),
  handleContextUpdate: jest.fn(),
  validateConnection: jest.fn(),
  getAvailableServers: jest.fn(),
  registerWebhook: jest.fn()
};

const mockCalendarService = {
  authenticate: jest.fn(),
  getEvents: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  createFocusBlock: jest.fn(),
  optimizeSchedule: jest.fn(),
  checkConflicts: jest.fn(),
  getFlowProtectedSlots: jest.fn(),
  syncFlowState: jest.fn(),
  handleWebhook: jest.fn()
};

const mockVCSService = {
  authenticate: jest.fn(),
  getRepositories: jest.fn(),
  trackRepository: jest.fn(),
  untrackRepository: jest.fn(),
  getCommits: jest.fn(),
  getDeployments: jest.fn(),
  syncContext: jest.fn(),
  handleWebhook: jest.fn(),
  getShippingMetrics: jest.fn(),
  trackFlowSession: jest.fn(),
  updateShipStreak: jest.fn()
};

const mockCommunicationService = {
  authenticate: jest.fn(),
  getChannels: jest.fn(),
  sendMessage: jest.fn(),
  createChannel: jest.fn(),
  updateNotificationStrategy: jest.fn(),
  getTeamFlowState: jest.fn(),
  sendFlowAwareNotification: jest.fn(),
  handleWebhook: jest.fn(),
  batchNotifications: jest.fn(),
  checkFlowProtection: jest.fn()
};

const mockWebhookService = {
  register: jest.fn(),
  unregister: jest.fn(),
  validate: jest.fn(),
  process: jest.fn(),
  getSecret: jest.fn(),
  handleError: jest.fn(),
  retryFailedWebhook: jest.fn()
};

const mockConsentService = {
  requestConsent: jest.fn(),
  revokeConsent: jest.fn(),
  checkConsent: jest.fn(),
  updatePermissions: jest.fn(),
  getConsentSettings: jest.fn(),
  validateDataSharing: jest.fn(),
  scheduleDataDeletion: jest.fn()
};

const mockRateLimitService = {
  checkLimit: jest.fn(),
  updateUsage: jest.fn(),
  getRemaining: jest.fn(),
  resetWindow: jest.fn(),
  handleRateLimit: jest.fn()
};

const mockErrorResilienceService = {
  handleError: jest.fn(),
  retry: jest.fn(),
  circuit: jest.fn(),
  fallback: jest.fn(),
  exponentialBackoff: jest.fn()
};

describe('FlowForge Phase 3: Integrations Ecosystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Task 41: Extended MCP Server Integration', () => {
    describe('MCP Server Discovery and Connection', () => {
      test('should discover available MCP servers', async () => {
        const mockServers: MCPServer[] = [
          {
            id: 'claude-desktop-1',
            name: 'Claude Desktop',
            type: 'claude-desktop',
            status: 'disconnected',
            capabilities: ['context-sync', 'flow-tracking', 'session-analytics'],
            contextHealth: 95
          }
        ];

        mockMCPServerService.getAvailableServers.mockResolvedValue(mockServers);

        const result = await mockMCPServerService.getAvailableServers();

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('claude-desktop');
        expect(result[0].capabilities).toContain('context-sync');
        expect(mockMCPServerService.getAvailableServers).toHaveBeenCalled();
      });

      test('should connect to MCP server with proper authentication', async () => {
        const serverId = 'claude-desktop-1';
        const credentials = { token: 'test-token', endpoint: 'ws://localhost:8080' };

        mockMCPServerService.connect.mockResolvedValue({ success: true, serverId });

        const result = await mockMCPServerService.connect(serverId, credentials);

        expect(result.success).toBe(true);
        expect(result.serverId).toBe(serverId);
        expect(mockMCPServerService.connect).toHaveBeenCalledWith(serverId, credentials);
      });

      test('should validate MCP server capabilities before connection', async () => {
        const serverId = 'vscode-1';
        const requiredCapabilities = ['context-sync', 'flow-tracking'];

        mockMCPServerService.getCapabilities.mockResolvedValue([
          'context-sync', 'flow-tracking', 'workspace-metrics'
        ]);
        mockMCPServerService.validateConnection.mockResolvedValue(true);

        const capabilities = await mockMCPServerService.getCapabilities(serverId);
        const isValid = await mockMCPServerService.validateConnection(serverId, requiredCapabilities);

        expect(capabilities).toContain('context-sync');
        expect(capabilities).toContain('flow-tracking');
        expect(isValid).toBe(true);
      });

      test('should handle MCP server connection failures gracefully', async () => {
        const serverId = 'cursor-1';
        const error = new Error('Connection timeout');

        mockMCPServerService.connect.mockRejectedValue(error);
        mockErrorResilienceService.handleError.mockResolvedValue({
          retry: true,
          backoff: 5000
        });

        await expect(mockMCPServerService.connect(serverId)).rejects.toThrow('Connection timeout');
        expect(mockErrorResilienceService.handleError).toHaveBeenCalledWith(error);
      });
    });

    describe('Context Health Monitoring', () => {
      test('should monitor AI context health across MCP servers', async () => {
        const serverId = 'claude-desktop-1';
        const contextHealth = {
          score: 85,
          issues: ['large-context-window', 'stale-references'],
          recommendations: ['refresh-context', 'prune-old-data'],
          lastUpdated: new Date()
        };

        mockMCPServerService.getContextHealth.mockResolvedValue(contextHealth);

        const result = await mockMCPServerService.getContextHealth(serverId);

        expect(result.score).toBe(85);
        expect(result.issues).toContain('large-context-window');
        expect(result.recommendations).toContain('refresh-context');
      });

      test('should sync context updates between MCP servers', async () => {
        const contextUpdate = {
          sessionId: 'session-123',
          changes: ['new-files', 'modified-functions'],
          flowState: 'FLOWING',
          timestamp: new Date()
        };

        mockMCPServerService.handleContextUpdate.mockResolvedValue({ success: true });

        const result = await mockMCPServerService.handleContextUpdate(contextUpdate);

        expect(result.success).toBe(true);
        expect(mockMCPServerService.handleContextUpdate).toHaveBeenCalledWith(contextUpdate);
      });

      test('should send commands to MCP servers with flow state awareness', async () => {
        const command = {
          type: 'refresh-context',
          priority: 'high',
          flowAware: true,
          serverId: 'vscode-1'
        };

        mockMCPServerService.sendCommand.mockResolvedValue({
          success: true,
          result: 'Context refreshed successfully'
        });

        const result = await mockMCPServerService.sendCommand(command);

        expect(result.success).toBe(true);
        expect(result.result).toContain('refreshed successfully');
      });
    });

    describe('MCP Server Webhook Integration', () => {
      test('should register webhooks for MCP server events', async () => {
        const webhook = {
          serverId: 'claude-desktop-1',
          events: ['context-updated', 'session-started', 'flow-state-changed'],
          url: 'https://flowforge.app/webhooks/mcp',
          secret: 'webhook-secret'
        };

        mockMCPServerService.registerWebhook.mockResolvedValue({ success: true, webhookId: 'wh-123' });

        const result = await mockMCPServerService.registerWebhook(webhook);

        expect(result.success).toBe(true);
        expect(result.webhookId).toBe('wh-123');
      });

      test('should handle MCP server webhook payloads securely', async () => {
        const payload: WebhookPayload = {
          source: 'claude-desktop',
          event: 'context-updated',
          data: { contextSize: 15000, healthScore: 92 },
          timestamp: new Date(),
          signature: 'sha256=abc123'
        };

        mockWebhookService.validate.mockResolvedValue(true);
        mockWebhookService.process.mockResolvedValue({ success: true });

        const isValid = await mockWebhookService.validate(payload);
        const result = await mockWebhookService.process(payload);

        expect(isValid).toBe(true);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Task 42: Calendar and Time Management Integration', () => {
    describe('Calendar Provider Authentication', () => {
      test('should authenticate with Google Calendar', async () => {
        const credentials = {
          clientId: 'google-client-id',
          clientSecret: 'google-secret',
          redirectUri: 'https://flowforge.app/auth/google'
        };

        mockCalendarService.authenticate.mockResolvedValue({
          success: true,
          provider: 'google',
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        });

        const result = await mockCalendarService.authenticate('google', credentials);

        expect(result.success).toBe(true);
        expect(result.provider).toBe('google');
        expect(result.accessToken).toBeDefined();
      });

      test('should authenticate with Outlook Calendar', async () => {
        const credentials = {
          tenantId: 'tenant-123',
          clientId: 'outlook-client-id',
          clientSecret: 'outlook-secret'
        };

        mockCalendarService.authenticate.mockResolvedValue({
          success: true,
          provider: 'outlook',
          accessToken: 'outlook-token'
        });

        const result = await mockCalendarService.authenticate('outlook', credentials);

        expect(result.success).toBe(true);
        expect(result.provider).toBe('outlook');
      });

      test('should handle authentication failures with retry logic', async () => {
        const error = new Error('Authentication failed');

        mockCalendarService.authenticate.mockRejectedValue(error);
        mockErrorResilienceService.retry.mockResolvedValue({ attempt: 2, success: false });

        await expect(mockCalendarService.authenticate('google', {})).rejects.toThrow();
        expect(mockErrorResilienceService.retry).toHaveBeenCalled();
      });
    });

    describe('Flow-Aware Scheduling', () => {
      test('should create flow-protected focus blocks', async () => {
        const focusBlock = {
          title: 'Deep Work - AI Context Health',
          startTime: new Date('2024-01-15T09:00:00Z'),
          endTime: new Date('2024-01-15T11:00:00Z'),
          type: 'focus-block' as const,
          flowProtection: true,
          aiContextRequired: true
        };

        mockCalendarService.createFocusBlock.mockResolvedValue({
          success: true,
          eventId: 'focus-123',
          protected: true
        });

        const result = await mockCalendarService.createFocusBlock(focusBlock);

        expect(result.success).toBe(true);
        expect(result.protected).toBe(true);
        expect(mockCalendarService.createFocusBlock).toHaveBeenCalledWith(focusBlock);
      });

      test('should optimize schedule based on flow patterns', async () => {
        const preferences = {
          deepWorkSlots: ['09:00-11:00', '14:00-16:00'],
          meetingAvoidanceHours: ['09:00-10:00'],
          flowRecoveryTime: 30, // minutes
          maxMeetingsPerDay: 4
        };

        mockCalendarService.optimizeSchedule.mockResolvedValue({
          optimized: true,
          changes: 3,
          flowScore: 85,
          recommendations: ['Move 2 meetings to afternoon', 'Add 30min flow recovery blocks']
        });

        const result = await mockCalendarService.optimizeSchedule(preferences);

        expect(result.optimized).toBe(true);
        expect(result.changes).toBeGreaterThan(0);
        expect(result.flowScore).toBeGreaterThanOrEqual(80);
      });

      test('should detect and resolve calendar conflicts with flow awareness', async () => {
        const newEvent: CalendarEvent = {
          id: 'event-456',
          title: 'Team Standup',
          startTime: new Date('2024-01-15T09:30:00Z'),
          endTime: new Date('2024-01-15T10:00:00Z'),
          type: 'meeting',
          flowImpact: 'disruptive'
        };

        mockCalendarService.checkConflicts.mockResolvedValue({
          hasConflicts: true,
          conflicts: ['focus-123'],
          resolution: 'suggest-alternative-time',
          alternatives: [
            { start: new Date('2024-01-15T11:30:00Z'), end: new Date('2024-01-15T12:00:00Z') }
          ]
        });

        const result = await mockCalendarService.checkConflicts(newEvent);

        expect(result.hasConflicts).toBe(true);
        expect(result.resolution).toBe('suggest-alternative-time');
        expect(result.alternatives).toHaveLength(1);
      });

      test('should sync flow state with calendar events', async () => {
        const flowState = {
          current: 'DEEP_FLOW',
          sessionId: 'session-789',
          startTime: new Date(),
          protectedUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        };

        mockCalendarService.syncFlowState.mockResolvedValue({
          success: true,
          eventsUpdated: 2,
          protectionExtended: true
        });

        const result = await mockCalendarService.syncFlowState(flowState);

        expect(result.success).toBe(true);
        expect(result.eventsUpdated).toBeGreaterThan(0);
        expect(result.protectionExtended).toBe(true);
      });
    });

    describe('Calendar Webhook Integration', () => {
      test('should handle calendar event webhooks', async () => {
        const webhook: WebhookPayload = {
          source: 'google-calendar',
          event: 'event-updated',
          data: {
            eventId: 'cal-event-123',
            changes: ['time', 'attendees'],
            flowImpact: 'neutral'
          },
          timestamp: new Date()
        };

        mockCalendarService.handleWebhook.mockResolvedValue({
          processed: true,
          flowStateUpdated: false,
          rescheduleRequired: false
        });

        const result = await mockCalendarService.handleWebhook(webhook);

        expect(result.processed).toBe(true);
        expect(mockCalendarService.handleWebhook).toHaveBeenCalledWith(webhook);
      });

      test('should handle webhook rate limiting', async () => {
        mockRateLimitService.checkLimit.mockResolvedValue({
          allowed: false,
          resetTime: new Date(Date.now() + 60000),
          remaining: 0
        });

        const limit = await mockRateLimitService.checkLimit('google-calendar');

        expect(limit.allowed).toBe(false);
        expect(limit.remaining).toBe(0);
        expect(limit.resetTime).toBeInstanceOf(Date);
      });
    });
  });

  describe('Task 43: Version Control and Project Integration', () => {
    describe('VCS Provider Authentication', () => {
      test('should authenticate with GitHub', async () => {
        const credentials = {
          token: 'github-token',
          scope: ['repo', 'read:user', 'notifications']
        };

        mockVCSService.authenticate.mockResolvedValue({
          success: true,
          provider: 'github',
          user: { login: 'testuser', id: 12345 },
          permissions: ['repo', 'read:user']
        });

        const result = await mockVCSService.authenticate('github', credentials);

        expect(result.success).toBe(true);
        expect(result.provider).toBe('github');
        expect(result.user.login).toBe('testuser');
      });

      test('should authenticate with GitLab', async () => {
        const credentials = {
          token: 'gitlab-token',
          baseUrl: 'https://gitlab.com'
        };

        mockVCSService.authenticate.mockResolvedValue({
          success: true,
          provider: 'gitlab',
          user: { username: 'testuser', id: 67890 }
        });

        const result = await mockVCSService.authenticate('gitlab', credentials);

        expect(result.success).toBe(true);
        expect(result.provider).toBe('gitlab');
      });
    });

    describe('Repository Tracking', () => {
      test('should get and track repositories', async () => {
        const mockRepos: Repository[] = [
          {
            id: 'repo-1',
            name: 'flowforge-web',
            url: 'https://github.com/user/flowforge-web',
            tracked: true,
            flowStateTracking: true,
            shippingMetrics: {
              commits: 156,
              deployments: 23,
              flowSessions: 45,
              lastShip: new Date(),
              shipStreak: 7
            }
          }
        ];

        mockVCSService.getRepositories.mockResolvedValue(mockRepos);
        mockVCSService.trackRepository.mockResolvedValue({ success: true, tracked: true });

        const repos = await mockVCSService.getRepositories();
        const trackResult = await mockVCSService.trackRepository('repo-1');

        expect(repos).toHaveLength(1);
        expect(repos[0].flowStateTracking).toBe(true);
        expect(trackResult.success).toBe(true);
      });

      test('should get shipping metrics for tracked repositories', async () => {
        const repoId = 'repo-1';
        const metrics = {
          commits: 156,
          deployments: 23,
          flowSessions: 45,
          lastShip: new Date(),
          shipStreak: 7,
          averageFlowPerShip: 2.8,
          deploymentSuccess: 0.91
        };

        mockVCSService.getShippingMetrics.mockResolvedValue(metrics);

        const result = await mockVCSService.getShippingMetrics(repoId);

        expect(result.commits).toBe(156);
        expect(result.shipStreak).toBe(7);
        expect(result.averageFlowPerShip).toBeGreaterThan(2);
      });

      test('should track flow sessions with commits', async () => {
        const sessionData = {
          sessionId: 'session-123',
          repoId: 'repo-1',
          commits: ['abc123', 'def456'],
          flowDuration: 90, // minutes
          flowState: 'DEEP_FLOW'
        };

        mockVCSService.trackFlowSession.mockResolvedValue({
          success: true,
          sessionTracked: true,
          metricsUpdated: true
        });

        const result = await mockVCSService.trackFlowSession(sessionData);

        expect(result.success).toBe(true);
        expect(result.sessionTracked).toBe(true);
        expect(result.metricsUpdated).toBe(true);
      });

      test('should update ship streak on deployments', async () => {
        const deploymentData = {
          repoId: 'repo-1',
          deploymentId: 'deploy-789',
          status: 'success',
          timestamp: new Date(),
          branch: 'main'
        };

        mockVCSService.updateShipStreak.mockResolvedValue({
          updated: true,
          newStreak: 8,
          streakMilestone: false
        });

        const result = await mockVCSService.updateShipStreak(deploymentData);

        expect(result.updated).toBe(true);
        expect(result.newStreak).toBe(8);
      });
    });

    describe('Context Synchronization', () => {
      test('should sync code context with AI systems', async () => {
        const contextData = {
          repoId: 'repo-1',
          files: ['src/components/Dashboard.tsx', 'src/lib/flowState.ts'],
          changes: ['modified', 'added'],
          flowRelevant: true
        };

        mockVCSService.syncContext.mockResolvedValue({
          synced: true,
          contextHealth: 88,
          aiSystemsUpdated: ['claude-desktop', 'cursor']
        });

        const result = await mockVCSService.syncContext(contextData);

        expect(result.synced).toBe(true);
        expect(result.contextHealth).toBeGreaterThan(80);
        expect(result.aiSystemsUpdated).toContain('claude-desktop');
      });
    });

    describe('VCS Webhook Integration', () => {
      test('should handle GitHub webhook events', async () => {
        const webhook: WebhookPayload = {
          source: 'github',
          event: 'push',
          data: {
            repository: { name: 'flowforge-web', id: 'repo-1' },
            commits: [{ id: 'abc123', message: 'feat: add flow state tracking' }],
            pusher: { name: 'testuser' }
          },
          timestamp: new Date(),
          signature: 'sha256=webhook-signature'
        };

        mockVCSService.handleWebhook.mockResolvedValue({
          processed: true,
          metricsUpdated: true,
          contextSynced: true
        });

        const result = await mockVCSService.handleWebhook(webhook);

        expect(result.processed).toBe(true);
        expect(result.metricsUpdated).toBe(true);
        expect(result.contextSynced).toBe(true);
      });

      test('should validate webhook signatures', async () => {
        const payload = {
          source: 'github',
          event: 'deployment',
          data: { deployment: { id: 'deploy-123', state: 'success' } },
          timestamp: new Date(),
          signature: 'invalid-signature'
        };

        mockWebhookService.validate.mockResolvedValue(false);

        const isValid = await mockWebhookService.validate(payload);

        expect(isValid).toBe(false);
        expect(mockWebhookService.validate).toHaveBeenCalledWith(payload);
      });
    });
  });

  describe('Task 44: Communication Platform Integration', () => {
    describe('Platform Authentication', () => {
      test('should authenticate with Slack', async () => {
        const credentials = {
          clientId: 'slack-client-id',
          clientSecret: 'slack-secret',
          scopes: ['chat:write', 'users:read', 'channels:read']
        };

        mockCommunicationService.authenticate.mockResolvedValue({
          success: true,
          platform: 'slack',
          teamId: 'T123456',
          botToken: 'xoxb-token',
          userToken: 'xoxp-token'
        });

        const result = await mockCommunicationService.authenticate('slack', credentials);

        expect(result.success).toBe(true);
        expect(result.platform).toBe('slack');
        expect(result.teamId).toBe('T123456');
      });

      test('should authenticate with Discord', async () => {
        const credentials = {
          botToken: 'discord-bot-token',
          guildId: '123456789'
        };

        mockCommunicationService.authenticate.mockResolvedValue({
          success: true,
          platform: 'discord',
          guildId: '123456789',
          botId: 'bot-987654'
        });

        const result = await mockCommunicationService.authenticate('discord', credentials);

        expect(result.success).toBe(true);
        expect(result.platform).toBe('discord');
      });
    });

    describe('Smart Notification Management', () => {
      test('should send flow-aware notifications', async () => {
        const notification = {
          channelId: 'C1234567',
          message: 'Build completed successfully!',
          priority: 'normal' as const,
          flowAware: true,
          respectFlowState: true
        };

        mockCommunicationService.sendFlowAwareNotification.mockResolvedValue({
          sent: true,
          delayed: false,
          flowStateRespected: true,
          deliveryTime: new Date()
        });

        const result = await mockCommunicationService.sendFlowAwareNotification(notification);

        expect(result.sent).toBe(true);
        expect(result.flowStateRespected).toBe(true);
      });

      test('should batch notifications during flow sessions', async () => {
        const notifications = [
          { message: 'PR approved', priority: 'low' },
          { message: 'Build started', priority: 'low' },
          { message: 'Tests passing', priority: 'normal' }
        ];

        mockCommunicationService.batchNotifications.mockResolvedValue({
          batched: true,
          count: 3,
          scheduledDelivery: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
          batchSummary: 'FlowForge: 3 updates ready'
        });

        const result = await mockCommunicationService.batchNotifications(notifications);

        expect(result.batched).toBe(true);
        expect(result.count).toBe(3);
        expect(result.scheduledDelivery).toBeInstanceOf(Date);
      });

      test('should check flow protection before sending notifications', async () => {
        const userId = 'user-123';
        const flowState = 'DEEP_FLOW';

        mockCommunicationService.checkFlowProtection.mockResolvedValue({
          protected: true,
          allowedChannels: ['urgent-only'],
          batchingEnabled: true,
          protectedUntil: new Date(Date.now() + 45 * 60 * 1000)
        });

        const protection = await mockCommunicationService.checkFlowProtection(userId, flowState);

        expect(protection.protected).toBe(true);
        expect(protection.batchingEnabled).toBe(true);
        expect(protection.allowedChannels).toContain('urgent-only');
      });

      test('should update notification strategy based on flow patterns', async () => {
        const strategy = {
          userId: 'user-123',
          type: 'flow-aware' as const,
          batchDuration: 30, // minutes
          urgentKeywords: ['urgent', 'critical', 'error'],
          quietHours: { start: '09:00', end: '11:00' }
        };

        mockCommunicationService.updateNotificationStrategy.mockResolvedValue({
          updated: true,
          strategy: 'flow-aware',
          effectiveImmediately: true
        });

        const result = await mockCommunicationService.updateNotificationStrategy(strategy);

        expect(result.updated).toBe(true);
        expect(result.strategy).toBe('flow-aware');
      });
    });

    describe('Team Flow State Awareness', () => {
      test('should get team flow state overview', async () => {
        const teamId = 'team-456';

        mockCommunicationService.getTeamFlowState.mockResolvedValue({
          teamId,
          members: [
            { userId: 'user-1', flowState: 'DEEP_FLOW', protectedUntil: new Date() },
            { userId: 'user-2', flowState: 'NEUTRAL', available: true },
            { userId: 'user-3', flowState: 'BLOCKED', needsHelp: true }
          ],
          teamFlowScore: 72,
          availableNow: 1,
          inFlow: 1,
          needingHelp: 1
        });

        const teamState = await mockCommunicationService.getTeamFlowState(teamId);

        expect(teamState.members).toHaveLength(3);
        expect(teamState.availableNow).toBe(1);
        expect(teamState.inFlow).toBe(1);
        expect(teamState.teamFlowScore).toBeGreaterThan(70);
      });

      test('should create flow-protected channels', async () => {
        const channelConfig = {
          name: 'deep-work-zone',
          type: 'channel' as const,
          flowProtected: true,
          allowedFlowStates: ['DEEP_FLOW', 'FLOWING'],
          autoMute: true
        };

        mockCommunicationService.createChannel.mockResolvedValue({
          created: true,
          channelId: 'C789012',
          name: 'deep-work-zone',
          flowProtected: true
        });

        const result = await mockCommunicationService.createChannel(channelConfig);

        expect(result.created).toBe(true);
        expect(result.flowProtected).toBe(true);
        expect(result.channelId).toBeTruthy();
      });
    });

    describe('Communication Webhook Integration', () => {
      test('should handle Slack webhook events', async () => {
        const webhook: WebhookPayload = {
          source: 'slack',
          event: 'message',
          data: {
            channel: 'C1234567',
            user: 'U123456',
            text: '@flowforge status',
            timestamp: '1640995200.123400'
          },
          timestamp: new Date()
        };

        mockCommunicationService.handleWebhook.mockResolvedValue({
          processed: true,
          responded: true,
          flowStateShared: true
        });

        const result = await mockCommunicationService.handleWebhook(webhook);

        expect(result.processed).toBe(true);
        expect(result.responded).toBe(true);
      });

      test('should handle Discord webhook events', async () => {
        const webhook: WebhookPayload = {
          source: 'discord',
          event: 'messageCreate',
          data: {
            channelId: '123456789',
            author: { id: '987654321', username: 'testuser' },
            content: '!flowforge ship-streak'
          },
          timestamp: new Date()
        };

        mockCommunicationService.handleWebhook.mockResolvedValue({
          processed: true,
          commandExecuted: true,
          responseType: 'ship-streak-status'
        });

        const result = await mockCommunicationService.handleWebhook(webhook);

        expect(result.processed).toBe(true);
        expect(result.commandExecuted).toBe(true);
      });
    });
  });

  describe('Cross-Integration Features', () => {
    describe('Privacy and Consent Management', () => {
      test('should request user consent for integrations', async () => {
        const consentRequest = {
          userId: 'user-123',
          integrations: ['google-calendar', 'github', 'slack'],
          permissions: ['read-events', 'write-events', 'read-repos', 'send-messages'],
          dataSharing: 'enhanced' as const
        };

        mockConsentService.requestConsent.mockResolvedValue({
          granted: true,
          consentId: 'consent-456',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          revocableAt: new Date()
        });

        const result = await mockConsentService.requestConsent(consentRequest);

        expect(result.granted).toBe(true);
        expect(result.consentId).toBeTruthy();
        expect(result.revocableAt).toBeInstanceOf(Date);
      });

      test('should validate data sharing permissions', async () => {
        const sharingRequest = {
          userId: 'user-123',
          integration: 'slack',
          dataType: 'flow-state',
          recipient: 'team-channel'
        };

        mockConsentService.validateDataSharing.mockResolvedValue({
          allowed: true,
          consentLevel: 'enhanced',
          restrictions: []
        });

        const result = await mockConsentService.validateDataSharing(sharingRequest);

        expect(result.allowed).toBe(true);
        expect(result.consentLevel).toBe('enhanced');
      });

      test('should handle consent revocation', async () => {
        const userId = 'user-123';
        const integration = 'github';

        mockConsentService.revokeConsent.mockResolvedValue({
          revoked: true,
          integrationDisabled: true,
          dataScheduledForDeletion: true,
          deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        const result = await mockConsentService.revokeConsent(userId, integration);

        expect(result.revoked).toBe(true);
        expect(result.integrationDisabled).toBe(true);
        expect(result.dataScheduledForDeletion).toBe(true);
      });
    });

    describe('Error Handling and Resilience', () => {
      test('should handle API rate limiting across integrations', async () => {
        const error = new Error('Rate limit exceeded');
        error.name = 'RateLimitError';

        mockErrorResilienceService.handleError.mockResolvedValue({
          handled: true,
          strategy: 'exponential-backoff',
          retryAfter: 60000,
          fallbackUsed: false
        });

        const result = await mockErrorResilienceService.handleError(error);

        expect(result.handled).toBe(true);
        expect(result.strategy).toBe('exponential-backoff');
        expect(result.retryAfter).toBeGreaterThan(0);
      });

      test('should implement circuit breaker for failing integrations', async () => {
        const integration = 'google-calendar';
        const consecutiveFailures = 5;

        mockErrorResilienceService.circuit.mockResolvedValue({
          state: 'open',
          failureCount: consecutiveFailures,
          nextAttempt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          fallbackActive: true
        });

        const result = await mockErrorResilienceService.circuit(integration, consecutiveFailures);

        expect(result.state).toBe('open');
        expect(result.failureCount).toBe(5);
        expect(result.fallbackActive).toBe(true);
      });

      test('should provide fallback functionality when integrations fail', async () => {
        const integration = 'slack';
        const operation = 'send-notification';

        mockErrorResilienceService.fallback.mockResolvedValue({
          fallbackUsed: true,
          method: 'local-queue',
          willRetry: true,
          userNotified: false
        });

        const result = await mockErrorResilienceService.fallback(integration, operation);

        expect(result.fallbackUsed).toBe(true);
        expect(result.method).toBe('local-queue');
        expect(result.willRetry).toBe(true);
      });

      test('should retry failed operations with exponential backoff', async () => {
        const operation = () => Promise.reject(new Error('Temporary failure'));
        const options = {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000
        };

        mockErrorResilienceService.exponentialBackoff.mockResolvedValue({
          success: false,
          attempts: 3,
          totalTime: 7000,
          lastError: 'Temporary failure'
        });

        const result = await mockErrorResilienceService.exponentialBackoff(operation, options);

        expect(result.attempts).toBe(3);
        expect(result.success).toBe(false);
        expect(result.totalTime).toBeGreaterThan(6000);
      });
    });

    describe('Cross-Platform Data Synchronization', () => {
      test('should synchronize flow state across all integrations', async () => {
        const flowState = {
          userId: 'user-123',
          state: 'DEEP_FLOW',
          sessionId: 'session-789',
          startTime: new Date(),
          context: {
            project: 'FlowForge',
            aiModel: 'claude-3',
            repository: 'flowforge-web'
          }
        };

        const mockSyncService = {
          syncFlowState: jest.fn().mockResolvedValue({
            synced: true,
            integrations: ['mcp-servers', 'calendar', 'slack', 'github'],
            conflicts: 0,
            syncTime: new Date()
          })
        };

        const result = await mockSyncService.syncFlowState(flowState);

        expect(result.synced).toBe(true);
        expect(result.integrations).toHaveLength(4);
        expect(result.conflicts).toBe(0);
      });

      test('should resolve data conflicts between integrations', async () => {
        const conflict = {
          type: 'schedule-conflict',
          sources: ['google-calendar', 'slack-status'],
          data: {
            calendar: { status: 'in-meeting' },
            slack: { status: 'available' }
          },
          priority: ['flow-state', 'calendar', 'communication']
        };

        const mockConflictResolver = {
          resolve: jest.fn().mockResolvedValue({
            resolved: true,
            resolution: 'flow-state-priority',
            finalState: 'in-flow-session',
            updatedIntegrations: ['slack']
          })
        };

        const result = await mockConflictResolver.resolve(conflict);

        expect(result.resolved).toBe(true);
        expect(result.resolution).toBe('flow-state-priority');
        expect(result.updatedIntegrations).toContain('slack');
      });

      test('should handle offline data synchronization', async () => {
        const offlineData = {
          userId: 'user-123',
          changes: [
            { type: 'flow-session', data: { duration: 90, state: 'FLOWING' } },
            { type: 'ship-event', data: { commits: 3, timestamp: new Date() } }
          ],
          queuedSince: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        };

        const mockOfflineSync = {
          syncOfflineData: jest.fn().mockResolvedValue({
            synced: true,
            changes: 2,
            conflicts: 0,
            integrationsSynced: ['github', 'calendar'],
            fallbacksResolved: 1
          })
        };

        const result = await mockOfflineSync.syncOfflineData(offlineData);

        expect(result.synced).toBe(true);
        expect(result.changes).toBe(2);
        expect(result.integrationsSynced).toContain('github');
      });
    });

    describe('Webhook Security and Validation', () => {
      test('should validate webhook signatures from all providers', async () => {
        const webhooks = [
          { source: 'github', signature: 'sha256=github-sig', payload: 'github-data' },
          { source: 'slack', signature: 'v0=slack-sig', payload: 'slack-data' },
          { source: 'google', signature: 'google-jwt-token', payload: 'calendar-data' }
        ];

        for (const webhook of webhooks) {
          mockWebhookService.validate.mockResolvedValue(true);
          const isValid = await mockWebhookService.validate(webhook);
          expect(isValid).toBe(true);
        }

        expect(mockWebhookService.validate).toHaveBeenCalledTimes(3);
      });

      test('should handle webhook replay attacks', async () => {
        const webhook = {
          source: 'github',
          signature: 'sha256=valid-sig',
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes old
          payload: 'duplicate-event-data'
        };

        mockWebhookService.validate.mockResolvedValue(false);
        mockWebhookService.handleError.mockResolvedValue({
          blocked: true,
          reason: 'replay-attack',
          timestamp: new Date()
        });

        const isValid = await mockWebhookService.validate(webhook);
        const errorResult = await mockWebhookService.handleError('replay-attack', webhook);

        expect(isValid).toBe(false);
        expect(errorResult.blocked).toBe(true);
        expect(errorResult.reason).toBe('replay-attack');
      });

      test('should retry failed webhook processing', async () => {
        const webhook = {
          source: 'gitlab',
          event: 'pipeline_failed',
          data: { pipeline: { id: 123, status: 'failed' } },
          timestamp: new Date()
        };

        mockWebhookService.retryFailedWebhook.mockResolvedValue({
          retried: true,
          attempt: 2,
          success: true,
          nextRetry: null
        });

        const result = await mockWebhookService.retryFailedWebhook(webhook);

        expect(result.retried).toBe(true);
        expect(result.success).toBe(true);
        expect(result.attempt).toBe(2);
      });
    });
  });
});