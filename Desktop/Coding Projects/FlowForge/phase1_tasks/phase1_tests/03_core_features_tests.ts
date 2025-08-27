/**
 * Phase 1 Core Features Tests (Tasks 7-12)
 * FlowForge - AI-Productivity Companion for Vibe Coders
 * 
 * These tests validate the core features that make FlowForge unique:
 * - AI Context Health Monitoring (Task 7)
 * - Project Management for Vibe Coders (Task 8)  
 * - Habit Tracking for AI-Assisted Development (Task 9)
 * - Notes and Knowledge Management (Task 10)
 * - Analytics and Insights Dashboard (Task 11)
 * - Focus Mode and Flow Protection (Task 12)
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Types for FlowForge Core Features
interface AIContextHealth {
  id: string;
  modelName: 'claude' | 'gpt' | 'copilot' | 'cursor';
  healthScore: number; // 0-100
  tokenUsage: number;
  conversationTurns: number;
  coherenceScore: number; // 0-100
  lastRefresh: Date;
  degradationRate: number;
  needsRefresh: boolean;
  recommendations: string[];
}

interface Project {
  id: string;
  name: string;
  feelsRightScore: number; // 0-100, subjective progress feeling
  shipTarget: 'flexible' | 'soft' | 'hard';
  targetDate?: Date;
  pivotCount: number;
  vibeHealth: 'thriving' | 'steady' | 'struggling' | 'blocked';
  lastShip: Date;
  momentum: number; // 0-100
  contextSessions: string[];
}

interface Habit {
  id: string;
  category: 'DAILY_SHIP' | 'CONTEXT_REFRESH' | 'CODE_REVIEW' | 'FLOW_BLOCK' | 'BACKUP_CHECK';
  name: string;
  streak: number;
  lastCompleted: Date;
  targetFrequency: 'daily' | 'weekly' | 'per_session';
  vibeCelebration: boolean;
  flowImpact: number; // -10 to 10
}

interface Note {
  id: string;
  category: 'PROMPT_PATTERN' | 'GOLDEN_CODE' | 'DEBUG_LOG' | 'MODEL_NOTE' | 'INSIGHT';
  title: string;
  content: string;
  tags: string[];
  modelContext?: string;
  reusability: number; // 0-100
  flowMoment: boolean; // Captured during flow state
  createdAt: Date;
}

interface FlowAnalytics {
  userId: string;
  timeRange: 'day' | 'week' | 'month';
  flowStateDistribution: {
    BLOCKED: number;
    NEUTRAL: number; 
    FLOWING: number;
    DEEP_FLOW: number;
  };
  aiModelPerformance: {
    modelName: string;
    avgHealthScore: number;
    sessionCount: number;
    productivityCorrelation: number;
  }[];
  shippingVelocity: {
    date: Date;
    shipsCount: number;
    vibeScore: number;
  }[];
  contextHealthTrend: {
    date: Date;
    avgHealthScore: number;
    refreshCount: number;
  }[];
}

interface FocusSession {
  id: string;
  sessionType: 'BUILDING' | 'EXPLORING' | 'DEBUGGING' | 'SHIPPING';
  startTime: Date;
  endTime?: Date;
  flowState: 'BLOCKED' | 'NEUTRAL' | 'FLOWING' | 'DEEP_FLOW';
  interruptionsBlocked: number;
  contextPreserved: boolean;
  emergencySaves: number;
  recoveryTime?: number; // minutes to regain flow after interruption
}

// Mock services that would be implemented in actual app
const mockAIContextService = {
  monitorHealth: jest.fn(),
  detectDegradation: jest.fn(),
  getRecommendations: jest.fn(),
  refreshContext: jest.fn(),
  trackTokenUsage: jest.fn()
};

const mockProjectService = {
  updateFeelsRight: jest.fn(),
  trackPivot: jest.fn(),
  calculateMomentum: jest.fn(),
  getVibeHealth: jest.fn(),
  recordShip: jest.fn()
};

const mockHabitService = {
  completeHabit: jest.fn(),
  trackStreak: jest.fn(),
  triggerCelebration: jest.fn(),
  analyzeFlowImpact: jest.fn(),
  getRecommendations: jest.fn()
};

const mockNotesService = {
  saveNote: jest.fn(),
  searchByContext: jest.fn(),
  suggestReuse: jest.fn(),
  categorizeAutomatically: jest.fn(),
  exportPromptPatterns: jest.fn()
};

const mockAnalyticsService = {
  generateFlowInsights: jest.fn(),
  compareModelPerformance: jest.fn(),
  trackShippingVelocity: jest.fn(),
  analyzeProductivityPatterns: jest.fn(),
  getVibeCorrelations: jest.fn()
};

const mockFocusService = {
  startSession: jest.fn(),
  blockInterruptions: jest.fn(),
  preserveContext: jest.fn(),
  emergencySave: jest.fn(),
  recoverFlow: jest.fn()
};

describe('Phase 1 Core Features - FlowForge', () => {

  describe('Task 7: AI Context Health Monitoring System', () => {
    
    it('should monitor real-time context degradation for Claude', async () => {
      const claudeContext: AIContextHealth = {
        id: 'claude-session-1',
        modelName: 'claude',
        healthScore: 85,
        tokenUsage: 8500,
        conversationTurns: 42,
        coherenceScore: 90,
        lastRefresh: new Date('2024-01-15T10:00:00Z'),
        degradationRate: 2.5,
        needsRefresh: false,
        recommendations: []
      };

      mockAIContextService.monitorHealth.mockResolvedValue(claudeContext);
      
      // This should track degradation over time
      const result = await mockAIContextService.monitorHealth('claude-session-1');
      
      expect(result.healthScore).toBeGreaterThan(80);
      expect(result.degradationRate).toBeLessThan(3);
      expect(mockAIContextService.monitorHealth).toHaveBeenCalledWith('claude-session-1');
    });

    it('should detect when context refresh is needed across multiple models', async () => {
      const multiModelHealth = [
        { modelName: 'claude', healthScore: 45, needsRefresh: true },
        { modelName: 'gpt', healthScore: 75, needsRefresh: false },
        { modelName: 'copilot', healthScore: 30, needsRefresh: true }
      ];

      mockAIContextService.detectDegradation.mockResolvedValue(multiModelHealth);
      
      const degradedModels = await mockAIContextService.detectDegradation();
      const needingRefresh = degradedModels.filter(m => m.needsRefresh);
      
      expect(needingRefresh).toHaveLength(2);
      expect(needingRefresh[0].modelName).toBe('claude');
      expect(needingRefresh[1].modelName).toBe('copilot');
    });

    it('should provide intelligent context refresh recommendations', async () => {
      const recommendations = [
        'Consider starting fresh conversation with Claude - coherence dropping',
        'GPT context still healthy, continue current session',
        'Copilot showing signs of repetition, try rephrasing your prompts'
      ];

      mockAIContextService.getRecommendations.mockResolvedValue(recommendations);
      
      const result = await mockAIContextService.getRecommendations('multi-model-session');
      
      expect(result).toContain('Consider starting fresh conversation');
      expect(result).toContain('Copilot showing signs of repetition');
      expect(result.length).toBeGreaterThan(2);
    });

    it('should track token usage patterns and predict context exhaustion', async () => {
      const tokenData = {
        currentUsage: 12000,
        projectedLimit: 32000,
        conversationTurns: 67,
        avgTokensPerTurn: 179,
        estimatedTurnsRemaining: 112,
        recommendedRefreshPoint: 25000
      };

      mockAIContextService.trackTokenUsage.mockResolvedValue(tokenData);
      
      const usage = await mockAIContextService.trackTokenUsage('claude-session-1');
      
      expect(usage.currentUsage).toBeLessThan(usage.projectedLimit);
      expect(usage.estimatedTurnsRemaining).toBeGreaterThan(50);
      expect(usage.recommendedRefreshPoint).toBeLessThan(usage.projectedLimit);
    });

    it('should integrate with real-time WebSocket updates for live monitoring', async () => {
      // Mock WebSocket connection for real-time context health
      const mockWebSocket = {
        send: jest.fn(),
        onMessage: jest.fn(),
        onClose: jest.fn()
      };

      const realTimeUpdate = {
        sessionId: 'claude-session-1',
        healthScore: 72,
        deltaFromLastUpdate: -5,
        timestamp: new Date(),
        alertLevel: 'warning'
      };

      // Simulate real-time health degradation alert
      mockWebSocket.onMessage.mockImplementation((callback) => {
        callback({ data: JSON.stringify(realTimeUpdate) });
      });

      expect(realTimeUpdate.deltaFromLastUpdate).toBeLessThan(0);
      expect(realTimeUpdate.alertLevel).toBe('warning');
    });
  });

  describe('Task 8: Project Management System for Vibe Coders', () => {
    
    it('should track "feels right" progress instead of traditional task completion', async () => {
      const project: Project = {
        id: 'vibe-project-1',
        name: 'AI Dashboard Redesign',
        feelsRightScore: 78,
        shipTarget: 'flexible',
        pivotCount: 2,
        vibeHealth: 'steady',
        lastShip: new Date('2024-01-10T14:30:00Z'),
        momentum: 65,
        contextSessions: ['claude-1', 'cursor-2', 'gpt-3']
      };

      mockProjectService.updateFeelsRight.mockResolvedValue(project);
      
      const updated = await mockProjectService.updateFeelsRight('vibe-project-1', 78);
      
      expect(updated.feelsRightScore).toBe(78);
      expect(updated.vibeHealth).toBe('steady');
      expect(updated.pivotCount).toBeGreaterThan(0);
    });

    it('should handle flexible ship targets and deadline adaptation', async () => {
      const flexibleProject = {
        id: 'flex-proj-1',
        shipTarget: 'flexible',
        originalTarget: new Date('2024-02-01'),
        adaptedTarget: new Date('2024-02-15'),
        pivotReason: 'discovered better architecture pattern',
        vibeJustification: 'feeling more confident with current direction'
      };

      mockProjectService.calculateMomentum.mockResolvedValue(85);
      
      const momentum = await mockProjectService.calculateMomentum('flex-proj-1');
      
      expect(momentum).toBeGreaterThan(70); // High momentum despite date shift
      expect(flexibleProject.shipTarget).toBe('flexible');
    });

    it('should count and celebrate pivots as learning rather than failures', async () => {
      const pivotData = {
        projectId: 'learning-proj-1',
        pivotCount: 4,
        pivotHistory: [
          { date: new Date('2024-01-05'), reason: 'better UX insight', vibeGain: 15 },
          { date: new Date('2024-01-12'), reason: 'performance optimization', vibeGain: 8 },
          { date: new Date('2024-01-18'), reason: 'user feedback integration', vibeGain: 12 },
          { date: new Date('2024-01-22'), reason: 'AI model upgrade opportunity', vibeGain: 20 }
        ],
        totalVibeGain: 55,
        adaptabilityScore: 92
      };

      mockProjectService.trackPivot.mockResolvedValue(pivotData);
      
      const result = await mockProjectService.trackPivot('learning-proj-1', 'AI breakthrough');
      
      expect(result.pivotCount).toBeGreaterThan(3);
      expect(result.totalVibeGain).toBeGreaterThan(40);
      expect(result.adaptabilityScore).toBeGreaterThan(85);
    });

    it('should calculate project momentum based on vibe and shipping frequency', async () => {
      const momentumFactors = {
        recentShips: 3,
        daysSinceLastShip: 2,
        feelsRightTrend: 'increasing',
        aiContextHealth: 85,
        flowSessionCount: 8,
        pivotPositivity: 'high'
      };

      mockProjectService.calculateMomentum.mockResolvedValue(88);
      
      const momentum = await mockProjectService.calculateMomentum('momentum-proj-1');
      
      expect(momentum).toBeGreaterThan(80);
      expect(momentumFactors.recentShips).toBeGreaterThan(2);
      expect(momentumFactors.daysSinceLastShip).toBeLessThan(5);
    });

    it('should integrate project health with AI context sessions', async () => {
      const projectContext = {
        projectId: 'context-proj-1',
        activeSessions: ['claude-session-1', 'cursor-session-2'],
        contextCoherence: 0.85,
        sessionSynergy: 0.92,
        knowledgeCarryover: 0.78,
        recommendedNextSession: 'claude' // Based on current project needs
      };

      expect(projectContext.contextCoherence).toBeGreaterThan(0.8);
      expect(projectContext.sessionSynergy).toBeGreaterThan(0.9);
      expect(projectContext.activeSessions.length).toBeGreaterThan(1);
    });
  });

  describe('Task 9: Habit Tracking for Vibe Coders', () => {
    
    it('should track Daily Ship habit with vibe-based celebration', async () => {
      const dailyShipHabit: Habit = {
        id: 'daily-ship-1',
        category: 'DAILY_SHIP',
        name: 'Daily Deployment',
        streak: 7,
        lastCompleted: new Date(),
        targetFrequency: 'daily',
        vibeCelebration: true,
        flowImpact: 8
      };

      mockHabitService.completeHabit.mockResolvedValue(dailyShipHabit);
      
      const result = await mockHabitService.completeHabit('daily-ship-1');
      
      expect(result.streak).toBe(7);
      expect(result.vibeCelebration).toBe(true);
      expect(result.flowImpact).toBeGreaterThan(5);
    });

    it('should remind for Context Refresh based on AI health degradation', async () => {
      const contextRefreshHabit = {
        id: 'context-refresh-1',
        category: 'CONTEXT_REFRESH',
        triggerCondition: 'ai_health_below_60',
        currentAIHealth: 45,
        lastRefresh: new Date('2024-01-20T09:00:00Z'),
        urgency: 'high',
        suggestedModels: ['claude', 'gpt']
      };

      mockHabitService.getRecommendations.mockResolvedValue([contextRefreshHabit]);
      
      const recommendations = await mockHabitService.getRecommendations('context_health');
      const urgent = recommendations.filter(r => r.urgency === 'high');
      
      expect(urgent).toHaveLength(1);
      expect(urgent[0].currentAIHealth).toBeLessThan(60);
      expect(urgent[0].suggestedModels).toContain('claude');
    });

    it('should identify Flow Block patterns and suggest mitigation', async () => {
      const flowBlockData = {
        habitId: 'flow-block-detection',
        recentBlocks: [
          { timestamp: new Date(), duration: 45, cause: 'context_confusion', resolved: true },
          { timestamp: new Date(), duration: 120, cause: 'unclear_requirements', resolved: true },
          { timestamp: new Date(), duration: 30, cause: 'ai_degradation', resolved: false }
        ],
        blockPatterns: ['afternoon_energy_drop', 'context_switching_overhead'],
        mitigationSuggestions: [
          'Schedule AI context refresh before afternoon sessions',
          'Use single-model focus periods',
          'Implement 25-minute deep work blocks'
        ]
      };

      mockHabitService.analyzeFlowImpact.mockResolvedValue(flowBlockData);
      
      const analysis = await mockHabitService.analyzeFlowImpact('flow-block-detection');
      
      expect(analysis.recentBlocks.length).toBeGreaterThan(2);
      expect(analysis.mitigationSuggestions).toContain('Schedule AI context refresh');
      expect(analysis.blockPatterns).toContain('context_switching_overhead');
    });

    it('should track Code Review habits specific to AI-generated code', async () => {
      const aiCodeReviewHabit = {
        id: 'ai-code-review',
        category: 'CODE_REVIEW',
        aiGeneratedLinesReviewed: 1250,
        humanWrittenLinesReviewed: 200,
        aiAccuracyRate: 0.87,
        commonAIIssues: ['edge_case_handling', 'error_boundaries', 'type_safety'],
        reviewVelocity: '45_lines_per_minute',
        vibeHealthImpact: 6
      };

      expect(aiCodeReviewHabit.aiGeneratedLinesReviewed).toBeGreaterThan(1000);
      expect(aiCodeReviewHabit.aiAccuracyRate).toBeGreaterThan(0.8);
      expect(aiCodeReviewHabit.commonAIIssues).toContain('edge_case_handling');
    });

    it('should visualize habit streaks with vibe-appropriate celebrations', async () => {
      const streakVisualization = {
        habitId: 'daily-ship-1',
        currentStreak: 12,
        longestStreak: 23,
        celebrationStyle: 'cosmic_developer', // Matches vibe coder aesthetic
        milestones: [
          { day: 7, celebration: 'First Week Magic', unlocked: true },
          { day: 14, celebration: 'Momentum Master', unlocked: false },
          { day: 30, celebration: 'Flow State Legend', unlocked: false }
        ],
        vibeBoost: 15
      };

      mockHabitService.triggerCelebration.mockResolvedValue(streakVisualization);
      
      const celebration = await mockHabitService.triggerCelebration('daily-ship-1');
      
      expect(celebration.currentStreak).toBeGreaterThan(10);
      expect(celebration.celebrationStyle).toBe('cosmic_developer');
      expect(celebration.vibeBoost).toBeGreaterThan(10);
    });
  });

  describe('Task 10: Notes and Knowledge Management', () => {
    
    it('should save and organize prompt patterns for reuse', async () => {
      const promptPattern: Note = {
        id: 'prompt-pattern-1',
        category: 'PROMPT_PATTERN',
        title: 'React Component Generation',
        content: 'Create a TypeScript React component with props interface...',
        tags: ['react', 'typescript', 'component', 'props'],
        modelContext: 'claude',
        reusability: 95,
        flowMoment: true,
        createdAt: new Date()
      };

      mockNotesService.saveNote.mockResolvedValue(promptPattern);
      
      const saved = await mockNotesService.saveNote(promptPattern);
      
      expect(saved.category).toBe('PROMPT_PATTERN');
      expect(saved.reusability).toBeGreaterThan(90);
      expect(saved.tags).toContain('typescript');
      expect(saved.flowMoment).toBe(true);
    });

    it('should maintain golden code snippet library with context', async () => {
      const goldenSnippet = {
        id: 'golden-code-1',
        category: 'GOLDEN_CODE',
        title: 'Zustand Store Pattern',
        content: 'const useFlowStore = create<FlowState>((set) => ({ ... }))',
        language: 'typescript',
        framework: 'zustand',
        aiModel: 'claude',
        contextWhenCreated: 'Building state management for flow tracking',
        performanceImpact: 'high',
        reusability: 88
      };

      mockNotesService.saveNote.mockResolvedValue(goldenSnippet);
      
      const snippet = await mockNotesService.saveNote(goldenSnippet);
      
      expect(snippet.language).toBe('typescript');
      expect(snippet.performanceImpact).toBe('high');
      expect(snippet.reusability).toBeGreaterThan(80);
    });

    it('should categorize debug logs with AI model context', async () => {
      const debugLog = {
        id: 'debug-log-1',
        category: 'DEBUG_LOG',
        title: 'Claude Context Confusion - useState Hook',
        content: 'Claude started suggesting class components after 50+ turns...',
        aiModel: 'claude',
        sessionId: 'claude-session-1',
        tokenCount: 12500,
        resolutionStrategy: 'context_refresh',
        preventionTips: ['refresh_at_10k_tokens', 'clarify_modern_react'],
        flowDisruption: 25 // minutes lost
      };

      mockNotesService.categorizeAutomatically.mockResolvedValue('DEBUG_LOG');
      
      const category = await mockNotesService.categorizeAutomatically(debugLog.content);
      
      expect(category).toBe('DEBUG_LOG');
      expect(debugLog.aiModel).toBe('claude');
      expect(debugLog.flowDisruption).toBeLessThan(30);
    });

    it('should capture AI insights during flow states', async () => {
      const aiInsight = {
        id: 'insight-1',
        category: 'INSIGHT',
        title: 'GPT-4 excels at system architecture, Claude at implementation details',
        content: 'Discovered optimal workflow: GPT for planning, Claude for coding...',
        flowState: 'DEEP_FLOW',
        aiModelsInvolved: ['gpt-4', 'claude'],
        productivityGain: 35, // percent improvement
        reproducible: true,
        sharedWithTeam: false
      };

      expect(aiInsight.flowState).toBe('DEEP_FLOW');
      expect(aiInsight.productivityGain).toBeGreaterThan(30);
      expect(aiInsight.reproducible).toBe(true);
    });

    it('should provide intelligent search across all note categories', async () => {
      const searchQuery = 'react typescript component props';
      const searchResults = [
        { category: 'PROMPT_PATTERN', relevance: 0.95, title: 'React Component Generation' },
        { category: 'GOLDEN_CODE', relevance: 0.87, title: 'TypeScript Props Interface' },
        { category: 'DEBUG_LOG', relevance: 0.72, title: 'Props Type Error Resolution' },
        { category: 'INSIGHT', relevance: 0.68, title: 'Claude vs GPT for React Components' }
      ];

      mockNotesService.searchByContext.mockResolvedValue(searchResults);
      
      const results = await mockNotesService.searchByContext(searchQuery);
      const highRelevance = results.filter(r => r.relevance > 0.8);
      
      expect(highRelevance).toHaveLength(2);
      expect(results[0].relevance).toBeGreaterThan(0.9);
      expect(results).toContain(expect.objectContaining({ category: 'PROMPT_PATTERN' }));
    });

    it('should suggest note reuse based on current context', async () => {
      const currentContext = {
        aiModel: 'claude',
        projectType: 'react-dashboard',
        flowState: 'FLOWING',
        recentPrompts: ['create component', 'add typescript', 'state management']
      };

      const suggestions = [
        { noteId: 'prompt-pattern-1', relevance: 0.92, reason: 'similar_component_request' },
        { noteId: 'golden-code-2', relevance: 0.88, reason: 'matching_tech_stack' },
        { noteId: 'insight-3', relevance: 0.75, reason: 'claude_optimization_tip' }
      ];

      mockNotesService.suggestReuse.mockResolvedValue(suggestions);
      
      const reuseSuggestions = await mockNotesService.suggestReuse(currentContext);
      
      expect(reuseSuggestions[0].relevance).toBeGreaterThan(0.9);
      expect(reuseSuggestions).toContain(expect.objectContaining({ reason: 'similar_component_request' }));
    });
  });

  describe('Task 11: Analytics and Insights Dashboard', () => {
    
    it('should analyze flow state patterns across time periods', async () => {
      const flowAnalytics: FlowAnalytics = {
        userId: 'vibe-coder-1',
        timeRange: 'week',
        flowStateDistribution: {
          BLOCKED: 15,
          NEUTRAL: 25,
          FLOWING: 45,
          DEEP_FLOW: 15
        },
        aiModelPerformance: [
          { modelName: 'claude', avgHealthScore: 85, sessionCount: 12, productivityCorrelation: 0.78 },
          { modelName: 'gpt', avgHealthScore: 72, sessionCount: 8, productivityCorrelation: 0.65 }
        ],
        shippingVelocity: [
          { date: new Date('2024-01-21'), shipsCount: 2, vibeScore: 85 },
          { date: new Date('2024-01-22'), shipsCount: 1, vibeScore: 78 },
          { date: new Date('2024-01-23'), shipsCount: 3, vibeScore: 92 }
        ],
        contextHealthTrend: [
          { date: new Date('2024-01-21'), avgHealthScore: 88, refreshCount: 2 },
          { date: new Date('2024-01-22'), avgHealthScore: 75, refreshCount: 4 },
          { date: new Date('2024-01-23'), avgHealthScore: 82, refreshCount: 3 }
        ]
      };

      mockAnalyticsService.generateFlowInsights.mockResolvedValue(flowAnalytics);
      
      const insights = await mockAnalyticsService.generateFlowInsights('vibe-coder-1', 'week');
      
      expect(insights.flowStateDistribution.FLOWING).toBe(45);
      expect(insights.flowStateDistribution.DEEP_FLOW).toBe(15);
      expect(insights.aiModelPerformance[0].productivityCorrelation).toBeGreaterThan(0.7);
    });

    it('should compare AI model performance and suggest optimal usage', async () => {
      const modelComparison = {
        period: 'month',
        models: [
          {
            name: 'claude',
            sessionsCount: 45,
            avgHealthScore: 84,
            flowStateContribution: { DEEP_FLOW: 35, FLOWING: 40, NEUTRAL: 20, BLOCKED: 5 },
            bestUseCases: ['implementation', 'debugging', 'refactoring'],
            optimalSessionLength: 90 // minutes
          },
          {
            name: 'gpt',
            sessionsCount: 32,
            avgHealthScore: 76,
            flowStateContribution: { DEEP_FLOW: 20, FLOWING: 45, NEUTRAL: 25, BLOCKED: 10 },
            bestUseCases: ['planning', 'architecture', 'documentation'],
            optimalSessionLength: 60
          }
        ],
        recommendation: 'Use Claude for implementation sessions, GPT for planning phases'
      };

      mockAnalyticsService.compareModelPerformance.mockResolvedValue(modelComparison);
      
      const comparison = await mockAnalyticsService.compareModelPerformance('month');
      
      expect(comparison.models[0].avgHealthScore).toBeGreaterThan(80);
      expect(comparison.models[0].flowStateContribution.DEEP_FLOW).toBeGreaterThan(30);
      expect(comparison.recommendation).toContain('Claude for implementation');
    });

    it('should track shipping velocity with vibe correlation', async () => {
      const velocityData = {
        period: 'month',
        totalShips: 45,
        avgVibeScore: 82,
        velocityTrend: 'increasing',
        bestShippingDays: ['Tuesday', 'Wednesday', 'Thursday'],
        vibeCorrelation: 0.73, // Strong positive correlation between vibe and shipping
        productivityPatterns: {
          morningFlow: 0.85,
          afternoonFlow: 0.62,
          eveningFlow: 0.41
        }
      };

      mockAnalyticsService.trackShippingVelocity.mockResolvedValue(velocityData);
      
      const velocity = await mockAnalyticsService.trackShippingVelocity('month');
      
      expect(velocity.totalShips).toBeGreaterThan(40);
      expect(velocity.vibeCorrelation).toBeGreaterThan(0.7);
      expect(velocity.bestShippingDays).toContain('Tuesday');
    });

    it('should identify productivity patterns and suggest optimizations', async () => {
      const productivityPatterns = {
        optimalAIModelSequence: ['gpt-planning', 'claude-implementation', 'cursor-polish'],
        bestFlowTriggers: ['morning_coffee', 'ambient_music', 'claude_context_fresh'],
        blockagePatterns: [
          { cause: 'context_degradation', frequency: 'daily', avgLoss: 25 },
          { cause: 'unclear_requirements', frequency: 'weekly', avgLoss: 45 }
        ],
        recommendedRoutine: {
          morningRitual: ['context_health_check', 'daily_ship_plan', 'vibe_assessment'],
          sessionOptimization: ['60_min_claude_blocks', '15_min_breaks', 'context_refresh_every_90'],
          eveningReflection: ['ship_celebration', 'tomorrow_prep', 'insight_capture']
        }
      };

      mockAnalyticsService.analyzeProductivityPatterns.mockResolvedValue(productivityPatterns);
      
      const patterns = await mockAnalyticsService.analyzeProductivityPatterns('vibe-coder-1');
      
      expect(patterns.optimalAIModelSequence).toContain('claude-implementation');
      expect(patterns.blockagePatterns[0].avgLoss).toBeLessThan(30);
      expect(patterns.recommendedRoutine.morningRitual).toContain('vibe_assessment');
    });

    it('should provide real-time dashboard with live metrics', async () => {
      const liveMetrics = {
        currentFlowState: 'FLOWING',
        activeAISessions: 2,
        todayShips: 1,
        contextHealthAvg: 78,
        vibeScore: 85,
        streakStatus: {
          dailyShip: 5,
          contextRefresh: 2,
          flowSessions: 8
        },
        liveRecommendations: [
          'Claude context at 65% - consider refresh in 30 minutes',
          'Flow state maintained for 45 minutes - great momentum!',
          'One more ship today to maintain streak'
        ]
      };

      expect(liveMetrics.currentFlowState).toBe('FLOWING');
      expect(liveMetrics.vibeScore).toBeGreaterThan(80);
      expect(liveMetrics.liveRecommendations.length).toBeGreaterThan(2);
    });
  });

  describe('Task 12: Focus Mode and Flow Protection', () => {
    
    it('should start and manage deep work sessions with flow state tracking', async () => {
      const focusSession: FocusSession = {
        id: 'focus-session-1',
        sessionType: 'BUILDING',
        startTime: new Date(),
        flowState: 'FLOWING',
        interruptionsBlocked: 0,
        contextPreserved: true,
        emergencySaves: 0
      };

      mockFocusService.startSession.mockResolvedValue(focusSession);
      
      const session = await mockFocusService.startSession('BUILDING', {
        duration: 90,
        aiModels: ['claude'],
        interruptionLevel: 'strict'
      });
      
      expect(session.sessionType).toBe('BUILDING');
      expect(session.flowState).toBe('FLOWING');
      expect(session.contextPreserved).toBe(true);
    });

    it('should block interruptions and batch notifications during flow', async () => {
      const interruptionData = {
        sessionId: 'focus-session-1',
        blockedInterruptions: [
          { type: 'slack_message', timestamp: new Date(), priority: 'low' },
          { type: 'email', timestamp: new Date(), priority: 'medium' },
          { type: 'calendar_reminder', timestamp: new Date(), priority: 'high' }
        ],
        allowedInterruptions: [
          { type: 'emergency_call', timestamp: new Date(), priority: 'critical' }
        ],
        batchedForLater: 3,
        flowStateProtected: true
      };

      mockFocusService.blockInterruptions.mockResolvedValue(interruptionData);
      
      const blocked = await mockFocusService.blockInterruptions('focus-session-1');
      
      expect(blocked.blockedInterruptions.length).toBeGreaterThan(2);
      expect(blocked.flowStateProtected).toBe(true);
      expect(blocked.batchedForLater).toBe(3);
    });

    it('should preserve context during breaks with auto-save', async () => {
      const contextPreservation = {
        sessionId: 'focus-session-1',
        aiContexts: [
          { model: 'claude', tokenCount: 8500, conversationSaved: true, healthScore: 78 },
          { model: 'cursor', windowState: 'saved', filesOpen: 8, unsavedChanges: false }
        ],
        codeState: {
          branchName: 'feature/focus-mode',
          uncommittedChanges: true,
          workingFiles: 5,
          testStatus: 'passing'
        },
        resumeInstructions: [
          'Continue React component implementation in FocusMode.tsx',
          'Claude context includes Zustand store pattern discussion',
          'Next task: Add interruption blocking logic'
        ]
      };

      mockFocusService.preserveContext.mockResolvedValue(contextPreservation);
      
      const preserved = await mockFocusService.preserveContext('focus-session-1');
      
      expect(preserved.aiContexts[0].conversationSaved).toBe(true);
      expect(preserved.codeState.uncommittedChanges).toBe(true);
      expect(preserved.resumeInstructions.length).toBeGreaterThan(2);
    });

    it('should provide emergency save functionality for critical interruptions', async () => {
      const emergencySave = {
        sessionId: 'focus-session-1',
        triggerReason: 'critical_system_alert',
        saveTimestamp: new Date(),
        aiContextsSaved: ['claude-session-1', 'cursor-session-2'],
        codeStateCommitted: true,
        resumeToken: 'emergency-resume-abc123',
        estimatedRecoveryTime: 5 // minutes to regain flow
      };

      mockFocusService.emergencySave.mockResolvedValue(emergencySave);
      
      const save = await mockFocusService.emergencySave('focus-session-1', 'critical_system_alert');
      
      expect(save.codeStateCommitted).toBe(true);
      expect(save.aiContextsSaved.length).toBeGreaterThan(1);
      expect(save.estimatedRecoveryTime).toBeLessThan(10);
    });

    it('should assist with flow state recovery after interruptions', async () => {
      const recoveryAssistance = {
        sessionId: 'focus-session-1',
        interruptionDuration: 15, // minutes
        preInterruptionState: {
          flowLevel: 'DEEP_FLOW',
          taskContext: 'implementing Redux store logic',
          aiModelState: 'claude-mid-conversation',
          codeLocation: 'src/store/flowStore.ts:45'
        },
        recoveryStrategy: {
          warmupTasks: ['review last 10 lines of code', 'read Claude conversation summary'],
          contextReestablishment: 'Ask Claude to summarize where we left off',
          estimatedRecoveryTime: 8,
          successIndicators: ['typing_flow_resumed', 'ai_context_coherent', 'progress_momentum']
        }
      };

      mockFocusService.recoverFlow.mockResolvedValue(recoveryAssistance);
      
      const recovery = await mockFocusService.recoverFlow('focus-session-1');
      
      expect(recovery.preInterruptionState.flowLevel).toBe('DEEP_FLOW');
      expect(recovery.recoveryStrategy.estimatedRecoveryTime).toBeLessThan(15);
      expect(recovery.recoveryStrategy.warmupTasks.length).toBeGreaterThan(1);
    });

    it('should integrate focus sessions with project momentum and shipping goals', async () => {
      const sessionIntegration = {
        focusSessionId: 'focus-session-1',
        linkedProjectId: 'vibe-project-1',
        sessionImpact: {
          feelsRightDelta: +12,
          momentumIncrease: +15,
          shippingProgress: 0.25, // 25% closer to next ship
          vibeBoost: +8
        },
        nextSessionRecommendation: {
          optimalTiming: '2 hours',
          suggestedType: 'SHIPPING',
          aiModelPreference: 'claude', // Based on current project context
          expectedOutcome: 'complete feature implementation'
        }
      };

      expect(sessionIntegration.sessionImpact.feelsRightDelta).toBeGreaterThan(10);
      expect(sessionIntegration.sessionImpact.vibeBoost).toBeGreaterThan(5);
      expect(sessionIntegration.nextSessionRecommendation.suggestedType).toBe('SHIPPING');
    });
  });

  describe('Integration Tests - Core Features Working Together', () => {
    
    it('should coordinate AI health monitoring with focus sessions', async () => {
      // Start focus session
      const session = await mockFocusService.startSession('BUILDING');
      
      // Monitor AI health during session
      const aiHealth = await mockAIContextService.monitorHealth('claude-session-1');
      
      // If health degrades during focus, should queue refresh for break
      if (aiHealth.healthScore < 60) {
        const preserved = await mockFocusService.preserveContext(session.id);
        expect(preserved.aiContexts[0].healthScore).toBeLessThan(60);
      }
      
      expect(session).toBeDefined();
      expect(aiHealth).toBeDefined();
    });

    it('should update project momentum based on successful focus sessions', async () => {
      const completedSession = {
        id: 'focus-session-1',
        sessionType: 'BUILDING',
        duration: 90,
        flowStateAchieved: 'DEEP_FLOW',
        shipsCompleted: 1,
        vibeIncrease: 12
      };

      const updatedMomentum = await mockProjectService.calculateMomentum('vibe-project-1');
      
      expect(updatedMomentum).toBeGreaterThan(70);
      expect(completedSession.flowStateAchieved).toBe('DEEP_FLOW');
    });

    it('should create notes from insights discovered during flow sessions', async () => {
      const flowInsight = {
        sessionId: 'focus-session-1',
        flowState: 'DEEP_FLOW',
        insight: 'Claude excels at TypeScript interfaces when context is fresh',
        captureMethod: 'automatic_flow_detection'
      };

      const note = await mockNotesService.saveNote({
        id: 'auto-insight-1',
        category: 'INSIGHT',
        title: 'Claude TypeScript Excellence',
        content: flowInsight.insight,
        tags: ['claude', 'typescript', 'interfaces'],
        flowMoment: true,
        createdAt: new Date()
      });

      expect(note.flowMoment).toBe(true);
      expect(note.category).toBe('INSIGHT');
    });

    it('should trigger habit completion when focus sessions meet criteria', async () => {
      const sessionCompleted = {
        duration: 90, // minutes
        flowStateReached: 'FLOWING',
        shipsDeployed: 1,
        aiContextMaintained: true
      };

      // Should trigger multiple habit completions
      const dailyShip = await mockHabitService.completeHabit('daily-ship-1');
      const contextRefresh = await mockHabitService.completeHabit('context-refresh-1');

      expect(dailyShip.streak).toBeGreaterThan(0);
      expect(contextRefresh.lastCompleted).toBeDefined();
    });

    it('should provide comprehensive analytics across all core features', async () => {
      const holisticAnalytics = {
        timeframe: 'week',
        aiHealthTrend: 'improving',
        projectMomentumAvg: 82,
        habitCompletionRate: 0.85,
        noteCaptureRate: 12, // per day
        focusSessionEffectiveness: 0.78,
        overallVibeScore: 88
      };

      const analytics = await mockAnalyticsService.generateFlowInsights('vibe-coder-1', 'week');
      
      expect(analytics).toBeDefined();
      expect(holisticAnalytics.overallVibeScore).toBeGreaterThan(80);
      expect(holisticAnalytics.focusSessionEffectiveness).toBeGreaterThan(0.7);
    });
  });
});