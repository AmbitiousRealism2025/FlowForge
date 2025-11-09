'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SessionTimer } from '@/components/sessions/SessionTimer'
import { StartSessionDialog } from '@/components/sessions/StartSessionDialog'
import { SessionCard } from '@/components/sessions/SessionCard'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  SessionStatus,
  SessionType,
  type CodingSessionWithProject,
} from '@/types'
import { getSessionDuration } from '@/lib/sessionManager'
import { formatDuration } from '@/lib/utils'
import { useActiveProjects } from '@/hooks/useActiveProjects'
import { useSessionStore } from '@/store/sessionStore'

const PAGE_SIZE = 6

interface SessionsQueryParams {
  page: number
  limit: number
  sessionType?: SessionType
  projectId?: string
  startDate?: string
  endDate?: string
}

interface PaginatedSessions {
  items: CodingSessionWithProject[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

async function fetchSessionsList(params: SessionsQueryParams): Promise<PaginatedSessions> {
  const searchParams = new URLSearchParams()
  searchParams.set('page', params.page.toString())
  searchParams.set('limit', params.limit.toString())
  if (params.sessionType) searchParams.set('sessionType', params.sessionType)
  if (params.projectId) searchParams.set('projectId', params.projectId)
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)

  const response = await fetch(`/api/sessions?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch sessions')
  }

  const json = await response.json()
  const payload = json.data || { items: [] }
  const items = Array.isArray(payload.items) ? (payload.items as CodingSessionWithProject[]) : []

  const normalizedItems: CodingSessionWithProject[] = items.map((session) => ({
    ...session,
    startedAt: typeof session.startedAt === 'string' ? new Date(session.startedAt) : session.startedAt,
    endedAt: session.endedAt ? (typeof session.endedAt === 'string' ? new Date(session.endedAt) : session.endedAt) : undefined,
  }))

  return {
    items: normalizedItems,
    total: payload.total ?? normalizedItems.length,
    page: payload.page ?? params.page,
    limit: payload.limit ?? params.limit,
    hasMore: payload.hasMore ?? params.page * params.limit < (payload.total ?? normalizedItems.length),
  }
}

export default function SessionsPage() {
  const [page, setPage] = useState(1)
  const [sessionTypeFilter, setSessionTypeFilter] = useState<'ALL' | SessionType>('ALL')
  const [projectFilter, setProjectFilter] = useState<'ALL' | string>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { projectId: activeProjectId } = useSessionStore((state) => ({ projectId: state.projectId }))
  const { data: activeProjects = [] } = useActiveProjects()
  const activeProjectName = useMemo(() => {
    if (!activeProjectId) return null
    return activeProjects.find((project) => project.id === activeProjectId)?.name ?? null
  }, [activeProjectId, activeProjects])

  const sessionsQuery = useQuery({
    queryKey: [
      'sessions',
      {
        page,
        limit: PAGE_SIZE,
        sessionType: sessionTypeFilter,
        projectId: projectFilter,
        startDate,
        endDate,
      },
    ],
    queryFn: () =>
      fetchSessionsList({
        page,
        limit: PAGE_SIZE,
        sessionType: sessionTypeFilter === 'ALL' ? undefined : sessionTypeFilter,
        projectId: projectFilter === 'ALL' ? undefined : projectFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    keepPreviousData: true,
  })

  const { data, isLoading, isError, refetch } = sessionsQuery
  const sessions = useMemo(() => data?.items ?? [], [data?.items])

  const summary = useMemo(() => {
    if (!sessions.length) {
      return {
        totalDurationSeconds: 0,
        avgDurationLabel: '0m',
        activeCount: 0,
        uniqueModels: 0,
      }
    }

    const totalDurationSeconds = sessions.reduce((acc, session) => acc + getSessionDuration(session), 0)
    const avgDurationSeconds = totalDurationSeconds / sessions.length || 0
    const activeCount = sessions.filter((session) => session.sessionStatus === SessionStatus.ACTIVE).length
    const uniqueModels = new Set(sessions.flatMap((session) => session.aiModelsUsed)).size

    return {
      totalDurationSeconds,
      avgDurationLabel: formatDuration(Math.round(avgDurationSeconds)),
      activeCount,
      uniqueModels,
    }
  }, [sessions])

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))

  const handleResetFilters = () => {
    setSessionTypeFilter('ALL')
    setProjectFilter('ALL')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const handleSessionTypeChange = (value: string) => {
    if (value === 'ALL') {
      setSessionTypeFilter('ALL')
    } else {
      setSessionTypeFilter(value as SessionType)
    }
    setPage(1)
  }

  const handleProjectChange = (value: string) => {
    setProjectFilter(value || 'ALL')
    setPage(1)
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">Track your focus blocks, AI partners, and context health.</p>
        </div>
        <StartSessionDialog className="w-full md:w-auto" onSessionStarted={() => refetch()} />
      </div>

      <SessionTimer className="shadow-sm" projectName={activeProjectName} />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Focus Time (page)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatDuration(summary.totalDurationSeconds, true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.avgDurationLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active + Models</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {summary.activeCount} active / {summary.uniqueModels} models
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Session Type
              <select
                value={sessionTypeFilter}
                onChange={(event) => handleSessionTypeChange(event.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All</option>
                {Object.values(SessionType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Project
              <select
                value={projectFilter}
                onChange={(event) => handleProjectChange(event.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All</option>
                {activeProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Start Date
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value)
                  setPage(1)
                }}
                className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              End Date
              <input
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value)
                  setPage(1)
                }}
                className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="font-semibold text-destructive">Unable to load sessions.</p>
          <p className="text-sm text-muted-foreground">Refresh or adjust filters to try again.</p>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-48 rounded-lg border bg-muted/40 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <div className="rounded-lg border p-10 text-center text-muted-foreground">
          <p>No sessions match your filters yet.</p>
          <p className="text-sm">Kick off a new block or adjust the filters above.</p>
        </div>
      )}

      <div className="space-y-4">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} onSessionUpdated={() => refetch()} onSessionDeleted={() => refetch()} />
        ))}
      </div>

      {sessions.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm md:flex-row">
          <span>
            Page {page} of {totalPages} · {data?.total ?? 0} sessions
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" onClick={() => setPage((prev) => prev + 1)} disabled={!data?.hasMore}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
