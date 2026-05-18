export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function downloadCsv(filename: string, text: string): void {
  // UTF-8 BOM so Excel opens it correctly.
  const blob = new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportCycleCsv(cycleId: string): Promise<void> {
  const [cycle, assignments] = await Promise.all([
    window.api.cycles.get(cycleId),
    window.api.assignments.list(cycleId)
  ])
  if (!cycle) throw new Error('Cycle not found')

  const headers = ['Cycle', 'Environment', 'Case ID', 'Case Name', 'Status', 'Notes', 'Executed At']
  const rows = assignments.map((a) => [
    cycle.display_id,
    cycle.environment,
    a.test_case_display_id,
    a.test_case_name,
    a.status,
    a.notes ?? '',
    a.executed_at ?? ''
  ])
  const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
  downloadCsv(`${cycle.display_id}-report.csv`, csv)
}
