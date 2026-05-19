import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Play, Layers, Sparkles } from 'lucide-react'
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
import { useDeleteTestCycle, useTestCyclesForPlan } from '@renderer/hooks/useTestCycles'
import { useCycleProgress } from '@renderer/hooks/useAssignments'
import { NewCycleDialog } from './NewCycleDialog'
import { ManageAssignmentsDialog } from './ManageAssignmentsDialog'
import type { TestCycle } from '@shared/types/test_cycles'

interface Props {
  projectId: string
  planId: string
}

// Environment pill color map
type EnvClass = 'prod' | 'stage' | 'dev' | 'local'

function envClass(env: string): EnvClass {
  const e = env.toLowerCase()
  if (e.includes('prod')) return 'prod'
  if (e.includes('stag')) return 'stage'
  if (e.includes('dev')) return 'dev'
  return 'local'
}

const ENV_STYLES: Record<EnvClass, string> = {
  prod: 'bg-[var(--env-prod)] text-red-400 border-red-500/20',
  stage: 'bg-[var(--env-stage)] text-amber-400 border-amber-500/20',
  dev: 'bg-[var(--env-dev)] text-blue-400 border-blue-500/20',
  local: 'bg-[var(--env-local)] text-[var(--fg-muted)] border-[var(--border)]'
}

// ── CycleProgressBar ────────────────────────────────────────────
function CycleProgressBar({ cycleId }: { cycleId: string }): React.JSX.Element {
  const { data: progress } = useCycleProgress(cycleId)
  const total = progress?.total ?? 0
  const done = (progress?.pass ?? 0) + (progress?.fail ?? 0) + (progress?.blocked ?? 0)
  const pct = (n: number): string => (total === 0 ? '0' : `${((n / total) * 100).toFixed(1)}`)

  return (
    <div className="flex items-center gap-2.5 mt-2 min-w-[240px]">
      <div className="flex flex-1 h-1.5 rounded-full overflow-hidden bg-white/5">
        <i
          className="block h-full bg-[var(--pass)] transition-[width] duration-300"
          style={{ width: `${pct(progress?.pass ?? 0)}%` }}
        />
        <i
          className="block h-full bg-[var(--fail)] transition-[width] duration-300"
          style={{ width: `${pct(progress?.fail ?? 0)}%` }}
        />
        <i
          className="block h-full bg-[var(--blocked)] transition-[width] duration-300"
          style={{ width: `${pct(progress?.blocked ?? 0)}%` }}
        />
      </div>
      <span className="font-mono text-[11.5px] text-[var(--fg-muted)] tabular-nums whitespace-nowrap">
        {done}/{total}
      </span>
    </div>
  )
}

// ── CycleCard ────────────────────────────────────────────────────
function CycleCard({
  cycle,
  onManage,
  onDelete
}: {
  cycle: TestCycle
  onManage: () => void
  onDelete: () => void
}): React.JSX.Element {
  const ecls = envClass(cycle.environment)
  return (
    <div
      className="grid items-center gap-4 rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-colors"
      style={{ gridTemplateColumns: 'auto 1fr auto' }}
    >
      {/* ID pill */}
      <span className="font-mono text-[11.5px] text-[var(--fg-subtle)] bg-white/[0.03] border border-[var(--border)] rounded px-2 py-0.5 self-start mt-0.5">
        {cycle.display_id}
      </span>

      {/* Body */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="text-[14px] font-medium text-foreground truncate">{cycle.name}</span>
          {/* Environment pill */}
          <span
            className={[
              'inline-flex items-center gap-1.5 h-5 px-2 rounded-full border text-[11px] font-medium shrink-0',
              ENV_STYLES[ecls]
            ].join(' ')}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {cycle.environment}
          </span>
        </div>

        <CycleProgressBar cycleId={cycle.id} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onManage}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border)] bg-transparent text-[12px] text-[var(--fg-muted)] hover:text-foreground hover:bg-[var(--surface-3)] transition-colors"
        >
          <Layers className="size-3.5" />
          Manage cases
        </button>
        <Link
          to="/cycles/$cycleId/execute"
          params={{ cycleId: cycle.id }}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Play className="size-3" />
          Execute
        </Link>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete cycle ${cycle.display_id}`}
          className="inline-flex size-8 items-center justify-center rounded-md bg-transparent border-0 text-[var(--fg-faint)] hover:text-red-300 hover:bg-[var(--fail-soft)] transition-colors"
        >
          <span className="text-[13px]">×</span>
        </button>
      </div>
    </div>
  )
}

// ── TestCyclesPanel ─────────────────────────────────────────────
export function TestCyclesPanel({ projectId, planId }: Props): React.JSX.Element {
  const { data: cycles } = useTestCyclesForPlan(planId)
  const deleteCycle = useDeleteTestCycle(projectId)
  const [newOpen, setNewOpen] = useState(false)
  const [manageId, setManageId] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<TestCycle | null>(null)

  const list = cycles ?? []

  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="flex items-baseline gap-3 mb-3.5">
        <h3 className="text-[14px] font-semibold text-foreground tracking-[-0.005em]">
          Test cycles
        </h3>
        <span className="font-mono text-[11px] text-[var(--fg-faint)]">{list.length}</span>
        <span className="text-[12px] text-[var(--fg-subtle)]">
          Each cycle is one execution of this plan against a specific build.
        </span>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="size-3.5" />
            New cycle
          </button>
        </div>
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <p className="text-sm font-medium text-[var(--fg-subtle)]">No cycles yet</p>
          <p className="mt-1 text-xs text-[var(--fg-faint)]">
            Create a cycle to start executing this plan.
          </p>
        </div>
      )}

      {/* Cycle cards */}
      {list.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {list.map((cycle) => (
            <CycleCard
              key={cycle.id}
              cycle={cycle}
              onManage={() => setManageId(cycle.id)}
              onDelete={() => setConfirmDel(cycle)}
            />
          ))}
        </div>
      )}

      {/* New cycle dialog */}
      <NewCycleDialog
        projectId={projectId}
        planId={planId}
        open={newOpen}
        onOpenChange={setNewOpen}
      />

      {/* Manage assignments dialog */}
      {manageId && (
        <ManageAssignmentsDialog
          projectId={projectId}
          cycleId={manageId}
          open={Boolean(manageId)}
          onOpenChange={(o) => !o && setManageId(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={confirmDel !== null} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this cycle?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-foreground">
                {confirmDel?.display_id} — {confirmDel?.name}
              </strong>{' '}
              will be removed, including all run history. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!confirmDel) return
                deleteCycle.mutate(confirmDel.id, {
                  onSuccess: () => {
                    toast.success(`${confirmDel.display_id} deleted`)
                    setConfirmDel(null)
                  },
                  onError: (e) => toast.error(e.message)
                })
              }}
            >
              Delete cycle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
