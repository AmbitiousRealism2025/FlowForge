'use client'

import { useEffect, useRef, useState } from 'react'
import * as Progress from '@radix-ui/react-progress'
import { Play, Pause, Square, Bookmark, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SessionTimerProps } from '@/types'
import { useSessionStore } from '@/store/sessionStore'
import { syncSessionDuration } from '@/lib/sessionManager'
import { formatDuration, calculateContextHealthColor, formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export function SessionTimer({
  sessionId,
  startTime,
  isPaused,
  elapsedSeconds,
  contextHealth,
  onPause,
  onResume,
  onEnd,
  onCheckpoint,
}: SessionTimerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const syncCounterRef = useRef(0)
  const [showCheckpointInput, setShowCheckpointInput] = useState(false)
  const [checkpointText, setCheckpointText] = useState('')

  const updateElapsed = useSessionStore((state) => state.updateElapsed)
  const updateContextHealth = useSessionStore((state) => state.updateContextHealth)
  const syncWithServer = useSessionStore((state) => state.syncWithServer)
  const lastSyncTime = useSessionStore((state) => state.lastSyncTime)

  const { toast } = useToast()

  // Set up timer interval
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        // Update elapsed time
        updateElapsed()

        // Update context health
        updateContextHealth()

        // Increment sync counter
        syncCounterRef.current += 1

        // Sync with server every 60 seconds
        if (syncCounterRef.current >= 60) {
          syncCounterRef.current = 0
          syncSessionDuration(sessionId, elapsedSeconds + 1).then((success) => {
            if (success) {
              syncWithServer()
            }
          })
        }
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused, sessionId, elapsedSeconds, updateElapsed, updateContextHealth, syncWithServer])

  const healthColors = calculateContextHealthColor(contextHealth)
  const isHealthLow = contextHealth < 40

  const formattedTime = formatDuration(elapsedSeconds)
  const lastSyncRelative = lastSyncTime ? formatRelativeTime(lastSyncTime) : 'Not synced yet'

  const handleSaveCheckpoint = () => {
    if (checkpointText.trim()) {
      onCheckpoint()
      toast.success('Checkpoint saved!')
      setCheckpointText('')
      setShowCheckpointInput(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      {/* Timer Display */}
      <div className="mb-6 text-center">
        <div className="mb-2 text-sm font-medium text-muted-foreground">Session Duration</div>
        <div className="text-4xl font-bold tabular-nums">{formattedTime}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Started {formatRelativeTime(startTime)}
        </div>
      </div>

      {/* Context Health Bar */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">AI Context Health</span>
          <span className={`font-semibold ${healthColors.textColor}`}>{contextHealth}%</span>
        </div>
        <Progress.Root
          className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
          value={contextHealth}
        >
          <Progress.Indicator
            className={`h-full transition-all ${healthColors.bgColor}`}
            style={{ width: `${contextHealth}%` }}
          />
        </Progress.Root>

        {/* Low Health Warning */}
        {isHealthLow && (
          <div className="flex items-center gap-2 rounded-md bg-stuck-red/10 p-3 text-sm text-stuck-red">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              Context health is low. Consider refreshing your AI conversation or taking a break.
            </span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="mb-4 flex gap-2">
        {isPaused ? (
          <Button onClick={onResume} className="flex-1" variant="default">
            <Play className="mr-2 h-4 w-4" />
            Resume
          </Button>
        ) : (
          <Button onClick={onPause} className="flex-1" variant="secondary">
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
        )}

        <Button
          onClick={() => setShowCheckpointInput(!showCheckpointInput)}
          variant="outline"
        >
          <Bookmark className="mr-2 h-4 w-4" />
          Checkpoint
        </Button>

        <Button onClick={onEnd} variant="destructive">
          <Square className="mr-2 h-4 w-4" />
          End
        </Button>
      </div>

      {/* Checkpoint Input */}
      {showCheckpointInput && (
        <div className="space-y-2 border-t pt-4">
          <textarea
            value={checkpointText}
            onChange={(e) => setCheckpointText(e.target.value)}
            placeholder="Add a checkpoint note..."
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowCheckpointInput(false)
                setCheckpointText('')
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCheckpoint}
              disabled={!checkpointText.trim()}
            >
              Save Checkpoint
            </Button>
          </div>
        </div>
      )}

      {/* Sync Status */}
      <div className="mt-4 border-t pt-3 text-center text-xs text-muted-foreground">
        Last synced {lastSyncRelative}
      </div>
    </div>
  )
}
