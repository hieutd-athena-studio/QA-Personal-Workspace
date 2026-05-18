/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Assignment, AssignmentStatus, AssignmentUpdate } from '@shared/types/assignments'
import type { AssignmentRow } from '@shared/types/api'

const key = (cycleId: string): readonly unknown[] => ['assignments', cycleId] as const

export function useAssignments(cycleId: string | undefined) {
  return useQuery({
    queryKey: key(cycleId ?? ''),
    queryFn: () => window.api.assignments.list(cycleId!),
    enabled: Boolean(cycleId)
  })
}

export function useCycleProgress(cycleId: string | undefined) {
  return useQuery({
    queryKey: ['assignments', cycleId, 'progress'],
    queryFn: () => window.api.assignments.progress(cycleId!),
    enabled: Boolean(cycleId)
  })
}

export function useAssignCases(cycleId: string) {
  const qc = useQueryClient()
  return useMutation<{ inserted: number }, Error, string[]>({
    mutationFn: (caseIds) => window.api.assignments.assign(cycleId, caseIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(cycleId) })
      qc.invalidateQueries({ queryKey: ['assignments', cycleId, 'progress'] })
    }
  })
}

export function useBatchUnassign(cycleId: string) {
  const qc = useQueryClient()
  return useMutation<{ removed: number }, Error, string[]>({
    mutationFn: (ids) => window.api.assignments.batchUnassign(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(cycleId) })
      qc.invalidateQueries({ queryKey: ['assignments', cycleId, 'progress'] })
    }
  })
}

export function useSetAssignmentStatus(cycleId: string) {
  const qc = useQueryClient()
  return useMutation<
    Assignment,
    Error,
    { id: string; status: AssignmentStatus; notes?: string | null }
  >({
    mutationFn: ({ id, status, notes }) =>
      window.api.assignments.setStatus(id, status, notes ?? null),
    onMutate: async ({ id, status, notes }) => {
      await qc.cancelQueries({ queryKey: key(cycleId) })
      const previous = qc.getQueryData<AssignmentRow[]>(key(cycleId))
      qc.setQueryData<AssignmentRow[]>(key(cycleId), (rows) =>
        rows?.map((r) =>
          r.id === id
            ? { ...r, status, notes: notes ?? r.notes, executed_at: new Date().toISOString() }
            : r
        )
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      const c = ctx as { previous?: AssignmentRow[] } | undefined
      if (c?.previous) qc.setQueryData(key(cycleId), c.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key(cycleId) })
      qc.invalidateQueries({ queryKey: ['assignments', cycleId, 'progress'] })
    }
  })
}

export function useUpdateAssignment(cycleId: string) {
  const qc = useQueryClient()
  return useMutation<Assignment, Error, { id: string; patch: AssignmentUpdate }>({
    mutationFn: ({ id, patch }) => window.api.assignments.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(cycleId) })
      qc.invalidateQueries({ queryKey: ['assignments', cycleId, 'progress'] })
    }
  })
}
