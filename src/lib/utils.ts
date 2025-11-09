import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  format,
  formatDistanceToNow,
  parseISO,
  differenceInMinutes,
  differenceInSeconds,
  differenceInDays,
  differenceInCalendarDays,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  isAfter,
  isBefore,
  isSameDay,
} from 'date-fns'
import { SessionType, SessionStatus, NoteCategory, Momentum, CodingSession } from '@/types'

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
 * Format session duration from CodingSession object
 */
export function formatSessionDuration(session: CodingSession): string {
  let durationSeconds = session.durationSeconds

  // If session has ended, calculate duration from timestamps
  if (session.endedAt && session.startedAt) {
    const startDate = typeof session.startedAt === 'string' ? parseISO(session.startedAt) : session.startedAt
    const endDate = typeof session.endedAt === 'string' ? parseISO(session.endedAt) : session.endedAt
    durationSeconds = differenceInSeconds(endDate, startDate)
  }

  return formatDuration(durationSeconds)
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
export function validateNoteCategory(value: NoteCategory | string): value is NoteCategory {
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
 * Get emoji icon for momentum status
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
 * Get human-readable label for momentum status
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

/**
 * Get emoji icon for feels right score (1-5)
 */
export function getFeelsRightEmoji(score: number): string {
  const clampedScore = Math.max(1, Math.min(5, score))
  switch (clampedScore) {
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
 * Get human-readable label for feels right score (1-5)
 */
export function getFeelsRightLabel(score: number): string {
  const clampedScore = Math.max(1, Math.min(5, score))
  switch (clampedScore) {
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
      return 'Okay'
  }
}

/**
 * Get Tailwind color class for feels right score (1-5)
 */
export function getFeelsRightColor(score: number): string {
  const clampedScore = Math.max(1, Math.min(5, score))
  if (clampedScore <= 2) return 'text-stuck-red'
  if (clampedScore === 3) return 'text-caution-amber'
  return 'text-flow-green'
}

/**
 * Format ship target date to human-readable string
 */
export function formatShipTarget(shipTarget: Date | string | null | undefined): string {
  if (!shipTarget) return 'No target set'

  const targetDate = typeof shipTarget === 'string' ? parseISO(shipTarget) : shipTarget
  const now = new Date()
  const daysDiff = differenceInDays(targetDate, now)

  if (daysDiff > 0) {
    return `Ships in ${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`
  } else if (daysDiff < 0) {
    return `Shipped ${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'day' : 'days'} ago`
  } else {
    return 'Ships today'
  }
}

/**
 * Get emoji icon for session type
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
  }
}

/**
 * Get human-readable label for session type
 */
export function getSessionTypeLabel(sessionType: SessionType): string {
  switch (sessionType) {
    case SessionType.BUILDING:
      return 'Building'
    case SessionType.EXPLORING:
      return 'Exploring'
    case SessionType.DEBUGGING:
      return 'Debugging'
    case SessionType.SHIPPING:
      return 'Shipping'
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
 * Get Tailwind color class for session status
 */
export function getSessionStatusColor(status: SessionStatus): string {
  switch (status) {
    case SessionStatus.ACTIVE:
      return 'text-green-500'
    case SessionStatus.PAUSED:
      return 'text-yellow-500'
    case SessionStatus.COMPLETED:
      return 'text-gray-500'
    case SessionStatus.ABANDONED:
      return 'text-red-500'
  }
}

/**
 * Get human-readable label for session status
 */
export function getSessionStatusLabel(status: SessionStatus): string {
  switch (status) {
    case SessionStatus.ACTIVE:
      return 'In Progress'
    case SessionStatus.PAUSED:
      return 'Paused'
    case SessionStatus.COMPLETED:
      return 'Completed'
    case SessionStatus.ABANDONED:
      return 'Abandoned'
  }
}

/**
 * Get emoji icon for note category
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
 * Get Tailwind background color class for note category
 */
export function getNoteCategoryBgColor(category: NoteCategory): string {
  switch (category) {
    case NoteCategory.PROMPT_PATTERN:
      return 'bg-purple-100 dark:bg-purple-900/20'
    case NoteCategory.GOLDEN_CODE:
      return 'bg-yellow-100 dark:bg-yellow-900/20'
    case NoteCategory.DEBUG_LOG:
      return 'bg-red-100 dark:bg-red-900/20'
    case NoteCategory.MODEL_NOTE:
      return 'bg-blue-100 dark:bg-blue-900/20'
    case NoteCategory.INSIGHT:
      return 'bg-gray-100 dark:bg-gray-900/20'
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

/**
 * Calculate context health color classes based on health value (0-100)
 * Returns object with textColor and bgColor for UI components
 */
export function calculateContextHealthColor(health: number): {
  textColor: string
  bgColor: string
} {
  if (health >= 70) {
    return {
      textColor: 'text-flow-green',
      bgColor: 'bg-flow-green',
    }
  } else if (health >= 40) {
    return {
      textColor: 'text-caution-amber',
      bgColor: 'bg-caution-amber',
    }
  } else {
    return {
      textColor: 'text-stuck-red',
      bgColor: 'bg-stuck-red',
    }
  }
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

// ============================================================================
// Tag Utilities
// ============================================================================

/**
 * Parse comma-separated tags string into array
 * Trims whitespace, removes duplicates, converts to lowercase
 */
export function parseTags(tagsInput: string): string[] {
  return tagsInput
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .filter((tag, index, array) => array.indexOf(tag) === index)
}

/**
 * Format tags array into comma-separated string
 */
export function formatTags(tags: string[]): string {
  return tags.join(', ')
}
