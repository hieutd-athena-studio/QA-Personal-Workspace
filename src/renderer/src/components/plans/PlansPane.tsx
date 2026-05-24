import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQueries } from '@tanstack/react-query'
import { CalendarDays, Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'
import { useDeleteTestPlan, useTestPlans } from '@renderer/hooks/useTestPlans'
import { useTestCyclesForProject } from '@renderer/hooks/useTestCycles'
import type { TestPlan } from '@shared/types/test_plans'

interface Props {
  projectId: string
}

interface PlanProgress {
  completed: number
  total: number
}

const EMPTY_PROGRESS: PlanProgress = { completed: 0, total: 0 }

export function PlansPane({ projectId }: Props): React.JSX.Element {
  const { data: plans } = useTestPlans(projectId)
  const { data: allCycles } = useTestCyclesForProject(projectId)
  const deletePlan = useDeleteTestPlan(projectId)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const confirmPlan = (plans ?? []).find((p) => p.id === confirmId)

  const cycles = allCycles ?? []

  // Fetch progress for every cycle — used to decide whether each cycle is "complete"
  // (all its assignments executed, i.e. no Unexecuted left and at least one case assigned).
  const progressQueries = useQueries({
    queries: cycles.map((c) => ({
      queryKey: ['assignments', c.id, 'progress'] as const,
      queryFn: () => window.api.assignments.progress(c.id),
      enabled: Boolean(c.id)
    }))
  })

  const progressByPlan = useMemo(() => {
    const map = new Map<string, PlanProgress>()
    cycles.forEach((cycle, idx) => {
      const slot = map.get(cycle.plan_id) ?? { ...EMPTY_PROGRESS }
      slot.total += 1
      const data = progressQueries[idx]?.data
      if (data && data.total > 0 && data.unexecuted === 0) {
        slot.completed += 1
      }
      map.set(cycle.plan_id, slot)
    })
    return map
  }, [cycles, progressQueries])

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center">
        <span className="eyebrow">All plans · {(plans ?? []).length}</span>
        <span className="flex-1" />
        <Link
          to="/projects/$projectId/plans/new"
          params={{ projectId }}
          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          <Sparkles className="size-[13px]" />
          New plan
        </Link>
      </div>

      {(plans ?? []).length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center text-[var(--fg-muted)]">
          <div className="mb-3 flex justify-center">
            <CalendarDays className="size-5 text-[var(--fg-faint)]" />
          </div>
          <h4 className="mb-1 text-[14px] font-semibold text-foreground">No test plans yet</h4>
          <p className="mb-4 text-[13px]">Create your first test plan to get started.</p>
          <Link
            to="/projects/$projectId/plans/new"
            params={{ projectId }}
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            <Plus className="size-3.5" />
            New plan
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {(plans ?? []).map((plan) => {
            const progress = progressByPlan.get(plan.id) ?? EMPTY_PROGRESS
            return (
              <PlanRow
                key={plan.id}
                plan={plan}
                projectId={projectId}
                progress={progress}
                onDelete={() => setConfirmId(plan.id)}
              />
            )
          })}
        </div>
      )}

      {/* Confirm delete */}
      <AlertDialog open={Boolean(confirmId)} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plan &quot;{confirmPlan?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete all cycles and assignments. Cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!confirmId) return
                deletePlan.mutate(confirmId, {
                  onSuccess: () => {
                    toast.success('Deleted')
                    setConfirmId(null)
                  },
                  onError: (e) => toast.error(e.message)
                })
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PlanRow({
  plan,
  projectId,
  progress,
  onDelete
}: {
  plan: TestPlan
  projectId: string
  progress: PlanProgress
  onDelete: () => void
}): React.JSX.Element {
  const cycleCount = progress.total
  const completedPct = progress.total === 0 ? 0 : (progress.completed / progress.total) * 100
  return (
    <div
      className="grid items-center gap-[18px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3.5"
      style={{ gridTemplateColumns: 'auto 1fr auto' }}
    >
      {/* ID pill */}
      <div>
        <span className="rounded border border-[var(--border)] bg-white/[0.03] px-2 py-px font-mono text-[11.5px] text-[var(--fg-subtle)]">
          {plan.display_id}
        </span>
      </div>

      {/* Name + meta */}
      <div className="min-w-0">
        <p className="mb-1 text-[14px] font-medium text-foreground">{plan.name}</p>
        {plan.description && (
          <p className="mb-1 text-[12.5px] text-[var(--fg-muted)]">{plan.description}</p>
        )}
        <div className="flex flex-wrap gap-3.5 text-[11.5px] text-[var(--fg-subtle)]">
          {plan.start_date && plan.end_date && (
            <span>
              {plan.start_date} → {plan.end_date}
            </span>
          )}
          {plan.working_days != null && <span>{plan.working_days} working days</span>}
          <span>
            {cycleCount} cycle{cycleCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Progress + actions */}
      <div className="min-w-[220px]">
        {/* Completion bar — completed cycles / total cycles */}
        <div
          className="mb-2.5 flex items-center gap-2.5"
          aria-label={`${progress.completed} of ${progress.total} cycles complete`}
        >
          <div
            className="flex h-1.5 flex-1 overflow-hidden rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <i
              className="block h-full bg-[var(--pass)] transition-[width] duration-[320ms]"
              style={{ width: `${completedPct.toFixed(1)}%` }}
            />
          </div>
          <span className="whitespace-nowrap font-mono text-[11px] text-[var(--fg-muted)] tabular-nums">
            {progress.completed}
            <span className="opacity-50">/{progress.total}</span>
          </span>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <Link
            to="/projects/$projectId/plans/$planId"
            params={{ projectId, planId: plan.id }}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-md)] border border-transparent bg-transparent px-3 text-[13px] font-medium text-[var(--fg-muted)] transition-[background,color] hover:bg-white/[0.04] hover:text-foreground"
          >
            Open
          </Link>
          <button
            className="grid size-7 place-items-center rounded-[var(--radius-md)] text-[var(--fg-subtle)] transition-[background,color] hover:bg-[var(--fail-soft)] hover:text-[#fca5a5]"
            onClick={onDelete}
            aria-label={`Delete ${plan.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
