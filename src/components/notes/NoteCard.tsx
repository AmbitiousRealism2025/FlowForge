'use client'

import * as React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreVertical, Edit, Trash2, Copy, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { NoteCardProps, NoteWithRelations } from '@/types'
import {
  getNoteCategoryIcon,
  getNoteCategoryLabel,
  getNoteCategoryColor,
  getNoteCategoryBgColor,
  truncateText,
  formatRelativeTime,
} from '@/lib/utils'
import { getNotePreview } from '@/lib/notesService'

export function NoteCard({ note, onEdit, onDelete, onCopy }: NoteCardProps) {
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(note.content)
      if (onCopy) {
        onCopy(note.content)
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const preview = getNotePreview(note)
  const isTruncated = note.content.length > 150

  const createdAt = typeof note.createdAt === 'string'
    ? new Date(note.createdAt)
    : note.createdAt
  const updatedAt = typeof note.updatedAt === 'string'
    ? new Date(note.updatedAt)
    : note.updatedAt

  const showUpdatedTime = updatedAt.getTime() !== createdAt.getTime()

  const categoryColor = getNoteCategoryColor(note.category)
  const categoryBgColor = getNoteCategoryBgColor(note.category)

  return (
    <Card
      className={`relative transition-shadow hover:shadow-md ${onEdit ? 'cursor-pointer' : ''} border-l-4 ${categoryColor.replace('text-', 'border-')}`}
      onClick={() => onEdit && onEdit(note)}
    >
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge className={categoryBgColor}>
              <span className="mr-1">{getNoteCategoryIcon(note.category)}</span>
              {getNoteCategoryLabel(note.category)}
            </Badge>
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] rounded-md border bg-popover p-1 shadow-md"
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                    onClick={() => onEdit(note)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </DropdownMenu.Item>
                {onDelete && (
                  <>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-accent"
                      onClick={() => onDelete(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenu.Item>
                  </>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        {note.title ? (
          <CardTitle className="text-lg">{note.title}</CardTitle>
        ) : (
          <CardTitle className="text-lg">
            {truncateText(note.content.split('\n')[0], 50)}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {preview}
          {isTruncated && (
            <span className="ml-1 text-primary">Read more</span>
          )}
        </div>

        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.slice(0, 5).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{note.tags.length - 5} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div>Created {formatRelativeTime(createdAt)}</div>
          {showUpdatedTime && (
            <div>Updated {formatRelativeTime(updatedAt)}</div>
          )}
        </div>

        {(note.session || note.project) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {note.session && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span>Session: {note.session.sessionType}</span>
              </div>
            )}
            {note.project && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span>Project: {note.project.name}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
