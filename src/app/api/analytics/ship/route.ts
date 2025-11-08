/**
 * API route for marking a ship today
 * POST: Create or update today's analytics record with ship count
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MarkShipSchema } from '@/lib/validations'
import { apiResponse, apiError, parseJsonBody, handleZodError, handlePrismaError } from '@/lib/api-utils'
import { startOfDay, differenceInDays } from 'date-fns'

/**
 * POST /api/analytics/ship
 * Mark a ship for today
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

    const validation = MarkShipSchema.safeParse(body)

    if (!validation.success) {
      return handleZodError(validation.error)
    }

    const { notes } = validation.data

    // Get user timezone (default to UTC)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    })

    const timezone = user?.timezone || 'UTC'

    // Calculate today's date normalized to user's timezone
    const todayDate = startOfDay(new Date())

    // Check if analytics record exists for today
    const existingRecord = await prisma.analytics.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayDate,
        },
      },
    })

    const isFirstShipToday = !existingRecord || existingRecord.shipCount === 0

    // Prepare metadata
    const metadata: Record<string, unknown> = existingRecord?.metadata
      ? (existingRecord.metadata as Record<string, unknown>)
      : {}

    if (notes) {
      const shipNotes = (metadata.shipNotes as string[]) || []
      shipNotes.push(notes)
      metadata.shipNotes = shipNotes
    }

    // Upsert analytics record
    const updatedAnalytics = await prisma.analytics.upsert({
      where: {
        userId_date: {
          userId,
          date: todayDate,
        },
      },
      update: {
        shipCount: {
          increment: 1,
        },
        metadata,
      },
      create: {
        userId,
        date: todayDate,
        shipCount: 1,
        flowScore: 0,
        codingMinutes: 0,
        contextRefreshes: 0,
        metadata: notes ? { shipNotes: [notes] } : {},
      },
    })

    // Recalculate current streak
    const analyticsRecords = await prisma.analytics.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: {
        date: true,
        shipCount: true,
      },
    })

    let currentStreak = 0
    const today = startOfDay(new Date())

    for (let i = 0; i < analyticsRecords.length; i++) {
      const record = analyticsRecords[i]
      const recordDate = startOfDay(record.date)

      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - currentStreak)

      const daysDiff = differenceInDays(startOfDay(expectedDate), recordDate)

      if (daysDiff === 0 && record.shipCount > 0) {
        currentStreak++
      } else if (daysDiff > 0) {
        break
      }
    }

    // Update user's ship streak
    await prisma.user.update({
      where: { id: userId },
      data: {
        shipStreak: currentStreak,
      },
    })

    // Determine if this extended the streak
    const extendedStreak = isFirstShipToday && currentStreak > 0

    return apiResponse(
      {
        analytics: updatedAnalytics,
        currentStreak,
        extendedStreak,
      },
      isFirstShipToday ? 201 : 200
    )
  } catch (error) {
    console.error('Error marking ship:', error)
    return handlePrismaError(error)
  }
}
