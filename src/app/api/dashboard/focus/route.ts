/**
 * API route for today's focus text management
 * GET: Retrieve today's focus text
 * PUT: Update today's focus text
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FocusTextSchema } from '@/lib/validations'
import { apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError, withAuth } from '@/lib/api-utils'

/**
 * GET /api/dashboard/focus
 * Retrieve today's focus text from user preferences
 */
async function getFocusHandler(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    if (!user) {
      return apiError('User not found', 404)
    }

    const preferences = user.preferences as Record<string, unknown> | null
    const todaysFocus = (preferences?.todaysFocus as string) || ''

    return apiResponse({ focus: todaysFocus })
  } catch (error) {
    console.error('Error fetching focus text:', error)
    return handlePrismaError(error)
  }
}

export const GET = withAuth((_userId, _request) => getFocusHandler(_userId))

/**
 * PUT /api/dashboard/focus
 * Update today's focus text in user preferences
 */
async function updateFocusHandler(userId: string, request: NextRequest) {
  try {
    const body = await parseJsonBody(request)

    if (!body) {
      return apiError('Invalid JSON body', 400)
    }

    const validation = FocusTextSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    const { focus } = validation.data

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    if (!user) {
      return apiError('User not found', 404)
    }

    const currentPreferences = (user.preferences as Record<string, unknown>) || {}

    // Update preferences with new focus text
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...currentPreferences,
          todaysFocus: focus,
        },
      },
    })

    return apiResponse({ focus })
  } catch (error) {
    console.error('Error updating focus text:', error)
    return handlePrismaError(error)
  }
}

export const PUT = withAuth((userId, request) => updateFocusHandler(userId, request))
