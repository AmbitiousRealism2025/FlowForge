/**
 * Business logic service for notes CRUD operations
 */

import { format } from 'date-fns'
import type {
  Note,
  NoteWithRelations,
  NoteCategory,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteFilters,
  PaginatedResponse,
} from '@/types'
import {
  truncateText,
  formatRelativeTime,
  parseTags,
  formatTags,
  getNoteCategoryIcon,
  getNoteCategoryLabel,
  getNoteCategoryColor,
  validateNoteCategory,
} from '@/lib/utils'

// ============================================================================
// Constants
// ============================================================================

const API_BASE = '/api/notes'

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch notes with optional filters and pagination
 */
export async function fetchNotes(
  filters: NoteFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<NoteWithRelations>> {
  try {
    const params = new URLSearchParams()

    if (filters.category) params.append('category', filters.category)
    if (filters.search) params.append('search', filters.search)
    if (filters.sessionId) params.append('sessionId', filters.sessionId)
    if (filters.projectId) params.append('projectId', filters.projectId)
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag))
    }
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const response = await fetch(`${API_BASE}?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw new Error(handleNoteError(error))
  }
}

/**
 * Fetch a single note by ID
 */
export async function fetchNoteById(noteId: string): Promise<NoteWithRelations> {
  try {
    const response = await fetch(`${API_BASE}/${noteId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch note: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw new Error(handleNoteError(error))
  }
}

/**
 * Create a new note
 */
export async function createNote(data: CreateNoteRequest): Promise<Note> {
  try {
    // Validate category if provided
    if (data.category && !validateNoteCategory(data.category)) {
      throw new Error('Invalid note category')
    }

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create note: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    throw new Error(handleNoteError(error))
  }
}

/**
 * Update an existing note
 */
export async function updateNote(
  noteId: string,
  data: UpdateNoteRequest
): Promise<Note> {
  try {
    const response = await fetch(`${API_BASE}/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to update note: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    throw new Error(handleNoteError(error))
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/${noteId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete note: ${response.statusText}`)
    }

    return true
  } catch (error) {
    throw new Error(handleNoteError(error))
  }
}

/**
 * Search notes by query string
 */
export async function searchNotes(
  searchQuery: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<NoteWithRelations>> {
  return fetchNotes({ search: searchQuery }, page, limit)
}

/**
 * Get notes by category
 */
export async function getNotesByCategory(
  category: NoteCategory,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<NoteWithRelations>> {
  return fetchNotes({ category }, page, limit)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get note preview (first 150 characters of content)
 */
export function getNotePreview(note: Note): string {
  return truncateText(note.content, 150)
}

/**
 * Format note timestamp for display
 */
export function formatNoteTimestamp(note: Note): string {
  const now = new Date()
  const updatedAt = typeof note.updatedAt === 'string'
    ? new Date(note.updatedAt)
    : note.updatedAt
  const createdAt = typeof note.createdAt === 'string'
    ? new Date(note.createdAt)
    : note.createdAt

  const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)

  if (hoursSinceUpdate < 24) {
    return `Updated ${formatRelativeTime(updatedAt)}`
  } else {
    return `Created ${format(createdAt, 'MMM d')}`
  }
}

/**
 * Extract common tags from notes array
 */
export function extractCommonTags(
  notes: Note[]
): Array<{ tag: string; count: number }> {
  const tagCounts = new Map<string, number>()

  notes.forEach((note) => {
    note.tags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase()
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1)
    })
  })

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

/**
 * Group notes by category
 */
export function groupNotesByCategory(notes: Note[]): Map<NoteCategory, Note[]> {
  const grouped = new Map<NoteCategory, Note[]>()

  notes.forEach((note) => {
    if (!grouped.has(note.category)) {
      grouped.set(note.category, [])
    }
    grouped.get(note.category)!.push(note)
  })

  return grouped
}

/**
 * Validate note data
 */
export function validateNoteData(data: Partial<CreateNoteRequest>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Content must be non-empty
  if (!data.content || data.content.trim().length === 0) {
    errors.push('Content is required')
  }

  // Category must be valid NoteCategory
  if (data.category && !validateNoteCategory(data.category)) {
    errors.push('Invalid note category')
  }

  // Tags must be string array
  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Handle note error and return formatted error message
 */
export function handleNoteError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unknown error occurred'
}
