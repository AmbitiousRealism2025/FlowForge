'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Progress from '@radix-ui/react-progress'
import { AlertCircle, Bookmark, Clock, Pause, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useSessionStore } from '@/store/sessionStore'
import { useToast } from '@/hooks/useToast'
import {
  pauseSession as pauseSessionRequest,
  resumeSession as resumeSessionRequest,
  endSession as endSessionRequest,
  updateSessionDuration as updateSessionDurationRequest,
  saveCheckpoint,
} from '@/lib/sessionManager'
import type { SessionTimerProps } from '@/types'

export function SessionTimer({ className, projectName }: SessionTimerProps) {
  const {
    activeSessionId,
    sessionType,
    projectId,
    aiModel,
    isPaused,
    elapsedSeconds,
    contextHealth,
    pauseSession: pauseLocal,
    resumeSession: resumeLocal,
    endSession: clearSession,
    updateElapsed,
    updateContextHealth,
    syncWithServer,
    formattedElapsed,
  } = useSessionStore()

  const { toast } = useToast()

  const [isStatusUpdating, setIsStatusUpdating] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [isCheckpointDialogOpen, setIsCheckpointDialogOpen] = useState(false)
  const [checkpointNote, setCheckpointNote] = useState('')
  const [isSavingCheckpoint, setIsSavingCheckpoint] = useState(false)

  useEffect(() => {
    if (!activeSessionId || isPaused) {
      return
    }

    const interval = setInterval(() => {
      updateElapsed()
      updateContextHealth()
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSessionId, isPaused, updateElapsed, updateContextHealth])

  useEffect(() => {
    if (!activeSessionId || elapsedSeconds === 0 || isPaused) {
      return
    }

    if (elapsedSeconds % 60 !== 0) {
      return
    }

    let cancelled = false

    const syncDuration = async () => {
      const result = await updateSessionDurationRequest(activeSessionId, elapsedSeconds)

      if (cancelled) return

      if (result.success) {
        syncWithServer()
      } else {
        console.warn(result.error || 'Failed to sync session duration')
      }
    }

    syncDuration()

    return () => {
      cancelled = true
    }
  }, [activeSessionId, elapsedSeconds, isPaused, syncWithServer])

  const handlePauseResume = async () => {
    if (!activeSessionId) return

    setIsStatusUpdating(true)
    try {
      if (isPaused) {
        const result = await resumeSessionRequest(activeSessionId)
        if (!result.success) {
          throw new Error(result.error || 'Failed to resume session')
        }
        resumeLocal()
        toast.info('Session resumed')
      } else {
        const result = await pauseSessionRequest(activeSessionId)
        if (!result.success) {
          throw new Error(result.error || 'Failed to pause session')
        }
        pauseLocal()
        toast.info('Session paused')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Session action failed'
      toast.error(message)
    } finally {
      setIsStatusUpdating(false)
    }
  }

  const handleEndSession = async () => {
    if (!activeSessionId) return
    setIsEnding(true)

    try {
      const result = await endSessionRequest(activeSessionId, elapsedSeconds, null)

      if (!result.success) {
        throw new Error(result.error || 'Failed to end session')
      }

      clearSession()
      toast.success('Session ended')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to end session'
      toast.error(message)
    } finally {
      setIsEnding(false)
    }
  }

  const handleSaveCheckpoint = async () => {
    if (!activeSessionId || !checkpointNote.trim()) return

    setIsSavingCheckpoint(true)
    try {
      const result = await saveCheckpoint(activeSessionId, checkpointNote.trim())

      if (!result.success) {
        throw new Error(result.error || 'Failed to save checkpoint')
      }

      setCheckpointNote('')
      setIsCheckpointDialogOpen(false)
      toast.success('Checkpoint saved')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save checkpoint'
      toast.error(message)
    } finally {
      setIsSavingCheckpoint(false)
    }
  }

  const handleOpenCheckpointDialog = () => {
    setCheckpointNote('')
    setIsCheckpointDialogOpen(true)
  }

  if (!activeSessionId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Active Session
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>No active session. Use the Start Session button to launch a focus block.</p>
        </CardContent>
      </Card>
    )
  }

  const healthColor = contextHealth >= 70 ? 'bg-flow-green' : contextHealth >= 40 ? 'bg-caution-amber' : 'bg-stuck-red'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Active Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground">Session Type</p>
            <p className="font-semibold">{sessionType ?? 'Focus Block'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">AI Model</p>
            <p className="font-semibold">{aiModel || 'Not set'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Project</p>
            <p className="font-semibold">{projectName || projectId || 'Unassigned'}</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-4xl font-bold tabular-nums">
            {formattedElapsed()}
          </p>
          {isPaused && <p className="text-sm text-muted-foreground">Paused</p>}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Context Health</span>
            <div className="flex items-center gap-1">
              {contextHealth < 40 && <AlertCircle className="h-4 w-4 text-stuck-red" />}
              <span className="font-semibold">{contextHealth}%</span>
            </div>
          </div>
          <Progress.Root className="h-2 w-full overflow-hidden rounded-full bg-muted" value={contextHealth}>
            <Progress.Indicator className={`h-full transition-all ${healthColor}`} style={{ width: `${contextHealth}%` }} />
          </Progress.Root>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-w-[120px]"
            onClick={handlePauseResume}
            disabled={isStatusUpdating}
          >
            {isPaused ? (
              <>
                <Play className="mr-2 h-4 w-4" /> Resume
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleOpenCheckpointDialog}
            disabled={isSavingCheckpoint}
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Checkpoint
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleEndSession}
            disabled={isEnding}
          >
            {isEnding ? (
              'Ending...'
            ) : (
              <>
                <Square className="mr-2 h-4 w-4" /> End
              </>
            )}
          </Button>
        </div>

        <Dialog.Root open={isCheckpointDialogOpen} onOpenChange={setIsCheckpointDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-lg">
              <Dialog.Title className="text-lg font-semibold">Add Checkpoint</Dialog.Title>
              <p className="mt-1 text-sm text-muted-foreground">
                Capture what changed so your future self (and AI) can reload context.
              </p>

              <div className="mt-4 space-y-3">
                <textarea
                  value={checkpointNote}
                  onChange={(event) => setCheckpointNote(event.target.value)}
                  placeholder="Fixed auth bug, need to refactor tests..."
                  maxLength={2000}
                  className="min-h-[140px] w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{checkpointNote.length}/2000</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCheckpointDialogOpen(false)} disabled={isSavingCheckpoint}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveCheckpoint}
                  disabled={!checkpointNote.trim() || isSavingCheckpoint}
                >
                  {isSavingCheckpoint ? 'Saving...' : 'Save Checkpoint'}
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </CardContent>
    </Card>
  )
}
