/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NewTestPlanInput, TestPlanPatch, TestPlanWithTasks } from '@shared/types/test_plans'

const key = (projectId: string): readonly unknown[] => ['plans', projectId] as const

export function useTestPlans(projectId: string | undefined) {
  return useQuery({
    queryKey: key(projectId ?? ''),
    queryFn: () => window.api.plans.list(projectId!),
    enabled: Boolean(projectId)
  })
}

export function useTestPlan(id: string | undefined) {
  return useQuery({
    queryKey: ['plans', 'detail', id],
    queryFn: () => window.api.plans.getWithTasks(id!),
    enabled: Boolean(id)
  })
}

export function useCreateTestPlan(projectId: string) {
  const qc = useQueryClient()
  return useMutation<TestPlanWithTasks, Error, NewTestPlanInput>({
    mutationFn: (input) => window.api.plans.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) })
  })
}

export function useUpdateTestPlan(projectId: string) {
  const qc = useQueryClient()
  return useMutation<TestPlanWithTasks, Error, { id: string; patch: TestPlanPatch }>({
    mutationFn: ({ id, patch }) => window.api.plans.update(id, patch),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: key(projectId) })
      qc.invalidateQueries({ queryKey: ['plans', 'detail', vars.id] })
    }
  })
}

export function useDeleteTestPlan(projectId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => window.api.plans.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(projectId) })
  })
}
