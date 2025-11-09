'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flame, TrendingUp, Calendar, Sparkles } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/hooks/useToast'

import {
  fetchStreakData,
  markShipToday,
  hasShippedToday,
} from '@/lib/analyticsService'
import {
  formatStreakDisplay,
  getStreakMilestone,
  shouldCelebrate,
  formatRelativeTime,
} from '@/lib/utils'

/**
 * ShipStreakCard - Display ship streak with mark ship functionality
 */
export function ShipStreakCard() {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null)

  // Fetch streak data
  const { data: streakResponse, isLoading, error } = useQuery({
    queryKey: ['analytics', 'streak'],
    queryFn: fetchStreakData,
    staleTime: 60000, // 1 minute
    refetchOnMount: true,
  })

  const streakData = streakResponse?.data

  // Mutation for marking ship
  const markShipMutation = useMutation({
    mutationFn: markShipToday,
    onSuccess: (response) => {
      // Invalidate streak query to refetch
      queryClient.invalidateQueries({ queryKey: ['analytics', 'streak'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'weekly'] })

      if (response.success && response.data) {
        const { newStreak, isNewMilestone } = response.data
        const previousStreak = streakData?.currentStreak || 0

        // Check if we should celebrate
        if (shouldCelebrate(previousStreak, newStreak)) {
          const milestone = getStreakMilestone(newStreak)

          if (milestone) {
            setCelebrationMessage(milestone)
            setIsCelebrating(true)
            addToast(milestone, 'success', '🎉 Milestone Reached!')
          } else {
            addToast('Ship marked successfully!', 'success', '🔥 Streak Extended!')
          }
        } else {
          addToast('Ship marked for today', 'success')
        }
      }
    },
    onError: (error) => {
      addToast(
        error instanceof Error ? error.message : 'Failed to mark ship',
        'error',
        'Error'
      )
    },
  })

  // Auto-dismiss celebration after 3 seconds
  useEffect(() => {
    if (isCelebrating) {
      const timer = setTimeout(() => {
        setIsCelebrating(false)
        setCelebrationMessage(null)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isCelebrating])

  // Handle mark ship action
  const handleMarkShip = async () => {
    await markShipMutation.mutateAsync()
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error || !streakData) {
    return (
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load streak data. Please try again.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['analytics', 'streak'] })}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const { currentStreak, longestStreak, lastShipDate } = streakData
  const shippedToday = false // Will be determined from analytics records in real implementation

  return (
    <Card className="relative bg-gradient-to-br from-flow-green/10 to-flow-green/5 border-flow-green/20 overflow-hidden">
      {/* Celebration Overlay */}
      {isCelebrating && celebrationMessage && (
        <div className="absolute inset-0 bg-gradient-to-br from-flow-green/20 to-flow-green/10 flex items-center justify-center z-10 animate-fade-in">
          <div className="text-center animate-slide-up">
            <Sparkles className="h-12 w-12 mx-auto mb-2 text-flow-green" />
            <p className="text-2xl font-bold text-flow-green">{celebrationMessage}</p>
          </div>
        </div>
      )}

      <CardHeader className="flex flex-row items-center space-x-2">
        <Flame className="h-5 w-5 text-flow-green" />
        <CardTitle>Ship Streak</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Streak Display */}
        <div className="text-center">
          <p className="text-4xl font-bold text-flow-green mb-2">
            {currentStreak === 0 ? '🌱' : '🔥'} {currentStreak}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatStreakDisplay(currentStreak)}
          </p>
        </div>

        {/* Secondary Stats */}
        <div className="space-y-2">
          {/* Longest Streak */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Best Streak</span>
            </div>
            <span className="font-semibold">{longestStreak} {longestStreak === 1 ? 'day' : 'days'}</span>
          </div>

          {/* Last Ship Date */}
          {lastShipDate && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Last Shipped</span>
              </div>
              <span className="font-semibold">
                {formatRelativeTime(lastShipDate)}
              </span>
            </div>
          )}
        </div>

        {/* Mini Calendar - Last 7 Days */}
        <div className="flex items-center justify-center gap-1 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < currentStreak
                  ? 'bg-flow-green'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
              title={`Day ${7 - i}`}
            />
          ))}
        </div>

        {/* Encouraging Message */}
        {currentStreak === 0 && (
          <p className="text-sm text-center text-muted-foreground italic">
            Start your shipping journey today! 🚀
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleMarkShip}
          disabled={shippedToday || markShipMutation.isPending}
          className="w-full"
          variant={shippedToday ? 'secondary' : 'default'}
        >
          {markShipMutation.isPending
            ? 'Marking...'
            : shippedToday
            ? '✅ Shipped Today'
            : '🚀 Mark Ship Today'}
        </Button>
      </CardFooter>
    </Card>
  )
}
