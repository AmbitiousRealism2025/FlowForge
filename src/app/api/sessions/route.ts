/**
 * API route for sessions list and creation
 * GET: List sessions with pagination and filters
 * POST: Create new coding session
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CreateSessionSchema } from '@/lib/validations'
import {
  apiResponse,
  apiError,
  parseJsonBody,
  parsePaginationParams,
  buildPaginatedResponse,
  handleZodError,
  handlePrismaError,
} from '@/lib/api-utils'
import { SessionStatus, SessionType } from '@/types'

/**
 * GET /api/sessions
 * List sessions with pagination and optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(searchParams)

    // Build where clause with optional filters
    const where: Record<string, unknown> = { userId }

    // Filter by session type
    const sessionType = searchParams.get('sessionType')
    if (sessionType && Object.values(SessionType).includes(sessionType as SessionType)) {
      where.sessionType = sessionType
    }

    // Filter by project
    const projectId = searchParams.get('projectId')
    if (projectId) {
      where.projectId = projectId
    }

    // Filter by date range
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate || endDate) {
      where.startedAt = {}
      if (startDate) {
        ;(where.startedAt as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        ;(where.startedAt as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    // Execute queries in parallel
    const [sessions, total] = await Promise.all([
      prisma.codingSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              feelsRightScore: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.codingSession.count({ where }),
    ])

    return buildPaginatedResponse(sessions, total, page, limit)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return handlePrismaError(error)
  }
}

/**
 * POST /api/sessions
 * Create new coding session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const userId = session.user.id
    const body = await parseJsonBody(request)

    if (!body) {
      return apiError('Invalid JSON body', 400)
    }

    const validation = CreateSessionSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    const { sessionType, projectId, aiModelsUsed } = validation.data

    // Create new session
    const newSession = await prisma.codingSession.create({
      data: {
        userId,
        sessionType,
        projectId: projectId || null,
        aiModelsUsed,
        startedAt: new Date(),
        aiContextHealth: 100,
        sessionStatus: SessionStatus.ACTIVE,
        durationSeconds: 0,
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

    return apiResponse(newSession, 201)
  } catch (error) {
    console.error('Error creating session:', error)
    return handlePrismaError(error)
  }
}
