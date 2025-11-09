'use client'

import { useState, useEffect } from 'react'
import * as Slider from '@radix-ui/react-slider'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HelpCircle } from 'lucide-react'
import { FeelsRightSliderProps } from '@/types'
import {
  getFeelsRightEmoji,
  getFeelsRightLabel,
  getFeelsRightColor,
  validateFeelsRightScore,
} from '@/lib/utils'
import { updateFeelsRightScore } from '@/lib/projectService'
import { useToast } from '@/hooks/useToast'

export function FeelsRightSlider({
  projectId,
  initialValue,
  onChange,
  disabled = false,
}: FeelsRightSliderProps) {
  const [currentValue, setCurrentValue] = useState(initialValue)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Update local state when initialValue changes
  useEffect(() => {
    setCurrentValue(initialValue)
  }, [initialValue])

  const mutation = useMutation({
    mutationFn: async (score: number) => {
      const result = await updateFeelsRightScore(projectId, score)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update feels right score')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      toast.success('Feels right score updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update feels right score')
      // Revert to previous value on error
      setCurrentValue(initialValue)
    },
  })

  // Debounced update
  useEffect(() => {
    if (currentValue === initialValue) return

    const timer = setTimeout(() => {
      if (validateFeelsRightScore(currentValue)) {
        mutation.mutate(currentValue)
        onChange(currentValue)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [currentValue])

  const handleValueChange = (value: number[]) => {
    setCurrentValue(value[0])
  }

  const emoji = getFeelsRightEmoji(currentValue)
  const label = getFeelsRightLabel(currentValue)
  const colorClass = getFeelsRightColor(currentValue)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            How does this feel?
          </span>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md text-sm max-w-xs z-50"
                  sideOffset={5}
                >
                  This is your subjective feeling about the project, not objective completion.
                  1=Struggling, 5=Nailing It
                  <Tooltip.Arrow className="fill-popover" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
        <div className={`flex items-center gap-2 ${colorClass} font-semibold`}>
          <span className="text-2xl">{emoji}</span>
          <span className="text-sm">{label}</span>
        </div>
      </div>

      <div className="relative">
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[currentValue]}
          onValueChange={handleValueChange}
          min={1}
          max={5}
          step={1}
          disabled={disabled || mutation.isPending}
          aria-label="Feels right score"
        >
          <Slider.Track className="bg-gradient-to-r from-stuck-red via-caution-amber to-flow-green relative grow rounded-full h-2">
            <Slider.Range className="absolute h-full rounded-full opacity-0" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white border-2 border-primary rounded-full shadow-lg hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors"
            aria-label="Feels right score"
          />
        </Slider.Root>

        {/* Visual markers */}
        <div className="flex justify-between mt-2 px-0.5">
          {[1, 2, 3, 4, 5].map((score) => (
            <div
              key={score}
              className="flex flex-col items-center"
              style={{ width: '20%' }}
            >
              <div className="text-xs opacity-60">{getFeelsRightEmoji(score)}</div>
            </div>
          ))}
        </div>
      </div>

      {mutation.isPending && (
        <div className="text-xs text-muted-foreground">Updating...</div>
      )}
    </div>
  )
}
