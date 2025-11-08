/**
 * API route for individual project operations
 * GET: Retrieve single project with statistics
 * PATCH: Update project fields
 * DELETE: Soft delete project (set isActive to false)
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UpdateProjectSchema } from '@/lib/validations'
import { apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError } from '@/lib/api-utils'
import type { Momentum } from '@/types'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/projects/[id]
 * Retrieve single project with statistics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        codingSessions: {
          select: {
            durationSeconds: true,
            startedAt: true,
          },
          orderBy: {
            startedAt: 'desc',
          },
        },
      },
    })

    if (!project) {
      return apiError('Project not found', 404)
    }

    if (project.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this project', 403)
    }

    // Calculate statistics
    const totalSessions = project.codingSessions.length
    const totalCodingTime = project.codingSessions.reduce(
      (sum: number, session: { durationSeconds: number }) => sum + session.durationSeconds,
      0
    )
    const lastWorkedDate = totalSessions > 0 ? project.codingSessions[0].startedAt : null

    // Calculate momentum
    let momentum: Momentum = 'QUIET'
    if (lastWorkedDate) {
      const hoursSinceLastWork = (new Date().getTime() - lastWorkedDate.getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastWork < 24) {
        momentum = 'HOT'
      } else if (hoursSinceLastWork < 168) {
        momentum = 'ACTIVE'
      }
    }

    // Remove sessions from response
    const { codingSessions, ...projectData } = project

    return apiResponse({
      ...projectData,
      statistics: {
        totalSessions,
        totalCodingTime,
        lastWorkedDate,
        momentum,
      },
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return handlePrismaError(error)
  }
}

/**
 * PATCH /api/projects/[id]
 * Update project fields
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

    const validation = UpdateProjectSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!existingProject) {
      return apiError('Project not found', 404)
    }

    if (existingProject.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this project', 403)
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: validation.data,
    })

    return apiResponse(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/projects/[id]
 * Soft delete project (set isActive to false)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!existingProject) {
      return apiError('Project not found', 404)
    }

    if (existingProject.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this project', 403)
    }

    // Soft delete by setting isActive to false
    await prisma.project.update({
      where: { id: params.id },
      data: {
        isActive: false,
      },
    })

    return apiResponse({ message: 'Project archived successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return handlePrismaError(error)
  }
}
