import { csvEscape, downloadCsv } from './export-csv'
import type { AssignmentRow } from '@shared/types/api'
import type { AssignmentStatus } from '@shared/types/assignments'
import type { TestCycle } from '@shared/types/test_cycles'

export interface CycleSummary {
  total: number
  pass: number
  fail: number
  blocked: number
  unexecuted: number
}

export interface MultiCycleExportData {
  cycles: TestCycle[]
  assignmentsByCycle: Map<string, AssignmentRow[]>
}

interface RowEntry {
  caseDisplayId: string
  caseName: string
  statuses: Map<string, AssignmentStatus | ''>
}

export function buildMultiCycleRows(data: MultiCycleExportData): RowEntry[] {
  const rowMap = new Map<string, RowEntry>()
  for (const cycle of data.cycles) {
    const assignments = data.assignmentsByCycle.get(cycle.id) ?? []
    for (const a of assignments) {
      const existing = rowMap.get(a.test_case_id)
      if (existing) {
        existing.statuses.set(cycle.id, a.status)
      } else {
        const statuses = new Map<string, AssignmentStatus | ''>()
        statuses.set(cycle.id, a.status)
        rowMap.set(a.test_case_id, {
          caseDisplayId: a.test_case_display_id,
          caseName: a.test_case_name,
          statuses
        })
      }
    }
  }
  return Array.from(rowMap.values()).sort((a, b) => a.caseDisplayId.localeCompare(b.caseDisplayId))
}

export function summarizeCycle(rows: AssignmentRow[]): CycleSummary {
  const summary: CycleSummary = { total: 0, pass: 0, fail: 0, blocked: 0, unexecuted: 0 }
  for (const r of rows) {
    summary.total++
    if (r.status === 'Pass') summary.pass++
    else if (r.status === 'Fail') summary.fail++
    else if (r.status === 'Blocked') summary.blocked++
    else if (r.status === 'Unexecuted') summary.unexecuted++
  }
  return summary
}

function buildCsv(data: MultiCycleExportData): string {
  const rows = buildMultiCycleRows(data)
  const headers = [
    'Case ID',
    'Case Name',
    ...data.cycles.map((c) => `${c.display_id} (${c.environment})`)
  ]
  const lines: string[] = [headers.map(csvEscape).join(',')]
  for (const row of rows) {
    const cells: Array<string | number> = [row.caseDisplayId, row.caseName]
    for (const cycle of data.cycles) {
      cells.push(row.statuses.get(cycle.id) ?? '')
    }
    lines.push(cells.map(csvEscape).join(','))
  }
  lines.push('')
  lines.push('Summary')
  lines.push(
    ['Cycle', 'Environment', 'Total', 'Pass', 'Fail', 'Blocked', 'Unexecuted']
      .map(csvEscape)
      .join(',')
  )
  for (const cycle of data.cycles) {
    const assignments = data.assignmentsByCycle.get(cycle.id) ?? []
    const summary = summarizeCycle(assignments)
    lines.push(
      [
        cycle.display_id,
        cycle.environment,
        summary.total,
        summary.pass,
        summary.fail,
        summary.blocked,
        summary.unexecuted
      ]
        .map(csvEscape)
        .join(',')
    )
  }
  return lines.join('\r\n')
}

export async function exportMultiCycleCsv(cycleIds: string[]): Promise<void> {
  if (cycleIds.length === 0) throw new Error('No cycles selected')

  const cycles: TestCycle[] = []
  for (const id of cycleIds) {
    const c = await window.api.cycles.get(id)
    if (c) cycles.push(c)
  }
  if (cycles.length === 0) throw new Error('No matching cycles found')

  const assignmentsByCycle = new Map<string, AssignmentRow[]>()
  for (const c of cycles) {
    const rows = await window.api.assignments.list(c.id)
    assignmentsByCycle.set(c.id, rows)
  }

  const csv = buildCsv({ cycles, assignmentsByCycle })
  const dateStamp = new Date().toISOString().slice(0, 10)
  downloadCsv(`multi-cycle-report-${dateStamp}.csv`, csv)
}
