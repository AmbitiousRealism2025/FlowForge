import {
  Project,
  ProjectWithStats,
  CodingSession,
  Momentum,
  CreateProjectRequest,
  UpdateProjectRequest,
  ApiResponse,
  ProjectFilters,
} from '@/types'
import { differenceInHours } from 'date-fns'
import {
  formatRelativeTime,
  formatDuration,
  validateFeelsRightScore,
  getMomentumEmoji as getEmoji,
  getMomentumLabel as getLabel,
} from '@/lib/utils'

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = '/api/projects'

// ============================================================================
// Project CRUD Functions
// ============================================================================

/**
 * Fetch all projects with optional filters
 */
export async function fetchProjects(filters?: ProjectFilters): Promise<ApiResponse<ProjectWithStats[]>> {
  try {
    const params = new URLSearchParams()

    if (filters?.isActive !== null && filters?.isActive !== undefined) {
      params.append('isActive', String(filters.isActive))
    }
    if (filters?.sortBy) {
      params.append('sortBy', filters.sortBy)
    }
    if (filters?.search) {
      params.append('search', filters.search)
    }

    const queryString = params.toString()
    const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch projects',
        message: null,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data || data || [],
      error: null,
      message: 'Projects fetched successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleProjectError(error),
      message: null,
    }
  }
}

/**
 * Fetch a single project by ID with statistics
 */
export async function fetchProjectById(projectId: string): Promise<ApiResponse<ProjectWithStats>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${projectId}`)

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch project',
        message: null,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data || data,
      error: null,
      message: 'Project fetched successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleProjectError(error),
      message: null,
    }
  }
}

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  description: string | null = null,
  feelsRightScore: number = 3,
  shipTarget: Date | null = null,
  stackNotes: string | null = null
): Promise<ApiResponse<Project>> {
  try {
    const payload: CreateProjectRequest = {
      name,
      description: description || undefined,
      feelsRightScore,
      shipTarget: shipTarget || undefined,
      stackNotes: stackNotes || undefined,
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
        error: error.message || 'Failed to create project',
        message: null,
      }
    }

    const project = await response.json()
    return {
      success: true,
      data: project,
      error: null,
      message: 'Project created successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleProjectError(error),
      message: null,
    }
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string,
  updates: UpdateProjectRequest
): Promise<ApiResponse<Project>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${projectId}`, {
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
        error: error.message || 'Failed to update project',
        message: null,
      }
    }

    const project = await response.json()
    return {
      success: true,
      data: project,
      error: null,
      message: 'Project updated successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleProjectError(error),
      message: null,
    }
  }
}

/**
 * Update project's feels right score
 */
export async function updateFeelsRightScore(
  projectId: string,
  score: number
): Promise<ApiResponse<Project>> {
  // Validate score before making request
  if (!validateFeelsRightScore(score)) {
    return {
      success: false,
      data: null,
      error: 'Feels right score must be between 1 and 5',
      message: null,
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${projectId}/feels-right`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feelsRightScore: score }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update feels right score',
        message: null,
      }
    }

    const project = await response.json()
    return {
      success: true,
      data: project,
      error: null,
      message: 'Feels right score updated successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleProjectError(error),
      message: null,
    }
  }
}

/**
 * Record a project pivot (direction change)
 */
export async function recordPivot(
  projectId: string,
  pivotNotes?: string
): Promise<ApiResponse<Project>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${projectId}/pivot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes: pivotNotes }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to record pivot',
        message: null,
      }
    }

    const project = await response.json()
    return {
      success: true,
      data: project,
      error: null,
      message: 'Pivot recorded successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleProjectError(error),
      message: null,
    }
  }
}

/**
 * Delete a project (soft delete - sets isActive to false)
 */
export async function deleteProject(projectId: string): Promise<ApiResponse<boolean>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${projectId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to delete project',
        message: null,
      }
    }

    return {
      success: true,
      data: true,
      error: null,
      message: 'Project deleted successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleProjectError(error),
      message: null,
    }
  }
}

/**
 * Get project statistics
 */
export async function getProjectStats(projectId: string): Promise<{
  totalSessions: number
  totalCodingTime: string
  lastWorkedDate: string | null
  averageFeelsRightScore?: number
}> {
  try {
    const [projectResponse, sessionsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/${projectId}`),
      fetch(`${API_BASE_URL}/${projectId}/sessions`),
    ])

    if (!projectResponse.ok) {
      throw new Error('Failed to fetch project details')
    }

    const project: Project = await projectResponse.json()

    let sessions: CodingSession[] = []
    if (sessionsResponse.ok) {
      const sessionsPayload = await sessionsResponse.json()
      if (Array.isArray(sessionsPayload)) {
        sessions = sessionsPayload
      } else if (Array.isArray(sessionsPayload.data)) {
        sessions = sessionsPayload.data
      } else if (Array.isArray(sessionsPayload.items)) {
        sessions = sessionsPayload.items
      }
    }

    const totalSessions = sessions.length
    const totalSeconds = sessions.reduce((sum, session) => sum + (session.durationSeconds || 0), 0)
    const totalCodingTime = formatDuration(totalSeconds)
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )
    const lastWorkedDate = sortedSessions.length > 0 ? new Date(sortedSessions[0].startedAt).toISOString() : null

    return {
      totalSessions,
      totalCodingTime,
      lastWorkedDate,
      averageFeelsRightScore: project.feelsRightScore,
    }
  } catch (error) {
    console.error('Error calculating project stats:', error)
    return {
      totalSessions: 0,
      totalCodingTime: '0m',
      lastWorkedDate: null,
    }
  }
}

// ============================================================================
// Momentum Calculation Functions
// ============================================================================

/**
 * Calculate project momentum based on recent sessions
 */
export function calculateMomentum(project: Project, sessions: CodingSession[]): Momentum {
  if (sessions.length === 0) return 'QUIET'

  // Sort sessions by start time (most recent first)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )

  const mostRecentSession = sortedSessions[0]
  const hoursSinceLastSession = differenceInHours(new Date(), new Date(mostRecentSession.startedAt))

  if (hoursSinceLastSession <= 24) return 'HOT'
  if (hoursSinceLastSession <= 168) return 'ACTIVE' // 7 days
  return 'QUIET'
}

/**
 * Get emoji for momentum status
 */
export function getMomentumEmoji(momentum: Momentum): string {
  switch (momentum) {
    case 'HOT':
      return '🔥'
    case 'ACTIVE':
      return '⚡'
    case 'QUIET':
      return '💤'
  }
}

/**
 * Get human-readable label for momentum
 */
export function getMomentumLabel(momentum: Momentum): string {
  switch (momentum) {
    case 'HOT':
      return 'Hot'
    case 'ACTIVE':
      return 'Active'
    case 'QUIET':
      return 'Quiet'
  }
}

// ============================================================================
// Feels Right Score Functions
// ============================================================================

/**
 * Get emoji for feels right score
 */
export function getFeelsRightEmoji(score: number): string {
  switch (score) {
    case 1:
      return '😰'
    case 2:
      return '😕'
    case 3:
      return '😐'
    case 4:
      return '😊'
    case 5:
      return '🚀'
    default:
      return '😐'
  }
}

/**
 * Get descriptive label for feels right score
 */
export function getFeelsRightLabel(score: number): string {
  switch (score) {
    case 1:
      return 'Struggling'
    case 2:
      return 'Uncertain'
    case 3:
      return 'Okay'
    case 4:
      return 'Good'
    case 5:
      return 'Nailing It'
    default:
      return 'Unknown'
  }
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format ship target date as relative time with context
 */
export function formatShipTarget(shipTarget: Date | null | undefined): string {
  if (!shipTarget) return 'No target set'

  const now = new Date()
  const targetDate = new Date(shipTarget)
  const isPast = targetDate < now

  const relativeTime = formatRelativeTime(targetDate)

  if (isPast) {
    return `Shipped ${relativeTime}`
  }
  return `Ships ${relativeTime}`
}

/**
 * Get total project duration from sessions
 */
export function getProjectDuration(project: Project, sessions: CodingSession[]): string {
  const totalSeconds = sessions.reduce((sum, session) => sum + session.durationSeconds, 0)
  return formatDuration(totalSeconds)
}

/**
 * Format project stats for display
 */
export function formatProjectStats(project: ProjectWithStats): {
  durationFormatted: string
  momentumEmoji: string
  momentumLabel: string
  lastWorkedFormatted: string
  shipTargetFormatted: string
} {
  const durationSeconds = project.totalCodingMinutes * 60

  return {
    durationFormatted: formatDuration(durationSeconds),
    momentumEmoji: getMomentumEmoji(project.momentum),
    momentumLabel: getMomentumLabel(project.momentum),
    lastWorkedFormatted: project.lastWorkedDate
      ? formatRelativeTime(project.lastWorkedDate)
      : 'Never worked on',
    shipTargetFormatted: formatShipTarget(project.shipTarget),
  }
}

// ============================================================================
// Sorting Functions
// ============================================================================

/**
 * Sort projects by momentum (HOT > ACTIVE > QUIET)
 * Within same momentum, sort by updatedAt descending
 */
export function sortProjectsByMomentum<T extends Project & { momentum?: Momentum }>(
  projects: T[]
): T[] {
  const momentumPriority: Record<Momentum, number> = {
    HOT: 1,
    ACTIVE: 2,
    QUIET: 3,
  }

  return [...projects].sort((a, b) => {
    const aMomentum = a.momentum || 'QUIET'
    const bMomentum = b.momentum || 'QUIET'

    // First sort by momentum priority
    const momentumDiff = momentumPriority[aMomentum] - momentumPriority[bMomentum]
    if (momentumDiff !== 0) return momentumDiff

    // If same momentum, sort by most recently updated
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

/**
 * Sort projects by feels right score (highest first)
 */
export function sortProjectsByFeelsRight(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => b.feelsRightScore - a.feelsRightScore)
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate project data before making API calls
 */
export function validateProjectData(data: Partial<CreateProjectRequest | UpdateProjectRequest>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if ('name' in data) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Project name is required')
    }
  }

  if ('feelsRightScore' in data && data.feelsRightScore !== undefined) {
    if (!validateFeelsRightScore(data.feelsRightScore)) {
      errors.push('Feels right score must be between 1 and 5')
    }
  }

  if ('shipTarget' in data && data.shipTarget !== undefined) {
    const shipTarget = new Date(data.shipTarget)
    if (isNaN(shipTarget.getTime())) {
      errors.push('Ship target must be a valid date')
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
 * Handle project errors consistently
 */
export function handleProjectError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}
