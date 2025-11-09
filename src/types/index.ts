/**
 * Core FlowForge type definitions
 */

// ============================================================================
// Enums (Aligned with Prisma Schema)
// ============================================================================

export enum FlowState {
  BLOCKED = 'BLOCKED',
  NEUTRAL = 'NEUTRAL',
  FLOWING = 'FLOWING',
  DEEP_FLOW = 'DEEP_FLOW',
}

export enum SessionType {
  BUILDING = 'BUILDING',
  EXPLORING = 'EXPLORING',
  DEBUGGING = 'DEBUGGING',
  SHIPPING = 'SHIPPING',
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum HabitCategory {
  DAILY_SHIP = 'DAILY_SHIP',
  CONTEXT_REFRESH = 'CONTEXT_REFRESH',
  CODE_REVIEW = 'CODE_REVIEW',
  BACKUP_CHECK = 'BACKUP_CHECK',
  FLOW_BLOCK = 'FLOW_BLOCK',
}

export enum NoteCategory {
  PROMPT_PATTERN = 'PROMPT_PATTERN',
  GOLDEN_CODE = 'GOLDEN_CODE',
  DEBUG_LOG = 'DEBUG_LOG',
  MODEL_NOTE = 'MODEL_NOTE',
  INSIGHT = 'INSIGHT',
}

export enum FlowBlockType {
  FOCUS_TIME = 'FOCUS_TIME',
  MEETING = 'MEETING',
  BREAK = 'BREAK',
  REVIEW = 'REVIEW',
}

// ============================================================================
// Core Domain Models (Aligned with Prisma Schema)
// ============================================================================

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  flowState: FlowState
  shipStreak: number
  timezone: string
  preferences?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  feelsRightScore: number
  shipTarget?: Date
  pivotCount: number
  stackNotes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CodingSession {
  id: string
  userId: string
  projectId?: string
  sessionType: SessionType
  aiContextHealth: number
  aiModelsUsed: string[]
  productivityScore?: number
  durationSeconds: number
  checkpointNotes?: string
  sessionStatus: SessionStatus
  startedAt: Date
  endedAt?: Date
}

export interface Habit {
  id: string
  userId: string
  name: string
  category: HabitCategory
  streakCount: number
  targetFrequency: number
  lastCompletedAt?: Date
  isActive: boolean
  createdAt: Date
}

export interface Note {
  id: string
  userId: string
  title: string
  content: string
  category: NoteCategory
  tags: string[]
  isTemplate: boolean
  sessionId?: string
  projectId?: string
  createdAt: Date
  updatedAt: Date
}

export interface FlowBlock {
  id: string
  userId: string
  projectId?: string
  startTime: Date
  endTime: Date
  blockType: FlowBlockType
  notes?: string
  createdAt: Date
}

export interface AIContext {
  id: string
  userId: string
  modelName: string
  contextHealth: number
  issuesDetected: string[]
  lastRefreshedAt: Date
  conversationCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Analytics {
  id: string
  userId: string
  date: Date
  shipCount: number
  flowScore: number
  codingMinutes: number
  contextRefreshes: number
  metadata?: Record<string, unknown>
  createdAt: Date
}

// ============================================================================
// Extended Domain Models (with calculated fields)
// ============================================================================

export interface ProjectWithStats extends Project {
  totalSessions: number
  totalCodingMinutes: number
  lastWorkedDate: Date | null
  momentum: Momentum
}

export interface ProjectFilters {
  isActive?: boolean | null
  sortBy?: 'updatedAt' | 'feelsRightScore' | 'momentum' | null
  search?: string | null
}

export interface ProjectStats {
  activeProjectsCount: number
  projectsShippedThisMonth: number
  totalProjects: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
  message: string | null
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ============================================================================
// API Request Types
// ============================================================================

export interface CreateSessionRequest {
  sessionType: SessionType
  projectId?: string
  aiModelsUsed: string[]
}

export interface UpdateSessionRequest {
  durationSeconds?: number
  aiContextHealth?: number
  productivityScore?: number
  checkpointNotes?: string
  sessionStatus?: SessionStatus
  endedAt?: Date
}

export interface CreateProjectRequest {
  name: string
  description?: string
  feelsRightScore?: number
  shipTarget?: Date
  stackNotes?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  feelsRightScore?: number
  shipTarget?: Date
  stackNotes?: string
  isActive?: boolean
}

export interface FeelsRightScoreRequest {
  score: number
}

export interface RecordPivotRequest {
  notes?: string
}

export interface CreateNoteRequest {
  title?: string
  content: string
  category: NoteCategory
  tags: string[]
  sessionId?: string
  projectId?: string
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  category?: NoteCategory
  tags?: string[]
  isTemplate?: boolean
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface SessionTimerProps {
  sessionId: string
  startTime: Date
  isPaused: boolean
  elapsedSeconds: number
  contextHealth: number
  onPause: () => void
  onResume: () => void
  onEnd: () => void
  onCheckpoint: () => void
}

export interface SessionCardProps {
  session: CodingSession
  onDelete?: (sessionId: string) => void
  onCheckpoint?: (sessionId: string) => void
  onViewDetails?: (sessionId: string) => void
}

export interface StartSessionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSessionStarted?: (session: CodingSession) => void
}

export interface ProjectCardProps {
  project: ProjectWithStats
  onUpdate?: (project: Project) => void
  onStartSession?: (projectId: string) => void
  onDelete?: (projectId: string) => void
}

export interface FeelsRightSliderProps {
  projectId: string
  initialValue: number
  onChange: (value: number) => void
  disabled?: boolean
}

export interface CreateProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated?: (project: Project) => void
}

export interface PivotCounterProps {
  projectId: string
  currentCount: number
  onPivotRecorded?: () => void
}

export interface NoteCardProps {
  note: Note
  onEdit?: (noteId: string) => void
  onDelete?: (noteId: string) => void
}

export interface ShipStreakCardProps {
  currentStreak: number
  longestStreak: number
  lastShipDate?: Date
  onMarkShip: () => void
}

// ============================================================================
// Dashboard-Specific Types
// ============================================================================

export interface DashboardStats {
  activeSessionId: string | null
  shipStreak: number
  activeProjectsCount: number
  todaysCodingMinutes: number
  flowState: FlowState
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastShipDate?: Date
}

export interface SessionStats {
  totalSessions: number
  totalCodingMinutes: number
  averageSessionDuration: number
}

// ============================================================================
// Utility Types
// ============================================================================

export type Momentum = 'HOT' | 'ACTIVE' | 'QUIET'

export interface DateRange {
  start: Date
  end: Date
}

export interface SessionFilters {
  sessionType?: SessionType
  projectId?: string
  dateRange?: DateRange
}
