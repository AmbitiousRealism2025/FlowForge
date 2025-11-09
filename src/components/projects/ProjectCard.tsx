'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreVertical, Play, Edit, Archive, TrendingUp, Calendar, Clock } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProjectCardProps } from '@/types'
import {
  getMomentumEmoji,
  getMomentumLabel,
  getMomentumColor,
  formatRelativeTime,
  formatShipTarget,
  truncateText,
  formatDuration,
} from '@/lib/utils'
import { FeelsRightSlider } from './FeelsRightSlider'
import { PivotCounter } from './PivotCounter'

export function ProjectCard({
  project,
  onUpdate,
  onStartSession,
  onDelete,
}: ProjectCardProps) {
  const momentumEmoji = getMomentumEmoji(project.momentum)
  const momentumLabel = getMomentumLabel(project.momentum)
  const momentumColor = getMomentumColor(project.momentum)

  // Determine border color based on momentum
  const borderColorClass =
    project.momentum === 'HOT'
      ? 'border-l-4 border-l-red-500'
      : project.momentum === 'ACTIVE'
      ? 'border-l-4 border-l-yellow-500'
      : 'border-l-4 border-l-gray-400'

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate(project)
    }
  }

  const handleStartSession = () => {
    if (onStartSession) {
      onStartSession(project.id)
    }
  }

  const handleArchive = () => {
    if (onDelete) {
      const confirmed = confirm(
        `Are you sure you want to archive "${project.name}"? You can restore it later.`
      )
      if (confirmed) {
        onDelete(project.id)
      }
    }
  }

  const codingTimeFormatted = formatDuration(project.totalCodingMinutes * 60)

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${borderColorClass} ${
        onUpdate ? 'cursor-pointer' : ''
      }`}
      onClick={handleUpdate}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium ${momentumColor}`}
              >
                <span>{momentumEmoji}</span>
                <span>{momentumLabel}</span>
              </span>
            </div>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="min-h-[44px] min-w-[44px]"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[180px] bg-popover rounded-md shadow-lg p-1 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {onStartSession && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm outline-none"
                    onClick={handleStartSession}
                  >
                    <Play className="h-4 w-4" />
                    <span>Start Session</span>
                  </DropdownMenu.Item>
                )}

                {onUpdate && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm outline-none"
                    onClick={handleUpdate}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Project</span>
                  </DropdownMenu.Item>
                )}

                {onDelete && (
                  <>
                    <DropdownMenu.Separator className="h-px bg-border my-1" />
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm outline-none text-destructive"
                      onClick={handleArchive}
                    >
                      <Archive className="h-4 w-4" />
                      <span>Archive Project</span>
                    </DropdownMenu.Item>
                  </>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {truncateText(project.description, 100)}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
        {/* Feels Right Slider */}
        <FeelsRightSlider
          projectId={project.id}
          initialValue={project.feelsRightScore}
          onChange={(value) => {
            // Update handled by FeelsRightSlider internally
          }}
        />

        {/* Project Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Ship Target */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">{formatShipTarget(project.shipTarget)}</span>
          </div>

          {/* Total Coding Time */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">{codingTimeFormatted}</span>
          </div>

          {/* Last Worked */}
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs">
              {project.lastWorkedDate
                ? `Last worked ${formatRelativeTime(project.lastWorkedDate)}`
                : 'Never worked on'}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter onClick={(e) => e.stopPropagation()}>
        <PivotCounter
          projectId={project.id}
          currentCount={project.pivotCount}
          onPivotRecorded={() => {
            // Handled by PivotCounter internally with query invalidation
          }}
        />
      </CardFooter>
    </Card>
  )
}
