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
  shipTarget?: Date | string
  pivotCount: number
  stackNotes?: string
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
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
  startedAt: Date | string
  endedAt?: Date | string
}

export interface Habit {
  id: string
  userId: string
  name: string
  category: HabitCategory
  streakCount: number
  targetFrequency: number
  lastCompletedAt?: Date | string
  isActive: boolean
  createdAt: Date | string
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
  createdAt: Date | string
  updatedAt: Date | string
}

export interface NoteWithRelations extends Note {
  session?: {
    id: string
    sessionType: SessionType
  }
  project?: {
    id: string
    name: string
  }
}

export interface FlowBlock {
  id: string
  userId: string
  projectId?: string
  startTime: Date | string
  endTime: Date | string
  blockType: FlowBlockType
  notes?: string
  createdAt: Date | string
}

export interface AIContext {
  id: string
  userId: string
  modelName: string
  contextHealth: number
  issuesDetected: string[]
  lastRefreshedAt: Date | string
  conversationCount: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Analytics {
  id: string
  userId: string
  date: Date | string
  shipCount: number
  flowScore: number
  codingMinutes: number
  contextRefreshes: number
  metadata?: Record<string, unknown>
  createdAt: Date | string
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

export interface HabitWithStats extends Habit {
  completedToday: boolean
  daysUntilDue: number
  completionRate: number
}

export interface HabitSummaryStats {
  totalActiveHabits: number
  longestCurrentStreak: number
  habitsCompletedToday: number
  totalCompletions: number
}

export interface HabitStreakData {
  currentStreak: number
  longestStreak: number
  completionDates: Date[]
  completionRate: number
  lastCompletedAt: Date | null
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
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
  endedAt?: Date | string
}

export interface CreateProjectRequest {
  name: string
  description?: string
  feelsRightScore?: number
  shipTarget?: Date | string
  stackNotes?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  feelsRightScore?: number
  shipTarget?: Date | string
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
  isTemplate?: boolean
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  category?: NoteCategory
  tags?: string[]
  isTemplate?: boolean
}

export interface MarkShipRequest {
  notes?: string
}

export interface CreateHabitRequest {
  name: string
  category: HabitCategory
  targetFrequency: number
}

export interface UpdateHabitRequest {
  name?: string
  targetFrequency?: number
  isActive?: boolean
}

export interface CompleteHabitRequest {
  notes?: string
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
  note: NoteWithRelations
  onEdit?: (note: Note) => void
  onDelete?: (noteId: string) => void
  onCopy?: (content: string) => void
}

export interface CreateNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  onNoteCreated?: (note: Note) => void
  initialSessionId?: string
  initialProjectId?: string
}

export interface NoteEditorProps {
  value: string
  onChange: (value: string) => void
  category: NoteCategory
  onCategoryChange: (category: NoteCategory) => void
  placeholder?: string
  autoFocus?: boolean
}

export interface ShipStreakCardProps {
  currentStreak: number
  longestStreak: number
  lastShipDate?: Date | string
  onMarkShip: () => void
}

export interface HabitCardProps {
  habit: HabitWithStats
  onComplete: (habitId: string) => void
  onEdit?: (habitId: string) => void
  onArchive?: (habitId: string) => void
}

export interface HabitCheckInProps {
  habitId: string
  habitName: string
  completedToday: boolean
  onComplete: () => Promise<void>
  isLoading: boolean
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
  lastShipDate?: Date | string
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
