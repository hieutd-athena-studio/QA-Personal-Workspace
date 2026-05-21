import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { useTestCyclesForProject } from '@renderer/hooks/useTestCycles'
import { useTestPlans } from '@renderer/hooks/useTestPlans'
import { useAssignments, useCycleProgress } from '@renderer/hooks/useAssignments'
import type { AssignmentStatus } from '@shared/types/assignments'
import { exportCycleCsv } from './export-csv'
import { MultiCycleReport } from './MultiCycleReport'

interface Props {
  projectId: string
}

type ReportView = 'single' | 'compare'
const VIEWS: { key: ReportView; label: string }[] = [
  { key: 'single', label: 'Single cycle' },
  { key: 'compare', label: 'Compare cycles' }
]

// Segmented pill tab (thumb-style)
function RepSegments({
  value,
  options,
  onChange
}: {
  value: string
  options: { key: string; label: string }[]
  onChange: (k: string) => void
}): React.JSX.Element {
  const barRef = useRef<HTMLDivElement>(null)
  const [ind, setInd] = useState({ left: 2, width: 0 })

  const measure = (): void => {
    const btn = barRef.current?.querySelector<HTMLElement>(`[data-segkey="${value}"]`)
    if (!btn || !barRef.current) return
    const parent = barRef.current.getBoundingClientRect()
    const r = btn.getBoundingClientRect()
    setInd({ left: r.left - parent.left, width: r.width })
  }

  useLayoutEffect(() => {
    measure()
  }, [value])

  return (
    <div
      ref={barRef}
      className="relative inline-flex gap-px rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)] p-0.5"
    >
      {/* sliding thumb */}
      <span
        className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-[5px]"
        style={{
          left: ind.left,
          width: ind.width,
          background: 'rgba(255,255,255,0.08)',
          transition: 'left 200ms var(--ease-out-back), width 200ms var(--ease-out-back)'
        }}
        aria-hidden="true"
      />
      {options.map((o) => (
        <button
          key={o.key}
          data-segkey={o.key}
          className={[
            'relative z-[1] rounded-[5px] border-0 bg-transparent px-3.5 py-1.5 text-[12.5px] font-medium transition-colors duration-[120ms] cursor-pointer',
            value === o.key ? 'text-foreground' : 'text-[var(--fg-muted)] hover:text-foreground'
          ].join(' ')}
          onClick={() => onChange(o.key)}
          role="radio"
          aria-checked={value === o.key}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ReportsPane({ projectId }: Props): React.JSX.Element {
  const [view, setView] = useState<ReportView>('single')

  return (
    <div className="space-y-4">
      <RepSegments value={view} options={VIEWS} onChange={(k) => setView(k as ReportView)} />
      {view === 'single' ? (
        <SingleCycleReport projectId={projectId} />
      ) : (
        <MultiCycleReport projectId={projectId} />
      )}
    </div>
  )
}

type BreakdownFilter = 'all' | 'Fail' | 'Pass' | 'Blocked'

const STATUS_PRIORITY: Record<AssignmentStatus, number> = {
  Fail: 0,
  Blocked: 1,
  Pass: 2,
  Unexecuted: 3
}

function SingleCycleReport({ projectId }: Props): React.JSX.Element {
  const { data: cycles } = useTestCyclesForProject(projectId)
  const { data: plans } = useTestPlans(projectId)
  const [cycleId, setCycleId] = useState<string>('')
  const { data: progress } = useCycleProgress(cycleId || undefined)
  const { data: assignments } = useAssignments(cycleId || undefined)
  const [breakdownFilter, setBreakdownFilter] = useState<BreakdownFilter>('all')

  const selectedCycle = (cycles ?? []).find((c) => c.id === cycleId)
  const selectedPlan = (plans ?? []).find((p) => p.id === selectedCycle?.plan_id)

  const p = progress
  const total = p?.total ?? 0
  const pct = (n: number): number => (total === 0 ? 0 : Math.round((n / total) * 100))

  const orderedAssignments = useMemo(() => {
    const list = [...(assignments ?? [])]
    list.sort((a, b) => {
      const d = (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9)
      if (d !== 0) return d
      return a.test_case_display_id.localeCompare(b.test_case_display_id)
    })
    if (breakdownFilter === 'all') return list
    return list.filter((a) => a.status === breakdownFilter)
  }, [assignments, breakdownFilter])

  const handleExport = async (): Promise<void> => {
    if (!cycleId) return
    try {
      await exportCycleCsv(cycleId)
      toast.success('CSV exported')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="space-y-5">
      {/* Cycle picker row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
          Cycle
        </span>
        <Select value={cycleId} onValueChange={setCycleId}>
          <SelectTrigger className="h-8 min-w-[280px] rounded-[var(--radius-md)] border-[var(--border)] bg-[var(--surface-1)] text-[13px]">
            <SelectValue placeholder="Pick a cycle…" />
          </SelectTrigger>
          <SelectContent>
            {(cycles ?? []).length === 0 ? (
              <div className="px-2 py-3 text-[13px] text-[var(--fg-muted)]">No cycles.</div>
            ) : (
              (cycles ?? []).map((c) => {
                const plan = (plans ?? []).find((pl) => pl.id === c.plan_id)
                return (
                  <SelectItem key={c.id} value={c.id}>
                    {c.display_id} — {c.name}
                    {plan && ` (${plan.display_id})`}
                  </SelectItem>
                )
              })
            )}
          </SelectContent>
        </Select>
        <span className="flex-1" />
        <button
          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-transparent bg-transparent px-3 text-[13px] font-medium text-[var(--fg-muted)] transition-[background,color] hover:bg-white/[0.04] hover:text-foreground disabled:opacity-40"
          onClick={() => void handleExport()}
          disabled={!cycleId}
        >
          <Download className="size-[13px]" />
          Export CSV
        </button>
      </div>

      {/* 5-stat row */}
      {selectedCycle && (
        <>
          <div
            className="grid gap-7 pb-7"
            style={{
              gridTemplateColumns: 'repeat(5, 1fr)',
              borderBottom: '1px solid var(--border)'
            }}
          >
            <ReportStat
              dot={null}
              label="Total cases"
              value={total}
              pct={null}
              sub="in this cycle"
            />
            <ReportStat
              dot="pass"
              label="Pass"
              value={p?.pass ?? 0}
              pct={pct(p?.pass ?? 0)}
              sub="of total"
            />
            <ReportStat
              dot="fail"
              label="Fail"
              value={p?.fail ?? 0}
              pct={pct(p?.fail ?? 0)}
              sub={
                (p?.fail ?? 0) === 0
                  ? 'no defects'
                  : `${p?.fail ?? 0} defect${(p?.fail ?? 0) === 1 ? '' : 's'}`
              }
            />
            <ReportStat
              dot="blocked"
              label="Blocked"
              value={p?.blocked ?? 0}
              pct={pct(p?.blocked ?? 0)}
              sub="waiting on deps"
            />
            <ReportStat
              dot="unexec"
              label="Unexecuted"
              value={p?.unexecuted ?? 0}
              pct={pct(p?.unexecuted ?? 0)}
              sub={(p?.unexecuted ?? 0) === 0 ? 'complete' : 'remaining'}
            />
          </div>

          {selectedPlan && (
            <p className="text-[12px] text-[var(--fg-subtle)]">
              Plan {selectedPlan.display_id} · Environment {selectedCycle.environment}
            </p>
          )}

          {/* Per-case breakdown */}
          <div>
            <div className="mb-3 flex flex-wrap items-baseline gap-2">
              <h3 className="text-[13px] font-semibold tracking-[-0.005em] text-foreground">
                Per-case breakdown
              </h3>
              <span className="text-[12px] text-[var(--fg-subtle)]">
                Failed and blocked appear first.
              </span>
              <div className="ml-auto">
                <BreakdownFilterTabs
                  value={breakdownFilter}
                  counts={{
                    all: assignments?.length ?? 0,
                    Fail: (assignments ?? []).filter((a) => a.status === 'Fail').length,
                    Pass: (assignments ?? []).filter((a) => a.status === 'Pass').length,
                    Blocked: (assignments ?? []).filter((a) => a.status === 'Blocked').length
                  }}
                  onChange={setBreakdownFilter}
                />
              </div>
            </div>

            {orderedAssignments.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-8 text-center text-[12.5px] text-[var(--fg-muted)]">
                {assignments && assignments.length === 0
                  ? 'No cases assigned to this cycle yet.'
                  : 'No cases match this filter.'}
              </div>
            ) : (
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)]">
                <div
                  className="grid items-center border-b border-[var(--border)] bg-white/[0.02] px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]"
                  style={{ gridTemplateColumns: '88px 1fr 1fr 92px' }}
                >
                  <div>Status</div>
                  <div>ID + name</div>
                  <div>Notes</div>
                  <div className="text-right">Last run</div>
                </div>
                {orderedAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="grid items-center border-t border-[var(--border-soft)] px-3.5 py-2 text-[12.5px] transition-colors hover:bg-white/[0.03]"
                    style={{ gridTemplateColumns: '88px 1fr 1fr 92px' }}
                  >
                    <StatusPill status={a.status} />
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 font-mono text-[11.5px] text-[var(--fg-subtle)]">
                        {a.test_case_display_id}
                      </span>
                      <span className="truncate text-foreground">{a.test_case_name}</span>
                    </div>
                    <div className="truncate text-[var(--fg-muted)]">
                      {a.notes ? a.notes : <span className="text-[var(--fg-faint)]">—</span>}
                    </div>
                    <div className="text-right font-mono text-[11px] text-[var(--fg-subtle)] tabular-nums">
                      {a.executed_at ? new Date(a.executed_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!selectedCycle && (cycles ?? []).length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-10 text-center text-[var(--fg-muted)]">
          <p className="text-[13px]">No cycles in this project yet.</p>
        </div>
      )}

      {!selectedCycle && (cycles ?? []).length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-10 text-center text-[var(--fg-muted)]">
          <p className="text-[13px]">Select a cycle above to view its report.</p>
        </div>
      )}
    </div>
  )
}

function BreakdownFilterTabs({
  value,
  counts,
  onChange
}: {
  value: BreakdownFilter
  counts: { all: number; Fail: number; Pass: number; Blocked: number }
  onChange: (v: BreakdownFilter) => void
}): React.JSX.Element {
  const opts: { key: BreakdownFilter; label: string; dot?: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'Fail', label: 'Failed', dot: 'var(--fail)' },
    { key: 'Blocked', label: 'Blocked', dot: 'var(--blocked)' },
    { key: 'Pass', label: 'Passed', dot: 'var(--pass)' }
  ]
  return (
    <div
      className="inline-flex gap-px rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)] p-0.5"
      role="tablist"
    >
      {opts.map((o) => {
        const active = value === o.key
        const count = counts[o.key]
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className={[
              'inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[12px] font-medium transition-colors duration-[120ms]',
              active
                ? 'bg-white/[0.08] text-foreground'
                : 'bg-transparent text-[var(--fg-muted)] hover:text-foreground'
            ].join(' ')}
          >
            {o.dot && (
              <span
                className="size-1.5 rounded-full"
                style={{ background: o.dot }}
                aria-hidden="true"
              />
            )}
            {o.label}
            <span className="font-mono text-[10.5px] text-[var(--fg-subtle)]">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

function StatusPill({ status }: { status: AssignmentStatus }): React.JSX.Element {
  const cfg: Record<AssignmentStatus, { label: string; dot: string; cls: string }> = {
    Pass: {
      label: 'Pass',
      dot: 'var(--pass)',
      cls: 'border-[rgba(16,185,129,0.3)] bg-[var(--pass-soft)] text-[#34d399]'
    },
    Fail: {
      label: 'Fail',
      dot: 'var(--fail)',
      cls: 'border-[rgba(239,68,68,0.3)] bg-[var(--fail-soft)] text-[#fca5a5]'
    },
    Blocked: {
      label: 'Blocked',
      dot: 'var(--blocked)',
      cls: 'border-[rgba(245,158,11,0.3)] bg-[var(--blocked-soft)] text-[#fcd34d]'
    },
    Unexecuted: {
      label: 'Open',
      dot: 'var(--unexec)',
      cls: 'border-[var(--border)] bg-[var(--unexec-soft)] text-[var(--fg-muted)]'
    }
  }
  const c = cfg[status]
  return (
    <span
      className={[
        'inline-flex h-5 w-fit items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium',
        c.cls
      ].join(' ')}
    >
      <span className="size-1.5 rounded-full" style={{ background: c.dot }} aria-hidden="true" />
      {c.label}
    </span>
  )
}

function ReportStat({
  dot,
  label,
  value,
  pct,
  sub
}: {
  dot: 'pass' | 'fail' | 'blocked' | 'unexec' | null
  label: string
  value: number
  pct: number | null
  sub: string
}): React.JSX.Element {
  const dotColor: Record<string, string> = {
    pass: 'var(--pass)',
    fail: 'var(--fail)',
    blocked: 'var(--blocked)',
    unexec: 'var(--unexec)'
  }

  const lineColor =
    dot === 'pass'
      ? 'var(--pass)'
      : dot === 'fail'
        ? 'var(--fail)'
        : dot === 'blocked'
          ? 'var(--blocked)'
          : dot === 'unexec'
            ? 'var(--unexec)'
            : 'var(--accent)'

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
        {dot && (
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: dotColor[dot] }}
            aria-hidden="true"
          />
        )}
        {label}
      </div>
      <div className="mt-0.5 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums text-foreground">
        {value}
        {pct !== null && (
          <span className="ml-2 text-[14px] font-normal text-[var(--fg-muted)]">{pct}%</span>
        )}
      </div>
      <span
        className="mt-1.5 block h-px w-8 rounded-full"
        style={{ background: lineColor }}
        aria-hidden="true"
      />
      <div className="mt-1.5 text-[11.5px] text-[var(--fg-subtle)]">{sub}</div>
    </div>
  )
}
