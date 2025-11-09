'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flame, TrendingUp, Package } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'

export function ShipStreak() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch streak data
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'streak'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/streak')
      if (!response.ok) throw new Error('Failed to fetch streak')
      return response.json()
    },
  })

  // Mark ship today mutation
  const shipMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/analytics/ship', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to mark ship')
      return response.json()
    },
    onSuccess: (newData) => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'streak'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })

      const streak = newData.currentStreak || 0
      if (streak > 0) {
        let message = 'Ship marked! Keep it going! 🎉'
        if (streak === 7) message = '7-day streak! You\'re on fire! 🔥'
        if (streak === 30) message = '30-day streak! Incredible! 🚀'
        if (streak === 100) message = '100-day streak! Legendary! 👑'
        toast.success(message, 'Ship Marked')
      } else {
        toast.success('Ship marked successfully!')
      }
    },
    onError: () => {
      toast.error('Failed to mark ship')
    },
  })

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-24 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  const currentStreak = data?.currentStreak || 0
  const longestStreak = data?.longestStreak || 0
  const lastShipDate = data?.lastShipDate
  const shippedToday = data?.shippedToday || false

  const getStreakColor = () => {
    if (currentStreak === 0) return 'text-muted-foreground'
    if (currentStreak < 7) return 'text-caution-amber'
    return 'text-flow-green'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className={`h-5 w-5 ${getStreakColor()}`} />
          Ship Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak Display */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-5xl font-bold text-flow-green">
              {currentStreak}
            </span>
            <Flame className="h-8 w-8 text-flow-green" />
          </div>
          <p className="text-sm text-muted-foreground">
            {currentStreak === 1 ? 'day streak' : 'days streak'}
          </p>
        </div>

        {/* Best Streak */}
        {longestStreak > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Best: <span className="font-semibold">{longestStreak} days</span>
            </span>
          </div>
        )}

        {/* Mark Ship Button */}
        {!shippedToday ? (
          <Button
            className="w-full"
            onClick={() => shipMutation.mutate()}
            disabled={shipMutation.isPending}
          >
            <Package className="h-4 w-4 mr-2" />
            {shipMutation.isPending ? 'Marking...' : 'Mark Ship Today'}
          </Button>
        ) : (
          <div className="text-center py-3 px-4 rounded-lg bg-flow-green/10 border border-flow-green/20">
            <p className="text-sm font-medium text-flow-green">
              ✓ Shipped today! Great work!
            </p>
          </div>
        )}

        {/* Last Ship Date */}
        {lastShipDate && !shippedToday && (
          <p className="text-xs text-muted-foreground text-center">
            Last shipped: {new Date(lastShipDate).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
