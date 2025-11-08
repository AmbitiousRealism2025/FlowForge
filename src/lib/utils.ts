import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  format,
  formatDistance,
  formatDistanceToNow,
  parseISO,
  startOfDay,
  endOfDay,
  isToday,
  isYesterday,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  subDays,
} from 'date-fns'
import { SessionType, NoteCategory, Momentum, FlowState } from '@/types'

// ============================================================================
// Class Name Utilities
// ============================================================================

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// Date & Time Utilities
// ============================================================================

/**
 * Format duration in seconds to human-readable string
 * Enhanced to handle edge cases and multiple formats
 */
export function formatDuration(seconds: number, long: boolean = false): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (long) {
    const parts = []
    if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
    if (secs > 0 && days === 0 && hours === 0) parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`)
    return parts.join(' ')
  }

  // Short format
  if (days > 0) {
    return `${days}d ${hours}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m`
  }
  return `${secs}s`
}

/**
 * Format date to human-readable string
 */
export function formatDate(
  date: Date | string,
  formatType: 'short' | 'medium' | 'long' | 'time' | 'datetime' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  switch (formatType) {
    case 'short':
      return format(dateObj, 'MMM d')
    case 'medium':
      return format(dateObj, 'MMM d, yyyy')
    case 'long':
      return format(dateObj, 'MMMM d, yyyy')
    case 'time':
      return format(dateObj, 'h:mm a')
    case 'datetime':
      return format(dateObj, 'MMM d, h:mm a')
    default:
      return format(dateObj, 'MMM d, yyyy')
  }
}

/**
 * Format date to relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diffMinutes = differenceInMinutes(now, dateObj)

  // Handle "just now" for recent times (< 1 minute)
  if (Math.abs(diffMinutes) < 1) {
    return 'just now'
  }

  return formatDistanceToNow(dateObj, { addSuffix: true })
}

/**
 * Get time of day period for contextual greetings
 */
export function getTimeOfDay(date: Date = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hours = date.getHours()

  if (hours >= 5 && hours < 12) return 'morning'
  if (hours >= 12 && hours < 17) return 'afternoon'
  if (hours >= 17 && hours < 21) return 'evening'
  return 'night'
}

/**
 * Calculate duration in seconds between two dates
 */
export function calculateDuration(startDate: Date, endDate: Date = new Date()): number {
  return Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
}

/**
 * Check if a date falls within a date range
 */
export function isWithinDateRange(date: Date, startDate: Date, endDate: Date): boolean {
  const dateTime = date.getTime()
  return dateTime >= startDate.getTime() && dateTime <= endDate.getTime()
}

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate feels right score (1-5)
 */
export function validateFeelsRightScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 5
}

/**
 * Validate session type enum value
 */
export function validateSessionType(value: string): value is SessionType {
  return Object.values(SessionType).includes(value as SessionType)
}

/**
 * Validate note category enum value
 */
export function validateNoteCategory(value: string): value is NoteCategory {
  return Object.values(NoteCategory).includes(value as NoteCategory)
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Truncate text to specified length with suffix
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Convert string to URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Get Tailwind color class for momentum status
 */
export function getMomentumColor(momentum: Momentum): string {
  switch (momentum) {
    case 'HOT':
      return 'text-red-500'
    case 'ACTIVE':
      return 'text-yellow-500'
    case 'QUIET':
      return 'text-gray-400'
  }
}

/**
 * Get Tailwind color class for session type
 */
export function getSessionTypeColor(sessionType: SessionType): string {
  switch (sessionType) {
    case SessionType.BUILDING:
      return 'text-blue-500'
    case SessionType.EXPLORING:
      return 'text-purple-500'
    case SessionType.DEBUGGING:
      return 'text-red-500'
    case SessionType.SHIPPING:
      return 'text-green-500'
  }
}

/**
 * Get Tailwind color class for note category
 */
export function getNoteCategoryColor(category: NoteCategory): string {
  switch (category) {
    case NoteCategory.PROMPT_PATTERN:
      return 'text-purple-500'
    case NoteCategory.GOLDEN_CODE:
      return 'text-yellow-500'
    case NoteCategory.DEBUG_LOG:
      return 'text-red-500'
    case NoteCategory.MODEL_NOTE:
      return 'text-blue-500'
    case NoteCategory.INSIGHT:
      return 'text-gray-500'
  }
}

/**
 * Calculate flow state color based on health percentage
 * Enhanced with variant support for backgrounds and borders
 */
export function getFlowStateColor(
  health: number,
  variant: 'text' | 'bg' | 'border' = 'text'
): string {
  const colorMap = {
    green: {
      text: 'text-flow-green',
      bg: 'bg-flow-green',
      border: 'border-flow-green',
    },
    amber: {
      text: 'text-caution-amber',
      bg: 'bg-caution-amber',
      border: 'border-caution-amber',
    },
    red: {
      text: 'text-stuck-red',
      bg: 'bg-stuck-red',
      border: 'border-stuck-red',
    },
  }

  let colorKey: 'green' | 'amber' | 'red'
  if (health >= 70) colorKey = 'green'
  else if (health >= 40) colorKey = 'amber'
  else colorKey = 'red'

  return colorMap[colorKey][variant]
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Group array of items by date
 */
export function groupByDate<T extends { createdAt: Date | string }>(
  items: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>()

  items.forEach((item) => {
    const date = typeof item.createdAt === 'string' ? parseISO(item.createdAt) : item.createdAt
    const dateKey = format(date, 'yyyy-MM-dd')

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(item)
  })

  return grouped
}

// ============================================================================
// Number Utilities
// ============================================================================

/**
 * Calculate percentage with optional decimal places
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimalPlaces: number = 0
): number {
  if (total === 0) return 0
  const percentage = (value / total) * 100
  return Number(percentage.toFixed(decimalPlaces))
}
