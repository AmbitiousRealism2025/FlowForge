/**
 * API route for habits list and creation
 * GET: List all habits for the user
 * POST: Create new habit
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateHabitSchema } from '@/lib/validations'
import {
  apiResponse,
  apiError,
  parseJsonBody,
  handleZodError,
  handlePrismaError,
  withAuth,
} from '@/lib/api-utils'

/**
 * GET /api/habits
 * List all habits for the current user, ordered by streak count descending
 */
async function listHabitsHandler(userId: string, request: NextRequest) {
  try {
    const habits = await prisma.habit.findMany({
      where: {
        userId,
      },
      orderBy: {
        streakCount: 'desc', // Show highest streaks first
      },
    })

    return apiResponse(habits)
  } catch (error) {
    console.error('Error fetching habits:', error)
    return handlePrismaError(error)
  }
}

export const GET = withAuth((userId, request) => listHabitsHandler(userId, request))

/**
 * POST /api/habits
 * Create new habit
 */
async function createHabitHandler(userId: string, request: NextRequest) {
  try {
    const body = await parseJsonBody(request)

    if (!body) {
      return apiError('Invalid JSON body', 400)
    }

    const validation = CreateHabitSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    const { name, category, targetFrequency } = validation.data

    const habit = await prisma.habit.create({
      data: {
        userId,
        name,
        category,
        targetFrequency,
        streakCount: 0,
        isActive: true,
      },
    })

    return apiResponse(habit, 201)
  } catch (error) {
    console.error('Error creating habit:', error)
    return handlePrismaError(error)
  }
}

export const POST = withAuth((userId, request) => createHabitHandler(userId, request))
