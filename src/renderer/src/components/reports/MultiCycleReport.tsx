import { useMemo, useState } from 'react'
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
import { ArrowUpDown, Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@renderer/components/ui/command'
import { cn } from '@renderer/lib/utils'
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

const STATUS_COLOR: Record<AssignmentStatus, string> = {
  Pass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Fail: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Blocked: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Unexecuted: 'bg-muted text-muted-foreground'
}

export function MultiCycleReport({ projectId }: Props): React.JSX.Element {
  const { data: cycles } = useTestCyclesForProject(projectId)
  const { data: plans } = useTestPlans(projectId)
  const [selectedCycleIds, setSelectedCycleIds] = useState<string[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [filter, setFilter] = useState('')

  const cycleList: TestCycle[] = useMemo(() => cycles ?? [], [cycles])
  const selectedCycles = useMemo(
    () => cycleList.filter((c) => selectedCycleIds.includes(c.id)),
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

  const rows: CompareRow[] = useMemo(() => {
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

  const columns = useMemo<ColumnDef<CompareRow>[]>(() => {
    const helper = createColumnHelper<CompareRow>()
    const cols: ColumnDef<CompareRow>[] = [
      helper.accessor('caseDisplayId', {
        header: 'Case ID',
        cell: (info) => (
          <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
        ),
        sortingFn: 'alphanumeric'
      }) as ColumnDef<CompareRow>,
      helper.accessor('caseName', {
        header: 'Case Name',
        cell: (info) => <span className="truncate">{info.getValue()}</span>
      }) as ColumnDef<CompareRow>
    ]
    for (const cycle of selectedCycles) {
      cols.push(
        helper.accessor((row) => row.statuses[cycle.id] ?? '', {
          id: `cycle:${cycle.id}`,
          header: () => (
            <div className="flex flex-col">
              <span className="font-mono text-xs">{cycle.display_id}</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {cycle.environment}
              </span>
            </div>
          ),
          cell: (info) => {
            const value = info.getValue<AssignmentStatus | ''>()
            if (!value) {
              return <span className="text-muted-foreground">—</span>
            }
            return (
              <span
                className={cn(
                  'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                  STATUS_COLOR[value]
                )}
              >
                {value}
              </span>
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
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
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

  const toggleCycle = (id: string): void => {
    setSelectedCycleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
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
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="size-5 text-muted-foreground" />
            <h3 className="font-medium">Compare cycles</h3>
            {selectedCycleIds.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedCycleIds.length} selected
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <div className="rounded-md border">
              <Command shouldFilter>
                <CommandInput placeholder="Search cycles…" />
                <CommandList className="max-h-72">
                  {cycleList.length === 0 ? (
                    <CommandEmpty>No cycles.</CommandEmpty>
                  ) : (
                    <CommandGroup heading="Cycles">
                      {cycleList.map((cycle) => {
                        const plan = (plans ?? []).find((p) => p.id === cycle.plan_id)
                        const checked = selectedCycleIds.includes(cycle.id)
                        return (
                          <CommandItem
                            key={cycle.id}
                            value={`${cycle.display_id} ${cycle.name} ${plan?.display_id ?? ''}`}
                            onSelect={() => toggleCycle(cycle.id)}
                          >
                            <label className="flex w-full items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCycle(cycle.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="size-4 shrink-0 rounded border-input"
                                aria-label={`Include ${cycle.display_id}`}
                              />
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {cycle.display_id}
                                  </span>{' '}
                                  {cycle.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {plan?.display_id ?? '—'} · {cycle.environment}
                                </span>
                              </span>
                            </label>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter test cases…"
                  className="max-w-sm"
                />
                <Button onClick={handleExport} disabled={selectedCycleIds.length === 0}>
                  <Download className="mr-2 size-4" /> Export CSV
                </Button>
              </div>

              {selectedCycleIds.length === 0 ? (
                <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Pick one or more cycles to compare.
                </p>
              ) : isLoading ? (
                <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Loading assignments…
                </p>
              ) : rows.length === 0 ? (
                <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No test cases assigned to the selected cycles.
                </p>
              ) : (
                <CompareTable table={table} columnCount={columns.length} />
              )}

              {summaries.length > 0 && <SummaryTable summaries={summaries} />}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CompareTable({
  table,
  columnCount
}: {
  table: ReturnType<typeof useReactTable<CompareRow>>
  columnCount: number
}): React.JSX.Element {
  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortable = header.column.getCanSort()
                return (
                  <th
                    key={header.id}
                    className="border-b px-3 py-2 text-left align-bottom font-medium"
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-left hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="size-3 text-muted-foreground" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columnCount}
                className="px-3 py-6 text-center text-sm text-muted-foreground"
              >
                No matching test cases.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0 hover:bg-accent/30">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function SummaryTable({
  summaries
}: {
  summaries: {
    cycle: TestCycle
    plan: { display_id: string } | undefined
    summary: ReturnType<typeof summarizeCycle>
  }[]
}): React.JSX.Element {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Cycle</th>
            <th className="px-3 py-2 text-left font-medium">Environment</th>
            <th className="px-3 py-2 text-right font-medium">Total</th>
            <th className="px-3 py-2 text-right font-medium text-emerald-700 dark:text-emerald-400">
              Pass
            </th>
            <th className="px-3 py-2 text-right font-medium text-destructive">Fail</th>
            <th className="px-3 py-2 text-right font-medium text-amber-700 dark:text-amber-400">
              Blocked
            </th>
            <th className="px-3 py-2 text-right font-medium">Unexec.</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map(({ cycle, plan, summary }) => (
            <tr key={cycle.id} className="border-t">
              <td className="px-3 py-2">
                <span className="font-mono text-xs text-muted-foreground">{cycle.display_id}</span>
                {plan && (
                  <span className="ml-2 text-xs text-muted-foreground">({plan.display_id})</span>
                )}
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{cycle.environment}</td>
              <td className="px-3 py-2 text-right">{summary.total}</td>
              <td className="px-3 py-2 text-right text-emerald-700 dark:text-emerald-400">
                {summary.pass}
              </td>
              <td className="px-3 py-2 text-right text-destructive">{summary.fail}</td>
              <td className="px-3 py-2 text-right text-amber-700 dark:text-amber-400">
                {summary.blocked}
              </td>
              <td className="px-3 py-2 text-right text-muted-foreground">{summary.unexecuted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
