import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  NewProjectVersionInput,
  ProjectVersion,
  ProjectVersionPatch
} from '@shared/types/project_versions'

const versionsKey = (projectId: string): readonly unknown[] =>
  ['projectVersions', projectId] as const

export function useProjectVersions(
  projectId: string | undefined
): ReturnType<typeof useQuery<ProjectVersion[]>> {
  return useQuery({
    queryKey: ['projectVersions', projectId],
    queryFn: () => window.api.projectVersions.list(projectId!),
    enabled: Boolean(projectId)
  })
}

export function useCreateProjectVersion(
  projectId: string
): ReturnType<typeof useMutation<ProjectVersion, Error, NewProjectVersionInput>> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input) => window.api.projectVersions.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: versionsKey(projectId) })
      qc.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

export function useUpdateProjectVersion(
  projectId: string
): ReturnType<
  typeof useMutation<ProjectVersion, Error, { id: string; patch: ProjectVersionPatch }>
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }) => window.api.projectVersions.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: versionsKey(projectId) })
      qc.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

export function useDeleteProjectVersion(
  projectId: string
): ReturnType<typeof useMutation<void, Error, string>> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => window.api.projectVersions.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: versionsKey(projectId) })
      qc.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}
