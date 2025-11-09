'use client'

import { useQuery } from '@tanstack/react-query'
import type { Project } from '@/types'

interface ProjectsResponse {
  success: boolean
  data?: {
    items: Project[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  } | Project[]
}

async function fetchActiveProjects(): Promise<Project[]> {
  const response = await fetch('/api/projects?isActive=true&limit=100')

  if (!response.ok) {
    throw new Error('Failed to load active projects')
  }

  const json: ProjectsResponse = await response.json()
  const payload = json.data

  const projectsArray = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload?.items
      : []

  return projectsArray.map((project) => ({
    ...project,
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
    shipTarget: project.shipTarget ? new Date(project.shipTarget) : undefined,
  }))
}

export function useActiveProjects(enabled: boolean = true) {
  return useQuery({
    queryKey: ['projects', 'active'],
    queryFn: fetchActiveProjects,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export { fetchActiveProjects }
