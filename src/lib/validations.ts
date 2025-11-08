/**
 * Zod validation schemas for all API endpoints
 */

import { z } from 'zod'
import { SessionType, SessionStatus, NoteCategory } from '@/types'

// ============================================================================
// Session Schemas
// ============================================================================

export const CreateSessionSchema = z.object({
  sessionType: z.nativeEnum(SessionType),
  projectId: z.string().cuid().optional(),
  aiModelsUsed: z.array(z.string()).min(1).max(5),
})

export const UpdateSessionSchema = z.object({
  durationSeconds: z.number().int().min(0).optional(),
  aiContextHealth: z.number().int().min(0).max(100).optional(),
  productivityScore: z.number().int().min(1).max(10).optional(),
  checkpointNotes: z.string().max(5000).optional(),
  sessionStatus: z.nativeEnum(SessionStatus).optional(),
})

export const CheckpointSchema = z.object({
  checkpointText: z.string().min(1).max(2000),
})

// ============================================================================
// Project Schemas
// ============================================================================

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  feelsRightScore: z.number().int().min(1).max(5).default(3),
  shipTarget: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  stackNotes: z.string().max(2000).optional(),
})

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  feelsRightScore: z.number().int().min(1).max(5).optional(),
  shipTarget: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  stackNotes: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
})

export const FeelsRightScoreSchema = z.object({
  score: z.number().int().min(1).max(5),
})

export const PivotSchema = z.object({
  notes: z.string().max(1000).optional(),
})

// ============================================================================
// Note Schemas
// ============================================================================

export const CreateNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000),
  category: z.nativeEnum(NoteCategory),
  tags: z.array(z.string()).max(20).default([]),
  sessionId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
})

export const UpdateNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  category: z.nativeEnum(NoteCategory).optional(),
  tags: z.array(z.string()).max(20).optional(),
  isTemplate: z.boolean().optional(),
})

// ============================================================================
// Dashboard Schemas
// ============================================================================

export const FocusTextSchema = z.object({
  focus: z.string().max(500),
})

// ============================================================================
// Analytics Schemas
// ============================================================================

export const MarkShipSchema = z.object({
  notes: z.string().max(500).optional(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>
export type CheckpointInput = z.infer<typeof CheckpointSchema>
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
export type FeelsRightScoreInput = z.infer<typeof FeelsRightScoreSchema>
export type PivotInput = z.infer<typeof PivotSchema>
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>
export type FocusTextInput = z.infer<typeof FocusTextSchema>
export type MarkShipInput = z.infer<typeof MarkShipSchema>
