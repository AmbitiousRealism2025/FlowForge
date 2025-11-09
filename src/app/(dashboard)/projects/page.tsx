'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Select from '@radix-ui/react-select'
import { Plus, Filter, Search, FolderKanban, TrendingUp, Package, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { ProjectFilters, ProjectWithStats } from '@/types'
import { fetchProjects, deleteProject } from '@/lib/projectService'
import { useToast } from '@/hooks/useToast'
import { formatDuration } from '@/lib/utils'

export default function ProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>({
    isActive: true,
    sortBy: 'momentum',
    search: null,
  })
  const [searchInput, setSearchInput] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || null }))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch projects
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const result = await fetchProjects(filters)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch projects')
      }
      return result.data || []
    },
    staleTime: 30000, // 30 seconds
  })

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const result = await deleteProject(projectId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete project')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project archived successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive project')
    },
  })

  const projects = data || []

  // Calculate summary statistics
  const activeProjectsCount = projects.filter((p) => p.isActive).length
  const totalProjects = projects.length
  const totalCodingMinutes = projects.reduce((sum, p) => sum + p.totalCodingMinutes, 0)
  const totalCodingTime = formatDuration(totalCodingMinutes * 60)

  // Projects shipped this month
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const projectsShippedThisMonth = projects.filter((p) => {
    if (!p.shipTarget) return false
    const shipDate = new Date(p.shipTarget)
    return shipDate >= thisMonthStart && shipDate < now
  }).length

  const handleClearFilters = () => {
    setFilters({
      isActive: null,
      sortBy: null,
      search: null,
    })
    setSearchInput('')
  }

  const hasActiveFilters =
    filters.isActive !== true || filters.sortBy !== 'momentum' || filters.search !== null

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjectsCount}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped This Month</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsShippedThisMonth}</div>
            <p className="text-xs text-muted-foreground">Projects completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coding Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCodingTime}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            {/* Status Filter */}
            <Select.Root
              value={filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'archived'}
              onValueChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  isActive: value === 'all' ? null : value === 'active',
                }))
              }}
            >
              <Select.Trigger className="w-full px-3 py-2 border border-input rounded-md bg-background flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select.Value />
                </span>
                <ChevronDown className="h-4 w-4" />
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className="bg-popover rounded-md shadow-lg p-1 z-50">
                  <Select.Viewport>
                    <Select.Item
                      value="all"
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm outline-none"
                    >
                      <Select.ItemText>All Projects</Select.ItemText>
                    </Select.Item>
                    <Select.Item
                      value="active"
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm outline-none"
                    >
                      <Select.ItemText>Active</Select.ItemText>
                    </Select.Item>
                    <Select.Item
                      value="archived"
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm outline-none"
                    >
                      <Select.ItemText>Archived</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            {/* Sort By */}
            <Select.Root
              value={filters.sortBy || 'momentum'}
              onValueChange={(value) => {
                setFilters((prev) => ({
                  ...prev,
                  sortBy: value as 'updatedAt' | 'feelsRightScore' | 'momentum',
                }))
              }}
            >
              <Select.Trigger className="w-full px-3 py-2 border border-input rounded-md bg-background flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Select.Value />
                <ChevronDown className="h-4 w-4" />
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className="bg-popover rounded-md shadow-lg p-1 z-50">
                  <Select.Viewport>
                    <Select.Item
                      value="momentum"
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm outline-none"
                    >
                      <Select.ItemText>Momentum</Select.ItemText>
                    </Select.Item>
                    <Select.Item
                      value="updatedAt"
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm outline-none"
                    >
                      <Select.ItemText>Recent Activity</Select.ItemText>
                    </Select.Item>
                    <Select.Item
                      value="feelsRightScore"
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm outline-none"
                    >
                      <Select.ItemText>Feels Right Score</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {hasActiveFilters && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse rounded-lg h-64"
            />
          ))}
        </div>
      )}

      {error && (
        <Card className="p-6">
          <p className="text-center text-destructive">
            Failed to load projects. Please try again.
          </p>
        </Card>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <FolderKanban className="h-12 w-12 text-muted-foreground" />
            {hasActiveFilters ? (
              <>
                <h3 className="text-lg font-semibold">No projects match your filters</h3>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">No projects yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Create your first project to start tracking progress with subjective
                  feels-right indicators
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {!isLoading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onUpdate={(project) => {
                // Could open edit dialog here
                console.log('Edit project:', project)
              }}
              onStartSession={(projectId) => {
                toast.info('Session tracking coming soon!')
              }}
              onDelete={(projectId) => {
                deleteMutation.mutate(projectId)
              }}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onProjectCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['projects'] })
        }}
      />
    </div>
  )
}
