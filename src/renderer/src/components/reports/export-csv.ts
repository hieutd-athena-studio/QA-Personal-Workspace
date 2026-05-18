import ExcelJS from 'exceljs'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function exportCycleCsv(cycleId: string): Promise<void> {
  const [cycle, assignments] = await Promise.all([
    window.api.cycles.get(cycleId),
    window.api.assignments.list(cycleId)
  ])
  if (!cycle) throw new Error('Cycle not found')

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Cycle')

  ws.columns = [
    { header: 'Cycle', key: 'cycle' },
    { header: 'Environment', key: 'env' },
    { header: 'Case ID', key: 'case_id' },
    { header: 'Case Name', key: 'name' },
    { header: 'Status', key: 'status' },
    { header: 'Notes', key: 'notes' },
    { header: 'Executed At', key: 'executed_at' }
  ]

  for (const a of assignments) {
    ws.addRow({
      cycle: cycle.display_id,
      env: cycle.environment,
      case_id: a.test_case_display_id,
      name: a.test_case_name,
      status: a.status,
      notes: a.notes ?? '',
      executed_at: a.executed_at ?? ''
    })
  }

  const buffer = await wb.csv.writeBuffer()
  // exceljs csv writeBuffer returns Buffer in Node, string-like in browser; coerce to Uint8Array.
  let csvText: string
  if (typeof buffer === 'string') csvText = buffer
  else if (buffer instanceof Uint8Array) csvText = new TextDecoder().decode(buffer)
  else csvText = String(buffer)

  if (!csvText || csvText.length === 0) {
    csvText = [
      ['Cycle', 'Environment', 'Case ID', 'Case Name', 'Status', 'Notes', 'Executed At']
        .map(csvEscape)
        .join(','),
      ...assignments.map((a) =>
        [
          cycle.display_id,
          cycle.environment,
          a.test_case_display_id,
          a.test_case_name,
          a.status,
          a.notes ?? '',
          a.executed_at ?? ''
        ]
          .map(csvEscape)
          .join(',')
      )
    ].join('\n')
  }

  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${cycle.display_id}-report.csv`
  a.click()
  URL.revokeObjectURL(url)
}
