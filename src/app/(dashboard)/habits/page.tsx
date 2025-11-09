'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Flame, CheckCircle, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { HabitCard } from '@/components/habits/HabitCard'
import { Habit, HabitWithStats, HabitSummaryStats } from '@/types'
import { fetchHabits, completeHabit, enrichHabitWithStats } from '@/lib/habitService'
import { getUserTimezone, getHabitStreakMilestone } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export default function HabitsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const timezone = getUserTimezone()

  // Fetch habits
  const { data, isLoading, error } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const result = await fetchHabits()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch habits')
      }
      return (result.data || []) as Habit[]
    },
    staleTime: 60000, // 1 minute
    refetchOnMount: true,
  })

  // Complete habit mutation
  const completeMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const result = await completeHabit(habitId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete habit')
      }
      return result.data
    },
    onMutate: async (habitId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['habits'] })

      // Snapshot previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(['habits'])

      // Optimistically update
      if (previousHabits) {
        queryClient.setQueryData<Habit[]>(
          ['habits'],
          previousHabits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  lastCompletedAt: new Date().toISOString(),
                  streakCount: habit.streakCount + 1,
                }
              : habit
          )
        )
      }

      return { previousHabits }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['habits'] })

      // Check if milestone reached
      if (data?.isMilestone && data?.milestoneMessage) {
        toast.success(data.milestoneMessage)
      } else {
        toast.success('Habit completed! Streak extended 🔥')
      }
    },
    onError: (error: Error, _habitId, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits'], context.previousHabits)
      }
      toast.error(error.message || 'Failed to complete habit')
    },
  })

  // Enrich habits with calculated stats
  const enrichedHabits: HabitWithStats[] = (data || []).map((habit) =>
    enrichHabitWithStats(habit, timezone)
  )

  // Sort habits by streak count descending (highest streaks first)
  const sortedHabits = [...enrichedHabits].sort((a, b) => b.streakCount - a.streakCount)

  // Calculate summary statistics
  const summaryStats: HabitSummaryStats = {
    totalActiveHabits: enrichedHabits.filter((h) => h.isActive).length,
    longestCurrentStreak: Math.max(...enrichedHabits.map((h) => h.streakCount), 0),
    habitsCompletedToday: enrichedHabits.filter((h) => h.completedToday).length,
    totalCompletions: enrichedHabits.reduce((sum, h) => sum + h.streakCount, 0),
  }

  const handleComplete = async (habitId: string) => {
    await completeMutation.mutateAsync(habitId)
  }

  const handleEdit = (habitId: string) => {
    toast.info('Coming soon: Edit habit feature')
  }

  const handleArchive = (habitId: string) => {
    toast.info('Coming soon: Archive habit feature')
  }

  const handleAddCustomHabit = () => {
    toast.info('Coming soon: Create custom habits')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Habits</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Build consistency with daily practices
          </p>
        </div>
        <Button onClick={handleAddCustomHabit} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Add Custom Habit
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Habits
              </CardTitle>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summaryStats.totalActiveHabits}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Longest Streak
              </CardTitle>
              <Flame className="w-5 h-5 text-flow-green" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {summaryStats.longestCurrentStreak === 0
                ? '-'
                : `🔥 ${summaryStats.longestCurrentStreak}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completed Today
              </CardTitle>
              <CheckCircle className="w-5 h-5 text-flow-green" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summaryStats.habitsCompletedToday}</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg h-48"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : 'Failed to load habits'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && sortedHabits.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Default habits should be created at signup. Contact support if missing.
            </p>
            <Button onClick={handleAddCustomHabit} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add Custom Habit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Habits Grid */}
      {!isLoading && !error && sortedHabits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onComplete={handleComplete}
              onEdit={handleEdit}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}
    </div>
  )
}
