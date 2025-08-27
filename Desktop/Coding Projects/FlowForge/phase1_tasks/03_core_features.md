# Core Features Tasks (7-12)
**Main Application Functionality**

## Overview

The Core Features layer implements FlowForge's unique value proposition for AI-assisted developers. These tasks build the essential productivity tools that differentiate FlowForge from traditional task managers by focusing on AI context health, flow states, and shipping velocity.

**Timeline**: Month 2, Week 1-4  
**Dependencies**: Foundation Layer (1-3) + UI/UX Implementation (4-6)  
**Philosophy**: Vibe-centric productivity tracking for AI-assisted development

---

## Task 7: Create AI Context Health Monitoring System 🧠

### Objective
Develop a comprehensive system that tracks AI context degradation, provides warnings, and integrates with Claude Desktop, VS Code, and Cursor through MCP (Model Context Protocol) servers. Include health scoring algorithms and intelligent suggestion engine.

### AI Context Architecture

#### Context Health Monitoring Service
```typescript
// src/lib/ai-context-monitor.ts
export interface AIContextHealth {
  contextType: string
  healthScore: number // 0-100
  lastActivityAt: Date
  issues: string[]
  suggestions: string[]
  metadata: Record<string, any>
}

export interface ContextMetrics {
  conversationLength: number
  contextSwitches: number
  errorRate: number
  responseLatency: number
  memoryUsage?: number
  openFiles?: number
  activeTime?: number
}

export class AIContextMonitor {
  private static readonly HEALTH_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 70,
    FAIR: 50,
    POOR: 30,
  }

  static async updateContextHealth(
    userId: string,
    contextType: string,
    metrics: ContextMetrics
  ): Promise<AIContextHealth> {
    const healthScore = this.calculateHealthScore(contextType, metrics)
    const issues = this.identifyIssues(contextType, metrics, healthScore)
    const suggestions = this.generateSuggestions(contextType, issues, healthScore)

    // Update database
    const aiContext = await db.aIContext.upsert({
      where: {
        userId_contextType: { userId, contextType }
      },
      update: {
        healthScore: healthScore / 100,
        lastActivityAt: new Date(),
        metadata: metrics,
        issues,
        suggestions,
      },
      create: {
        userId,
        contextType,
        healthScore: healthScore / 100,
        lastActivityAt: new Date(),
        metadata: metrics,
        issues,
        suggestions,
      },
    })

    return {
      contextType,
      healthScore,
      lastActivityAt: new Date(),
      issues,
      suggestions,
      metadata: metrics,
    }
  }

  private static calculateHealthScore(
    contextType: string,
    metrics: ContextMetrics
  ): number {
    let score = 100

    // Universal scoring factors
    if (metrics.errorRate > 0.1) {
      score -= Math.min(30, (metrics.errorRate - 0.1) * 200)
    }

    if (metrics.responseLatency > 2000) {
      score -= Math.min(20, (metrics.responseLatency - 2000) / 100)
    }

    // Context-specific scoring
    switch (contextType) {
      case 'claude_desktop':
        score = this.scoreClaudeContext(score, metrics)
        break
      case 'vscode':
        score = this.scoreVSCodeContext(score, metrics)
        break
      case 'cursor':
        score = this.scoreCursorContext(score, metrics)
        break
    }

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  private static scoreClaudeContext(baseScore: number, metrics: ContextMetrics): number {
    let score = baseScore

    // Penalize excessive context switches
    if (metrics.contextSwitches > 10) {
      score -= Math.min(25, (metrics.contextSwitches - 10) * 2)
    }

    // Penalize very long conversations without breaks
    if (metrics.conversationLength > 50) {
      score -= Math.min(15, (metrics.conversationLength - 50) * 0.5)
    }

    // Bonus for steady conversation flow
    if (metrics.conversationLength > 10 && metrics.contextSwitches < 5) {
      score += 5
    }

    return score
  }

  private static scoreVSCodeContext(baseScore: number, metrics: ContextMetrics): number {
    let score = baseScore

    if (metrics.openFiles && metrics.openFiles > 15) {
      score -= Math.min(20, (metrics.openFiles - 15) * 1.5)
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 0.8) {
      score -= Math.min(25, (metrics.memoryUsage - 0.8) * 100)
    }

    if (metrics.activeTime && metrics.activeTime > 4 * 60 * 60 * 1000) { // 4 hours
      score -= 10
    }

    return score
  }

  private static scoreCursorContext(baseScore: number, metrics: ContextMetrics): number {
    // Similar to VS Code but with Cursor-specific optimizations
    return this.scoreVSCodeContext(baseScore, metrics)
  }

  private static identifyIssues(
    contextType: string,
    metrics: ContextMetrics,
    healthScore: number
  ): string[] {
    const issues: string[] = []

    if (healthScore < this.HEALTH_THRESHOLDS.FAIR) {
      if (metrics.errorRate > 0.15) {
        issues.push('High error rate detected - responses may be unreliable')
      }

      if (metrics.responseLatency > 3000) {
        issues.push('Slow response times - context may be overloaded')
      }

      switch (contextType) {
        case 'claude_desktop':
          if (metrics.contextSwitches > 15) {
            issues.push('Frequent context switching degrading conversation quality')
          }
          if (metrics.conversationLength > 75) {
            issues.push('Very long conversation - consider starting fresh')
          }
          break

        case 'vscode':
        case 'cursor':
          if (metrics.openFiles && metrics.openFiles > 20) {
            issues.push('Too many files open - affecting AI context awareness')
          }
          if (metrics.memoryUsage && metrics.memoryUsage > 0.85) {
            issues.push('High memory usage detected - consider restarting editor')
          }
          break
      }
    }

    return issues
  }

  private static generateSuggestions(
    contextType: string,
    issues: string[],
    healthScore: number
  ): string[] {
    const suggestions: string[] = []

    if (healthScore < this.HEALTH_THRESHOLDS.GOOD) {
      suggestions.push('Consider taking a short break to reset context')

      switch (contextType) {
        case 'claude_desktop':
          if (issues.some(i => i.includes('context switching'))) {
            suggestions.push('Focus on one topic per conversation for better results')
          }
          if (issues.some(i => i.includes('long conversation'))) {
            suggestions.push('Start a new conversation to refresh context')
          }
          if (issues.some(i => i.includes('error rate'))) {
            suggestions.push('Provide more specific context and examples in prompts')
          }
          break

        case 'vscode':
        case 'cursor':
          if (issues.some(i => i.includes('files open'))) {
            suggestions.push('Close unused files to improve AI context')
          }
          if (issues.some(i => i.includes('memory usage'))) {
            suggestions.push('Restart your editor to free up memory')
          }
          if (issues.some(i => i.includes('response times'))) {
            suggestions.push('Reduce workspace complexity or switch to simpler queries')
          }
          break
      }
    } else if (healthScore >= this.HEALTH_THRESHOLDS.EXCELLENT) {
      suggestions.push('Great context health! Perfect time for complex tasks')
    }

    return suggestions
  }

  static async getContextHealthSummary(userId: string) {
    const contexts = await db.aIContext.findMany({
      where: { userId },
      orderBy: { lastActivityAt: 'desc' }
    })

    const overallHealth = contexts.length > 0
      ? contexts.reduce((sum, ctx) => sum + (ctx.healthScore * 100), 0) / contexts.length
      : 100

    const activeContexts = contexts.filter(
      ctx => new Date().getTime() - ctx.lastActivityAt.getTime() < 30 * 60 * 1000 // 30 minutes
    )

    return {
      overallHealth: Math.round(overallHealth),
      activeContexts: activeContexts.length,
      totalContexts: contexts.length,
      contexts: contexts.map(ctx => ({
        contextType: ctx.contextType,
        healthScore: Math.round(ctx.healthScore * 100),
        lastActivityAt: ctx.lastActivityAt,
        issues: ctx.issues,
        suggestions: ctx.suggestions,
      }))
    }
  }
}
```

#### MCP Server Integration
```typescript
// src/lib/mcp-integration.ts
interface MCPMessage {
  type: 'context_update' | 'health_check' | 'metrics_report'
  data: any
  timestamp: Date
}

interface MCPServer {
  name: string
  endpoint: string
  capabilities: string[]
  isConnected: boolean
}

export class MCPIntegrationService {
  private servers: Map<string, MCPServer> = new Map()
  private eventListeners: Map<string, Function[]> = new Map()

  constructor() {
    this.initializeServers()
  }

  private initializeServers() {
    const servers = [
      {
        name: 'claude_desktop',
        endpoint: 'claude-desktop://mcp',
        capabilities: ['context-health', 'session-tracking', 'conversation-metrics']
      },
      {
        name: 'vscode',
        endpoint: 'vscode://mcp-extension',
        capabilities: ['file-context', 'workspace-metrics', 'ai-completions']
      },
      {
        name: 'cursor',
        endpoint: 'cursor://mcp-api',
        capabilities: ['ai-context', 'code-analysis', 'completion-metrics']
      }
    ]

    servers.forEach(server => {
      this.servers.set(server.name, {
        ...server,
        isConnected: false
      })
    })
  }

  async connectToServer(serverName: string): Promise<boolean> {
    const server = this.servers.get(serverName)
    if (!server) return false

    try {
      // Attempt connection to MCP server
      const response = await fetch(server.endpoint + '/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FlowForge-Client': 'web-app'
        },
        body: JSON.stringify({
          capabilities: ['context-monitoring', 'metrics-collection']
        })
      })

      if (response.ok) {
        server.isConnected = true
        this.startHealthMonitoring(serverName)
        return true
      }
    } catch (error) {
      console.warn(`Failed to connect to MCP server ${serverName}:`, error)
    }

    return false
  }

  private startHealthMonitoring(serverName: string) {
    const interval = setInterval(async () => {
      const server = this.servers.get(serverName)
      if (!server?.isConnected) {
        clearInterval(interval)
        return
      }

      try {
        const metrics = await this.fetchServerMetrics(serverName)
        if (metrics) {
          this.emit('metrics_update', { serverName, metrics })
        }
      } catch (error) {
        console.error(`Health monitoring error for ${serverName}:`, error)
      }
    }, 30000) // Check every 30 seconds
  }

  private async fetchServerMetrics(serverName: string): Promise<ContextMetrics | null> {
    const server = this.servers.get(serverName)
    if (!server?.isConnected) return null

    try {
      const response = await fetch(server.endpoint + '/metrics', {
        headers: { 'X-FlowForge-Client': 'web-app' }
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error(`Failed to fetch metrics from ${serverName}:`, error)
    }

    return null
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach(callback => callback(data))
  }

  async initializeAllServers() {
    const connectionPromises = Array.from(this.servers.keys()).map(
      serverName => this.connectToServer(serverName)
    )

    const results = await Promise.allSettled(connectionPromises)
    const connectedCount = results.filter(result => result.status === 'fulfilled' && result.value).length

    console.log(`Connected to ${connectedCount}/${this.servers.size} MCP servers`)
    return connectedCount
  }

  getConnectedServers(): string[] {
    return Array.from(this.servers.entries())
      .filter(([_, server]) => server.isConnected)
      .map(([name, _]) => name)
  }
}
```

#### AI Context Health Component
```typescript
// src/components/dashboard/ai-context-health.tsx
'use client'

import { useState, useEffect } from 'react'
import { AmbientCard } from '@/components/ui/ambient-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FlowIndicator } from '@/components/ui/flow-indicator'
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Settings,
  Lightbulb
} from 'lucide-react'
import { AIContextMonitor } from '@/lib/ai-context-monitor'
import { MCPIntegrationService } from '@/lib/mcp-integration'

interface AIContextData {
  contextType: string
  healthScore: number
  lastActivityAt: Date
  issues: string[]
  suggestions: string[]
  isConnected?: boolean
}

export function AIContextHealth() {
  const [contexts, setContexts] = useState<AIContextData[]>([])
  const [overallHealth, setOverallHealth] = useState<number>(100)
  const [loading, setLoading] = useState(true)
  const [mcpService] = useState(() => new MCPIntegrationService())

  useEffect(() => {
    initializeContextMonitoring()
    
    // Set up real-time updates
    const interval = setInterval(fetchContextHealth, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const initializeContextMonitoring = async () => {
    try {
      // Connect to MCP servers
      await mcpService.initializeAllServers()
      
      // Set up event listeners
      mcpService.on('metrics_update', handleMetricsUpdate)
      
      // Initial health fetch
      await fetchContextHealth()
    } catch (error) {
      console.error('Failed to initialize context monitoring:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchContextHealth = async () => {
    try {
      const response = await fetch('/api/ai-context/health')
      if (response.ok) {
        const data = await response.json()
        setContexts(data.contexts || [])
        setOverallHealth(data.overallHealth || 100)
      }
    } catch (error) {
      console.error('Failed to fetch context health:', error)
    }
  }

  const handleMetricsUpdate = async ({ serverName, metrics }: any) => {
    try {
      // Update context health with new metrics
      await fetch('/api/ai-context/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: serverName,
          metrics
        })
      })
      
      // Refresh display
      fetchContextHealth()
    } catch (error) {
      console.error('Failed to update context health:', error)
    }
  }

  const refreshContext = async (contextType: string) => {
    try {
      await fetch(`/api/ai-context/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextType })
      })
      
      // Show success feedback
      fetchContextHealth()
    } catch (error) {
      console.error('Failed to refresh context:', error)
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-flow-active'
    if (score >= 70) return 'text-blue-500'
    if (score >= 50) return 'text-flow-warning'
    return 'text-flow-blocked'
  }

  const getHealthBadgeVariant = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 70) return 'secondary' 
    if (score >= 50) return 'warning'
    return 'destructive'
  }

  const getHealthLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Poor'
  }

  if (loading) {
    return (
      <AmbientCard className="p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">
            Connecting to AI context monitors...
          </span>
        </div>
      </AmbientCard>
    )
  }

  return (
    <AmbientCard className="p-6" glow={overallHealth >= 90}>
      <div className="space-y-6">
        {/* Header with Overall Health */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-semibold">AI Context Health</h3>
              <p className="text-sm text-muted-foreground">
                {mcpService.getConnectedServers().length} of {contexts.length} connected
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${getHealthColor(overallHealth)}`}>
              {overallHealth}%
            </div>
            <Badge variant={getHealthBadgeVariant(overallHealth)}>
              {getHealthLabel(overallHealth)}
            </Badge>
          </div>
        </div>

        {/* Individual Context Health */}
        <div className="space-y-4">
          {contexts.map((context) => (
            <div 
              key={context.contextType} 
              className="p-4 bg-bg-secondary rounded-lg space-y-3"
            >
              {/* Context Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${getHealthColor(context.healthScore)}`} />
                    <span className="font-medium capitalize">
                      {context.contextType.replace('_', ' ')}
                    </span>
                  </div>
                  {context.isConnected && (
                    <Badge variant="outline" className="text-xs">
                      Connected
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold ${getHealthColor(context.healthScore)}`}>
                    {context.healthScore}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refreshContext(context.contextType)}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Health Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    context.healthScore >= 90 ? 'bg-flow-active' :
                    context.healthScore >= 70 ? 'bg-blue-500' :
                    context.healthScore >= 50 ? 'bg-flow-warning' :
                    'bg-flow-blocked'
                  }`}
                  style={{ width: `${context.healthScore}%` }}
                />
              </div>

              {/* Issues */}
              {context.issues.length > 0 && (
                <div className="space-y-2">
                  {context.issues.map((issue, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-flow-blocked mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">{issue}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {context.suggestions.length > 0 && (
                <div className="space-y-2">
                  {context.suggestions.slice(0, 2).map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-flow-active mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        {contexts.length === 0 && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-muted-foreground mb-4">
              No AI contexts detected
            </p>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configure Integrations
            </Button>
          </div>
        )}
      </div>
    </AmbientCard>
  )
}
```

### Implementation Steps

1. **Set up Context Monitoring Infrastructure**
   ```bash
   npm install ws @types/ws # For WebSocket server connections
   ```

2. **Create AI Context API Routes**
   - POST /api/ai-context/update (receive metrics from MCP servers)
   - GET /api/ai-context/health (get current health status)
   - POST /api/ai-context/refresh (trigger context refresh)

3. **Implement MCP Integration**
   - Protocol handlers for different MCP server types
   - Connection management and retry logic
   - Metrics collection and processing

4. **Build Health Scoring Algorithms**
   - Context-specific scoring rules
   - Issue detection logic
   - Suggestion generation system

5. **Create Real-time Updates**
   - WebSocket integration for live health updates
   - Background monitoring service
   - Alert system for critical health drops

### Acceptance Criteria
- [ ] Health scoring accurately reflects AI context quality
- [ ] MCP integration connects to available servers
- [ ] Issues and suggestions are contextually relevant
- [ ] Real-time updates work reliably
- [ ] Health warnings prevent poor AI interactions
- [ ] Context refresh functionality improves health scores
- [ ] Historical health data tracked for trends

### Testing Requirements
- [ ] Health scoring algorithms tested with various scenarios
- [ ] MCP server integration tested with mock servers
- [ ] Real-time updates work across browser sessions
- [ ] Context refresh improves health scores measurably
- [ ] UI responds appropriately to health changes

---

## Task 8: Implement Project Management with "Feels Right" Tracking 📊

### Objective
Build project tracking system with subjective "feels right" progress indicators, flexible ship targets, pivot counters, and visual project cards that celebrate exploration over rigid completion metrics.

### Project Management Architecture

#### Enhanced Project Model and Service
```typescript
// src/lib/projects.ts
import { db } from '@/lib/db'
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
  color: z.string().default('#3b82f6'),
  feelsRightScore: z.number().min(1).max(10).optional(),
  shipTarget: z.date().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export interface ProjectWithStats {
  id: string
  name: string
  description: string | null
  color: string
  status: 'ACTIVE' | 'PAUSED' | 'SHIPPED' | 'ABANDONED'
  feelsRightScore: number | null
  shipTarget: Date | null
  pivotCount: number
  lastWorkedAt: Date | null
  createdAt: Date
  updatedAt: Date
  
  // Computed stats
  stats: {
    totalSessions: number
    totalFocusTime: number // in minutes
    averageSessionLength: number
    lastWeekActivity: number
    momentum: 'building' | 'steady' | 'declining'
    streakDays: number
  }
  
  // Recent activity
  recentSessions: Array<{
    id: string
    type: string
    duration: number
    startedAt: Date
    status: string
  }>
}

export class ProjectService {
  static async createProject(
    userId: string, 
    data: z.infer<typeof createProjectSchema>
  ): Promise<ProjectWithStats> {
    const project = await db.project.create({
      data: {
        ...data,
        userId,
        pivotCount: 0,
      },
    })

    return this.enrichProjectWithStats(project)
  }

  static async updateProject(
    userId: string,
    projectId: string,
    data: z.infer<typeof updateProjectSchema>
  ): Promise<ProjectWithStats> {
    const project = await db.project.update({
      where: { id: projectId, userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return this.enrichProjectWithStats(project)
  }

  static async recordPivot(
    userId: string,
    projectId: string,
    pivotReason: string
  ): Promise<ProjectWithStats> {
    const project = await db.project.update({
      where: { id: projectId, userId },
      data: {
        pivotCount: { increment: 1 },
        updatedAt: new Date(),
      },
    })

    // Log the pivot for analytics
    await db.analytics.create({
      data: {
        userId,
        date: new Date(),
        metric: 'project_pivot',
        value: project.pivotCount,
        metadata: {
          projectId,
          projectName: project.name,
          reason: pivotReason,
        },
      },
    })

    return this.enrichProjectWithStats(project)
  }

  static async updateFeelsRightScore(
    userId: string,
    projectId: string,
    score: number
  ): Promise<ProjectWithStats> {
    const project = await db.project.update({
      where: { id: projectId, userId },
      data: {
        feelsRightScore: score,
        lastWorkedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Track feelings over time
    await db.analytics.create({
      data: {
        userId,
        date: new Date(),
        metric: 'feels_right_score',
        value: score,
        metadata: { projectId, projectName: project.name },
      },
    })

    return this.enrichProjectWithStats(project)
  }

  static async getProjectsWithStats(userId: string): Promise<ProjectWithStats[]> {
    const projects = await db.project.findMany({
      where: { userId },
      orderBy: { lastWorkedAt: 'desc' },
    })

    return Promise.all(
      projects.map(project => this.enrichProjectWithStats(project))
    )
  }

  static async getProjectById(
    userId: string, 
    projectId: string
  ): Promise<ProjectWithStats | null> {
    const project = await db.project.findFirst({
      where: { id: projectId, userId },
    })

    return project ? this.enrichProjectWithStats(project) : null
  }

  private static async enrichProjectWithStats(project: any): Promise<ProjectWithStats> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get session statistics
    const sessions = await db.session.findMany({
      where: { 
        projectId: project.id,
        endedAt: { not: null }
      },
      select: {
        id: true,
        type: true,
        duration: true,
        startedAt: true,
        status: true,
      },
      orderBy: { startedAt: 'desc' },
    })

    const recentSessions = sessions.filter(
      s => s.startedAt >= thirtyDaysAgo
    )

    const lastWeekSessions = sessions.filter(
      s => s.startedAt >= sevenDaysAgo
    )

    // Calculate stats
    const totalFocusTime = recentSessions.reduce(
      (sum, s) => sum + (s.duration || 0), 0
    )
    
    const averageSessionLength = recentSessions.length > 0 
      ? totalFocusTime / recentSessions.length 
      : 0

    const lastWeekActivity = lastWeekSessions.reduce(
      (sum, s) => sum + (s.duration || 0), 0
    )

    // Determine momentum
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    const previousWeekSessions = sessions.filter(
      s => s.startedAt >= twoWeeksAgo && s.startedAt < sevenDaysAgo
    )
    
    const previousWeekActivity = previousWeekSessions.reduce(
      (sum, s) => sum + (s.duration || 0), 0
    )

    let momentum: 'building' | 'steady' | 'declining' = 'steady'
    if (lastWeekActivity > previousWeekActivity * 1.2) {
      momentum = 'building'
    } else if (lastWeekActivity < previousWeekActivity * 0.8) {
      momentum = 'declining'
    }

    // Calculate streak days
    const streakDays = this.calculateStreakDays(sessions)

    return {
      ...project,
      stats: {
        totalSessions: recentSessions.length,
        totalFocusTime: Math.round(totalFocusTime),
        averageSessionLength: Math.round(averageSessionLength),
        lastWeekActivity: Math.round(lastWeekActivity),
        momentum,
        streakDays,
      },
      recentSessions: sessions.slice(0, 5),
    }
  }

  private static calculateStreakDays(sessions: any[]): number {
    if (sessions.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      
      const hasSessionOnDate = sessions.some(session => {
        const sessionDate = new Date(session.startedAt)
        sessionDate.setHours(0, 0, 0, 0)
        return sessionDate.getTime() === checkDate.getTime()
      })

      if (hasSessionOnDate) {
        streak++
      } else if (i > 0) { // Allow today to be empty
        break
      }
    }

    return streak
  }
}
```

#### Interactive Project Card Component
```typescript
// src/components/projects/project-card.tsx
'use client'

import { useState } from 'react'
import { AmbientCard } from '@/components/ui/ambient-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FeelsRightProgress } from '@/components/ui/feels-right-progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Target,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  Play,
  Calendar,
  Clock,
} from 'lucide-react'
import { ProjectWithStats } from '@/lib/projects'
import { formatDistanceToNow } from 'date-fns'

interface ProjectCardProps {
  project: ProjectWithStats
  onUpdateFeeling: (projectId: string, score: number) => Promise<void>
  onRecordPivot: (projectId: string, reason: string) => Promise<void>
  onStartSession: (projectId: string) => void
}

export function ProjectCard({ 
  project, 
  onUpdateFeeling, 
  onRecordPivot, 
  onStartSession 
}: ProjectCardProps) {
  const [isUpdatingFeeling, setIsUpdatingFeeling] = useState(false)

  const getMomentumIcon = () => {
    switch (project.stats.momentum) {
      case 'building': return <TrendingUp className="w-4 h-4 text-flow-active" />
      case 'declining': return <TrendingDown className="w-4 h-4 text-flow-blocked" />
      default: return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getMomentumColor = () => {
    switch (project.stats.momentum) {
      case 'building': return 'text-flow-active'
      case 'declining': return 'text-flow-blocked'
      default: return 'text-gray-500'
    }
  }

  const handleFeelingUpdate = async (newScore: number) => {
    setIsUpdatingFeeling(true)
    try {
      await onUpdateFeeling(project.id, newScore)
    } finally {
      setIsUpdatingFeeling(false)
    }
  }

  const handlePivot = async (reason: string) => {
    await onRecordPivot(project.id, reason)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const isHighMomentum = project.stats.momentum === 'building'
  const hasRecentActivity = project.lastWorkedAt && 
    new Date().getTime() - project.lastWorkedAt.getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <AmbientCard 
      className="p-6 group hover:shadow-lg transition-all duration-200"
      glow={isHighMomentum}
      elevation={hasRecentActivity ? 'medium' : 'low'}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <h3 className="font-semibold text-lg truncate">
                {project.name}
              </h3>
              <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
            
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {project.description}
              </p>
            )}

            {/* Momentum Indicator */}
            <div className="flex items-center space-x-2">
              {getMomentumIcon()}
              <span className={`text-sm font-medium capitalize ${getMomentumColor()}`}>
                {project.stats.momentum} momentum
              </span>
              {project.stats.streakDays > 0 && (
                <Badge variant="outline" className="text-xs">
                  {project.stats.streakDays} day streak
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {/* Pivot Counter */}
            {project.pivotCount > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 rounded-full">
                <RotateCcw className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">
                  {project.pivotCount}
                </span>
              </div>
            )}

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlePivot('Changed direction')}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Record Pivot
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Target className="w-4 h-4 mr-2" />
                  Update Ship Target
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Feels Right Progress */}
        <div>
          <FeelsRightProgress
            value={(project.feelsRightScore || 5) * 20}
            interactive={!isUpdatingFeeling}
            onChange={(value) => handleFeelingUpdate(Math.ceil(value / 20))}
            size="md"
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {project.stats.totalSessions}
            </div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {formatDuration(project.stats.totalFocusTime)}
            </div>
            <div className="text-xs text-muted-foreground">Focus Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {formatDuration(project.stats.averageSessionLength)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Session</div>
          </div>
        </div>

        {/* Ship Target & Last Activity */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            {project.shipTarget ? (
              <>
                <Target className="w-4 h-4" />
                <span>
                  Ship {formatDistanceToNow(project.shipTarget, { addSuffix: true })}
                </span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>No ship target set</span>
              </>
            )}
          </div>
          
          {project.lastWorkedAt && (
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                {formatDistanceToNow(project.lastWorkedAt, { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onStartSession(project.id)}
          variant={isHighMomentum ? "flow" : "outline"}
          className="w-full"
          disabled={project.status !== 'ACTIVE'}
        >
          <Play className="w-4 h-4 mr-2" />
          {isHighMomentum ? 'Continue Building' : 'Start Session'}
        </Button>
      </div>
    </AmbientCard>
  )
}
```

#### Projects Dashboard View
```typescript
// src/components/projects/projects-dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ProjectCard } from './project-card'
import { CreateProjectDialog } from './create-project-dialog'
import { ProjectService, ProjectWithStats } from '@/lib/projects'
import { Plus, Filter, Search, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ProjectsDashboardProps {
  onStartSession: (projectId: string) => void
}

export function ProjectsDashboard({ onStartSession }: ProjectsDashboardProps) {
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [projects, searchQuery, filterStatus])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = projects

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort by momentum and recent activity
    filtered = filtered.sort((a, b) => {
      // Prioritize building momentum
      if (a.stats.momentum === 'building' && b.stats.momentum !== 'building') return -1
      if (b.stats.momentum === 'building' && a.stats.momentum !== 'building') return 1
      
      // Then by last worked date
      const aLastWorked = a.lastWorkedAt?.getTime() || 0
      const bLastWorked = b.lastWorkedAt?.getTime() || 0
      return bLastWorked - aLastWorked
    })

    setFilteredProjects(filtered)
  }

  const handleUpdateFeeling = async (projectId: string, score: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/feeling`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feelsRightScore: score }),
      })

      if (response.ok) {
        await fetchProjects() // Refresh to get updated stats
      }
    } catch (error) {
      console.error('Failed to update feeling score:', error)
    }
  }

  const handleRecordPivot = async (projectId: string, reason: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/pivot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (response.ok) {
        await fetchProjects()
      }
    } catch (error) {
      console.error('Failed to record pivot:', error)
    }
  }

  const activeProjects = projects.filter(p => p.status === 'ACTIVE')
  const buildingMomentumCount = activeProjects.filter(
    p => p.stats.momentum === 'building'
  ).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
            <span>{activeProjects.length} active projects</span>
            {buildingMomentumCount > 0 && (
              <div className="flex items-center space-x-1 text-flow-active">
                <TrendingUp className="w-4 h-4" />
                <span>{buildingMomentumCount} building momentum</span>
              </div>
            )}
          </div>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          {['all', 'ACTIVE', 'PAUSED', 'SHIPPED'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'All' : status.toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Target className="w-16 h-16 mx-auto mb-4" />
            {searchQuery || filterStatus !== 'all' ? (
              <p>No projects match your filters</p>
            ) : (
              <p>No projects yet. Create your first project to get started!</p>
            )}
          </div>
          {!searchQuery && filterStatus === 'all' && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onUpdateFeeling={handleUpdateFeeling}
              onRecordPivot={handleRecordPivot}
              onStartSession={onStartSession}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onProjectCreated={fetchProjects}
      />
    </div>
  )
}
```

### Implementation Steps

1. **Enhance Database Schema**
   - Add pivot tracking fields
   - Create analytics table for feelings history
   - Add project momentum calculations

2. **Build Project Service**
   - CRUD operations with statistical enrichment
   - "Feels right" score tracking
   - Momentum calculation algorithms

3. **Create Interactive Components**
   - Project cards with live statistics
   - Interactive progress indicators
   - Pivot recording functionality

4. **Implement Visual Features**
   - Color-coded momentum indicators
   - Animated progress bars
   - Celebration animations for high scores

5. **Add Analytics Integration**
   - Track feeling scores over time
   - Monitor pivot patterns
   - Generate insight reports

### Acceptance Criteria
- [ ] Projects display momentum and activity statistics
- [ ] "Feels right" scoring works intuitively
- [ ] Pivot counting celebrates exploration
- [ ] Visual indicators clearly show project health
- [ ] Search and filtering work effectively
- [ ] Mobile interface remains touch-friendly
- [ ] Historical data tracks feelings over time

### Testing Requirements
- [ ] Statistics calculations are accurate
- [ ] Real-time updates work across sessions
- [ ] Mobile interface tested thoroughly
- [ ] Performance tested with many projects
- [ ] Analytics data collection verified

---

*[Continue with tasks 9-12 following the same detailed format]*

This pattern continues for the remaining tasks (9-12), each with comprehensive implementation details, code examples, and acceptance criteria. Would you like me to continue with the remaining core features tasks?