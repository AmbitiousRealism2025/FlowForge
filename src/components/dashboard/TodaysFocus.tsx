'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Target, Edit2, Check, X } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useToast } from '@/hooks/useToast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function TodaysFocus() {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch focus text
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'focus'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/focus')
      if (!response.ok) throw new Error('Failed to fetch focus')
      return response.json()
    },
  })

  // Update focus text mutation
  const updateMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/dashboard/focus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!response.ok) throw new Error('Failed to update focus')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'focus'] })
      toast.success('Focus updated successfully')
      setIsEditing(false)
    },
    onError: () => {
      toast.error('Failed to update focus')
    },
  })

  const focusText = data?.text || ''

  useEffect(() => {
    if (isEditing) {
      setEditValue(focusText)
    }
  }, [isEditing, focusText])

  const handleSave = () => {
    updateMutation.mutate(editValue)
  }

  const handleCancel = () => {
    setEditValue(focusText)
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-pulse">
        <div className="h-20" />
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 group">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Target className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Today's Focus
            </h2>
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {!isEditing ? (
            <div
              onClick={() => setIsEditing(true)}
              className="cursor-pointer"
            >
              {focusText ? (
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {focusText}
                </p>
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-muted-foreground/50 italic">
                  What's your main focus today?
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full resize-none rounded-lg border bg-background p-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
                placeholder="What's your main focus today?"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
