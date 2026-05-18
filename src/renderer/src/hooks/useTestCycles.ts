/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NewTestCycleInput, TestCycle, TestCyclePatch } from '@shared/types/test_cycles'

export function useTestCyclesForPlan(planId: string | undefined) {
  return useQuery({
    queryKey: ['cycles', 'plan', planId],
    queryFn: () => window.api.cycles.list(planId!),
    enabled: Boolean(planId)
  })
}

export function useTestCyclesForProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['cycles', 'project', projectId],
    queryFn: () => window.api.cycles.listByProject(projectId!),
    enabled: Boolean(projectId)
  })
}

export function useTestCycle(id: string | undefined) {
  return useQuery({
    queryKey: ['cycles', 'detail', id],
    queryFn: () => window.api.cycles.get(id!),
    enabled: Boolean(id)
  })
}

export function useCreateTestCycle(projectId: string) {
  const qc = useQueryClient()
  return useMutation<TestCycle, Error, NewTestCycleInput>({
    mutationFn: (input) => window.api.cycles.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles', 'project', projectId] })
      qc.invalidateQueries({ queryKey: ['cycles', 'plan'] })
    }
  })
}

export function useUpdateTestCycle(projectId: string) {
  const qc = useQueryClient()
  return useMutation<TestCycle, Error, { id: string; patch: TestCyclePatch }>({
    mutationFn: ({ id, patch }) => window.api.cycles.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles', 'project', projectId] })
      qc.invalidateQueries({ queryKey: ['cycles', 'plan'] })
    }
  })
}

export function useDeleteTestCycle(projectId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => window.api.cycles.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles', 'project', projectId] })
      qc.invalidateQueries({ queryKey: ['cycles', 'plan'] })
    }
  })
}
