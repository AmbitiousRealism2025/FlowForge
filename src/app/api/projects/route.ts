/**
 * API route for projects list and creation
 * GET: List projects with optional filters and sorting
 * POST: Create new project
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateProjectSchema } from '@/lib/validations'
import {
  apiResponse,
  apiError,
  parseJsonBody,
  handleZodError,
  handlePrismaError,
  withAuth,
  parsePaginationParams,
  buildPaginatedResponse,
} from '@/lib/api-utils'
import type { Momentum } from '@/types'

/**
 * GET /api/projects
 * List projects with optional filters and sorting
 */
async function listProjectsHandler(userId: string, request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Build where clause with optional filters
    const where: Record<string, unknown> = { userId }

    // Filter by active status
    const isActiveParam = searchParams.get('isActive')
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true'
    }

    // Get sort parameter (default: updatedAt)
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const orderBy: Record<string, string> = {}

    switch (sortBy) {
      case 'feelsRightScore':
        orderBy.feelsRightScore = 'desc'
        break
      case 'updatedAt':
      default:
        orderBy.updatedAt = 'desc'
        break
    }

    // Parse pagination parameters
    const { page, limit, skip } = parsePaginationParams(searchParams)

    // Query total count with same where clause
    const total = await prisma.project.count({
      where,
    })

    // Query projects page with session statistics
    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            codingSessions: true,
          },
        },
        codingSessions: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 1,
          select: {
            startedAt: true,
          },
        },
      },
    })

    // Calculate momentum for each project
    const now = new Date()
    const projectsWithMomentum = projects.map((project) => {
      let momentum: Momentum = 'QUIET'

      if (project.codingSessions.length > 0) {
        const lastWorkedDate = project.codingSessions[0].startedAt
        const hoursSinceLastWork = (now.getTime() - lastWorkedDate.getTime()) / (1000 * 60 * 60)

        if (hoursSinceLastWork < 24) {
          momentum = 'HOT'
        } else if (hoursSinceLastWork < 168) {
          // 7 days = 168 hours
          momentum = 'ACTIVE'
        }
      }

      // Remove the codingSessions array from response (we only needed it for momentum calculation)
      const { codingSessions: _codingSessions, ...projectData } = project

      return {
        ...projectData,
        momentum,
        totalSessions: project._count.codingSessions,
      }
    })

    // Return paginated response consistent with other list endpoints
    return buildPaginatedResponse(projectsWithMomentum, total, page, limit)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return handlePrismaError(error)
  }
}

export const GET = withAuth((userId, request) => listProjectsHandler(userId, request))

/**
 * POST /api/projects
 * Create new project
 */
async function createProjectHandler(userId: string, request: NextRequest) {
  try {
    const body = await parseJsonBody(request)

    if (!body) {
      return apiError('Invalid JSON body', 400)
    }

    const validation = CreateProjectSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    const { name, description, feelsRightScore, shipTarget, stackNotes } = validation.data

    // Create new project
    const newProject = await prisma.project.create({
      data: {
        userId,
        name,
        description: description || null,
        feelsRightScore: feelsRightScore ?? 3,
        shipTarget: shipTarget || null,
        stackNotes: stackNotes || null,
        isActive: true,
        pivotCount: 0,
      },
    })

    return apiResponse(newProject, 201)
  } catch (error) {
    console.error('Error creating project:', error)
    return handlePrismaError(error)
  }
}

export const POST = withAuth((userId, request) => createProjectHandler(userId, request))
