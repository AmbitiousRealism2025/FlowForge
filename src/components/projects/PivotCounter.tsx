'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { RotateCcw, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PivotCounterProps } from '@/types'
import { recordPivot } from '@/lib/projectService'
import { useToast } from '@/hooks/useToast'

export function PivotCounter({
  projectId,
  currentCount,
  onPivotRecorded,
}: PivotCounterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (pivotNotes?: string) => {
      const result = await recordPivot(projectId, pivotNotes)
      if (!result.success) {
        throw new Error(result.error || 'Failed to record pivot')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      toast.success('🔄 Pivot recorded! Exploration is progress!')
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
      setIsOpen(false)
      setNotes('')
      onPivotRecorded?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record pivot')
    },
  })

  const handleRecordPivot = () => {
    mutation.mutate(notes || undefined)
  }

  const displayText = currentCount === 0
    ? 'No pivots yet'
    : currentCount === 1
    ? '🔄 1 Pivot'
    : `🔄 Exploring (${currentCount} pivots)`

  return (
    <div className="flex items-center gap-3">
      <div
        className={`inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium transition-all ${
          isAnimating ? 'animate-pulse scale-110' : ''
        }`}
      >
        <RotateCcw className="h-4 w-4" />
        <span>{displayText}</span>
      </div>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-h-[44px] min-w-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Record Pivot</span>
          </Button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-lg p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                Record a Pivot
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-sm text-muted-foreground mb-4">
              Direction changes are a sign of exploration and learning. Document
              what changed and why (optional).
            </Dialog.Description>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="pivot-notes"
                  className="block text-sm font-medium mb-2"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="pivot-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What changed and why?"
                  className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                  disabled={mutation.isPending}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <Button variant="outline" disabled={mutation.isPending}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={handleRecordPivot}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Recording...' : 'Record Pivot'}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
