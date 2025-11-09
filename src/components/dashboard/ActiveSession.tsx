'use client'

import { useEffect, useState } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { formatDuration } from '@/lib/utils'
import { Play, Pause, Square, Bookmark, Clock, AlertCircle, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import * as Progress from '@radix-ui/react-progress'
import * as Dialog from '@radix-ui/react-dialog'
import { useToast } from '@/hooks/useToast'
import { saveCheckpoint } from '@/lib/sessionManager'

interface ActiveSessionProps {
  activeSessionId?: string | null
}

export function ActiveSession({ activeSessionId: propsActiveSessionId }: ActiveSessionProps) {
  const {
    activeSessionId: storeActiveSessionId,
    elapsedSeconds,
    isPaused,
    sessionType,
    aiModel,
    contextHealth,
    pauseSession,
    resumeSession,
    endSession,
    updateElapsed,
    updateContextHealth,
  } = useSessionStore()

  const { toast } = useToast()

  // Checkpoint dialog state
  const [isCheckpointDialogOpen, setIsCheckpointDialogOpen] = useState(false)
  const [checkpointText, setCheckpointText] = useState('')
  const [isSavingCheckpoint, setIsSavingCheckpoint] = useState(false)

  // Use store as source of truth, fall back to prop if store is null
  const activeSessionId = storeActiveSessionId ?? propsActiveSessionId ?? null

  // Timer update effect
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

  const handleStartSession = () => {
    toast.info('Coming in Phase 1.4', 'Start Session')
  }

  const handlePauseResume = () => {
    if (isPaused) {
      resumeSession()
      toast.info('Session resumed')
    } else {
      pauseSession()
      toast.info('Session paused')
    }
  }

  const handleEndSession = () => {
    endSession()
    toast.success('Session ended successfully')
  }

  const handleOpenCheckpointDialog = () => {
    setCheckpointText('')
    setIsCheckpointDialogOpen(true)
  }

  const handleSaveCheckpoint = async () => {
    if (!activeSessionId || !checkpointText.trim()) {
      return
    }

    setIsSavingCheckpoint(true)
    try {
      const result = await saveCheckpoint(activeSessionId, checkpointText.trim())

      if (result.success) {
        toast.success('Checkpoint saved successfully')
        setIsCheckpointDialogOpen(false)
        setCheckpointText('')
      } else {
        toast.error(result.error || 'Failed to save checkpoint')
      }
    } catch (error) {
      toast.error('Failed to save checkpoint')
    } finally {
      setIsSavingCheckpoint(false)
    }
  }

  // No active session state
  if (!activeSessionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Session
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">No active session</p>
          <Button onClick={handleStartSession}>
            <Play className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        </CardContent>
      </Card>
    )
  }

  const healthColor = contextHealth >= 70 ? 'bg-flow-green' : contextHealth >= 40 ? 'bg-caution-amber' : 'bg-stuck-red'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Active Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Type & AI Model */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="font-medium">{sessionType || 'Coding'}</p>
          </div>
          {aiModel && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">AI Model</p>
              <p className="font-medium text-sm">{aiModel}</p>
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="text-center py-4">
          <div className="text-4xl font-bold tabular-nums">
            {formatDuration(elapsedSeconds)}
          </div>
          {isPaused && (
            <p className="text-sm text-muted-foreground mt-2">Paused</p>
          )}
        </div>

        {/* Context Health Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Context Health</span>
            <div className="flex items-center gap-1">
              {contextHealth < 40 && (
                <AlertCircle className="h-4 w-4 text-stuck-red" />
              )}
              <span className="font-medium">{contextHealth}%</span>
            </div>
          </div>
          <Progress.Root
            className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
            value={contextHealth}
          >
            <Progress.Indicator
              className={`h-full transition-all ${healthColor}`}
              style={{ width: `${contextHealth}%` }}
            />
          </Progress.Root>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePauseResume}
            className="flex-1"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenCheckpointDialog}
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleEndSession}
          >
            <Square className="h-4 w-4 mr-1" />
            End
          </Button>
        </div>
      </CardContent>

      {/* Checkpoint Dialog */}
      <Dialog.Root open={isCheckpointDialogOpen} onOpenChange={setIsCheckpointDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">
                Save Checkpoint
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-sm text-muted-foreground">
              Record your current progress, thoughts, or important notes about this session.
            </Dialog.Description>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="checkpoint-text" className="text-sm font-medium">
                  Checkpoint Note
                </label>
                <textarea
                  id="checkpoint-text"
                  value={checkpointText}
                  onChange={(e) => setCheckpointText(e.target.value)}
                  placeholder="E.g., Fixed authentication bug, refactored UserService, need to test edge cases..."
                  className="w-full min-h-[120px] resize-y rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isSavingCheckpoint}
                />
                <p className="text-xs text-muted-foreground">
                  {checkpointText.length}/2000 characters
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCheckpointDialogOpen(false)}
                  disabled={isSavingCheckpoint}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCheckpoint}
                  disabled={!checkpointText.trim() || isSavingCheckpoint || checkpointText.length > 2000}
                >
                  {isSavingCheckpoint ? 'Saving...' : 'Save Checkpoint'}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  )
}
