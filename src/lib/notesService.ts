import {
  Note,
  NoteCategory,
  CreateNoteRequest,
  UpdateNoteRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types'
import { truncateText, formatRelativeTime, validateNoteCategory } from '@/lib/utils'

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = '/api/notes'

// ============================================================================
// Notes CRUD Functions
// ============================================================================

/**
 * Create a new note
 */
export async function createNote(
  title: string | null,
  content: string,
  category: NoteCategory,
  tags: string[],
  sessionId: string | null = null,
  projectId: string | null = null
): Promise<ApiResponse<Note>> {
  // Validate category
  if (!validateNoteCategory(category)) {
    return {
      success: false,
      data: null,
      error: 'Invalid note category',
      message: null,
    }
  }

  try {
    const payload: CreateNoteRequest = {
      title: title || undefined,
      content,
      category,
      tags,
      sessionId: sessionId || undefined,
      projectId: projectId || undefined,
    }

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to create note',
        message: null,
      }
    }

    const note = await response.json()
    return {
      success: true,
      data: note,
      error: null,
      message: 'Note created successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleNoteError(error),
      message: null,
    }
  }
}

/**
 * Update an existing note
 */
export async function updateNote(
  noteId: string,
  updates: UpdateNoteRequest
): Promise<ApiResponse<Note>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update note',
        message: null,
      }
    }

    const note = await response.json()
    return {
      success: true,
      data: note,
      error: null,
      message: 'Note updated successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleNoteError(error),
      message: null,
    }
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${noteId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to delete note',
        message: null,
      }
    }

    return {
      success: true,
      data: null,
      error: null,
      message: 'Note deleted successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleNoteError(error),
      message: null,
    }
  }
}

// ============================================================================
// Search & Filter Functions
// ============================================================================

/**
 * Search notes with filters
 */
export async function searchNotes(
  searchQuery: string,
  category: NoteCategory | null = null,
  tags: string[] = [],
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Note>> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (searchQuery) params.append('q', searchQuery)
    if (category) params.append('category', String(category))
    if (tags.length > 0) params.append('tags', tags.join(','))

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`)

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        total: 0,
        page,
        limit,
        hasMore: false,
        error: error.message || 'Failed to search notes',
        message: null,
      }
    }

    const data = await response.json()
    const notes: Note[] = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.items)
          ? data.items
          : []
    return {
      success: true,
      data: notes,
      total: data.total ?? notes.length,
      page: data.page ?? page,
      limit: data.limit ?? limit,
      hasMore: data.hasMore ?? false,
      error: null,
      message: null,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      total: 0,
      page,
      limit,
      hasMore: false,
      error: handleNoteError(error),
      message: null,
    }
  }
}

/**
 * Get notes by category
 */
export async function getNotesByCategory(
  category: NoteCategory,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Note>> {
  return searchNotes('', category, [], page, limit)
}

/**
 * Get notes by tags
 */
export async function getNotesByTags(
  tags: string[],
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Note>> {
  return searchNotes('', null, tags, page, limit)
}

// ============================================================================
// Tag Management Functions
// ============================================================================

/**
 * Parse comma-separated tags input
 */
export function parseTags(tagsInput: string): string[] {
  return tagsInput
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
}

/**
 * Format tags array as comma-separated string
 */
export function formatTags(tags: string[]): string {
  return tags.join(', ')
}

/**
 * Extract common tags from notes with counts
 */
export function extractCommonTags(notes: Note[]): Array<{ tag: string; count: number }> {
  const tagCounts = new Map<string, number>()

  notes.forEach((note) => {
    note.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  // Convert to array and sort by count (descending)
  const sortedTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)

  // Return top 10 most common tags
  return sortedTags.slice(0, 10)
}

// ============================================================================
// Note Display Functions
// ============================================================================

/**
 * Get preview text from note content
 */
export function getNotePreview(note: Note, maxLength: number = 150): string {
  return truncateText(note.content, maxLength)
}

/**
 * Get icon/emoji for note category
 */
export function getNoteCategoryIcon(category: NoteCategory): string {
  switch (category) {
    case NoteCategory.PROMPT_PATTERN:
      return '💡'
    case NoteCategory.GOLDEN_CODE:
      return '⭐'
    case NoteCategory.DEBUG_LOG:
      return '🐛'
    case NoteCategory.MODEL_NOTE:
      return '🤖'
    case NoteCategory.INSIGHT:
      return '💭'
    default:
      return '📝'
  }
}

/**
 * Get human-readable label for note category
 */
export function getNoteCategoryLabel(category: NoteCategory): string {
  switch (category) {
    case NoteCategory.PROMPT_PATTERN:
      return 'Prompt Pattern'
    case NoteCategory.GOLDEN_CODE:
      return 'Golden Code'
    case NoteCategory.DEBUG_LOG:
      return 'Debug Log'
    case NoteCategory.MODEL_NOTE:
      return 'Model Note'
    case NoteCategory.INSIGHT:
      return 'Insight'
    default:
      return 'Note'
  }
}

/**
 * Format note timestamp (created or updated)
 */
export function formatNoteTimestamp(note: Note): string {
  const updatedAt = new Date(note.updatedAt)
  const now = new Date()
  const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)

  if (hoursSinceUpdate < 24) {
    return `Updated ${formatRelativeTime(updatedAt)}`
  }

  const createdAt = new Date(note.createdAt)
  return `Created ${formatRelativeTime(createdAt)}`
}

// ============================================================================
// Grouping Functions
// ============================================================================

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

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate note data before making API calls
 */
export function validateNoteData(data: Partial<CreateNoteRequest | UpdateNoteRequest>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if ('content' in data) {
    if (!data.content || data.content.trim().length === 0) {
      errors.push('Note content is required')
    }
  }

  if ('category' in data && data.category) {
    if (!validateNoteCategory(data.category)) {
      errors.push('Invalid note category')
    }
  }

  if ('tags' in data && data.tags) {
    if (!Array.isArray(data.tags)) {
      errors.push('Tags must be an array')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handle note errors consistently
 */
export function handleNoteError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}
