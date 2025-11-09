'use client'

import { useMemo, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import { Bookmark, Clock, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import {
  formatSessionDuration,
  getSessionStatus,
  getSessionTypeIcon,
  deleteSession,
  saveCheckpoint,
} from '@/lib/sessionManager'
import { SessionStatus, type SessionCardProps } from '@/types'
import { useToast } from '@/hooks/useToast'

interface CheckpointEntry {
  timestamp: string
  text: string
}

const statusStyles: Record<SessionStatus, string> = {
  [SessionStatus.ACTIVE]: 'bg-flow-green/10 text-flow-green',
  [SessionStatus.PAUSED]: 'bg-caution-amber/10 text-caution-amber',
  [SessionStatus.COMPLETED]: 'bg-primary/10 text-primary',
  [SessionStatus.ABANDONED]: 'bg-stuck-red/10 text-stuck-red',
}

export function SessionCard({ session, onSessionUpdated, onSessionDeleted }: SessionCardProps) {
  const { toast } = useToast()
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCheckpointOpen, setIsCheckpointOpen] = useState(false)
  const [checkpointNote, setCheckpointNote] = useState('')
  const [isSavingCheckpoint, setIsSavingCheckpoint] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const checkpoints = useMemo<CheckpointEntry[]>(() => {
    if (!session.checkpointNotes) return []
    try {
      const parsed = JSON.parse(session.checkpointNotes)
      if (Array.isArray(parsed)) {
        return parsed as CheckpointEntry[]
      }
    } catch (error) {
      console.warn('Failed to parse checkpoint notes', error)
    }
    return []
  }, [session.checkpointNotes])

  const handleDelete = async () => {
    if (isDeleting) return
    if (!window.confirm('Delete this session? This action cannot be undone.')) return

    setIsDeleting(true)
    try {
      const result = await deleteSession(session.id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete session')
      }
      toast.success('Session deleted')
      onSessionDeleted?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete session'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveCheckpoint = async () => {
    if (!checkpointNote.trim()) return
    setIsSavingCheckpoint(true)
    try {
      const result = await saveCheckpoint(session.id, checkpointNote.trim())
      if (!result.success) {
        throw new Error(result.error || 'Failed to save checkpoint')
      }
      toast.success('Checkpoint added')
      setCheckpointNote('')
      setIsCheckpointOpen(false)
      onSessionUpdated?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save checkpoint'
      toast.error(message)
    } finally {
      setIsSavingCheckpoint(false)
    }
  }

  const statusLabel = getSessionStatus(session)
  const statusStyle = statusStyles[session.sessionStatus]
  const durationLabel = formatSessionDuration(session)
  const projectLabel = session.project?.name || session.projectId || 'Unassigned'

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">
              {getSessionTypeIcon(session.sessionType)} {session.sessionType.toLowerCase()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{projectLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>{statusLabel}</span>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="rounded-full border p-2 text-muted-foreground transition hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[180px] rounded-lg border bg-popover p-1 text-sm shadow-md"
                  sideOffset={8}
                >
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 outline-none hover:bg-accent"
                    onSelect={() => setIsDetailsOpen(true)}
                  >
                    <Eye className="h-4 w-4" /> View Details
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 outline-none hover:bg-accent"
                    onSelect={() => setIsCheckpointOpen(true)}
                  >
                    <Bookmark className="h-4 w-4" /> Add Checkpoint
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-stuck-red outline-none hover:bg-red-50"
                    onSelect={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
            <p className="text-lg font-semibold">{durationLabel}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">AI Models</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {session.aiModelsUsed.map((model) => (
                <span key={model} className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                  {model}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Checkpoints</p>
              <p className="text-lg font-semibold">{checkpoints.length}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsCheckpointOpen(true)}>
              <Bookmark className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
          {checkpoints.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {checkpoints
                .slice(-2)
                .reverse()
                .map((checkpoint, index) => (
                  <li key={`${checkpoint.timestamp}-${index}`} className="flex gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{checkpoint.text}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Started</p>
            <p className="font-medium">{formatDate(session.startedAt, 'datetime')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ended</p>
            <p className="font-medium">
              {session.endedAt ? formatDate(session.endedAt, 'datetime') : 'In progress'}
            </p>
          </div>
        </div>
      </CardContent>

      <Dialog.Root open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5" /> Session Details
            </Dialog.Title>
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Session Type</p>
                  <p className="font-medium">{session.sessionType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Project</p>
                  <p className="font-medium">{projectLabel}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">AI Models</p>
                <p className="font-medium">{session.aiModelsUsed.join(', ') || 'None'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Timeline</p>
                <div className="mt-2 space-y-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase text-muted-foreground">Started</p>
                    <p className="font-medium">{formatDate(session.startedAt, 'datetime')}</p>
                  </div>
                  {session.endedAt && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs uppercase text-muted-foreground">Ended</p>
                      <p className="font-medium">{formatDate(session.endedAt, 'datetime')}</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Checkpoints</p>
                {checkpoints.length === 0 && <p className="font-medium">No checkpoints yet.</p>}
                {checkpoints.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {checkpoints.map((checkpoint, index) => (
                      <li key={`${checkpoint.timestamp}-${index}`} className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">{formatDate(checkpoint.timestamp, 'datetime')}</p>
                        <p className="font-medium">{checkpoint.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={isCheckpointOpen} onOpenChange={setIsCheckpointOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold flex items-center gap-2">
              <Bookmark className="h-5 w-5" /> Add Checkpoint
            </Dialog.Title>
            <textarea
              value={checkpointNote}
              onChange={(event) => setCheckpointNote(event.target.value)}
              maxLength={2000}
              className="mt-4 min-h-[140px] w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="What changed?"
            />
            <div className="mt-2 text-right text-xs text-muted-foreground">{checkpointNote.length}/2000</div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCheckpointOpen(false)} disabled={isSavingCheckpoint}>
                Cancel
              </Button>
              <Button onClick={handleSaveCheckpoint} disabled={!checkpointNote.trim() || isSavingCheckpoint}>
                {isSavingCheckpoint ? 'Saving...' : 'Save Checkpoint'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  )
}
