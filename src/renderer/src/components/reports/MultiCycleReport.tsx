import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { Download, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { useTestCyclesForProject } from '@renderer/hooks/useTestCycles'
import { useTestPlans } from '@renderer/hooks/useTestPlans'
import type { AssignmentRow } from '@shared/types/api'
import type { AssignmentStatus } from '@shared/types/assignments'
import type { TestCycle } from '@shared/types/test_cycles'
import { exportMultiCycleCsv, summarizeCycle } from './export-multi-cycle-csv'

interface Props {
  projectId: string
}

type CompareRow = {
  caseId: string
  caseDisplayId: string
  caseName: string
  statuses: Record<string, AssignmentStatus | ''>
}

type StatusKey = 'Pass' | 'Fail' | 'Blocked' | 'Unexecuted'

const STATUS_DOT_COLOR: Record<StatusKey, string> = {
  Pass: 'var(--pass)',
  Fail: 'var(--fail)',
  Blocked: 'var(--blocked)',
  Unexecuted: 'var(--unexec)'
}

// Segmented pill (reused from ReportsPane but local here to avoid cross-import issues)
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
            'relative z-[1] rounded-[5px] border-0 bg-transparent px-3 py-1.5 text-[12px] font-medium transition-colors duration-[120ms] cursor-pointer',
            value === o.key ? 'text-foreground' : 'text-[var(--fg-muted)] hover:text-foreground'
          ].join(' ')}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const FILTER_OPTIONS = [
  { key: 'all', label: 'All cases' },
  { key: 'diff', label: 'Differing' },
  { key: 'Fail', label: 'Has failures' },
  { key: 'Blocked', label: 'Has blockers' },
  { key: 'Unexecuted', label: 'Has unexecuted' }
]

export function MultiCycleReport({ projectId }: Props): React.JSX.Element {
  const { data: cycles } = useTestCyclesForProject(projectId)
  const { data: plans } = useTestPlans(projectId)
  const [selectedCycleIds, setSelectedCycleIds] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [sorting, setSorting] = useState<SortingState>([])

  const cycleList: TestCycle[] = useMemo(() => cycles ?? [], [cycles])
  const selectedCycles = useMemo(
    () => cycleList.filter((c) => selectedCycleIds.includes(c.id)),
    [cycleList, selectedCycleIds]
  )
  const remainingCycles = useMemo(
    () => cycleList.filter((c) => !selectedCycleIds.includes(c.id)),
    [cycleList, selectedCycleIds]
  )

  const assignmentQueries = useQueries({
    queries: selectedCycles.map((cycle) => ({
      queryKey: ['assignments', cycle.id],
      queryFn: () => window.api.assignments.list(cycle.id),
      enabled: Boolean(cycle.id)
    }))
  })

  const assignmentsByCycle = useMemo(() => {
    const map = new Map<string, AssignmentRow[]>()
    selectedCycles.forEach((cycle, idx) => {
      const data = assignmentQueries[idx]?.data
      if (data) map.set(cycle.id, data)
    })
    return map
  }, [selectedCycles, assignmentQueries])

  const isLoading = assignmentQueries.some((q) => q.isLoading)

  const allRows: CompareRow[] = useMemo(() => {
    const rowMap = new Map<string, CompareRow>()
    for (const cycle of selectedCycles) {
      const assignments = assignmentsByCycle.get(cycle.id) ?? []
      for (const a of assignments) {
        const existing = rowMap.get(a.test_case_id)
        if (existing) {
          existing.statuses[cycle.id] = a.status
        } else {
          rowMap.set(a.test_case_id, {
            caseId: a.test_case_id,
            caseDisplayId: a.test_case_display_id,
            caseName: a.test_case_name,
            statuses: { [cycle.id]: a.status }
          })
        }
      }
    }
    return Array.from(rowMap.values())
  }, [selectedCycles, assignmentsByCycle])

  // Apply status filter
  const rows: CompareRow[] = useMemo(() => {
    if (statusFilter === 'all') return allRows
    if (statusFilter === 'diff') {
      return allRows.filter((r) => {
        const statuses = selectedCycles.map((c) => r.statuses[c.id])
        return new Set(statuses).size > 1
      })
    }
    return allRows.filter((r) => selectedCycles.some((c) => r.statuses[c.id] === statusFilter))
  }, [allRows, statusFilter, selectedCycles])

  // Grid template for comparison columns
  const gridTemplate = `2.2fr ${selectedCycles.map(() => 'minmax(60px, 1fr)').join(' ')}`

  const columns = useMemo<ColumnDef<CompareRow>[]>(() => {
    const helper = createColumnHelper<CompareRow>()
    const cols: ColumnDef<CompareRow>[] = [
      helper.accessor('caseDisplayId', {
        header: 'Test case',
        cell: (info) => (
          <div className="flex items-center gap-2.5">
            <span className="shrink-0 font-mono text-[11.5px] text-[var(--fg-subtle)]">
              {info.getValue()}
            </span>
            <span className="truncate text-[12.5px] text-foreground">
              {info.row.original.caseName}
            </span>
          </div>
        ),
        sortingFn: 'alphanumeric'
      }) as ColumnDef<CompareRow>
    ]
    for (const cycle of selectedCycles) {
      cols.push(
        helper.accessor((row) => row.statuses[cycle.id] ?? '', {
          id: `cycle:${cycle.id}`,
          header: () => (
            <div className="text-center font-mono text-[10.5px]">
              {cycle.display_id.split('-').slice(-1)[0]}
            </div>
          ),
          cell: (info) => {
            const value = info.getValue<AssignmentStatus | ''>()
            if (!value) {
              return (
                <div className="flex justify-center">
                  <StatusDot status="Unexecuted" />
                </div>
              )
            }
            return (
              <div className="flex justify-center">
                <StatusDot status={value as StatusKey} />
              </div>
            )
          }
        }) as ColumnDef<CompareRow>
      )
    }
    return cols
  }, [selectedCycles])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  const summaries = useMemo(
    () =>
      selectedCycles.map((cycle) => ({
        cycle,
        plan: (plans ?? []).find((p) => p.id === cycle.plan_id),
        summary: summarizeCycle(assignmentsByCycle.get(cycle.id) ?? [])
      })),
    [selectedCycles, assignmentsByCycle, plans]
  )

  const removeChip = (id: string): void => {
    setSelectedCycleIds((arr) => arr.filter((x) => x !== id))
  }

  const addChip = (id: string): void => {
    setSelectedCycleIds((arr) => [...arr, id])
  }

  const handleExport = async (): Promise<void> => {
    if (selectedCycleIds.length === 0) return
    try {
      await exportMultiCycleCsv(selectedCycleIds)
      toast.success('CSV exported')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Chip bar — selected cycles + add popover */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)] mr-1">
            Cycles
          </span>
          {selectedCycles.map((c) => (
            <span
              key={c.id}
              className="inline-flex h-7 items-center gap-2 rounded-full border border-[rgba(139,92,246,0.22)] bg-[var(--accent-tint)] pl-2.5 pr-1.5 font-mono text-[12px] tracking-[0.02em] text-foreground"
              title={c.name}
            >
              {c.display_id}
              <button
                className="grid size-[18px] place-items-center rounded-full text-[var(--fg-muted)] transition-colors hover:bg-black/30 hover:text-foreground"
                onClick={() => removeChip(c.id)}
                aria-label={`Remove ${c.display_id}`}
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}

          {remainingCycles.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex h-7 items-center gap-1.5 rounded-full border border-dashed border-[var(--border-strong)] px-3 text-[11.5px] text-[var(--fg-muted)] transition-colors hover:bg-white/[0.04] hover:text-foreground">
                  <Plus className="size-3" />
                  Add cycle
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={6}
                className="w-[300px] rounded-[var(--radius-md)] border-[var(--border-strong)] bg-[var(--surface-2)] p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_14px_36px_rgba(0,0,0,0.45)] anim-pop-in"
              >
                <div className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
                  Add to comparison
                </div>
                {remainingCycles.map((c) => {
                  const envClass = c.environment.includes('PROD')
                    ? 'bg-[var(--env-prod)] text-[#fca5a5]'
                    : c.environment.includes('DEV')
                      ? 'bg-[var(--env-dev)] text-blue-300'
                      : 'bg-[var(--env-stage)] text-amber-300'
                  return (
                    <button
                      key={c.id}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-[5px] px-2.5 py-1.5 text-[13px] text-foreground transition-colors hover:bg-white/[0.06]"
                      onClick={() => addChip(c.id)}
                    >
                      <span className="min-w-[76px] font-mono text-[11px] text-[var(--fg-subtle)]">
                        {c.display_id}
                      </span>
                      <span className="flex-1 truncate text-left">{c.name}</span>
                      <span className={`rounded px-1.5 py-px text-[10px] font-medium ${envClass}`}>
                        {c.environment}
                      </span>
                    </button>
                  )
                })}
              </PopoverContent>
            </Popover>
          )}
        </div>

        {selectedCycleIds.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-10 text-center text-[var(--fg-muted)]">
            {cycleList.length === 0 ? (
              <p className="text-[13px]">No cycles in this project yet.</p>
            ) : (
              <p className="text-[13px]">Pick one or more cycles to compare.</p>
            )}
          </div>
        ) : isLoading ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-10 text-center text-[var(--fg-muted)]">
            <p className="text-[13px]">Loading assignments…</p>
          </div>
        ) : (
          <>
            {/* Toolbar: filter segments + export */}
            <div className="flex items-center gap-2">
              <RepSegments
                value={statusFilter}
                options={FILTER_OPTIONS}
                onChange={setStatusFilter}
              />
              <span className="flex-1" />
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-transparent bg-transparent px-3 text-[13px] font-medium text-[var(--fg-muted)] transition-[background,color] hover:bg-white/[0.04] hover:text-foreground"
                onClick={() => void handleExport()}
              >
                <Download className="size-[13px]" />
                Export CSV
              </button>
            </div>

            {/* Comparison grid */}
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)]">
              {/* Header */}
              <div
                className="grid items-center border-b border-[var(--border)] bg-white/[0.02] px-3.5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div>Test case</div>
                {selectedCycles.map((c) => (
                  <div key={c.id} className="text-center" title={c.name}>
                    {c.display_id.split('-').slice(-1)[0]}
                  </div>
                ))}
              </div>

              {rows.length === 0 ? (
                <div className="px-4 py-9 text-center text-[12.5px] text-[var(--fg-subtle)]">
                  No cases match this filter.
                </div>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid items-center border-t border-[var(--border-soft)] px-3.5 py-2.5 transition-colors hover:bg-white/[0.03]"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Cycle summary table */}
            {summaries.length > 0 && (
              <div>
                <div className="mb-3.5 flex items-baseline gap-2">
                  <h3 className="text-[13px] font-semibold text-foreground">Cycle summary</h3>
                  <span className="text-[12px] text-[var(--fg-subtle)]">
                    P/F/B/U mix per cycle, with a stacked-bar visual.
                  </span>
                </div>
                <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)]">
                  {/* Header */}
                  <div
                    className="grid items-center gap-3 border-b border-[var(--border)] bg-white/[0.02] px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]"
                    style={{ gridTemplateColumns: '1fr 80px 80px 80px 80px 240px' }}
                  >
                    <div>Cycle</div>
                    <div className="text-center">Pass</div>
                    <div className="text-center">Fail</div>
                    <div className="text-center">Blocked</div>
                    <div className="text-center">Open</div>
                    <div>Mix</div>
                  </div>
                  {summaries.map(({ cycle, summary }) => {
                    const w = (n: number): number =>
                      summary.total === 0 ? 0 : (n / summary.total) * 100
                    return (
                      <div
                        key={cycle.id}
                        className="grid items-center gap-3 border-t border-[var(--border-soft)] px-4 py-3 text-[12.5px]"
                        style={{ gridTemplateColumns: '1fr 80px 80px 80px 80px 240px' }}
                      >
                        <div className="min-w-0">
                          <span className="mr-2 font-mono text-[11px] text-[var(--fg-subtle)]">
                            {cycle.display_id}
                          </span>
                          <span className="truncate font-medium text-foreground">{cycle.name}</span>
                        </div>
                        <div className="text-center font-mono tabular-nums text-[var(--pass)]">
                          {summary.pass}
                        </div>
                        <div className="text-center font-mono tabular-nums text-[var(--fail)]">
                          {summary.fail}
                        </div>
                        <div className="text-center font-mono tabular-nums text-[var(--blocked)]">
                          {summary.blocked}
                        </div>
                        <div className="text-center font-mono tabular-nums text-foreground">
                          {summary.unexecuted}
                        </div>
                        {/* Stacked mini-bar */}
                        <div
                          className="flex h-1.5 overflow-hidden rounded-full"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          <span
                            style={{
                              width: `${w(summary.pass)}%`,
                              background: 'var(--pass)',
                              height: '100%'
                            }}
                          />
                          <span
                            style={{
                              width: `${w(summary.fail)}%`,
                              background: 'var(--fail)',
                              height: '100%'
                            }}
                          />
                          <span
                            style={{
                              width: `${w(summary.blocked)}%`,
                              background: 'var(--blocked)',
                              height: '100%'
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

function StatusDot({ status }: { status: StatusKey | '' }): React.JSX.Element {
  if (!status) return <span className="size-5" />

  const color = STATUS_DOT_COLOR[status as StatusKey]
  const isUnexec = status === 'Unexecuted'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-grid size-5 place-items-center rounded-full" aria-label={status}>
          <span
            className="size-[9px] rounded-full"
            style={
              isUnexec
                ? { background: 'transparent', boxShadow: `inset 0 0 0 1.5px ${color}` }
                : { background: color }
            }
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className="text-[11px]">{status}</span>
      </TooltipContent>
    </Tooltip>
  )
}
