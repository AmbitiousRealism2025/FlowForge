/**
 * API route for recording project pivots
 * POST: Increment pivot count and optionally create pivot note
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PivotSchema } from '@/lib/validations'
import { apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError } from '@/lib/api-utils'
import { NoteCategory } from '@/types'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/projects/[id]/pivot
 * Record project pivot and create optional note
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

    const validation = PivotSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    const { notes } = validation.data

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        pivotCount: true,
        name: true,
      },
    })

    if (!existingProject) {
      return apiError('Project not found', 404)
    }

    if (existingProject.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this project', 403)
    }

    // Increment pivot count
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        pivotCount: {
          increment: 1,
        },
      },
    })

    const newPivotCount = updatedProject.pivotCount

    // Create pivot note if notes provided
    if (notes) {
      try {
        await prisma.note.create({
          data: {
            userId: session.user.id,
            projectId: params.id,
            title: `Pivot #${newPivotCount}`,
            content: notes,
            category: NoteCategory.INSIGHT,
            tags: ['pivot'],
            isTemplate: false,
          },
        })
      } catch (error) {
        // Non-critical error - log but don't fail the request
        console.error('Failed to create pivot note:', error)
      }
    }

    return apiResponse(updatedProject, 201)
  } catch (error) {
    console.error('Error recording pivot:', error)
    return handlePrismaError(error)
  }
}
