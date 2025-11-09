'use client'

import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HabitCheckInProps } from '@/types'

export function HabitCheckIn({
  habitId,
  habitName,
  completedToday,
  onComplete,
  isLoading,
}: HabitCheckInProps) {
  const handleClick = async () => {
    if (completedToday || isLoading) return
    await onComplete()
  }

  if (completedToday) {
    return (
      <div className="w-full min-h-[44px] flex items-center justify-center bg-flow-green/10 border border-flow-green/20 text-flow-green rounded-md px-4 py-3">
        <CheckCircle className="w-5 h-5 mr-2" />
        <span className="font-medium">Completed: {habitName}</span>
      </div>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || completedToday}
      className="w-full min-h-[44px] active:scale-95 transition-transform"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Checking in...
        </>
      ) : (
        <>
          <Circle className="w-5 h-5 mr-2" />
          Check In: {habitName}
        </>
      )}
    </Button>
  )
}
