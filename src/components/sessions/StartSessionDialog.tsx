'use client'

import { useState, FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Play, Loader2, Sparkles } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { SessionType, type StartSessionDialogProps, type CodingSession } from '@/types'
import { startSession, saveCheckpoint } from '@/lib/sessionManager'
import { useSessionStore } from '@/store/sessionStore'
import { useToast } from '@/hooks/useToast'
import { useActiveProjects } from '@/hooks/useActiveProjects'

const AI_MODELS = [
  { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
  { label: 'Gemini 1.5 Pro', value: 'gemini-1-5-pro' },
  { label: 'Grok 2', value: 'grok-2' },
]

const SESSION_TYPES: Record<SessionType, { label: string; description: string; icon: string }> = {
  [SessionType.BUILDING]: { label: 'Building', description: 'Heads-down feature work', icon: '🔨' },
  [SessionType.EXPLORING]: { label: 'Exploring', description: 'Research, prototyping, ideation', icon: '🔍' },
  [SessionType.DEBUGGING]: { label: 'Debugging', description: 'Break/fix, investigations', icon: '🐛' },
  [SessionType.SHIPPING]: { label: 'Shipping', description: 'Final polish & deploy', icon: '🚀' },
}

export function StartSessionDialog({
  onSessionStarted,
  triggerLabel = 'Start Session',
  className,
}: StartSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [sessionType, setSessionType] = useState<SessionType>(SessionType.BUILDING)
  const [projectId, setProjectId] = useState<string>('')
  const [aiModel, setAiModel] = useState<string>(AI_MODELS[0].value)
  const [notes, setNotes] = useState('')

  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { startSession: setActiveSession } = useSessionStore()

  const { data: projects = [], isLoading: isLoadingProjects } = useActiveProjects(open)

  const resetForm = () => {
    setSessionType(SessionType.BUILDING)
    setProjectId('')
    setAiModel(AI_MODELS[0].value)
    setNotes('')
  }

  const handleDialogChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleSuccess = (session: CodingSession) => {
    setActiveSession(session.id, session.sessionType, session.projectId, session.aiModelsUsed[0] ?? aiModel)
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
    onSessionStarted?.(session)
    toast.success('Session started successfully')
    handleDialogChange(false)
  }

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const result = await startSession(sessionType, projectId || null, aiModel, '')

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to start session')
      }

      if (notes.trim()) {
        await saveCheckpoint(result.data.id, notes.trim())
      }

      return result.data
    },
    onSuccess: handleSuccess,
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to start session'
      toast.error(message)
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    startSessionMutation.mutate()
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleDialogChange}>
      <Dialog.Trigger asChild>
        <Button className={className} size="sm">
          <Play className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Launch a Focus Block
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Pick your session type, link a project, and prime your AI co-pilot.
          </Dialog.Description>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <p className="text-sm font-medium">Session Type</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.values(SessionType).map((type) => {
                  const details = SESSION_TYPES[type]
                  const isActive = sessionType === type

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSessionType(type)}
                      className={cn(
                        'rounded-lg border px-4 py-3 text-left transition hover:border-primary',
                        isActive ? 'border-primary bg-primary/10' : 'border-border'
                      )}
                    >
                      <span className="text-2xl" aria-hidden>
                        {details.icon}
                      </span>
                      <div className="mt-2">
                        <p className="font-semibold">{details.label}</p>
                        <p className="text-sm text-muted-foreground">{details.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Project (optional)
                <select
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  disabled={isLoadingProjects}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                AI Model
                <select
                  value={aiModel}
                  onChange={(event) => setAiModel(event.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {AI_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Session Notes (optional)
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="What do you want to accomplish in this block?"
                maxLength={2000}
                className="min-h-[100px] rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground text-right">{notes.length}/2000</span>
            </label>

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={startSessionMutation.isPending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={startSessionMutation.isPending}>
                {startSessionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Session
                  </>
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
