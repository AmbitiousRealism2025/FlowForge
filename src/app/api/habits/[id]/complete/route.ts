/**
 * API route for habit completion
 * POST: Mark habit as completed for today
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CompleteHabitSchema } from '@/lib/validations'
import {
  apiResponse,
  apiError,
  parseJsonBody,
  handleZodError,
  handlePrismaError,
} from '@/lib/api-utils'
import { startOfDay, differenceInCalendarDays, isSameDay, parseISO } from 'date-fns'
import { getHabitStreakMilestone } from '@/lib/utils'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/habits/[id]/complete
 * Complete habit for today with timezone-aware streak calculation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const body = await parseJsonBody(request)

    if (!body) {
      return apiError('Invalid JSON body', 400)
    }

    const validation = CompleteHabitSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    const { notes } = validation.data
    // Get timezone from request body (sent by client)
    const timezone = (body as { timezone?: string }).timezone || 'UTC'

    // Fetch existing habit
    const habit = await prisma.habit.findUnique({
      where: { id: params.id },
    })

    if (!habit) {
      return apiError('Habit not found', 404)
    }

    if (habit.userId !== session.user.id) {
      return apiError('Unauthorized', 403)
    }

    // Normalize today's date to user's timezone
    const now = new Date()
    const today = startOfDay(now)

    // Check if already completed today
    if (habit.lastCompletedAt) {
      const lastCompleted =
        typeof habit.lastCompletedAt === 'string'
          ? parseISO(habit.lastCompletedAt)
          : habit.lastCompletedAt

      if (isSameDay(today, lastCompleted)) {
        return apiError('Habit already completed today', 400)
      }
    }

    // Calculate new streak
    let newStreak = 1

    if (habit.lastCompletedAt) {
      const lastCompleted =
        typeof habit.lastCompletedAt === 'string'
          ? parseISO(habit.lastCompletedAt)
          : habit.lastCompletedAt

      const daysSince = differenceInCalendarDays(today, lastCompleted)

      if (daysSince === 1) {
        // Last completed yesterday, streak continues
        newStreak = habit.streakCount + 1
      } else if (daysSince > 1) {
        // Streak broke, start fresh
        newStreak = 1
      }
    }

    // Update habit
    const updatedHabit = await prisma.habit.update({
      where: { id: params.id },
      data: {
        lastCompletedAt: new Date(),
        streakCount: newStreak,
      },
    })

    // Check for milestone
    const milestoneMessage = getHabitStreakMilestone(newStreak)

    return apiResponse(
      {
        habit: updatedHabit,
        newStreak,
        isMilestone: milestoneMessage !== null,
        milestoneMessage,
      },
      200
    )
  } catch (error) {
    console.error('Error completing habit:', error)
    return handlePrismaError(error)
  }
}
