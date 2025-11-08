/**
 * API route for individual session operations
 * GET: Retrieve single session by ID
 * PATCH: Update session fields
 * DELETE: End/abandon session (soft delete)
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UpdateSessionSchema } from '@/lib/validations'
import {
  apiResponse,
  apiError,
  parseJsonBody,
  handleZodError,
  handlePrismaError,
} from '@/lib/api-utils'
import { SessionStatus } from '@/types'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/sessions/[id]
 * Retrieve single session by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const codingSession = await prisma.codingSession.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            feelsRightScore: true,
          },
        },
      },
    })

    if (!codingSession) {
      return apiError('Session not found', 404)
    }

    if (codingSession.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this session', 403)
    }

    return apiResponse(codingSession)
  } catch (error) {
    console.error('Error fetching session:', error)
    return handlePrismaError(error)
  }
}

/**
 * PATCH /api/sessions/[id]
 * Update session fields
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const body = await parseJsonBody(request)

    if (!body) {
      return apiError('Invalid JSON body', 400)
    }

    const validation = UpdateSessionSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    // Check if session exists and belongs to user
    const existingSession = await prisma.codingSession.findUnique({
      where: { id: params.id },
    })

    if (!existingSession) {
      return apiError('Session not found', 404)
    }

    if (existingSession.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this session', 403)
    }

    const updateData: Record<string, unknown> = { ...validation.data }

    // If session status is COMPLETED or ABANDONED, set endedAt if not already set
    if (
      validation.data.sessionStatus &&
      (validation.data.sessionStatus === SessionStatus.COMPLETED ||
        validation.data.sessionStatus === SessionStatus.ABANDONED) &&
      !existingSession.endedAt
    ) {
      updateData.endedAt = new Date()
    }

    // Update session
    const updatedSession = await prisma.codingSession.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            feelsRightScore: true,
          },
        },
      },
    })

    return apiResponse(updatedSession)
  } catch (error) {
    console.error('Error updating session:', error)
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/sessions/[id]
 * End/abandon session (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    // Check if session exists and belongs to user
    const existingSession = await prisma.codingSession.findUnique({
      where: { id: params.id },
    })

    if (!existingSession) {
      return apiError('Session not found', 404)
    }

    if (existingSession.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this session', 403)
    }

    // Soft delete by marking as abandoned
    await prisma.codingSession.update({
      where: { id: params.id },
      data: {
        sessionStatus: SessionStatus.ABANDONED,
        endedAt: new Date(),
      },
    })

    return apiResponse({ message: 'Session abandoned successfully' })
  } catch (error) {
    console.error('Error deleting session:', error)
    return handlePrismaError(error)
  }
}
