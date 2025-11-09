'use client'

import { useEffect } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { formatDuration, getFlowStateColor } from '@/lib/utils'
import { Play, Pause, Square, Bookmark, Clock, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import * as Progress from '@radix-ui/react-progress'
import { useToast } from '@/hooks/useToast'

interface ActiveSessionProps {
  activeSessionId: string | null
}

export function ActiveSession({ activeSessionId }: ActiveSessionProps) {
  const {
    elapsedSeconds,
    isPaused,
    sessionType,
    aiModel,
    contextHealth,
    pauseSession,
    resumeSession,
    endSession,
  } = useSessionStore()

  const { toast } = useToast()

  // Timer update effect
  useEffect(() => {
    if (activeSessionId && !isPaused) {
      const interval = setInterval(() => {
        // Store handles the increment
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [activeSessionId, isPaused])

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

  const handleCheckpoint = () => {
    toast.info('Coming in Phase 1.4', 'Checkpoint')
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

  const healthColor = contextHealth >= 70 ? 'bg-[#00D9A5]' : contextHealth >= 40 ? 'bg-[#FFB800]' : 'bg-[#FF4757]'

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
                <AlertCircle className="h-4 w-4 text-[#FF4757]" />
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
            onClick={handleCheckpoint}
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
    </Card>
  )
}
