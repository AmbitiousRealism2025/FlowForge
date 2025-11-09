'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import * as Label from '@radix-ui/react-label'
import { X, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CreateProjectDialogProps, CreateProjectRequest } from '@/types'
import { createProject, validateProjectData } from '@/lib/projectService'
import { getFeelsRightEmoji, getFeelsRightLabel } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export function CreateProjectDialog({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [feelsRightScore, setFeelsRightScore] = useState(3)
  const [shipTarget, setShipTarget] = useState('')
  const [stackNotes, setStackNotes] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: CreateProjectRequest) => {
      const result = await createProject(
        data.name,
        data.description || null,
        data.feelsRightScore,
        data.shipTarget || null,
        data.stackNotes || null
      )
      if (!result.success) {
        throw new Error(result.error || 'Failed to create project')
      }
      return result.data
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created successfully')
      onProjectCreated?.(project)
      resetForm()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create project')
    },
  })

  const resetForm = () => {
    setName('')
    setDescription('')
    setFeelsRightScore(3)
    setShipTarget('')
    setStackNotes('')
    setErrors([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data: CreateProjectRequest = {
      name,
      description: description || undefined,
      feelsRightScore,
      shipTarget: shipTarget ? new Date(shipTarget) : undefined,
      stackNotes: stackNotes || undefined,
    }

    const validation = validateProjectData(data)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors([])
    mutation.mutate(data)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-2xl font-semibold">
              Create New Project
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

          <Dialog.Description className="text-sm text-muted-foreground mb-6">
            Start tracking a new project with subjective progress indicators.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <Label.Root htmlFor="name" className="block text-sm font-medium mb-2">
                Project Name <span className="text-destructive">*</span>
              </Label.Root>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={mutation.isPending}
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label.Root htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </Label.Root>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you building?"
                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                disabled={mutation.isPending}
              />
            </div>

            {/* Feels Right Score */}
            <div>
              <Label.Root className="block text-sm font-medium mb-3">
                Initial Feels Right Score
              </Label.Root>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setFeelsRightScore(score)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      feelsRightScore === score
                        ? 'border-primary bg-primary/10'
                        : 'border-input hover:border-primary/50'
                    }`}
                    disabled={mutation.isPending}
                  >
                    <span className="text-2xl mb-1">{getFeelsRightEmoji(score)}</span>
                    <span className="text-xs text-center">{getFeelsRightLabel(score)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ship Target */}
            <div>
              <Label.Root htmlFor="shipTarget" className="block text-sm font-medium mb-2">
                Ship Target (optional)
              </Label.Root>
              <div className="relative">
                <input
                  id="shipTarget"
                  type="date"
                  value={shipTarget}
                  onChange={(e) => setShipTarget(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  disabled={mutation.isPending}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Stack Notes */}
            <div>
              <Label.Root htmlFor="stackNotes" className="block text-sm font-medium mb-2">
                Stack Notes (optional)
              </Label.Root>
              <textarea
                id="stackNotes"
                value={stackNotes}
                onChange={(e) => setStackNotes(e.target.value)}
                placeholder="Document your optimal AI tools and approaches"
                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                disabled={mutation.isPending}
              />
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Dialog.Close asChild>
                <Button variant="outline" type="button" disabled={mutation.isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={mutation.isPending || !name.trim()}>
                {mutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
