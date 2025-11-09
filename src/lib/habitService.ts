/**
 * Business logic service for habit CRUD operations and streak calculations
 */

import {
  Habit,
  HabitWithStats,
  HabitCategory,
  CreateHabitRequest,
  UpdateHabitRequest,
  CompleteHabitRequest,
  HabitStreakData,
  ApiResponse,
} from '@/types'
import {
  formatHabitStreak,
  getHabitStreakMilestone,
  isHabitDueToday,
  calculateHabitStreak,
  getUserTimezone,
  formatRelativeTime,
} from '@/lib/utils'
import { startOfDay, differenceInDays, differenceInCalendarDays, isSameDay, subDays, parseISO } from 'date-fns'

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = '/api/habits'

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all habits for the current user
 */
export async function fetchHabits(): Promise<ApiResponse<Habit[]>> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch habits' }))
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data || data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Create a new habit
 */
export async function createHabit(
  name: string,
  category: HabitCategory,
  targetFrequency: number = 1
): Promise<ApiResponse<Habit>> {
  try {
    const payload: CreateHabitRequest = {
      name,
      category,
      targetFrequency,
    }

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create habit' }))
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data || data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Update an existing habit
 */
export async function updateHabit(
  habitId: string,
  updateData: UpdateHabitRequest
): Promise<ApiResponse<Habit>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${habitId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update habit' }))
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data || data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Complete a habit for today
 */
export async function completeHabit(
  habitId: string,
  notes?: string
): Promise<
  ApiResponse<{
    habit: Habit
    newStreak: number
    isMilestone: boolean
    milestoneMessage: string | null
  }>
> {
  try {
    const payload: CompleteHabitRequest & { timezone: string } = {
      notes,
      timezone: getUserTimezone(),
    }

    const response = await fetch(`${API_BASE_URL}/${habitId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to complete habit' }))
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data || data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get detailed streak history for a habit
 */
export async function getHabitStreak(habitId: string): Promise<ApiResponse<HabitStreakData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${habitId}/streak`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch streak data' }))
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data.data || data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate streak from last completed date (client-side helper)
 */
export function calculateStreakFromLastCompleted(
  lastCompletedAt: Date | null,
  currentStreak: number,
  timezone: string
): number {
  if (!lastCompletedAt) return 0

  const now = new Date()
  const lastCompleted = typeof lastCompletedAt === 'string' ? parseISO(lastCompletedAt) : lastCompletedAt

  // If completed today, return current streak
  if (isSameDay(now, lastCompleted)) {
    return currentStreak
  }

  // Calculate days since last completion
  const daysSince = differenceInCalendarDays(now, lastCompleted)

  // If last completed yesterday, streak continues
  if (daysSince === 1) {
    return currentStreak
  }

  // If older than yesterday, streak breaks
  return 0
}

/**
 * Check if habit was completed today
 */
export function isCompletedToday(lastCompletedAt: Date | null | string, timezone: string): boolean {
  if (!lastCompletedAt) return false

  const now = new Date()
  const lastCompleted = typeof lastCompletedAt === 'string' ? parseISO(lastCompletedAt) : lastCompletedAt

  return isSameDay(now, lastCompleted)
}

/**
 * Enrich habit with calculated stats
 */
export function enrichHabitWithStats(habit: Habit, timezone: string): HabitWithStats {
  const completedToday = isCompletedToday(habit.lastCompletedAt, timezone)

  // Calculate days until due based on target frequency
  let daysUntilDue = 0
  if (habit.lastCompletedAt) {
    const lastCompleted = typeof habit.lastCompletedAt === 'string'
      ? parseISO(habit.lastCompletedAt)
      : habit.lastCompletedAt
    const daysSinceCompletion = differenceInDays(new Date(), lastCompleted)
    daysUntilDue = Math.max(0, habit.targetFrequency - daysSinceCompletion)
  }

  // Calculate completion rate (placeholder for MVP)
  const completionRate = habit.streakCount > 0 ? 100 : 0

  return {
    ...habit,
    completedToday,
    daysUntilDue,
    completionRate,
  }
}

/**
 * Validate habit data
 */
export function validateHabitData(data: Partial<CreateHabitRequest>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Habit name is required')
  }

  if (data.name && data.name.length > 100) {
    errors.push('Habit name must be 100 characters or less')
  }

  if (data.targetFrequency !== undefined) {
    if (!Number.isInteger(data.targetFrequency)) {
      errors.push('Target frequency must be an integer')
    }
    if (data.targetFrequency < 1 || data.targetFrequency > 365) {
      errors.push('Target frequency must be between 1 and 365 days')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Handle habit-related errors
 */
export function handleHabitError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'An unknown error occurred'
}
