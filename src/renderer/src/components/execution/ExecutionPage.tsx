/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Flag,
  Search,
  MoreHorizontal,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { useTestCycle } from '@renderer/hooks/useTestCycles'
import { useTestPlan } from '@renderer/hooks/useTestPlans'
import {
  useAssignments,
  useCycleProgress,
  useSetAssignmentStatus,
  useUpdateAssignment
} from '@renderer/hooks/useAssignments'
import { useTestCase } from '@renderer/hooks/useTestCases'
import type { AssignmentRow } from '@shared/types/api'
import type { AssignmentStatus } from '@shared/types/assignments'

type FilterMode = 'all' | 'unexec' | 'failing'

interface Props {
  cycleId: string
}

// ── richText — render inline `code` markers ──────────────────────
function richText(s: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let i = 0
  const re = /`([^`]+)`/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) {
    if (m.index > i) parts.push(s.slice(i, m.index))
    parts.push(
      <code
        key={parts.length}
        className="font-mono text-[12.5px] text-foreground bg-white/5 border border-[var(--border)] rounded px-1 py-px"
      >
        {m[1]}
      </code>
    )
    i = m.index + m[0].length
  }
  if (i < s.length) parts.push(s.slice(i))
  return parts
}

// ── Status dot ────────────────────────────────────────────────────
function StatusDot({
  status,
  pulsing
}: {
  status: AssignmentStatus
  pulsing?: boolean
}): React.JSX.Element {
  const flashVar =
    status === 'Pass'
      ? 'var(--pass-flash)'
      : status === 'Fail'
        ? 'var(--fail-flash)'
        : status === 'Blocked'
          ? 'var(--blocked-flash)'
          : 'transparent'

  const dotClass =
    status === 'Pass'
      ? 'bg-[var(--pass)]'
      : status === 'Fail'
        ? 'bg-[var(--fail)]'
        : status === 'Blocked'
          ? 'bg-[var(--blocked)]'
          : 'bg-transparent shadow-[inset_0_0_0_1.5px_var(--unexec)]'

  return (
    <span
      className={[
        'block h-2 w-2 rounded-full shrink-0 flex-none',
        dotClass,
        pulsing ? 'anim-dot-pulse' : ''
      ].join(' ')}
      style={{ '--flash': flashVar } as React.CSSProperties}
      aria-hidden="true"
    />
  )
}

// ── ExecutionPage ─────────────────────────────────────────────────
export function ExecutionPage({ cycleId }: Props): React.JSX.Element {
  const { data: cycle } = useTestCycle(cycleId)
  const { data: plan } = useTestPlan(cycle?.plan_id)
  const { data: assignments } = useAssignments(cycleId)
  useCycleProgress(cycleId) // keep query warm for sidebar legend counts

  const setStatus = useSetAssignmentStatus(cycleId)
  const updateAssignment = useUpdateAssignment(cycleId)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [pulsingDotId, setPulsingDotId] = useState<string | null>(null)
  const [flashRowId, setFlashRowId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [savedNoteAt, setSavedNoteAt] = useState<number | null>(null)
  const [noteSaveKey, setNoteSaveKey] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement>(null)

  // ── Sorted assignments ─────────────────────────────────────────
  const sorted = useMemo(
    () =>
      (assignments ?? [])
        .slice()
        .sort((a, b) => a.test_case_display_id.localeCompare(b.test_case_display_id)),
    [assignments]
  )

  // Seed active on first load
  useEffect(() => {
    if (sorted.length > 0 && activeId === null) {
      setActiveId(sorted[0].id)
    }
  }, [sorted, activeId])

  // ── Filtered list ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filter === 'unexec') return sorted.filter((a) => a.status === 'Unexecuted')
    if (filter === 'failing')
      return sorted.filter((a) => a.status === 'Fail' || a.status === 'Blocked')
    return sorted
  }, [sorted, filter])

  const active = filtered.find((a) => a.id === activeId) ?? filtered[0] ?? null
  const activeIdx = filtered.findIndex((a) => a.id === (active?.id ?? ''))
  const fullIdx = sorted.findIndex((a) => a.id === (active?.id ?? ''))

  // Active case data
  const { data: activeCase } = useTestCase(active?.test_case_id)

  // ── Notes draft init ───────────────────────────────────────────
  useEffect(() => {
    if (!active) return
    if (!(active.id in notesDraft)) {
      setNotesDraft((d) => ({ ...d, [active.id]: active.notes ?? '' }))
    }
  }, [active?.id])

  // ── Notes auto-save indicator ─────────────────────────────────
  const notesValue = active ? (notesDraft[active.id] ?? active.notes ?? '') : ''

  useEffect(() => {
    if (!active) return
    if (!(active.id in notesDraft)) return
    const t = setTimeout(() => {
      setSavedNoteAt(Date.now())
      setNoteSaveKey(active.id)
      // Clear indicator after animation
      setTimeout(() => setSavedNoteAt(null), 2600)
    }, 600)
    return () => clearTimeout(t)
  }, [notesValue, active?.id])

  // ── Scroll active row into view ────────────────────────────────
  useEffect(() => {
    if (!active) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-id="${active.id}"]`)
    if (!node || !listRef.current) return
    const rect = node.getBoundingClientRect()
    const parent = listRef.current.getBoundingClientRect()
    if (rect.top < parent.top + 20 || rect.bottom > parent.bottom - 20) {
      node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [active?.id])

  // ── Status counts ──────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { Pass: 0, Fail: 0, Blocked: 0, Unexecuted: 0 }
    sorted.forEach((a) => {
      if (a.status in c) c[a.status as AssignmentStatus]++
    })
    return c
  }, [sorted])

  const total = sorted.length
  const done = counts.Pass + counts.Fail + counts.Blocked
  const pct = (n: number): string => (total === 0 ? '0' : `${((n / total) * 100).toFixed(1)}`)

  // ── Apply status ───────────────────────────────────────────────
  const applyStatus = useCallback(
    (status: AssignmentStatus): void => {
      if (!active) return
      setStatus.mutate(
        { id: active.id, status, notes: notesDraft[active.id] ?? null },
        { onError: (e) => toast.error(e.message) }
      )
      setPulsingDotId(active.id)
      setTimeout(() => setPulsingDotId(null), 320)

      // Advance to next
      const idxInFiltered = filtered.findIndex((a) => a.id === active.id)
      const next = filtered[idxInFiltered + 1] ?? filtered[idxInFiltered - 1] ?? null
      if (next && next.id !== active.id) {
        setTimeout(() => {
          setActiveId(next.id)
          setFlashRowId(next.id)
          setTimeout(() => setFlashRowId(null), 500)
        }, 140)
      }
    },
    [active, filtered, notesDraft, setStatus]
  )

  // ── Navigate ───────────────────────────────────────────────────
  const nav = useCallback(
    (delta: number): void => {
      if (filtered.length === 0) return
      const i = filtered.findIndex((a) => a.id === (active?.id ?? ''))
      const ni = Math.max(0, Math.min(filtered.length - 1, i + delta))
      setActiveId(filtered[ni].id)
    },
    [filtered, active?.id]
  )

  // ── Jump to next failed ────────────────────────────────────────
  const jumpToNextFailed = useCallback((): void => {
    if (sorted.length === 0) return
    const start = sorted.findIndex((a) => a.id === (active?.id ?? ''))
    for (let off = 1; off <= sorted.length; off++) {
      const k = (start + off) % sorted.length
      if (sorted[k].status === 'Fail') {
        setActiveId(sorted[k].id)
        return
      }
    }
  }, [sorted, active?.id])

  // Expose for command palette
  useEffect(() => {
    ;(window as Window & { __jumpToNextFailed?: () => void }).__jumpToNextFailed = jumpToNextFailed
  }, [jumpToNextFailed])

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault()
          applyStatus('Pass')
          break
        case 'f':
          e.preventDefault()
          applyStatus('Fail')
          break
        case 'b':
          e.preventDefault()
          applyStatus('Blocked')
          break
        case 'u':
          e.preventDefault()
          applyStatus('Unexecuted')
          break
        case 'arrowdown':
        case 'arrowright':
          e.preventDefault()
          nav(1)
          break
        case 'arrowup':
        case 'arrowleft':
          e.preventDefault()
          nav(-1)
          break
        case 'n':
          e.preventDefault()
          jumpToNextFailed()
          break
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [applyStatus, nav, jumpToNextFailed])

  // ── Notes save on blur ─────────────────────────────────────────
  const saveNotes = (): void => {
    if (!active) return
    updateAssignment.mutate({ id: active.id, patch: { notes: notesDraft[active.id] ?? null } })
  }

  // ── Loading / empty states ─────────────────────────────────────
  if (!cycle) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-64 animate-pulse rounded bg-[var(--surface-3)]" />
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="overflow-y-auto py-10 px-6">
        <Link
          to="/projects/$projectId/plans/$planId"
          params={{ projectId: plan?.project_id ?? '', planId: cycle.plan_id }}
          className="mb-4 inline-flex items-center gap-1 text-[12px] text-[var(--fg-subtle)] hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" /> Back to plan
        </Link>
        <h1 className="text-[22px] font-semibold">{cycle.name}</h1>
        <p className="mt-4 text-[13px] text-[var(--fg-muted)]">
          No assignments yet. Use &quot;Manage cases&quot; on the cycle to add some.
        </p>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────
  return (
    <div
      className="flex flex-1 min-h-0"
      style={{ display: 'grid', gridTemplateColumns: '320px 1fr' }}
    >
      {/* ═══════════════════ SIDEBAR ═══════════════════════════════ */}
      <aside className="flex flex-col min-h-0 border-r border-[var(--border)] bg-[rgba(255,255,255,0.015)]">
        {/* Head */}
        <div className="shrink-0 border-b border-[var(--border)] px-4 py-3">
          {/* Back link */}
          <Link
            to="/projects/$projectId/plans/$planId"
            params={{ projectId: plan?.project_id ?? '', planId: cycle.plan_id }}
            className="mb-2 inline-flex items-center gap-1 text-[11px] text-[var(--fg-subtle)] hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3" /> Back to plan
          </Link>
          {/* Cycle name */}
          <div className="text-[13px] font-semibold text-foreground tracking-[-0.005em] mb-1.5 truncate">
            {cycle.name}
          </div>
          {/* Meta */}
          <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--fg-subtle)] mb-3.5 overflow-hidden">
            <span className="font-mono text-[var(--fg-muted)]">{cycle.display_id}</span>
            <span className="text-[var(--fg-faint)]">·</span>
            <span className="font-mono truncate">{cycle.environment}</span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2.5" aria-label={`${done} of ${total} executed`}>
            <div className="flex flex-1 h-1.5 rounded-full overflow-hidden bg-white/5">
              <i
                className="block h-full bg-[var(--pass)] transition-[width_var(--duration-slow)]"
                style={{ width: `${pct(counts.Pass)}%` }}
              />
              <i
                className="block h-full bg-[var(--fail)] transition-[width_var(--duration-slow)]"
                style={{ width: `${pct(counts.Fail)}%` }}
              />
              <i
                className="block h-full bg-[var(--blocked)] transition-[width_var(--duration-slow)]"
                style={{ width: `${pct(counts.Blocked)}%` }}
              />
            </div>
            <span className="font-mono text-[11.5px] text-[var(--fg-muted)] tabular-nums">
              {done}
              <span className="opacity-50">/{total}</span>
            </span>
          </div>

          {/* Legend */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {(
              [
                { label: 'Pass', count: counts.Pass, dot: 'bg-[var(--pass)]' },
                { label: 'Fail', count: counts.Fail, dot: 'bg-[var(--fail)]' },
                { label: 'Blkd', count: counts.Blocked, dot: 'bg-[var(--blocked)]' },
                {
                  label: 'Open',
                  count: counts.Unexecuted,
                  dot: 'bg-transparent shadow-[inset_0_0_0_1.5px_var(--unexec)]'
                }
              ] as const
            ).map(({ label, count, dot }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-[10.5px] text-[var(--fg-subtle)]"
              >
                <span className={['block h-[7px] w-[7px] rounded-full shrink-0', dot].join(' ')} />
                {label}
                <span className="font-mono text-foreground ml-0.5 tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div
          className="shrink-0 flex gap-1 border-b border-[var(--border)] px-3 py-2.5"
          role="tablist"
        >
          {(
            [
              { id: 'all', label: 'All', count: total },
              { id: 'unexec', label: 'Open', count: counts.Unexecuted },
              { id: 'failing', label: 'Issues', count: counts.Fail + counts.Blocked }
            ] as const
          ).map(({ id, label, count }) => (
            <button
              key={id}
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={[
                'flex flex-1 items-center justify-center gap-1.5 h-6 rounded-md text-[11.5px] transition-colors border',
                filter === id
                  ? 'bg-white/[0.06] border-[var(--border-strong)] text-foreground'
                  : 'border-transparent bg-transparent text-[var(--fg-muted)] hover:bg-white/[0.04] hover:text-foreground'
              ].join(' ')}
            >
              {label}
              <span className="font-mono text-[10.5px] opacity-60">{count}</span>
            </button>
          ))}
        </div>

        {/* Assignment rows */}
        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-thin py-1.5">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-[12.5px] text-[var(--fg-subtle)]">
              No cases match this filter.
            </div>
          )}
          {filtered.map((a) => {
            const isActive = a.id === active?.id
            const isFlashing = flashRowId === a.id
            return (
              <div
                key={a.id}
                data-id={a.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveId(a.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveId(a.id)}
                className={[
                  'relative grid items-center gap-2.5 px-4 py-2 cursor-pointer transition-colors border-l-[3px]',
                  isActive
                    ? 'bg-[var(--accent-soft)] border-l-[hsl(var(--primary))]'
                    : 'border-l-transparent hover:bg-white/[0.03]',
                  isFlashing ? 'anim-outline-pulse' : ''
                ].join(' ')}
                style={{ gridTemplateColumns: 'auto auto 1fr auto' }}
              >
                <StatusDot status={a.status} pulsing={pulsingDotId === a.id} />
                <span
                  className={[
                    'font-mono text-[11px] whitespace-nowrap',
                    isActive ? 'text-[var(--fg-muted)]' : 'text-[var(--fg-subtle)]'
                  ].join(' ')}
                >
                  {a.test_case_display_id}
                </span>
                <span
                  className={[
                    'text-[12.5px] truncate leading-[1.4]',
                    isActive ? 'text-foreground font-medium' : 'text-[var(--fg-muted)]'
                  ].join(' ')}
                >
                  {a.test_case_name}
                </span>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex gap-1.5 border-t border-[var(--border)] px-3 py-2.5">
          <button
            type="button"
            onClick={jumpToNextFailed}
            className="flex flex-1 items-center gap-1.5 h-8 px-2.5 rounded-md border border-[var(--border)] bg-white/[0.03] text-[11.5px] text-[var(--fg-muted)] hover:bg-white/[0.06] hover:text-foreground transition-colors"
          >
            <Flag className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left leading-none">Next failed</span>
            <span className="kbd shrink-0">N</span>
          </button>
          <button
            type="button"
            className="flex flex-1 items-center gap-1.5 h-8 px-2.5 rounded-md border border-[var(--border)] bg-white/[0.03] text-[11.5px] text-[var(--fg-muted)] hover:bg-white/[0.06] hover:text-foreground transition-colors"
          >
            <Search className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left leading-none">Jump…</span>
            <span className="flex shrink-0 items-center gap-0.5" aria-hidden="true">
              <span className="kbd">⌘</span>
              <span className="kbd">K</span>
            </span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════ MAIN PANE ═════════════════════════════ */}
      <section className="flex flex-col min-w-0 min-h-0 bg-background">
        {/* Case head */}
        {active && (
          <div className="shrink-0 flex flex-col gap-2.5 border-b border-[var(--border)] px-8 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[12px] text-[var(--fg-subtle)]">
              {activeCase && (
                <>
                  <span>{activeCase.description?.slice(0, 0) ?? ''}</span>
                  {/* category breadcrumb not directly available on TestCase — show cycle name */}
                  <span className="text-[var(--fg-faint)]">›</span>
                  <span>{cycle.name}</span>
                </>
              )}
            </div>

            {/* Case name H1 */}
            <h1 className="text-[22px] font-semibold leading-[1.25] tracking-[-0.015em] text-foreground text-wrap-pretty">
              {active.test_case_name}
            </h1>

            {/* Subline */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* ID pill */}
              <span className="inline-flex items-center h-6 px-2.5 rounded-[5px] bg-[var(--accent-soft)] border border-[rgba(139,92,246,0.18)] font-mono text-[11.5px] font-medium text-[#c4b5fd]">
                {active.test_case_display_id}
              </span>
              {/* Version pill */}
              {activeCase && (
                <span className="inline-flex items-center h-5 px-2.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[11px] text-[var(--fg-muted)]">
                  v{activeCase.version}
                </span>
              )}
              {/* Last run */}
              <span className="flex items-center gap-2 text-[11.5px] text-[var(--fg-subtle)]">
                <span className="text-[var(--fg-faint)]">·</span>
                <span>
                  {active.executed_at
                    ? `Last run ${new Date(active.executed_at).toLocaleDateString()}`
                    : 'Unexecuted'}
                </span>
                {/* Notes saved fade indicator */}
                {savedNoteAt !== null && noteSaveKey === active.id && (
                  <span
                    className="inline-flex items-center gap-1.5 anim-saved-fade"
                    key={savedNoteAt}
                  >
                    <span className="block h-1.5 w-1.5 rounded-full bg-[var(--pass)] shadow-[0_0_8px_var(--pass)] opacity-70" />
                    Notes saved
                  </span>
                )}
              </span>

              {/* More menu (placeholder) */}
              <button
                type="button"
                aria-label="More options"
                className="ml-auto flex size-7 items-center justify-center rounded-md bg-transparent text-[var(--fg-faint)] hover:bg-[var(--surface-3)] hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Case body */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-8 py-5" key={active?.id}>
          {active && activeCase && (
            <div className="anim-case-fade max-w-[920px]">
              {/* Description */}
              {activeCase.description && (
                <div className="mb-7">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--fg-subtle)] flex items-center gap-2">
                    Description
                  </h3>
                  <div className="text-[14px] leading-[1.6] text-[var(--fg-muted)] max-w-[64ch] text-wrap-pretty">
                    {richText(activeCase.description)}
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="mb-7">
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--fg-subtle)] flex items-center gap-2">
                  Steps
                  <span className="font-mono text-[10.5px] text-[var(--fg-faint)] normal-case tracking-normal">
                    {activeCase.steps.length}
                  </span>
                </h3>
                {activeCase.steps.length === 0 ? (
                  <p className="text-[13px] text-[var(--fg-subtle)]">No steps recorded.</p>
                ) : (
                  <div className="flex flex-col gap-px bg-[var(--border)] rounded-lg overflow-hidden max-w-[920px]">
                    {activeCase.steps.map((s, i) => (
                      <div
                        key={s.id}
                        className={[
                          'grid bg-background py-3.5',
                          i % 2 === 0 ? 'bg-white/[0.012]' : 'bg-background'
                        ].join(' ')}
                        style={{ gridTemplateColumns: '36px 1fr 1fr' }}
                      >
                        {/* Step number */}
                        <div className="flex justify-center pt-px">
                          <span className="flex size-[22px] items-center justify-center rounded-full bg-white/[0.04] border border-[var(--border-strong)] font-mono text-[11px] font-medium text-[var(--fg-muted)]">
                            {i + 1}
                          </span>
                        </div>
                        {/* Action */}
                        <div className="pr-4 pl-0">
                          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-faint)]">
                            Action
                          </div>
                          <div className="text-[13.5px] leading-[1.55] text-foreground">
                            {richText(s.action)}
                          </div>
                        </div>
                        {/* Expected */}
                        <div className="border-l border-[var(--border)] pl-4">
                          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-faint)]">
                            Expected
                          </div>
                          <div className="text-[13.5px] leading-[1.55] text-foreground">
                            {richText(s.expected)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expected result card */}
              {activeCase.expected_result && (
                <div className="mb-7">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--fg-subtle)]">
                    Expected result
                  </h3>
                  <div className="flex gap-3 items-start max-w-[920px] rounded-lg border border-[rgba(139,92,246,0.16)] bg-[rgba(139,92,246,0.06)] px-4 py-3.5">
                    <div className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-hover)] mt-0.5">
                      <Check className="size-3" />
                    </div>
                    <div className="text-[13.5px] leading-[1.55] text-foreground">
                      {richText(activeCase.expected_result)}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="mb-6">
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--fg-subtle)]">
                  Notes
                </h3>
                <textarea
                  rows={4}
                  placeholder="Capture observations, env quirks, defect IDs…"
                  value={notesValue}
                  onChange={(e) => setNotesDraft((d) => ({ ...d, [active.id]: e.target.value }))}
                  onBlur={saveNotes}
                  className="w-full max-w-[920px] min-h-24 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3.5 py-3 text-[13.5px] leading-[1.55] text-foreground font-[inherit] resize-y outline-none transition-colors placeholder:text-[var(--fg-faint)] hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)]"
                />
              </div>
            </div>
          )}

          {(!active || !activeCase) && (
            <div className="flex items-center justify-center h-32">
              <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-3)]" />
            </div>
          )}
        </div>

        {/* ── Status bar (sticky bottom) ── */}
        <div className="shrink-0 flex items-center gap-3 border-t border-[var(--border)] bg-white/[0.012] px-8 py-3.5">
          {/* Nav arrows + position */}
          <div className="flex items-center gap-1.5 mr-auto shrink-0">
            <button
              type="button"
              onClick={() => nav(-1)}
              disabled={activeIdx <= 0}
              aria-label="Previous case"
              className="flex size-8 items-center justify-center rounded-md border border-[var(--border)] bg-transparent text-[var(--fg-muted)] hover:bg-white/5 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => nav(1)}
              disabled={activeIdx >= filtered.length - 1}
              aria-label="Next case"
              className="flex size-8 items-center justify-center rounded-md border border-[var(--border)] bg-transparent text-[var(--fg-muted)] hover:bg-white/5 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="font-mono text-[12px] text-[var(--fg-subtle)] px-1 tabular-nums">
              {fullIdx + 1} / {total}
            </div>
          </div>

          {/* Status keys */}
          <div className="flex items-center gap-2 shrink-0">
            {(
              [
                {
                  status: 'Pass' as AssignmentStatus,
                  label: 'Pass',
                  key: 'P',
                  dot: 'bg-[var(--pass)]',
                  active: 'bg-[var(--pass-soft)] border-[rgba(16,185,129,0.4)]'
                },
                {
                  status: 'Fail' as AssignmentStatus,
                  label: 'Fail',
                  key: 'F',
                  dot: 'bg-[var(--fail)]',
                  active: 'bg-[var(--fail-soft)] border-[rgba(239,68,68,0.4)]'
                },
                {
                  status: 'Blocked' as AssignmentStatus,
                  label: 'Blocked',
                  key: 'B',
                  dot: 'bg-[var(--blocked)]',
                  active: 'bg-[var(--blocked-soft)] border-[rgba(245,158,11,0.4)]'
                },
                {
                  status: 'Unexecuted' as AssignmentStatus,
                  label: 'Reset',
                  key: 'U',
                  dot: 'bg-transparent shadow-[inset_0_0_0_1.5px_var(--unexec)]',
                  active: 'bg-[var(--unexec-soft)] border-[var(--border-strong)]'
                }
              ] as const
            ).map(({ status, label, key, dot, active: activeClass }) => {
              const isCurrent = active?.status === status
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => applyStatus(status)}
                  className={[
                    'relative inline-flex items-center gap-2.5 h-9 px-3 rounded-md border font-medium text-[13px] text-foreground cursor-pointer transition-colors active:translate-y-px',
                    isCurrent
                      ? activeClass
                      : 'bg-[var(--surface-2)] border-[var(--border-strong)] hover:bg-[var(--surface-3)]'
                  ].join(' ')}
                >
                  <span className={['block h-[7px] w-[7px] rounded-full', dot].join(' ')} />
                  {label}
                  <span className="font-mono text-[10px] leading-none text-[var(--fg-muted)] bg-white/5 border border-[var(--border-strong)] border-b-white/[0.18] rounded px-1.5 py-[3px]">
                    {key}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export type { AssignmentRow }
