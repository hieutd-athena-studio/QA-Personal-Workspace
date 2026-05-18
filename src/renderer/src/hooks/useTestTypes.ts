/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NewTestTypeInput, TestType, TestTypePatch } from '@shared/types/test_types'

const key = (projectId: string): readonly unknown[] => ['types', projectId] as const

export function useTestTypes(projectId: string | undefined) {
  return useQuery({
    queryKey: key(projectId ?? ''),
    queryFn: () => window.api.types.list(projectId!),
    enabled: Boolean(projectId)
  })
}

export function useTestTypeCounts(projectId: string | undefined) {
  return useQuery({
    queryKey: ['types', projectId, 'counts'],
    queryFn: () => window.api.types.counts(projectId!),
    enabled: Boolean(projectId)
  })
}

export function useTestTypeCases(typeId: string | undefined) {
  return useQuery({
    queryKey: ['types', typeId, 'cases'],
    queryFn: () => window.api.types.getCases(typeId!),
    enabled: Boolean(typeId)
  })
}

export function useCreateTestType(projectId: string) {
  const qc = useQueryClient()
  return useMutation<TestType, Error, NewTestTypeInput>({
    mutationFn: (input) => window.api.types.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) })
  })
}

export function useUpdateTestType(projectId: string) {
  const qc = useQueryClient()
  return useMutation<TestType, Error, { id: string; patch: TestTypePatch }>({
    mutationFn: ({ id, patch }) => window.api.types.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) })
  })
}

export function useDeleteTestType(projectId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => window.api.types.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(projectId) })
      qc.invalidateQueries({ queryKey: ['types', projectId, 'counts'] })
    }
  })
}

export function useSetTestTypeCases(projectId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; caseIds: string[] }>({
    mutationFn: ({ id, caseIds }) => window.api.types.setCases(id, caseIds),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['types', vars.id, 'cases'] })
      qc.invalidateQueries({ queryKey: ['types', projectId, 'counts'] })
    }
  })
}
