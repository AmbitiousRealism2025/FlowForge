/**
 * API route for analytics summary metrics
 * GET: Returns aggregated summary metrics for dashboard
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/api-utils'
import { startOfDay, subDays, startOfMonth, endOfMonth, getDay, getHours } from 'date-fns'
import { AnalyticsSummary, DateRangeFilter, SessionType } from '@/types'

// Cache response for 5 minutes
export const revalidate = 300

/**
 * GET /api/analytics/advanced/summary
 * Calculate summary metrics for analytics dashboard
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

    // Execute parallel queries for different metrics
    const [sessions, analyticsRecords] = await Promise.all([
      // Query coding sessions for flow score and model performance
      prisma.codingSession.findMany({
        where: {
          userId,
          startedAt: {
            gte: startDate,
          },
        },
        select: {
          id: true,
          productivityScore: true,
          aiModelsUsed: true,
          durationSeconds: true,
          sessionType: true,
          startedAt: true,
        },
      }),

      // Query analytics for ships this month
      prisma.analytics.findMany({
        where: {
          userId,
          date: {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          },
        },
        select: {
          shipCount: true,
        },
      }),
    ])

    // Calculate average flow score
    const sessionsWithScores = sessions.filter((s) => s.productivityScore !== null)
    const averageFlowScore =
      sessionsWithScores.length > 0
        ? sessionsWithScores.reduce((sum, s) => sum + (s.productivityScore || 0), 0) /
          sessionsWithScores.length
        : 0

    // Find most productive model
    const modelScores = new Map<string, number[]>()

    sessions.forEach((session) => {
      if (session.productivityScore === null || session.aiModelsUsed.length === 0) return

      const model = session.aiModelsUsed[0]
      if (!modelScores.has(model)) {
        modelScores.set(model, [])
      }
      modelScores.get(model)!.push(session.productivityScore)
    })

    let mostProductiveModel = 'N/A'
    let bestModelScore = 0

    modelScores.forEach((scores, model) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      if (avgScore > bestModelScore) {
        bestModelScore = avgScore
        mostProductiveModel = model
      }
    })

    // Find best time of day
    const timeSlotScores = new Map<string, number[]>()

    sessions.forEach((session) => {
      if (session.productivityScore === null) return

      const dayOfWeek = getDay(session.startedAt)
      const hour = getHours(session.startedAt)
      const key = `${dayOfWeek}-${hour}`

      if (!timeSlotScores.has(key)) {
        timeSlotScores.set(key, [])
      }
      timeSlotScores.get(key)!.push(session.productivityScore)
    })

    let bestTimeOfDay = 'Not enough data'
    let bestTimeScore = 0
    let bestDayOfWeek = 0
    let bestHour = 0

    timeSlotScores.forEach((scores, key) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      if (avgScore > bestTimeScore) {
        bestTimeScore = avgScore
        const [dayStr, hourStr] = key.split('-')
        bestDayOfWeek = parseInt(dayStr)
        bestHour = parseInt(hourStr)
      }
    })

    if (bestTimeScore > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const dayName = dayNames[bestDayOfWeek]

      let timeOfDay = 'morning'
      if (bestHour >= 12 && bestHour < 17) {
        timeOfDay = 'afternoon'
      } else if (bestHour >= 17 && bestHour < 21) {
        timeOfDay = 'evening'
      } else if (bestHour >= 21 || bestHour < 5) {
        timeOfDay = 'night'
      }

      bestTimeOfDay = `${dayName} ${timeOfDay}`
    }

    // Calculate total ships this month
    const totalShipsThisMonth = analyticsRecords.reduce((sum, record) => sum + record.shipCount, 0)

    // Calculate total coding minutes
    const totalCodingMinutes = sessions.reduce(
      (sum, session) => sum + Math.round(session.durationSeconds / 60),
      0
    )

    const summary: AnalyticsSummary = {
      averageFlowScore: Math.round(averageFlowScore * 10) / 10, // Round to 1 decimal
      mostProductiveModel,
      bestTimeOfDay,
      totalShipsThisMonth,
      totalCodingMinutes,
    }

    return apiResponse(summary)
  } catch (error) {
    console.error('Error fetching analytics summary:', error)
    return apiError('Failed to fetch analytics summary', 500)
  }
}
