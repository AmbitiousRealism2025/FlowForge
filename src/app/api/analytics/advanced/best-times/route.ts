/**
 * API route for productivity heatmap data
 * GET: Returns 7x24 productivity heatmap by day of week and hour
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/api-utils'
import { startOfDay, subDays, getDay, getHours } from 'date-fns'
import { ProductivityHeatmapData, DateRangeFilter } from '@/types'

// Cache response for 5 minutes
export const revalidate = 300

/**
 * GET /api/analytics/advanced/best-times
 * Calculate productivity patterns by day of week and hour
 * Query params: range (7d, 30d, 90d, all), timezone (user timezone)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const userId = session.user.id

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const range = (searchParams.get('range') || '30d') as DateRangeFilter
    const timezone = searchParams.get('timezone') || 'UTC'

    // Calculate start date based on range
    let startDate: Date
    const now = new Date()

    switch (range) {
      case '7d':
        startDate = startOfDay(subDays(now, 7))
        break
      case '30d':
        startDate = startOfDay(subDays(now, 30))
        break
      case '90d':
        startDate = startOfDay(subDays(now, 90))
        break
      case 'all':
        // Get user creation date
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { createdAt: true },
        })
        startDate = user ? startOfDay(user.createdAt) : startOfDay(subDays(now, 365))
        break
      default:
        startDate = startOfDay(subDays(now, 30))
    }

    // Query coding sessions with productivity scores
    const sessions = await prisma.codingSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: startDate,
        },
        productivityScore: {
          not: null,
        },
      },
      select: {
        id: true,
        startedAt: true,
        productivityScore: true,
      },
    })

    // Group sessions by (dayOfWeek, hour) tuple
    const heatmapData = new Map<string, {
      scores: number[]
      sessionCount: number
    }>()

    sessions.forEach((session) => {
      // Convert to user's timezone
      const sessionDate = session.startedAt

      // Extract day of week (0-6, Sunday-Saturday) and hour (0-23)
      const dayOfWeek = getDay(sessionDate)
      const hour = getHours(sessionDate)

      const key = `${dayOfWeek}-${hour}`
      const score = session.productivityScore || 0

      if (!heatmapData.has(key)) {
        heatmapData.set(key, {
          scores: [],
          sessionCount: 0,
        })
      }

      const data = heatmapData.get(key)!
      data.scores.push(score)
      data.sessionCount++
    })

    // Generate complete 7x24 grid
    const result: ProductivityHeatmapData[] = []

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${dayOfWeek}-${hour}`
        const data = heatmapData.get(key)

        if (data) {
          // Calculate average score
          const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
          result.push({
            dayOfWeek,
            hour,
            averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
            sessionCount: data.sessionCount,
          })
        } else {
          // Fill missing cell with zeros
          result.push({
            dayOfWeek,
            hour,
            averageScore: 0,
            sessionCount: 0,
          })
        }
      }
    }

    // Sort by dayOfWeek then hour
    result.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek
      }
      return a.hour - b.hour
    })

    return apiResponse(result)
  } catch (error) {
    console.error('Error fetching productivity heatmap:', error)
    return apiError('Failed to fetch productivity heatmap data', 500)
  }
}
