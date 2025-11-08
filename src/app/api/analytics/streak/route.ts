/**
 * API route for calculating ship streaks
 * GET: Calculate current streak, longest streak, and last ship date
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/api-utils'
import { startOfDay, differenceInDays } from 'date-fns'
import { StreakData } from '@/types'

// Cache response for 60 seconds
export const revalidate = 60

/**
 * GET /api/analytics/streak
 * Calculate ship streaks
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return apiError('Unauthorized - Please sign in', 401)
    }

    const userId = session.user.id

    // Get user timezone (default to UTC)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    })

    const timezone = user?.timezone || 'UTC'

    // Query all analytics records ordered by date descending
    const analyticsRecords = await prisma.analytics.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: {
        date: true,
        shipCount: true,
      },
    })

    if (analyticsRecords.length === 0) {
      const emptyStreakData: StreakData = {
        currentStreak: 0,
        longestStreak: 0,
        lastShipDate: undefined,
      }
      return apiResponse(emptyStreakData)
    }

    // Calculate current streak
    let currentStreak = 0
    const today = startOfDay(new Date())

    for (let i = 0; i < analyticsRecords.length; i++) {
      const record = analyticsRecords[i]
      const recordDate = startOfDay(record.date)

      // Calculate expected date for streak continuation
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - currentStreak)

      const daysDiff = differenceInDays(startOfDay(expectedDate), recordDate)

      // If this record is from the expected date and has ships, continue streak
      if (daysDiff === 0 && record.shipCount > 0) {
        currentStreak++
      } else if (daysDiff > 0) {
        // Gap found, stop counting current streak
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let runningStreak = 0
    let lastDate: Date | null = null

    for (const record of analyticsRecords.slice().reverse()) {
      const recordDate = startOfDay(record.date)

      if (record.shipCount > 0) {
        if (lastDate === null) {
          // First record with ships
          runningStreak = 1
        } else {
          const daysDiff = differenceInDays(recordDate, lastDate)
          if (daysDiff === 1) {
            // Consecutive day
            runningStreak++
          } else {
            // Gap found, restart streak
            runningStreak = 1
          }
        }

        lastDate = recordDate
        longestStreak = Math.max(longestStreak, runningStreak)
      } else if (lastDate !== null) {
        // No ships on this day, check if it breaks the streak
        const daysDiff = differenceInDays(recordDate, lastDate)
        if (daysDiff === 1) {
          // Consecutive day but no ships, break streak
          runningStreak = 0
          lastDate = recordDate
        }
      }
    }

    // Get last ship date
    const lastShipRecord = analyticsRecords.find((record: { date: Date; shipCount: number }) => record.shipCount > 0)
    const lastShipDate = lastShipRecord ? lastShipRecord.date : undefined

    const streakData: StreakData = {
      currentStreak,
      longestStreak,
      lastShipDate,
    }

    return apiResponse(streakData)
  } catch (error) {
    console.error('Error calculating streaks:', error)
    return apiError('Failed to calculate streaks', 500)
  }
}
