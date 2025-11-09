'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Select from '@radix-ui/react-select'
import { Plus, Search, StickyNote, Tag, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { NoteCard } from '@/components/notes/NoteCard'
import { CreateNoteDialog } from '@/components/notes/CreateNoteDialog'
import type { NoteCategory, NoteFilters, NoteWithRelations } from '@/types'
import {
  fetchNotes,
  deleteNote,
  extractCommonTags,
} from '@/lib/notesService'
import {
  getNoteCategoryIcon,
  getNoteCategoryLabel,
} from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export default function NotesPage() {
  const [filters, setFilters] = React.useState<NoteFilters>({})
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [searchInput, setSearchInput] = React.useState('')
  const limit = 20

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Debounced search effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }))
      setPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch notes query
  const { data: notesData, isLoading, isError } = useQuery({
    queryKey: ['notes', filters, page, limit],
    queryFn: () => fetchNotes(filters, page, limit),
    staleTime: 30000,
  })

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete note')
    },
  })

  // Extract common tags from current notes
  const commonTags = React.useMemo(() => {
    if (!notesData?.items) return []
    return extractCommonTags(notesData.items)
  }, [notesData?.items])

  // Calculate statistics
  const totalNotes = notesData?.total || 0
  const notesThisWeek = React.useMemo(() => {
    if (!notesData?.items) return 0
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return notesData.items.filter((note) => {
      const createdAt = typeof note.createdAt === 'string'
        ? new Date(note.createdAt)
        : note.createdAt
      return createdAt >= weekAgo
    }).length
  }, [notesData?.items])

  const mostUsedCategory = React.useMemo(() => {
    if (!notesData?.items || notesData.items.length === 0) return null
    const categoryCounts = new Map<NoteCategory, number>()
    notesData.items.forEach((note) => {
      categoryCounts.set(note.category, (categoryCounts.get(note.category) || 0) + 1)
    })
    let maxCount = 0
    let maxCategory: NoteCategory | null = null
    categoryCounts.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count
        maxCategory = category
      }
    })
    return maxCategory
  }, [notesData?.items])

  const handleEdit = (note: NoteWithRelations) => {
    // TODO: Implement edit functionality
    console.log('Edit note:', note)
  }

  const handleDelete = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId)
    }
  }

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleNoteCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] })
  }

  const clearFilters = () => {
    setFilters({})
    setSearchInput('')
    setPage(1)
  }

  const categories: NoteCategory[] = [
    'PROMPT_PATTERN',
    'GOLDEN_CODE',
    'DEBUG_LOG',
    'MODEL_NOTE',
    'INSIGHT',
  ]

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">
            Capture and organize your ideas, code snippets, and insights
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <StickyNote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Notes This Week
            </CardTitle>
            <StickyNote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesThisWeek}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Most Used Category
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {mostUsedCategory ? (
              <div className="flex items-center gap-2">
                <span className="text-xl">{getNoteCategoryIcon(mostUsedCategory)}</span>
                <div className="text-lg font-semibold">
                  {getNoteCategoryLabel(mostUsedCategory)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No notes yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search notes..."
            className="pl-9"
          />
        </div>

        <Select.Root
          value={filters.category || ''}
          onValueChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              category: value || undefined,
            }))
            setPage(1)
          }}
        >
          <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm md:w-[200px]">
            <Select.Value placeholder="All Categories" />
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
                  <Select.ItemText>All Categories</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-2">
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </Select.Item>
                {categories.map((cat) => (
                  <Select.Item
                    key={cat}
                    value={cat}
                    className="relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                  >
                    <span>{getNoteCategoryIcon(cat)}</span>
                    <Select.ItemText>{getNoteCategoryLabel(cat)}</Select.ItemText>
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

      {/* Common Tags */}
      {commonTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Common tags:
          </span>
          {commonTags.map(({ tag, count }) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  tags: [tag],
                }))
                setPage(1)
              }}
            >
              {tag} ({count})
            </Badge>
          ))}
        </div>
      )}

      {/* Notes Grid */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center text-destructive">
          Failed to load notes. Please try again.
        </div>
      )}

      {!isLoading && !isError && notesData?.items && notesData.items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {Object.keys(filters).length > 0 ? (
            <>
              <StickyNote className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No notes match your filters</h3>
              <p className="mb-4 text-muted-foreground">
                Try adjusting your search or filters
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <StickyNote className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No notes yet</h3>
              <p className="mb-4 text-muted-foreground">
                Create your first note to capture ideas and insights
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Note
              </Button>
            </>
          )}
        </div>
      )}

      {!isLoading && !isError && notesData?.items && notesData.items.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notesData.items.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
              />
            ))}
          </div>

          {/* Pagination */}
          {notesData.total > limit && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(notesData.total / limit)}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={!notesData.hasMore}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Note Dialog */}
      <CreateNoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onNoteCreated={handleNoteCreated}
      />
    </div>
  )
}
