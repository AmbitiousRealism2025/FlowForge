/**
 * API route for today's focus text management
 * GET: Retrieve today's focus text
 * PUT: Update today's focus text
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FocusTextSchema } from '@/lib/validations'
import { apiResponse, apiError, parseJsonBody, handleZodError } from '@/lib/api-utils'

/**
 * GET /api/dashboard/focus
 * Retrieve today's focus text from user preferences
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
    return apiError('Failed to fetch focus text', 500)
  }
}

/**
 * PUT /api/dashboard/focus
 * Update today's focus text in user preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

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
      where: { id: session.user.id },
      select: { preferences: true },
    })

    if (!user) {
      return apiError('User not found', 404)
    }

    const currentPreferences = (user.preferences as Record<string, unknown>) || {}

    // Update preferences with new focus text
    await prisma.user.update({
      where: { id: session.user.id },
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
    return apiError('Failed to update focus text', 500)
  }
}
