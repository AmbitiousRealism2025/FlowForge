/**
 * API route for individual note operations
 * GET: Retrieve single note by ID
 * PATCH: Update note fields
 * DELETE: Delete note (hard delete)
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UpdateNoteSchema } from '@/lib/validations'
import { apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError } from '@/lib/api-utils'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/notes/[id]
 * Retrieve single note by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const note = await prisma.note.findUnique({
      where: { id: params.id },
      include: {
        session: {
          select: {
            id: true,
            sessionType: true,
            startedAt: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!note) {
      return apiError('Note not found', 404)
    }

    if (note.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this note', 403)
    }

    return apiResponse(note)
  } catch (error) {
    console.error('Error fetching note:', error)
    return handlePrismaError(error)
  }
}

/**
 * PATCH /api/notes/[id]
 * Update note fields
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

    const validation = UpdateNoteSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findUnique({
      where: { id: params.id },
    })

    if (!existingNote) {
      return apiError('Note not found', 404)
    }

    if (existingNote.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this note', 403)
    }

    // Update note
    const updatedNote = await prisma.note.update({
      where: { id: params.id },
      data: validation.data,
      include: {
        session: {
          select: {
            id: true,
            sessionType: true,
            startedAt: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return apiResponse(updatedNote)
  } catch (error) {
    console.error('Error updating note:', error)
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/notes/[id]
 * Delete note (hard delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findUnique({
      where: { id: params.id },
    })

    if (!existingNote) {
      return apiError('Note not found', 404)
    }

    if (existingNote.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this note', 403)
    }

    // Hard delete note
    await prisma.note.delete({
      where: { id: params.id },
    })

    return apiResponse({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting note:', error)
    return handlePrismaError(error)
  }
}
