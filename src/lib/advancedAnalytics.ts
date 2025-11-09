import {
  FlowScoreTrendData,
  ModelPerformanceData,
  ProductivityHeatmapData,
  AnalyticsSummary,
  DateRangeFilter,
  SessionType,
  ApiResponse,
} from '@/types'
import { startOfDay, subDays, format, getDay, getHours, differenceInDays } from 'date-fns'
import { getUserTimezone } from '@/lib/utils'

// ============================================================================
// Constants
// ============================================================================

const API_BASE = '/api/analytics/advanced'

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get flow score trend data from API
 */
export async function getFlowScoreTrend(
  dateRange: DateRangeFilter
): Promise<ApiResponse<FlowScoreTrendData[]>> {
  try {
    const timezone = getUserTimezone()
    const response = await fetch(`${API_BASE}/flow-score?range=${dateRange}&timezone=${timezone}`)

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.message || 'Failed to fetch flow score trend data',
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: handleAdvancedAnalyticsError(error),
    }
  }
}

/**
 * Get AI model performance comparison data from API
 */
export async function getModelPerformance(
  dateRange: DateRangeFilter
): Promise<ApiResponse<ModelPerformanceData[]>> {
  try {
    const timezone = getUserTimezone()
    const response = await fetch(
      `${API_BASE}/model-performance?range=${dateRange}&timezone=${timezone}`
    )

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.message || 'Failed to fetch model performance data',
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: handleAdvancedAnalyticsError(error),
    }
  }
}

/**
 * Get productivity heatmap data from API
 */
export async function getBestTimes(
  dateRange: DateRangeFilter
): Promise<ApiResponse<ProductivityHeatmapData[]>> {
  try {
    const timezone = getUserTimezone()
    const response = await fetch(`${API_BASE}/best-times?range=${dateRange}&timezone=${timezone}`)

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.message || 'Failed to fetch productivity heatmap data',
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: handleAdvancedAnalyticsError(error),
    }
  }
}

/**
 * Get analytics summary metrics from API
 */
export async function getAnalyticsSummary(
  dateRange: DateRangeFilter
): Promise<ApiResponse<AnalyticsSummary>> {
  try {
    const timezone = getUserTimezone()
    const response = await fetch(`${API_BASE}/summary?range=${dateRange}&timezone=${timezone}`)

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.message || 'Failed to fetch analytics summary',
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: handleAdvancedAnalyticsError(error),
    }
  }
}

// ============================================================================
// Client-Side Helper Functions
// ============================================================================

/**
 * Calculate moving average for trend smoothing
 */
export function calculateMovingAverage(
  data: FlowScoreTrendData[],
  windowSize: number = 7
): FlowScoreTrendData[] {
  if (data.length < windowSize) {
    return data
  }

  return data.map((item, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2))
    const end = Math.min(data.length, start + windowSize)
    const window = data.slice(start, end)

    const avgScore = window.reduce((sum, d) => sum + d.averageScore, 0) / window.length

    return {
      ...item,
      movingAverage: Math.round(avgScore * 10) / 10, // Round to 1 decimal
    }
  })
}

/**
 * Find the best time of day from heatmap data
 */
export function findBestTimeOfDay(heatmapData: ProductivityHeatmapData[]): string {
  if (heatmapData.length === 0) {
    return 'Not enough data'
  }

  // Find the time slot with highest average score
  const bestSlot = heatmapData.reduce((best, current) => {
    return current.averageScore > best.averageScore ? current : best
  })

  // Convert to human-readable format
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = dayNames[bestSlot.dayOfWeek]

  let timeOfDay = 'morning'
  if (bestSlot.hour >= 12 && bestSlot.hour < 17) {
    timeOfDay = 'afternoon'
  } else if (bestSlot.hour >= 17 && bestSlot.hour < 21) {
    timeOfDay = 'evening'
  } else if (bestSlot.hour >= 21 || bestSlot.hour < 5) {
    timeOfDay = 'night'
  }

  return `${dayName} ${timeOfDay}`
}

/**
 * Format AI model name for display
 */
export function formatModelName(modelName: string): string {
  // Standardize common model names
  const nameMap: Record<string, string> = {
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gpt-4': 'GPT-4',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    cursor: 'Cursor',
    copilot: 'GitHub Copilot',
    'local-model': 'Local Model',
  }

  return nameMap[modelName.toLowerCase()] || modelName
}

/**
 * Export analytics data to CSV
 */
export function exportAnalyticsData(
  data: FlowScoreTrendData[] | ModelPerformanceData[] | ProductivityHeatmapData[],
  filename: string
): void {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Convert data to CSV format
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((row) => Object.values(row).join(',')).join('\n')
  const csv = `${headers}\n${rows}`

  // Create blob and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Validate date range filter value
 */
export function validateDateRange(range: string): boolean {
  const validRanges: DateRangeFilter[] = ['7d', '30d', '90d', 'all']
  return validRanges.includes(range as DateRangeFilter)
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handle advanced analytics errors consistently
 */
export function handleAdvancedAnalyticsError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred while fetching analytics data'
}
