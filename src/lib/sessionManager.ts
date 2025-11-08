import {
  CodingSession,
  SessionType,
  SessionStatus,
  CreateSessionRequest,
  UpdateSessionRequest,
  ApiResponse,
} from '@/types'
import { formatDuration, calculateDuration } from '@/lib/utils'

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = '/api/sessions'

// ============================================================================
// Session Management Functions
// ============================================================================

/**
 * Start a new coding session
 */
export async function startSession(
  sessionType: SessionType,
  projectId: string | null,
  aiModel: string,
  _userId: string
): Promise<ApiResponse<CodingSession>> {
  try {
    const payload: CreateSessionRequest = {
      sessionType,
      projectId: projectId || undefined,
      aiModelsUsed: [aiModel],
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
        error: error.message || 'Failed to start session',
        message: null,
      }
    }

    const session = await response.json()
    return {
      success: true,
      data: session,
      error: null,
      message: 'Session started successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleSessionError(error),
      message: null,
    }
  }
}

/**
 * Pause an active session
 */
export async function pauseSession(sessionId: string): Promise<ApiResponse<CodingSession>> {
  try {
    const payload: UpdateSessionRequest = {
      sessionStatus: SessionStatus.PAUSED,
    }

    const response = await fetch(`${API_BASE_URL}/${sessionId}`, {
      method: 'PATCH',
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
        error: error.message || 'Failed to pause session',
        message: null,
      }
    }

    const session = await response.json()
    return {
      success: true,
      data: session,
      error: null,
      message: 'Session paused successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleSessionError(error),
      message: null,
    }
  }
}

/**
 * Resume a paused session
 */
export async function resumeSession(sessionId: string): Promise<ApiResponse<CodingSession>> {
  try {
    const payload: UpdateSessionRequest = {
      sessionStatus: SessionStatus.ACTIVE,
    }

    const response = await fetch(`${API_BASE_URL}/${sessionId}`, {
      method: 'PATCH',
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
        error: error.message || 'Failed to resume session',
        message: null,
      }
    }

    const session = await response.json()
    return {
      success: true,
      data: session,
      error: null,
      message: 'Session resumed successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleSessionError(error),
      message: null,
    }
  }
}

/**
 * End an active session
 */
export async function endSession(
  sessionId: string,
  finalDuration: number,
  productivityScore: number | null
): Promise<ApiResponse<CodingSession>> {
  try {
    const payload: UpdateSessionRequest = {
      endedAt: new Date(),
      durationSeconds: finalDuration,
      sessionStatus: SessionStatus.COMPLETED,
      productivityScore: productivityScore || undefined,
    }

    const response = await fetch(`${API_BASE_URL}/${sessionId}`, {
      method: 'PATCH',
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
        error: error.message || 'Failed to end session',
        message: null,
      }
    }

    const session = await response.json()
    return {
      success: true,
      data: session,
      error: null,
      message: 'Session ended successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleSessionError(error),
      message: null,
    }
  }
}

/**
 * Update session duration (called every 60 seconds by SessionTimer)
 * Errors are logged but not thrown since this is background sync
 */
export async function updateSessionDuration(
  sessionId: string,
  durationSeconds: number
): Promise<ApiResponse<CodingSession>> {
  try {
    const payload: UpdateSessionRequest = {
      durationSeconds,
    }

    const response = await fetch(`${API_BASE_URL}/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      // Log error but don't throw - this is background sync
      console.error('Failed to sync session duration:', await response.text())
      return {
        success: false,
        data: null,
        error: 'Failed to sync session duration',
        message: null,
      }
    }

    const session = await response.json()
    return {
      success: true,
      data: session,
      error: null,
      message: null,
    }
  } catch (error) {
    // Log error but don't throw - this is background sync
    console.error('Error syncing session duration:', error)
    return {
      success: false,
      data: null,
      error: handleSessionError(error),
      message: null,
    }
  }
}

/**
 * Save a checkpoint note to the session
 */
export async function saveCheckpoint(
  sessionId: string,
  checkpointText: string
): Promise<ApiResponse<CodingSession>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${sessionId}/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ checkpoint: checkpointText }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to save checkpoint',
        message: null,
      }
    }

    const session = await response.json()
    return {
      success: true,
      data: session,
      error: null,
      message: 'Checkpoint saved successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleSessionError(error),
      message: null,
    }
  }
}

// ============================================================================
// Calculation & Formatting Functions
// ============================================================================

/**
 * Calculate context health based on elapsed time
 * Decreases by 10 points per hour, clamped between 0-100
 */
export function calculateContextHealth(
  elapsedSeconds: number,
  initialHealth: number = 100
): number {
  const degradation = Math.floor((elapsedSeconds / 3600) * 10)
  const health = initialHealth - degradation
  return Math.max(0, Math.min(100, health))
}

/**
 * Get session duration in seconds
 */
export function getSessionDuration(session: CodingSession): number {
  if (session.endedAt) {
    return calculateDuration(session.startedAt, session.endedAt)
  }
  return session.durationSeconds
}

/**
 * Format session duration as human-readable string
 */
export function formatSessionDuration(session: CodingSession): string {
  const duration = getSessionDuration(session)
  return formatDuration(duration)
}

/**
 * Get human-readable session status
 */
export function getSessionStatus(session: CodingSession): string {
  switch (session.sessionStatus) {
    case SessionStatus.ACTIVE:
      return 'In Progress'
    case SessionStatus.PAUSED:
      return 'Paused'
    case SessionStatus.COMPLETED:
      return 'Completed'
    case SessionStatus.ABANDONED:
      return 'Abandoned'
    default:
      return 'Unknown'
  }
}

/**
 * Get icon/emoji for session type
 */
export function getSessionTypeIcon(sessionType: SessionType): string {
  switch (sessionType) {
    case SessionType.BUILDING:
      return '🔨'
    case SessionType.EXPLORING:
      return '🔍'
    case SessionType.DEBUGGING:
      return '🐛'
    case SessionType.SHIPPING:
      return '🚀'
    default:
      return '💻'
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate session data before making API calls
 */
export function validateSessionData(data: Partial<CreateSessionRequest | UpdateSessionRequest>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate CreateSessionRequest
  if ('sessionType' in data) {
    if (!data.sessionType) {
      errors.push('Session type is required')
    }
    if (data.aiModelsUsed && (!Array.isArray(data.aiModelsUsed) || data.aiModelsUsed.length === 0)) {
      errors.push('At least one AI model must be specified')
    }
  }

  // Validate UpdateSessionRequest
  if ('durationSeconds' in data && data.durationSeconds !== undefined) {
    if (typeof data.durationSeconds !== 'number' || data.durationSeconds < 0) {
      errors.push('Duration must be a non-negative number')
    }
  }

  if ('productivityScore' in data && data.productivityScore !== undefined) {
    if (typeof data.productivityScore !== 'number' || data.productivityScore < 0 || data.productivityScore > 100) {
      errors.push('Productivity score must be between 0 and 100')
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
 * Handle session errors consistently
 */
export function handleSessionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}
