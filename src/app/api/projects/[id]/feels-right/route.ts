/**
 * API route for updating feels-right score
 * PATCH: Update project's feels-right score (1-5 scale)
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FeelsRightScoreSchema } from '@/lib/validations'
import { apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError } from '@/lib/api-utils'
import { startOfDay } from 'date-fns'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PATCH /api/projects/[id]/feels-right
 * Update feels-right score and optionally log to analytics
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

    const validation = FeelsRightScoreSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    const { score } = validation.data

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        feelsRightScore: true,
      },
    })

    if (!existingProject) {
      return apiError('Project not found', 404)
    }

    if (existingProject.userId !== session.user.id) {
      return apiError('Forbidden - You do not own this project', 403)
    }

    const oldScore = existingProject.feelsRightScore

    // Update project with new score
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        feelsRightScore: score,
      },
    })

    // Optionally log score change to analytics metadata for historical tracking
    if (oldScore !== score) {
      const today = startOfDay(new Date())

      try {
        const analytics = await prisma.analytics.findUnique({
          where: {
            userId_date: {
              userId: session.user.id,
              date: today,
            },
          },
        })

        const currentMetadata = (analytics?.metadata as Record<string, unknown>) || {}
        const scoreChanges = (currentMetadata.feelsRightScoreChanges as Array<Record<string, unknown>>) || []

        scoreChanges.push({
          projectId: params.id,
          oldScore,
          newScore: score,
          timestamp: new Date().toISOString(),
        })

        await prisma.analytics.upsert({
          where: {
            userId_date: {
              userId: session.user.id,
              date: today,
            },
          },
          update: {
            metadata: {
              ...currentMetadata,
              feelsRightScoreChanges: scoreChanges,
            },
          },
          create: {
            userId: session.user.id,
            date: today,
            shipCount: 0,
            flowScore: 0,
            codingMinutes: 0,
            contextRefreshes: 0,
            metadata: {
              feelsRightScoreChanges: scoreChanges,
            },
          },
        })
      } catch (error) {
        // Non-critical error - log but don't fail the request
        console.error('Failed to log score change to analytics:', error)
      }
    }

    return apiResponse(updatedProject)
  } catch (error) {
    console.error('Error updating feels-right score:', error)
    return handlePrismaError(error)
  }
}
