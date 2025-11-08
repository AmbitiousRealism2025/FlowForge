/**
 * API route for saving session checkpoint notes
 * POST: Append checkpoint note with timestamp to session
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CheckpointSchema } from '@/lib/validations'
import { apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError } from '@/lib/api-utils'

interface RouteParams {
  params: {
    id: string
  }
}

interface Checkpoint {
  timestamp: string
  text: string
}

/**
 * POST /api/sessions/[id]/checkpoint
 * Save checkpoint note with timestamp
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

    const validation = CheckpointSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    const { checkpointText } = validation.data

    // Check if session exists and belongs to user
    const existingSession = await prisma.codingSession.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        checkpointNotes: true,
      },
    })

    if (!existingSession) {
      return apiError('Session not found', 404)
    }

    if (existingSession.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this session', 403)
    }

    // Parse existing checkpoints or create new array
    let checkpoints: Checkpoint[] = []
    if (existingSession.checkpointNotes) {
      try {
        checkpoints = JSON.parse(existingSession.checkpointNotes)
        if (!Array.isArray(checkpoints)) {
          checkpoints = []
        }
      } catch (error) {
        console.error('Failed to parse existing checkpoints:', error)
        checkpoints = []
      }
    }

    // Append new checkpoint with timestamp
    const newCheckpoint: Checkpoint = {
      timestamp: new Date().toISOString(),
      text: checkpointText,
    }
    checkpoints.push(newCheckpoint)

    // Update session with new checkpoint notes
    const updatedSession = await prisma.codingSession.update({
      where: { id: params.id },
      data: {
        checkpointNotes: JSON.stringify(checkpoints),
      },
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

    return apiResponse(updatedSession, 201)
  } catch (error) {
    console.error('Error saving checkpoint:', error)
    return handlePrismaError(error)
  }
}
