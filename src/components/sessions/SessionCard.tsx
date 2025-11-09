'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreVertical, Trash2, FileText, Eye } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SessionCardProps, SessionStatus } from '@/types'
import {
  formatSessionDuration,
  formatRelativeTime,
  getSessionTypeIcon,
  getSessionTypeLabel,
  getSessionTypeColor,
  getSessionStatusColor,
  getSessionStatusLabel,
  truncateText,
} from '@/lib/utils'

export function SessionCard({
  session,
  onDelete,
  onCheckpoint,
  onViewDetails,
}: SessionCardProps) {
  const typeIcon = getSessionTypeIcon(session.sessionType)
  const typeLabel = getSessionTypeLabel(session.sessionType)
  const typeColor = getSessionTypeColor(session.sessionType)
  const statusColor = getSessionStatusColor(session.sessionStatus)
  const statusLabel = getSessionStatusLabel(session.sessionStatus)
  const duration = formatSessionDuration(session)
  const relativeTime = formatRelativeTime(session.startedAt)

  // Border color based on status
  const getBorderColor = () => {
    switch (session.sessionStatus) {
      case SessionStatus.ACTIVE:
        return 'border-l-blue-500'
      case SessionStatus.PAUSED:
        return 'border-l-yellow-500'
      case SessionStatus.COMPLETED:
        return 'border-l-green-500'
      case SessionStatus.ABANDONED:
        return 'border-l-red-500'
      default:
        return ''
    }
  }

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(session.id)
    }
  }

  return (
    <Card
      className={`border-l-4 transition-all hover:shadow-md ${getBorderColor()} ${
        onViewDetails ? 'cursor-pointer' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeIcon}</span>
            <div>
              <div className={`font-semibold ${typeColor}`}>{typeLabel}</div>
              <div className={`text-xs ${statusColor}`}>{statusLabel}</div>
            </div>
          </div>

          {/* Action Menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                sideOffset={5}
                onClick={(e) => e.stopPropagation()}
              >
                {onViewDetails && (
                  <DropdownMenu.Item
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => onViewDetails(session.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenu.Item>
                )}

                {onCheckpoint && (
                  <DropdownMenu.Item
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => onCheckpoint(session.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Add Checkpoint
                  </DropdownMenu.Item>
                )}

                {onDelete && (
                  <>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this session?')) {
                          onDelete(session.id)
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenu.Item>
                  </>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Duration */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-semibold">{duration}</span>
        </div>

        {/* AI Models */}
        {session.aiModelsUsed && session.aiModelsUsed.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">AI Models</div>
            <div className="flex flex-wrap gap-1">
              {session.aiModelsUsed.map((model, index) => (
                <span
                  key={index}
                  className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                >
                  {model}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Productivity Score */}
        {session.productivityScore !== null && session.productivityScore !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Productivity</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i < session.productivityScore!
                      ? 'bg-flow-green'
                      : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Checkpoint Notes Preview */}
        {session.checkpointNotes && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Checkpoint Notes</div>
            <div className="text-sm">
              {truncateText(session.checkpointNotes, 100)}
              {session.checkpointNotes.length > 100 && (
                <button
                  className="ml-1 text-primary hover:underline"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onViewDetails) onViewDetails(session.id)
                  }}
                >
                  Read more
                </button>
              )}
            </div>
          </div>
        )}

        {/* Project (if exists) */}
        {session.projectId && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Project</span>
            <span className="font-medium">{session.projectId}</span>
          </div>
        )}

        {/* Timestamp */}
        <div className="pt-2 text-xs text-muted-foreground">
          Started {relativeTime}
        </div>
      </CardContent>
    </Card>
  )
}
