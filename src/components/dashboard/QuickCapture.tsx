'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lightbulb, Send } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { NoteCategory } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'

export function QuickCapture() {
  const [inputValue, setInputValue] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { quickCaptureBuffer, updateQuickCaptureBuffer, clearQuickCaptureBuffer } = useDashboardStore()

  // Restore unsaved text from buffer
  useEffect(() => {
    if (quickCaptureBuffer && !inputValue) {
      setInputValue(quickCaptureBuffer)
    }
  }, [quickCaptureBuffer, inputValue])

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.slice(0, 50),
          content,
          category: NoteCategory.INSIGHT,
          tags: [],
        }),
      })
      if (!response.ok) throw new Error('Failed to create note')
      return response.json()
    },
    onMutate: async () => {
      // Optimistic update - clear input immediately
      const previousValue = inputValue
      setInputValue('')
      clearQuickCaptureBuffer()
      return { previousValue }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Idea captured!', 'Quick Capture')
    },
    onError: (_error, _variables, context) => {
      // Restore input on error
      if (context?.previousValue) {
        setInputValue(context.previousValue)
        updateQuickCaptureBuffer(context.previousValue)
      }
      toast.error('Failed to capture idea')
    },
  })

  const handleInputChange = (value: string) => {
    setInputValue(value)
    // Save to buffer to prevent data loss
    updateQuickCaptureBuffer(value)
  }

  const handleSubmit = () => {
    if (!inputValue.trim()) return
    createNoteMutation.mutate(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Quick Capture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Quick capture an idea..."
          className="w-full resize-none rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
          disabled={createNoteMutation.isPending}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">⌘</kbd>+
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Enter</kbd> to capture
          </p>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || createNoteMutation.isPending}
          >
            <Send className="h-4 w-4 mr-1" />
            {createNoteMutation.isPending ? 'Capturing...' : 'Capture'}
          </Button>
        </div>

        {inputValue.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            {inputValue.length} characters
          </p>
        )}
      </CardContent>
    </Card>
  )
}
