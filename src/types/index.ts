/**
 * Core FlowForge type definitions
 */

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

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  flowState: FlowState
  shipStreak: number
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
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  userId: string
  projectId?: string
  sessionType: SessionType
  aiContextHealth: number
  aiModelsUsed: string[]
  productivityScore?: number
  durationSeconds: number
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
