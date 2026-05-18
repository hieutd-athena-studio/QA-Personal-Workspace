/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, ChevronLeft as Back } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
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

interface Props {
  cycleId: string
}

const STATUS_COLOR: Record<AssignmentStatus, string> = {
  Pass: 'bg-emerald-500',
  Fail: 'bg-red-500',
  Blocked: 'bg-amber-500',
  Unexecuted: 'bg-muted'
}

export function ExecutionPage({ cycleId }: Props): React.JSX.Element {
  const { data: cycle } = useTestCycle(cycleId)
  const { data: plan } = useTestPlan(cycle?.plan_id)
  const { data: assignments } = useAssignments(cycleId)
  const { data: progress } = useCycleProgress(cycleId)

  const [activeIdx, setActiveIdx] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const activeRowRef = useRef<HTMLLIElement>(null)
  const setStatus = useSetAssignmentStatus(cycleId)
  const updateAssignment = useUpdateAssignment(cycleId)

  const sorted = useMemo(
    () =>
      (assignments ?? [])
        .slice()
        .sort((a, b) => a.test_case_display_id.localeCompare(b.test_case_display_id)),
    [assignments]
  )

  const active = sorted[activeIdx]
  const { data: activeCase } = useTestCase(active?.test_case_id)
  const [notesDraft, setNotesDraft] = useState('')

  useEffect(() => {
    setNotesDraft(active?.notes ?? '')
  }, [active?.id, active?.notes])

  useEffect(() => {
    if (activeRowRef.current && listRef.current) {
      activeRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeIdx])

  const applyStatus = useCallback(
    (status: AssignmentStatus): void => {
      if (!active) return
      setStatus.mutate(
        { id: active.id, status, notes: notesDraft || null },
        { onError: (e) => toast.error(e.message) }
      )
      if (activeIdx < sorted.length - 1) setActiveIdx((i) => i + 1)
    },
    [active, activeIdx, sorted.length, notesDraft, setStatus]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.target as HTMLElement | null)?.tagName === 'TEXTAREA') return
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return
      if (sorted.length === 0) return
      const k = e.key.toLowerCase()
      if (k === 'p') {
        e.preventDefault()
        applyStatus('Pass')
      } else if (k === 'f') {
        e.preventDefault()
        applyStatus('Fail')
      } else if (k === 'b') {
        e.preventDefault()
        applyStatus('Blocked')
      } else if (k === 'u') {
        e.preventDefault()
        applyStatus('Unexecuted')
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(0, i - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(sorted.length - 1, i + 1))
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sorted.length, applyStatus])

  const saveNotes = (): void => {
    if (!active) return
    updateAssignment.mutate({ id: active.id, patch: { notes: notesDraft || null } })
  }

  if (!cycle)
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      </div>
    )

  if (sorted.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/projects/$projectId/plans/$planId"
          params={{ projectId: plan?.project_id ?? '', planId: cycle.plan_id }}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Back className="size-4" /> Back to plan
        </Link>
        <h1 className="text-2xl font-bold">{cycle.name}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          No assignments yet. Use &quot;Manage cases&quot; on the cycle to add some.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="flex w-80 shrink-0 flex-col border-r">
        <header className="border-b p-4">
          <Link
            to="/projects/$projectId/plans/$planId"
            params={{ projectId: plan?.project_id ?? '', planId: cycle.plan_id }}
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Back className="size-3" /> Back
          </Link>
          <h2 className="font-mono text-xs text-muted-foreground">{cycle.display_id}</h2>
          <h1 className="truncate text-lg font-bold">{cycle.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{cycle.environment}</p>
          {progress && (
            <div className="mt-3 space-y-1">
              <div className="flex h-2 overflow-hidden rounded">
                <span
                  className="bg-emerald-500"
                  style={{ width: `${(progress.pass / progress.total) * 100}%` }}
                />
                <span
                  className="bg-red-500"
                  style={{ width: `${(progress.fail / progress.total) * 100}%` }}
                />
                <span
                  className="bg-amber-500"
                  style={{ width: `${(progress.blocked / progress.total) * 100}%` }}
                />
                <span
                  className="bg-muted"
                  style={{ width: `${(progress.unexecuted / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress.pass}P · {progress.fail}F · {progress.blocked}B · {progress.unexecuted}U /{' '}
                {progress.total}
              </p>
            </div>
          )}
        </header>
        <div ref={listRef} className="flex-1 overflow-auto">
          <ul className="divide-y">
            {sorted.map((a, i) => (
              <li
                key={a.id}
                ref={i === activeIdx ? activeRowRef : null}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent/40',
                  i === activeIdx && 'bg-accent text-accent-foreground'
                )}
                onClick={() => setActiveIdx(i)}
              >
                <span
                  className={cn('size-2.5 shrink-0 rounded-full', STATUS_COLOR[a.status])}
                  aria-hidden="true"
                />
                <span className="w-20 shrink-0 font-mono text-xs">{a.test_case_display_id}</span>
                <span className="flex-1 truncate">{a.test_case_name}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b px-6 py-3 text-sm">
          <span className="text-muted-foreground">
            {activeIdx + 1} / {sorted.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
            >
              <ChevronLeft className="mr-1 size-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveIdx((i) => Math.min(sorted.length - 1, i + 1))}
              disabled={activeIdx === sorted.length - 1}
            >
              Next <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </header>

        {active && activeCase && (
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold">
                <span className="mr-2 font-mono text-base text-muted-foreground">
                  {active.test_case_display_id}
                </span>
                {active.test_case_name}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">v{activeCase.version}</p>
            </div>

            {activeCase.description && (
              <section className="mb-4">
                <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Description
                </h3>
                <p className="whitespace-pre-wrap text-sm">{activeCase.description}</p>
              </section>
            )}

            <section className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Steps</h3>
              {activeCase.steps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No steps recorded.</p>
              ) : (
                <ol className="space-y-2">
                  {activeCase.steps.map((s, i) => (
                    <li key={s.id} className="rounded-md border p-3 text-sm">
                      <div className="mb-1 text-xs font-medium text-muted-foreground">
                        Step {i + 1}
                      </div>
                      <p className="whitespace-pre-wrap">
                        <span className="font-medium">Action: </span>
                        {s.action}
                      </p>
                      {s.expected && (
                        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                          <span className="font-medium">Expected: </span>
                          {s.expected}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {activeCase.expected_result && (
              <section className="mb-4">
                <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Overall expected
                </h3>
                <p className="whitespace-pre-wrap text-sm">{activeCase.expected_result}</p>
              </section>
            )}

            <section className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Notes</h3>
              <textarea
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={saveNotes}
              />
            </section>

            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => applyStatus('Pass')}
              >
                Pass <kbd className="ml-2 rounded bg-black/20 px-1 text-xs">P</kbd>
              </Button>
              <Button variant="destructive" onClick={() => applyStatus('Fail')}>
                Fail <kbd className="ml-2 rounded bg-black/20 px-1 text-xs">F</kbd>
              </Button>
              <Button
                className="bg-amber-500 text-white hover:bg-amber-600"
                onClick={() => applyStatus('Blocked')}
              >
                Blocked <kbd className="ml-2 rounded bg-black/20 px-1 text-xs">B</kbd>
              </Button>
              <Button variant="outline" onClick={() => applyStatus('Unexecuted')}>
                Reset <kbd className="ml-2 rounded bg-muted px-1 text-xs">U</kbd>
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Keyboard: <kbd className="rounded bg-muted px-1">P</kbd>/
              <kbd className="rounded bg-muted px-1">F</kbd>/
              <kbd className="rounded bg-muted px-1">B</kbd> set status,{' '}
              <kbd className="rounded bg-muted px-1">U</kbd> reset,{' '}
              <kbd className="rounded bg-muted px-1">←</kbd>/
              <kbd className="rounded bg-muted px-1">→</kbd> navigate
            </p>
          </div>
        )}
        {(!active || !activeCase) && (
          <div className="flex-1 p-6">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        )}
      </main>
    </div>
  )
}

export type { AssignmentRow }
