'use client'

import { useDashboardStats } from '@/hooks/useDashboardStats'
import { getTimeOfDay } from '@/lib/utils'
import { TodaysFocus } from '@/components/dashboard/TodaysFocus'
import { ActiveSession } from '@/components/dashboard/ActiveSession'
import { ShipStreak } from '@/components/dashboard/ShipStreak'
import { VibeMeter } from '@/components/dashboard/VibeMeter'
import { QuickCapture } from '@/components/dashboard/QuickCapture'

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats()

  const greeting = getTimeOfDay()

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Good {greeting}</h1>
        <p className="text-muted-foreground">
          Ready to build something amazing today?
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-lg border bg-card animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">
            Failed to load dashboard data
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please refresh the page to try again
          </p>
        </div>
      )}

      {/* Dashboard Content */}
      {stats && (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {/* Today's Focus - Full Width */}
          <div className="md:col-span-2">
            <TodaysFocus />
          </div>

          {/* Active Session */}
          <ActiveSession activeSessionId={stats.activeSessionId} />

          {/* Ship Streak */}
          <ShipStreak />

          {/* Vibe Meter */}
          <VibeMeter flowState={stats.flowState} />

          {/* Quick Capture */}
          <QuickCapture />
        </div>
      )}
    </div>
  )
}
