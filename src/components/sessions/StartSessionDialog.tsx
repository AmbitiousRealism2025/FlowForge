'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Hammer, Search, Bug, Rocket, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SessionType, StartSessionDialogProps, Project, ApiResponse } from '@/types'
import { useSessionStore } from '@/store/sessionStore'
import { startSession } from '@/lib/sessionManager'
import { useToast } from '@/hooks/useToast'

const SESSION_TYPE_OPTIONS = [
  { type: SessionType.BUILDING, icon: Hammer, label: 'Building', description: 'Creating new features' },
  { type: SessionType.EXPLORING, icon: Search, label: 'Exploring', description: 'Research and discovery' },
  { type: SessionType.DEBUGGING, icon: Bug, label: 'Debugging', description: 'Fixing issues' },
  { type: SessionType.SHIPPING, icon: Rocket, label: 'Shipping', description: 'Finalizing and deploying' },
]

const AI_MODEL_OPTIONS = [
  'Claude 3.5 Sonnet',
  'GPT-4',
  'Cursor',
  'Copilot',
  'Local Model',
  'Other',
]

export function StartSessionDialog({ isOpen, onClose, onSessionStarted }: StartSessionDialogProps) {
  const [selectedType, setSelectedType] = useState<SessionType | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedAiModel, setSelectedAiModel] = useState<string>('Claude 3.5 Sonnet')
  const [notes, setNotes] = useState<string>('')

  const queryClient = useQueryClient()
  const startSessionStore = useSessionStore((state) => state.startSession)
  const { toast } = useToast()

  // Fetch active projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery<ApiResponse<Project[]>>({
    queryKey: ['projects', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/projects?isActive=true')
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
    enabled: isOpen,
  })

  const projects = projectsData?.data || []

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedType) throw new Error('Session type is required')
      // Get userId from session - for now we'll let the API handle it
      return startSession(selectedType, selectedProject, selectedAiModel, '')
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Update client store
        startSessionStore(
          response.data.id,
          response.data.sessionType,
          response.data.projectId || null,
          selectedAiModel
        )

        // Invalidate sessions query
        queryClient.invalidateQueries({ queryKey: ['sessions'] })

        // Show success toast
        toast.success('Session started successfully!')

        // Call callback
        if (onSessionStarted) {
          onSessionStarted(response.data)
        }

        // Reset form
        setSelectedType(null)
        setSelectedProject(null)
        setSelectedAiModel('Claude 3.5 Sonnet')
        setNotes('')

        // Close dialog
        onClose()
      } else {
        throw new Error(response.error || 'Failed to start session')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start session')
    },
  })

  const handleStartSession = () => {
    if (!selectedType) {
      toast.error('Please select a session type')
      return
    }
    startSessionMutation.mutate()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Start New Session
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-muted-foreground">
            Choose your session type and get started with your coding flow
          </Dialog.Description>

          <div className="space-y-6">
            {/* Session Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {SESSION_TYPE_OPTIONS.map(({ type, icon: Icon, label, description }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                      selectedType === type
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">{description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Project (Optional)</label>
              <Select.Root value={selectedProject || 'none'} onValueChange={(value) => setSelectedProject(value === 'none' ? null : value)}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <Select.Value placeholder="No project" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="none"
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <Select.ItemText>No project</Select.ItemText>
                      </Select.Item>
                      {projectsLoading ? (
                        <div className="py-2 text-center text-sm text-muted-foreground">Loading...</div>
                      ) : (
                        projects.map((project) => (
                          <Select.Item
                            key={project.id}
                            value={project.id}
                            className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                          >
                            <Select.ItemText>{project.name}</Select.ItemText>
                          </Select.Item>
                        ))
                      )}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* AI Model Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Model</label>
              <Select.Root value={selectedAiModel} onValueChange={setSelectedAiModel}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <Select.Viewport className="p-1">
                      {AI_MODEL_OPTIONS.map((model) => (
                        <Select.Item
                          key={model}
                          value={model}
                          className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <Select.ItemText>{model}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Optional Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any context or goals for this session..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleStartSession}
              disabled={!selectedType || startSessionMutation.isPending}
            >
              {startSessionMutation.isPending ? 'Starting...' : 'Start Session'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
