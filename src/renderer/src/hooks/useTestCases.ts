/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  NewTestCaseInput,
  TestCase,
  TestCasePatch,
  TestCaseWithSteps
} from '@shared/types/test_cases'

const key = (projectId: string): readonly unknown[] => ['cases', projectId] as const

export function useTestCases(projectId: string | undefined) {
  return useQuery({
    queryKey: key(projectId ?? ''),
    queryFn: () => window.api.cases.list(projectId!),
    enabled: Boolean(projectId)
  })
}

export function useTestCase(id: string | undefined) {
  return useQuery({
    queryKey: ['cases', 'detail', id],
    queryFn: () => window.api.cases.getWithSteps(id!),
    enabled: Boolean(id)
  })
}

export function useSearchTestCases(projectId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['cases', projectId, 'search', query],
    queryFn: () => window.api.cases.search(projectId!, query),
    enabled: Boolean(projectId) && query.length > 0
  })
}

export function useCreateTestCase(projectId: string) {
  const qc = useQueryClient()
  return useMutation<TestCaseWithSteps, Error, NewTestCaseInput>({
    mutationFn: (input) => window.api.cases.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) })
  })
}

export function useUpdateTestCase(projectId: string) {
  const qc = useQueryClient()
  return useMutation<TestCaseWithSteps, Error, { id: string; patch: TestCasePatch }>({
    mutationFn: ({ id, patch }) => window.api.cases.update(id, patch),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: key(projectId) })
      qc.invalidateQueries({ queryKey: ['cases', 'detail', vars.id] })
    }
  })
}

export function useDeleteTestCase(projectId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => window.api.cases.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) })
  })
}

export function useImportTestCases(projectId: string) {
  const qc = useQueryClient()
  return useMutation<number, Error, NewTestCaseInput[]>({
    mutationFn: (payload) => window.api.cases.importJson(projectId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) })
  })
}

export function useExportTestCases(projectId: string) {
  return useMutation({
    mutationFn: () => window.api.cases.exportJson(projectId)
  })
}

export type { TestCase, TestCaseWithSteps }
