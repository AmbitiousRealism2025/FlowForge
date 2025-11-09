'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Label from '@radix-ui/react-label'
import * as Select from '@radix-ui/react-select'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NoteEditor } from '@/components/notes/NoteEditor'
import type { CreateNoteDialogProps, NoteCategory } from '@/types'
import { createNote } from '@/lib/notesService'
import { parseTags } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export function CreateNoteDialog({
  isOpen,
  onClose,
  onNoteCreated,
  initialSessionId,
  initialProjectId,
}: CreateNoteDialogProps) {
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [category, setCategory] = React.useState<NoteCategory>('INSIGHT')
  const [tags, setTags] = React.useState('')
  const [sessionId, setSessionId] = React.useState<string | null>(
    initialSessionId || null
  )
  const [projectId, setProjectId] = React.useState<string | null>(
    initialProjectId || null
  )
  const [validationError, setValidationError] = React.useState('')

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch active sessions (optional)
  const { data: sessions } = useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/sessions?status=ACTIVE')
      if (!response.ok) return []
      return response.json()
    },
    enabled: isOpen,
  })

  // Fetch active projects (optional)
  const { data: projects } = useQuery({
    queryKey: ['projects', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/projects?isActive=true')
      if (!response.ok) return []
      return response.json()
    },
    enabled: isOpen,
  })

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: createNote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note created successfully')
      if (onNoteCreated) {
        onNoteCreated(data)
      }
      resetForm()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create note')
    },
  })

  const resetForm = () => {
    setTitle('')
    setContent('')
    setCategory('INSIGHT')
    setTags('')
    setSessionId(initialSessionId || null)
    setProjectId(initialProjectId || null)
    setValidationError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate content
    if (!content.trim()) {
      setValidationError('Content is required')
      return
    }

    setValidationError('')

    // Parse tags
    const parsedTags = tags ? parseTags(tags) : []

    // Create note
    createNoteMutation.mutate({
      title: title.trim() || undefined,
      content: content.trim(),
      category,
      tags: parsedTags,
      sessionId: sessionId || undefined,
      projectId: projectId || undefined,
      isTemplate: false,
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
          <Dialog.Title className="text-2xl font-semibold">
            Create New Note
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Capture ideas, code snippets, or insights
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label.Root htmlFor="title" className="text-sm font-medium">
                Title (optional)
              </Label.Root>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title (optional)"
              />
            </div>

            {/* Note Editor with Category Selector and Content */}
            <div className="space-y-2">
              <Label.Root htmlFor="content" className="text-sm font-medium">
                Content *
              </Label.Root>
              <NoteEditor
                value={content}
                onChange={setContent}
                category={category}
                onCategoryChange={setCategory}
                placeholder="Start typing your note..."
                autoFocus
              />
              {validationError && (
                <p className="text-sm text-destructive">{validationError}</p>
              )}
            </div>

            {/* Tags Field */}
            <div className="space-y-2">
              <Label.Root htmlFor="tags" className="text-sm font-medium">
                Tags
              </Label.Root>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma, separated, tags"
              />
            </div>

            {/* Session Association (Optional) */}
            {sessions && sessions.length > 0 && (
              <div className="space-y-2">
                <Label.Root htmlFor="session" className="text-sm font-medium">
                  Session Association (optional)
                </Label.Root>
                <Select.Root
                  value={sessionId || undefined}
                  onValueChange={(value) => setSessionId(value || null)}
                >
                  <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <Select.Value placeholder="Select a session..." />
                    <Select.Icon>
                      <ChevronDown className="h-4 w-4" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-md border bg-popover shadow-md">
                      <Select.Viewport className="p-1">
                        <Select.Item
                          value=""
                          className="relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                        >
                          <Select.ItemText>None</Select.ItemText>
                          <Select.ItemIndicator className="absolute right-2">
                            <Check className="h-4 w-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                        {sessions.map((session: any) => (
                          <Select.Item
                            key={session.id}
                            value={session.id}
                            className="relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                          >
                            <Select.ItemText>
                              {session.sessionType} - {new Date(session.startedAt).toLocaleDateString()}
                            </Select.ItemText>
                            <Select.ItemIndicator className="absolute right-2">
                              <Check className="h-4 w-4" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            )}

            {/* Project Association (Optional) */}
            {projects && projects.length > 0 && (
              <div className="space-y-2">
                <Label.Root htmlFor="project" className="text-sm font-medium">
                  Project Association (optional)
                </Label.Root>
                <Select.Root
                  value={projectId || undefined}
                  onValueChange={(value) => setProjectId(value || null)}
                >
                  <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <Select.Value placeholder="Select a project..." />
                    <Select.Icon>
                      <ChevronDown className="h-4 w-4" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-md border bg-popover shadow-md">
                      <Select.Viewport className="p-1">
                        <Select.Item
                          value=""
                          className="relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                        >
                          <Select.ItemText>None</Select.ItemText>
                          <Select.ItemIndicator className="absolute right-2">
                            <Check className="h-4 w-4" />
                          </Select.ItemIndicator>
                        </Select.Item>
                        {projects.map((project: any) => (
                          <Select.Item
                            key={project.id}
                            value={project.id}
                            className="relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                          >
                            <Select.ItemText>{project.name}</Select.ItemText>
                            <Select.ItemIndicator className="absolute right-2">
                              <Check className="h-4 w-4" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            )}

            {/* Dialog Footer */}
            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                disabled={!content.trim() || createNoteMutation.isPending}
              >
                {createNoteMutation.isPending ? 'Creating...' : 'Create Note'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
