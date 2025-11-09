/**
 * API route for weekly ship data visualization
 * GET: Retrieve last 7 days of ship activity
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/api-utils'
import { startOfDay, subDays, format } from 'date-fns'

// Cache response for 5 minutes
export const revalidate = 300

interface DailyShipData {
  date: string
  shipCount: number
  dayOfWeek: string
}

/**
 * GET /api/analytics/weekly
 * Retrieve last 7 days of ship data
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

    // Calculate date range: today and 6 days ago (total 7 days)
    const today = startOfDay(new Date())
    const startDate = subDays(today, 6)

    // Query analytics records for the last 7 days
    const analyticsRecords = await prisma.analytics.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: today,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        shipCount: true,
      },
    })

    // Create a map for quick lookup
    const recordMap = new Map<string, number>()
    analyticsRecords.forEach((record: { date: Date; shipCount: number }) => {
      const dateKey = format(startOfDay(record.date), 'yyyy-MM-dd')
      recordMap.set(dateKey, record.shipCount)
    })

    // Build complete 7-day array with missing days filled with 0
    const weeklyData: DailyShipData[] = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const dateKey = format(date, 'yyyy-MM-dd')
      const shipCount = recordMap.get(dateKey) || 0
      const dayOfWeek = format(date, 'EEE') // Mon, Tue, Wed, etc.

      weeklyData.push({
        date: dateKey, // Use YYYY-MM-DD format
        shipCount,
        dayOfWeek,
      })
    }

    return apiResponse(weeklyData)
  } catch (error) {
    console.error('Error fetching weekly ship data:', error)
    return apiError('Failed to fetch weekly ship data', 500)
  }
}
