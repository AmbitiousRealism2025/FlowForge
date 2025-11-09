/**
 * API route for flow score trend data
 * GET: Returns 30-day flow score trend with aggregated daily data
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/api-utils'
import { startOfDay, subDays, format } from 'date-fns'
import { FlowScoreTrendData, DateRangeFilter } from '@/types'

// Cache response for 5 minutes
export const revalidate = 300

/**
 * GET /api/analytics/advanced/flow-score
 * Calculate daily flow score trends
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
        durationSeconds: true,
      },
      orderBy: {
        startedAt: 'asc',
      },
    })

    // Group sessions by date and calculate aggregates
    const dataByDate = new Map<string, {
      scores: number[]
      sessionCount: number
      totalMinutes: number
    }>()

    sessions.forEach((session) => {
      const dateStr = format(startOfDay(session.startedAt), 'yyyy-MM-dd')
      const score = session.productivityScore || 0
      const minutes = Math.round(session.durationSeconds / 60)

      if (!dataByDate.has(dateStr)) {
        dataByDate.set(dateStr, {
          scores: [],
          sessionCount: 0,
          totalMinutes: 0,
        })
      }

      const data = dataByDate.get(dateStr)!
      data.scores.push(score)
      data.sessionCount++
      data.totalMinutes += minutes
    })

    // Generate complete date range and fill missing dates
    const result: FlowScoreTrendData[] = []
    let currentDate = startDate

    while (currentDate <= now) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const data = dataByDate.get(dateStr)

      if (data) {
        // Calculate average score
        const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
        result.push({
          date: dateStr,
          averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
          sessionCount: data.sessionCount,
          totalMinutes: data.totalMinutes,
        })
      } else {
        // Fill missing date with zeros
        result.push({
          date: dateStr,
          averageScore: 0,
          sessionCount: 0,
          totalMinutes: 0,
        })
      }

      currentDate = subDays(currentDate, -1) // Move to next day
    }

    return apiResponse(result)
  } catch (error) {
    console.error('Error fetching flow score trend:', error)
    return apiError('Failed to fetch flow score trend data', 500)
  }
}
