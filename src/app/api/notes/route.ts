/**
 * API route for notes list and creation
 * GET: List notes with pagination, search, and filters
 * POST: Create new note
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateNoteSchema } from '@/lib/validations'
import {
  apiResponse,
  apiError,
  parseJsonBody,
  parsePaginationParams,
  buildPaginatedResponse,
  handleZodError,
  handlePrismaError,
  withAuth,
} from '@/lib/api-utils'
import { NoteCategory } from '@/types'

/**
 * GET /api/notes
 * List notes with pagination, search, and filters
 */
async function listNotesHandler(userId: string, request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(searchParams)

    // Build where clause with optional filters
    const where: Record<string, unknown> = { userId }

    // Filter by category
    const category = searchParams.get('category')
    if (category && Object.values(NoteCategory).includes(category as NoteCategory)) {
      where.category = category
    }

    // Filter by tags
    const tagsParam = searchParams.get('tags')
    if (tagsParam) {
      const tags = tagsParam.split(',').map((tag) => tag.trim())
      where.tags = {
        hasSome: tags,
      }
    }

    // Search in title and content
    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Execute queries in parallel
    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
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
      }),
      prisma.note.count({ where }),
    ])

    return buildPaginatedResponse(notes, total, page, limit)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return handlePrismaError(error)
  }
}

export const GET = withAuth((userId, request) => listNotesHandler(userId, request))

/**
 * POST /api/notes
 * Create new note
 */
async function createNoteHandler(userId: string, request: NextRequest) {
  try {
    const body = await parseJsonBody(request)

    if (!body) {
      return apiError('Invalid JSON body', 400)
    }

    const validation = CreateNoteSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    const { title, content, category, tags, sessionId, projectId } = validation.data

    // Verify sessionId exists and belongs to user (if provided)
    if (sessionId) {
      const sessionExists = await prisma.codingSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      })

      if (!sessionExists) {
        return apiError('Session not found or does not belong to you', 400)
      }
    }

    // Verify projectId exists and belongs to user (if provided)
    if (projectId) {
      const projectExists = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
      })

      if (!projectExists) {
        return apiError('Project not found or does not belong to you', 400)
      }
    }

    // Create new note
    const newNote = await prisma.note.create({
      data: {
        userId,
        title: title || '',
        content,
        category,
        tags: tags || [],
        sessionId: sessionId || null,
        projectId: projectId || null,
        isTemplate: false,
      },
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

    return apiResponse(newNote, 201)
  } catch (error) {
    console.error('Error creating note:', error)
    return handlePrismaError(error)
  }
}

export const POST = withAuth((userId, request) => createNoteHandler(userId, request))
