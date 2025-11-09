'use client'

import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Flame, MoreVertical, Edit, Archive, CheckCircle, Circle } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { HabitCardProps } from '@/types'
import {
  getHabitCategoryIcon,
  getHabitCategoryLabel,
  getHabitCategoryColor,
  formatHabitStreak,
  formatRelativeTime,
} from '@/lib/utils'

export function HabitCard({ habit, onComplete, onEdit, onArchive }: HabitCardProps) {
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const categoryIcon = getHabitCategoryIcon(habit.category)
  const categoryLabel = getHabitCategoryLabel(habit.category)
  const categoryColor = getHabitCategoryColor(habit.category)

  // Determine border color based on category
  const borderColorClass = `border-l-4 ${
    habit.category === 'DAILY_SHIP'
      ? 'border-l-flow-green'
      : habit.category === 'CONTEXT_REFRESH'
      ? 'border-l-claude-purple'
      : habit.category === 'CODE_REVIEW'
      ? 'border-l-blue-500'
      : habit.category === 'BACKUP_CHECK'
      ? 'border-l-caution-amber'
      : 'border-l-red-500'
  }`

  // Determine streak color
  const streakColor = habit.streakCount > 0 ? 'text-flow-green' : 'text-gray-400'

  const handleComplete = async () => {
    if (habit.completedToday || isLoading) return

    setIsLoading(true)
    try {
      await onComplete(habit.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(habit.id)
    }
  }

  const handleArchive = () => {
    if (onArchive) {
      const confirmed = confirm(
        `Are you sure you want to archive "${habit.name}"? You can restore it later.`
      )
      if (confirmed) {
        onArchive(habit.id)
      }
    }
  }

  // Get frequency text
  const getFrequencyText = () => {
    if (habit.targetFrequency === 1) return 'Daily'
    if (habit.targetFrequency === 7) return 'Weekly'
    return `Every ${habit.targetFrequency} days`
  }

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${borderColorClass} relative overflow-hidden`}
    >
      {/* Celebration overlay */}
      {isCelebrating && celebrationMessage && (
        <div className="absolute inset-0 bg-flow-green/10 z-10 flex items-center justify-center animate-bounce">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center gap-3">
            <Flame className="w-8 h-8 text-flow-green" />
            <p className="text-lg font-semibold">{celebrationMessage}</p>
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-2xl ${categoryColor}`}>{categoryIcon}</span>
              <span className={`text-sm font-medium ${categoryColor}`}>{categoryLabel}</span>
            </div>
            <CardTitle className="text-xl">{habit.name}</CardTitle>
          </div>

          {/* Action menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] bg-white dark:bg-gray-800 rounded-md shadow-lg p-1 border border-gray-200 dark:border-gray-700"
                align="end"
              >
                {onEdit && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded outline-none"
                    onClick={handleEdit}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Habit
                  </DropdownMenu.Item>
                )}
                {onArchive && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded outline-none text-red-600"
                    onClick={handleArchive}
                  >
                    <Archive className="w-4 h-4" />
                    Archive Habit
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Streak display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${streakColor}`} />
            <span className={`text-lg font-semibold ${streakColor}`}>
              {formatHabitStreak(habit.streakCount)}
            </span>
          </div>
          <span className="text-sm text-gray-500">{getFrequencyText()}</span>
        </div>

        {/* Last completed */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {habit.lastCompletedAt
            ? `Last completed ${formatRelativeTime(habit.lastCompletedAt)}`
            : 'Never completed'}
        </div>

        {/* Check-in button */}
        {!habit.completedToday ? (
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="w-full min-h-[44px] active:scale-95 transition-transform"
            size="lg"
          >
            {isLoading ? (
              <>
                <Circle className="w-5 h-5 mr-2 animate-spin" />
                Checking in...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Check In Today
              </>
            )}
          </Button>
        ) : (
          <div className="w-full min-h-[44px] flex items-center justify-center bg-flow-green/10 border border-flow-green/20 text-flow-green rounded-md px-4 py-3">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">✓ Completed Today</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
