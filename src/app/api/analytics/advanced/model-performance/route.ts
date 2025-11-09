/**
 * API route for AI model performance comparison
 * GET: Returns performance metrics grouped by AI model
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/api-utils'
import { startOfDay, subDays } from 'date-fns'
import { ModelPerformanceData, DateRangeFilter, SessionType } from '@/types'

// Cache response for 5 minutes
export const revalidate = 300

/**
 * GET /api/analytics/advanced/model-performance
 * Calculate AI model performance metrics
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

    // Query coding sessions with AI models and productivity scores
    const sessions = await prisma.codingSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: startDate,
        },
        productivityScore: {
          not: null,
        },
        aiModelsUsed: {
          isEmpty: false,
        },
      },
      select: {
        id: true,
        aiModelsUsed: true,
        productivityScore: true,
        durationSeconds: true,
        sessionType: true,
      },
    })

    // Group sessions by model (use first model in array)
    const modelData = new Map<string, {
      scores: number[]
      sessionCount: number
      totalMinutes: number
      sessionTypes: Map<SessionType, number[]>
    }>()

    sessions.forEach((session) => {
      // Extract primary model (first in array)
      const model = session.aiModelsUsed[0]
      if (!model) return

      const score = session.productivityScore || 0
      const minutes = Math.round(session.durationSeconds / 60)

      if (!modelData.has(model)) {
        modelData.set(model, {
          scores: [],
          sessionCount: 0,
          totalMinutes: 0,
          sessionTypes: new Map(),
        })
      }

      const data = modelData.get(model)!
      data.scores.push(score)
      data.sessionCount++
      data.totalMinutes += minutes

      // Track scores by session type
      if (!data.sessionTypes.has(session.sessionType)) {
        data.sessionTypes.set(session.sessionType, [])
      }
      data.sessionTypes.get(session.sessionType)!.push(score)
    })

    // Calculate performance metrics for each model
    const result: ModelPerformanceData[] = []

    modelData.forEach((data, modelName) => {
      // Calculate average score
      const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length

      // Determine best session type for this model
      let bestSessionType: SessionType = SessionType.BUILDING
      let bestTypeScore = 0

      data.sessionTypes.forEach((scores, type) => {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
        if (avgScore > bestTypeScore) {
          bestTypeScore = avgScore
          bestSessionType = type
        }
      })

      result.push({
        modelName,
        averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
        sessionCount: data.sessionCount,
        totalMinutes: data.totalMinutes,
        bestSessionType,
      })
    })

    // Sort by average score descending (best models first)
    result.sort((a, b) => b.averageScore - a.averageScore)

    return apiResponse(result)
  } catch (error) {
    console.error('Error fetching model performance:', error)
    return apiError('Failed to fetch model performance data', 500)
  }
}
