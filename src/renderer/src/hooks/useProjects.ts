import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NewProjectInput, Project, ProjectPatch } from '@shared/types/projects'

const projectsKey = ['projects'] as const

export function useProjects(): ReturnType<typeof useQuery<Project[]>> {
  return useQuery({
    queryKey: projectsKey,
    queryFn: () => window.api.projects.list()
  })
}

export function useProject(id: string | undefined): ReturnType<typeof useQuery<Project | null>> {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => window.api.projects.get(id!),
    enabled: Boolean(id)
  })
}

export function useCreateProject(): ReturnType<
  typeof useMutation<Project, Error, NewProjectInput>
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => window.api.projects.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey })
  })
}

export function useUpdateProject(): ReturnType<
  typeof useMutation<Project, Error, { id: string; patch: ProjectPatch }>
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }) => window.api.projects.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey })
  })
}

export function useDeleteProject(): ReturnType<typeof useMutation<void, Error, string>> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => window.api.projects.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey })
  })
}
