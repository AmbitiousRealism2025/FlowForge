/**
 * API route for habit streak history
 * GET: Get detailed streak information for a habit
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, handlePrismaError } from '@/lib/api-utils'
import { subDays } from 'date-fns'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/habits/[id]/streak
 * Get detailed streak information for a habit
 *
 * Note: Completion dates are approximated for MVP (no completion history table)
 * Future enhancement: Add HabitCompletion table to track detailed completion history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const habit = await prisma.habit.findUnique({
      where: { id: params.id },
    })

    if (!habit) {
      return apiError('Habit not found', 404)
    }

    if (habit.userId !== session.user.id) {
      return apiError('Unauthorized', 403)
    }

    // Calculate streak data
    const currentStreak = habit.streakCount
    // For MVP, longest streak equals current streak (assumes no breaks)
    const longestStreak = habit.streakCount

    // Generate approximate completion dates based on current streak
    // This is a MVP approximation - in production, this would come from a HabitCompletion table
    const completionDates: Date[] = []
    if (habit.streakCount > 0) {
      const today = new Date()
      for (let i = 0; i < habit.streakCount; i++) {
        completionDates.push(subDays(today, i))
      }
      completionDates.reverse() // Oldest to newest
    }

    // Calculate completion rate (MVP: 100% if streak > 0, 0% otherwise)
    // In production, this would be calculated from actual completion history
    const completionRate = habit.streakCount > 0 ? 100 : 0

    const streakData = {
      currentStreak,
      longestStreak,
      completionDates,
      completionRate,
      lastCompletedAt: habit.lastCompletedAt,
    }

    return apiResponse(streakData)
  } catch (error) {
    console.error('Error fetching habit streak:', error)
    return handlePrismaError(error)
  }
}
