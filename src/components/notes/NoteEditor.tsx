'use client'

import * as React from 'react'
import { Code, List, Bold, Italic, Link2 } from 'lucide-react'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import type { NoteEditorProps, NoteCategory } from '@/types'
import { getNoteCategoryIcon, getNoteCategoryLabel } from '@/lib/utils'

type SaveStatus = 'Saved' | 'Saving' | 'Unsaved'

export function NoteEditor({
  value,
  onChange,
  category,
  onCategoryChange,
  placeholder = 'Start typing your note...',
  autoFocus = false,
}: NoteEditorProps) {
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('Saved')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const saveDraftTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Auto-save draft to localStorage
  React.useEffect(() => {
    if (value.trim().length === 0) {
      setSaveStatus('Saved')
      return
    }

    setSaveStatus('Unsaved')

    if (saveDraftTimerRef.current) {
      clearTimeout(saveDraftTimerRef.current)
    }

    saveDraftTimerRef.current = setTimeout(() => {
      const draftKey = `flowforge-note-draft-${Date.now()}`
      localStorage.setItem(draftKey, value)
      setSaveStatus('Saved')
    }, 500)

    return () => {
      if (saveDraftTimerRef.current) {
        clearTimeout(saveDraftTimerRef.current)
      }
    }
  }, [value])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        insertMarkdown('**', '**')
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault()
        insertMarkdown('*', '*')
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        insertMarkdown('[', '](url)')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [value])

  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end)

    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = start + before.length + selectedText.length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newPosition, newPosition)
      }
    }, 0)
  }

  const categories: NoteCategory[] = [
    'PROMPT_PATTERN',
    'GOLDEN_CODE',
    'DEBUG_LOG',
    'MODEL_NOTE',
    'INSIGHT',
  ]

  const characterCount = value.length

  return (
    <div className="space-y-3">
      {/* Category Selector */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            type="button"
            variant={category === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(cat)}
            className="flex items-center gap-1.5"
          >
            <span>{getNoteCategoryIcon(cat)}</span>
            <span className="text-xs">{getNoteCategoryLabel(cat)}</span>
          </Button>
        ))}
      </div>

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap gap-1 border-b pb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('```\n', '\n```')}
          title="Code Block (```)"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('- ')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('**', '**')}
          title="Bold (Cmd/Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('*', '*')}
          title="Italic (Cmd/Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('[', '](url)')}
          title="Link (Cmd/Ctrl+K)"
        >
          <Link2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="min-h-[200px] font-mono text-sm"
      />

      {/* Footer with status and character count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {saveStatus === 'Saved' && (
            <span className="text-green-600">Ï Saved</span>
          )}
          {saveStatus === 'Saving' && (
            <span className="text-yellow-600">Ï Saving...</span>
          )}
          {saveStatus === 'Unsaved' && (
            <span className="text-gray-500">Ï Unsaved changes</span>
          )}
        </div>
        <div className={characterCount > 5000 ? 'text-yellow-600' : ''}>
          {characterCount} characters
        </div>
      </div>
    </div>
  )
}
