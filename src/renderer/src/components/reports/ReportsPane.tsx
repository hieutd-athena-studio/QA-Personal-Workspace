import { useLayoutEffect, useRef, useState } from 'react'
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
import { useCycleProgress } from '@renderer/hooks/useAssignments'
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

function SingleCycleReport({ projectId }: Props): React.JSX.Element {
  const { data: cycles } = useTestCyclesForProject(projectId)
  const { data: plans } = useTestPlans(projectId)
  const [cycleId, setCycleId] = useState<string>('')
  const { data: progress } = useCycleProgress(cycleId || undefined)

  const selectedCycle = (cycles ?? []).find((c) => c.id === cycleId)
  const selectedPlan = (plans ?? []).find((p) => p.id === selectedCycle?.plan_id)

  const p = progress
  const total = p?.total ?? 0
  const pct = (n: number): number => (total === 0 ? 0 : Math.round((n / total) * 100))

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
      <div className="mt-0.5 text-[11.5px] text-[var(--fg-subtle)]">{sub}</div>
    </div>
  )
}
