/**
 * API route for aggregated dashboard statistics
 * GET: Retrieve dashboard stats (active session, ship streak, active projects, etc.)
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/api-utils'
import { startOfDay, endOfDay } from 'date-fns'
import { SessionStatus, DashboardStats } from '@/types'

// Cache response for 60 seconds
export const revalidate = 60

/**
 * GET /api/dashboard/stats
 * Retrieve aggregated dashboard statistics
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const userId = session.user.id
    const now = new Date()

    // Execute parallel queries for better performance
    const [activeSession, activeProjectsCount, todaysSessions, user] = await Promise.all([
      // Query active session
      prisma.codingSession.findFirst({
        where: {
          userId,
          sessionStatus: SessionStatus.ACTIVE,
        },
        include: {
          project: true,
        },
      }),

      // Count active projects
      prisma.project.count({
        where: {
          userId,
          isActive: true,
        },
      }),

      // Query today's sessions for total coding time
      prisma.codingSession.findMany({
        where: {
          userId,
          startedAt: {
            gte: startOfDay(now),
            lte: endOfDay(now),
          },
        },
        select: {
          durationSeconds: true,
        },
      }),

      // Get user data for ship streak and flow state
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          shipStreak: true,
          flowState: true,
        },
      }),
    ])

    if (!user) {
      return apiError('User not found', 404)
    }

    // Calculate today's total coding time in minutes
    const todaysCodingMinutes = Math.floor(
      todaysSessions.reduce((sum: number, session: { durationSeconds: number }) => sum + session.durationSeconds, 0) / 60
    )

    // Build dashboard stats response
    const stats: DashboardStats = {
      activeSessionId: activeSession?.id || null,
      shipStreak: user.shipStreak,
      activeProjectsCount,
      todaysCodingMinutes,
      flowState: user.flowState,
    }

    return apiResponse(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return apiError('Failed to fetch dashboard stats', 500)
  }
}
