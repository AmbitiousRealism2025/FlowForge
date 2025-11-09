'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Select from '@radix-ui/react-select'
import { Plus, Filter, Calendar, Clock, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { SessionCard } from '@/components/sessions/SessionCard'
import { StartSessionDialog } from '@/components/sessions/StartSessionDialog'
import {
  SessionType,
  SessionFilters,
  CodingSession,
  ApiResponse,
  PaginatedResponse,
  Project,
} from '@/types'
import { formatDuration } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export default function SessionsPage() {
  const [filters, setFilters] = useState<SessionFilters>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 20

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch sessions with filters
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useQuery<PaginatedResponse<CodingSession>>({
    queryKey: ['sessions', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (filters.sessionType) {
        params.append('sessionType', filters.sessionType)
      }
      if (filters.projectId) {
        params.append('projectId', filters.projectId)
      }
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange.start.toISOString())
        params.append('endDate', filters.dateRange.end.toISOString())
      }

      const response = await fetch(`/api/sessions?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch sessions')
      return response.json()
    },
  })

  // Fetch projects for filter
  const { data: projectsData } = useQuery<ApiResponse<Project[]>>({
    queryKey: ['projects', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/projects?isActive=true')
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
  })

  const sessions = sessionsData?.data || []
  const total = sessionsData?.total || 0
  const hasMore = sessionsData?.hasMore || false
  const projects = projectsData?.data || []

  // Calculate summary statistics
  const totalSessions = sessions.length
  const totalCodingMinutes = sessions.reduce((sum, s) => sum + s.durationSeconds / 60, 0)
  const averageSessionDuration =
    totalSessions > 0 ? totalCodingMinutes / totalSessions : 0

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete session')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete session')
    },
  })

  const handleSessionStarted = () => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
  }

  const handleClearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const hasActiveFilters =
    filters.sessionType || filters.projectId || filters.dateRange

  // Loading skeleton
  if (sessionsLoading && page === 1) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sessions</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sessions</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Start New Session
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Coding Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {formatDuration(Math.floor(totalCodingMinutes * 60))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {formatDuration(Math.floor(averageSessionDuration * 60))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Session Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Type</label>
              <Select.Root
                value={filters.sessionType || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    sessionType: value === 'all' ? undefined : (value as SessionType),
                  }))
                }
              >
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <Select.Value placeholder="All types" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="all"
                        className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent"
                      >
                        <Select.ItemText>All Types</Select.ItemText>
                      </Select.Item>
                      {Object.values(SessionType).map((type) => (
                        <Select.Item
                          key={type}
                          value={type}
                          className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent"
                        >
                          <Select.ItemText>{type}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Project Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select.Root
                value={filters.projectId || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    projectId: value === 'all' ? undefined : value,
                  }))
                }
              >
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <Select.Value placeholder="All projects" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="all"
                        className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent"
                      >
                        <Select.ItemText>All Projects</Select.ItemText>
                      </Select.Item>
                      {projects.map((project) => (
                        <Select.Item
                          key={project.id}
                          value={project.id}
                          className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent"
                        >
                          <Select.ItemText>{project.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              {hasActiveFilters ? 'No sessions match your filters' : 'No sessions yet'}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'Try adjusting your filters or clearing them to see more sessions'
                : 'Start your first coding session to begin tracking your progress'}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Start Your First Session
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={(id) => deleteMutation.mutate(id)}
              onViewDetails={(id) => console.log('View details:', id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      )}

      {/* Start Session Dialog */}
      <StartSessionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSessionStarted={handleSessionStarted}
      />
    </div>
  )
}
