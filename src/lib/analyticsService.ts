import { StreakData, ApiResponse, Analytics } from '@/types'
import { startOfDay, differenceInDays, format, subDays } from 'date-fns'
import { getUserTimezone } from '@/lib/utils'

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = '/api/analytics'

// ============================================================================
// Streak Calculation Functions
// ============================================================================

/**
 * Calculate current ship streak from analytics records
 * Records must be sorted by date descending (most recent first)
 */
export function calculateShipStreak(analytics: Analytics[]): number {
  if (analytics.length === 0) return 0

  const timezone = getUserTimezone()
  const today = normalizeToUserTimezone(new Date(), timezone)
  let currentStreak = 0

  // Sort analytics by date descending to ensure correct order
  const sortedAnalytics = [...analytics].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Check each consecutive day for shipCount > 0
  for (let i = 0; i < sortedAnalytics.length; i++) {
    const record = sortedAnalytics[i]
    const recordDate = normalizeToUserTimezone(new Date(record.date), timezone)
    const expectedDate = normalizeToUserTimezone(subDays(today, i), timezone)

    // Check if this record is for the expected consecutive day
    if (recordDate.getTime() === expectedDate.getTime()) {
      if (record.shipCount > 0) {
        currentStreak++
      } else {
        // Gap in streak (day with no ships)
        break
      }
    } else {
      // Missing day in records
      break
    }
  }

  return currentStreak
}

/**
 * Calculate longest ship streak from all-time analytics records
 */
export function calculateLongestStreak(analytics: Analytics[]): number {
  if (analytics.length === 0) return 0

  const timezone = getUserTimezone()
  // Sort analytics by date ascending for iteration
  const sortedAnalytics = [...analytics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let maxStreak = 0
  let currentStreak = 0
  let lastDate: Date | null = null

  sortedAnalytics.forEach((record) => {
    const recordDate = normalizeToUserTimezone(new Date(record.date), timezone)

    if (record.shipCount > 0) {
      if (lastDate === null) {
        // First record with ships
        currentStreak = 1
      } else {
        const daysDiff = differenceInDays(recordDate, lastDate)
        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++
        } else {
          // Gap in streak
          maxStreak = Math.max(maxStreak, currentStreak)
          currentStreak = 1
        }
      }
      lastDate = recordDate
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      // Day with no ships
      maxStreak = Math.max(maxStreak, currentStreak)
      currentStreak = 0
      lastDate = null
    }
  })

  return maxStreak
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get streak data from API (pre-calculated)
 */
export async function getStreakData(): Promise<ApiResponse<StreakData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/streak`)

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch streak data',
        message: null,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      error: null,
      message: null,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleAnalyticsError(error),
      message: null,
    }
  }
}

// Alias for consistency with naming convention
export const fetchStreakData = getStreakData

/**
 * Mark ship for today
 */
export async function markShipToday(metadata?: Record<string, unknown>): Promise<ApiResponse<Analytics>> {
  try {
    const timezone = getUserTimezone()
    const response = await fetch(`${API_BASE_URL}/ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timezone,
        metadata,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to mark ship',
        message: null,
      }
    }

    const analytics = await response.json()
    return {
      success: true,
      data: analytics,
      error: null,
      message: 'Ship marked successfully',
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleAnalyticsError(error),
      message: null,
    }
  }
}

/**
 * Get weekly ship data (last 7 days)
 */
export async function getWeeklyShipData(): Promise<
  Array<{
    date: string
    shipCount: number
    dayOfWeek: string
  }>
> {
  try {
    const timezone = getUserTimezone()
    const response = await fetch(`${API_BASE_URL}/weekly?timezone=${timezone}`)

    if (!response.ok) {
      throw new Error('Failed to fetch weekly data')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching weekly ship data:', error)
    return []
  }
}

// Alias for consistency with naming convention
export const fetchWeeklyShipData = getWeeklyShipData

// ============================================================================
// Ship Status Functions
// ============================================================================

/**
 * Check if user has shipped today
 */
export function hasShippedToday(analytics: Analytics[]): boolean {
  const timezone = getUserTimezone()
  const today = normalizeToUserTimezone(new Date(), timezone)

  return analytics.some((record) => {
    const recordDate = normalizeToUserTimezone(new Date(record.date), timezone)
    return recordDate.getTime() === today.getTime() && record.shipCount > 0
  })
}

/**
 * Get last ship date from analytics records
 */
export function getLastShipDate(analytics: Analytics[]): Date | null {
  const timezone = getUserTimezone()
  // Sort by date descending
  const sortedAnalytics = [...analytics].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const lastShip = sortedAnalytics.find((record) => record.shipCount > 0)
  return lastShip ? normalizeToUserTimezone(new Date(lastShip.date), timezone) : null
}

/**
 * Get days since last ship
 */
export function getDaysSinceLastShip(lastShipDate: Date | null): number | null {
  if (!lastShipDate) return null
  const timezone = getUserTimezone()
  const today = normalizeToUserTimezone(new Date(), timezone)
  const lastShip = normalizeToUserTimezone(lastShipDate, timezone)
  return differenceInDays(today, lastShip)
}

// ============================================================================
// Display & Formatting Functions
// ============================================================================

/**
 * Format streak display with emoji
 */
export function formatStreakDisplay(currentStreak: number): string {
  if (currentStreak === 0) {
    return 'No active streak'
  }

  const days = currentStreak === 1 ? 'day' : 'days'
  return `🔥 ${currentStreak} ${days} streak`
}

/**
 * Get milestone message for special streak numbers
 */
export function getStreakMilestone(currentStreak: number): string | null {
  const milestones: Record<number, string> = {
    7: 'Week streak! 🎉',
    14: 'Two weeks! 💪',
    30: 'Month streak! 🚀',
    60: 'Two months! 🌟',
    100: 'Century! 💯',
    365: 'Full year! 🏆',
  }

  return milestones[currentStreak] || null
}

/**
 * Check if celebration should trigger
 */
export function shouldCelebrate(previousStreak: number, newStreak: number): boolean {
  // Celebrate when streak extends
  if (newStreak > previousStreak) return true

  // Celebrate on milestones
  if (getStreakMilestone(newStreak) !== null) return true

  return false
}

// ============================================================================
// Timezone Functions
// ============================================================================

/**
 * Normalize date to user's timezone for accurate "today" calculations
 */
export function normalizeToUserTimezone(date: Date, timezone: string): Date {
  // Create a date string in the user's timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }

  const formatter = new Intl.DateTimeFormat('en-US', options)
  const parts = formatter.formatToParts(date)

  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '0')
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1') - 1
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1')

  return new Date(year, month, day)
}

// ============================================================================
// Chart Data Functions
// ============================================================================

/**
 * Get weekday labels for chart X-axis
 */
export function getWeekdayLabels(): string[] {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
}

/**
 * Fill missing days in weekly data to ensure complete 7-day dataset
 */
export function fillMissingDays(
  weeklyData: Array<{ date: string; shipCount: number; dayOfWeek: string }>
): Array<{ date: string; shipCount: number; dayOfWeek: string }> {
  const today = new Date()
  const filledData: Array<{ date: string; shipCount: number; dayOfWeek: string }> = []

  // Generate last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = startOfDay(subDays(today, i))
    const dateString = format(date, 'yyyy-MM-dd')
    const dayOfWeek = format(date, 'EEE')

    // Find existing data for this date
    const existingData = weeklyData.find((d) => d.date === dateString)

    filledData.push({
      date: dateString,
      shipCount: existingData?.shipCount || 0,
      dayOfWeek,
    })
  }

  return filledData
}

/**
 * Format weekly data for chart consumption
 * Ensures complete 7-day dataset with proper labels
 */
export function formatWeeklyDataForChart(
  weeklyData: Array<{ date: string; shipCount: number; dayOfWeek: string }>
): Array<{ date: string; shipCount: number; dayOfWeek: string }> {
  return fillMissingDays(weeklyData)
}

/**
 * Calculate weekly average ship count
 */
export function calculateWeeklyAverage(
  weeklyData: Array<{ date: string; shipCount: number; dayOfWeek: string }>
): number {
  if (weeklyData.length === 0) return 0

  const totalShips = weeklyData.reduce((sum, day) => sum + day.shipCount, 0)
  const average = totalShips / weeklyData.length

  return Math.round(average * 10) / 10 // Round to 1 decimal place
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate analytics data
 */
export function validateAnalyticsData(data: Partial<Analytics>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if ('date' in data && data.date) {
    const date = new Date(data.date)
    if (isNaN(date.getTime())) {
      errors.push('Invalid date')
    }
  }

  if ('shipCount' in data && data.shipCount !== undefined) {
    if (typeof data.shipCount !== 'number' || data.shipCount < 0) {
      errors.push('Ship count must be a non-negative number')
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
 * Handle analytics errors consistently
 */
export function handleAnalyticsError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}
