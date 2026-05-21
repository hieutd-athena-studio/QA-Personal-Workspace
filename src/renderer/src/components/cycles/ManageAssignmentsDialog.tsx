/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Search, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useTestCycle } from '@renderer/hooks/useTestCycles'
import { useTestPlan } from '@renderer/hooks/useTestPlans'
import { useTestCases } from '@renderer/hooks/useTestCases'
import { useCategories } from '@renderer/hooks/useCategories'
import { useAssignCases, useAssignments, useBatchUnassign } from '@renderer/hooks/useAssignments'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@renderer/components/ui/dialog'
import type { Category } from '@shared/types/categories'
import type { TestCase } from '@shared/types/test_cases'

interface Props {
  projectId: string
  cycleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type GroupState = 'all' | 'partial' | 'none'

export function ManageAssignmentsDialog({
  projectId,
  cycleId,
  open,
  onOpenChange
}: Props): React.JSX.Element {
  const { data: cycle } = useTestCycle(cycleId)
  const { data: plan } = useTestPlan(cycle?.plan_id)
  const effectiveProjectId = plan?.project_id ?? projectId
  const { data: allCases } = useTestCases(effectiveProjectId)
  const { data: cats } = useCategories(effectiveProjectId)
  const { data: assigned } = useAssignments(cycleId)
  const assign = useAssignCases(cycleId)
  const unassign = useBatchUnassign(cycleId)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setSelected(new Set((assigned ?? []).map((a) => a.test_case_id)))
  }, [assigned])

  const topCats = useMemo(() => (cats ?? []).filter((c) => !c.parent_category_id), [cats])
  const subsByParent = useMemo(() => {
    const m = new Map<string, Category[]>()
    for (const c of cats ?? []) {
      if (c.parent_category_id) {
        const arr = m.get(c.parent_category_id) ?? []
        arr.push(c)
        m.set(c.parent_category_id, arr)
      }
    }
    return m
  }, [cats])

  const casesBySubcat = useMemo(() => {
    const m = new Map<string, TestCase[]>()
    const orphans: TestCase[] = []
    for (const tc of allCases ?? []) {
      if (tc.subcategory_id) {
        const arr = m.get(tc.subcategory_id) ?? []
        arr.push(tc)
        m.set(tc.subcategory_id, arr)
      } else {
        orphans.push(tc)
      }
    }
    return { bySubcat: m, orphans }
  }, [allCases])

  const lc = filter.trim().toLowerCase()
  const matchesFilter = (tc: TestCase): boolean =>
    !lc || tc.name.toLowerCase().includes(lc) || tc.display_id.toLowerCase().includes(lc)

  const toggle = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const setGroup = (ids: string[], select: boolean): void => {
    if (ids.length === 0) return
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (select) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const groupState = (ids: string[]): GroupState => {
    if (ids.length === 0) return 'none'
    const sel = ids.filter((id) => selected.has(id)).length
    if (sel === ids.length) return 'all'
    if (sel > 0) return 'partial'
    return 'none'
  }

  const visible = useMemo(() => {
    type Sub = { sub: Category; tcs: TestCase[] }
    type Cat = { cat: Category; subs: Sub[]; direct: TestCase[] }
    const allCats: Cat[] = topCats.map((cat) => {
      const subs = (subsByParent.get(cat.id) ?? []).map((sub) => ({
        sub,
        tcs: (casesBySubcat.bySubcat.get(sub.id) ?? []).filter(matchesFilter)
      }))
      const direct = (casesBySubcat.bySubcat.get(cat.id) ?? []).filter(matchesFilter)
      return { cat, subs, direct }
    })
    const orphans = casesBySubcat.orphans.filter(matchesFilter)
    return { allCats, orphans }
  }, [topCats, subsByParent, casesBySubcat, lc])

  const allVisibleIds = useMemo(() => {
    const ids: string[] = []
    for (const c of visible.allCats) {
      for (const s of c.subs) for (const tc of s.tcs) ids.push(tc.id)
      for (const tc of c.direct) ids.push(tc.id)
    }
    for (const tc of visible.orphans) ids.push(tc.id)
    return ids
  }, [visible])

  const allShownState = groupState(allVisibleIds)
  const allShownSelected = allShownState === 'all'
  const hasAnyVisible = allVisibleIds.length > 0

  const initialIds = (assigned ?? []).map((a) => a.test_case_id)
  const addedCount = [...selected].filter((id) => !initialIds.includes(id)).length
  const removedCount = initialIds.filter((id) => !selected.has(id)).length

  const handleSave = (): void => {
    const currentlyAssigned = new Set(initialIds)
    const toAssign: string[] = []
    const toUnassign: string[] = []
    for (const id of selected) if (!currentlyAssigned.has(id)) toAssign.push(id)
    for (const a of assigned ?? []) if (!selected.has(a.test_case_id)) toUnassign.push(a.id)

    const tasks: Promise<unknown>[] = []
    if (toAssign.length > 0) tasks.push(assign.mutateAsync(toAssign))
    if (toUnassign.length > 0) tasks.push(unassign.mutateAsync(toUnassign))
    Promise.all(tasks)
      .then(() => {
        toast.success(`Assigned ${toAssign.length}, removed ${toUnassign.length}`)
        onOpenChange(false)
      })
      .catch((e: Error) => toast.error(e.message))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--surface-2)] border-[var(--border-strong)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.55)] anim-dialog-in max-w-[640px] flex flex-col max-h-[calc(100vh-64px)] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-4 pb-1 shrink-0">
          <DialogTitle className="text-[16px] font-semibold tracking-[-0.005em]">
            Manage cases — {cycle?.display_id}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-[var(--fg-muted)]">
            Pick the test cases this cycle covers. Tick a category or subcategory to bulk-select.
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-col gap-3 px-5 py-3 flex-1 min-h-0 overflow-y-auto">
          {/* Search input */}
          <div className="flex items-center gap-2 h-8 rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2.5 focus-within:border-[var(--accent-ring)] focus-within:bg-[var(--surface-2)] transition-colors">
            <Search className="size-3.5 text-[var(--fg-faint)] shrink-0" />
            <input
              type="text"
              placeholder="Search test cases…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-[13.5px] text-foreground placeholder:text-[var(--fg-faint)]"
            />
            {filter && (
              <button
                type="button"
                onClick={() => setFilter('')}
                aria-label="Clear search"
                className="text-[var(--fg-faint)] hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Checklist */}
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
            {/* Top header w/ select-all */}
            <div className="flex items-center gap-2 px-2.5 py-2 border-b border-[var(--border)] bg-white/[0.02]">
              <GroupCheckbox
                state={allShownState}
                disabled={!hasAnyVisible}
                onClick={() => setGroup(allVisibleIds, !allShownSelected)}
                label="Toggle all shown"
              />
              <span className="text-[12px] text-[var(--fg-muted)]">
                {allShownSelected ? 'Deselect all' : 'Select all'}
                {lc && ` (${allVisibleIds.length} matching)`}
              </span>
              <span className="ml-auto font-mono text-[11.5px] text-[var(--fg-muted)]">
                {selected.size} of {(allCases ?? []).length} selected
              </span>
            </div>

            {/* Grouped case list */}
            <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
              {!hasAnyVisible ? (
                <div className="px-4 py-8 text-center text-[12px] text-[var(--fg-subtle)]">
                  No cases match.
                </div>
              ) : (
                <>
                  {visible.allCats.map(({ cat, subs, direct }) => {
                    const catIds: string[] = []
                    for (const s of subs) for (const tc of s.tcs) catIds.push(tc.id)
                    for (const tc of direct) catIds.push(tc.id)
                    if (catIds.length === 0) return null
                    return (
                      <CategoryBlock
                        key={cat.id}
                        label={cat.name}
                        state={groupState(catIds)}
                        onToggle={() => setGroup(catIds, groupState(catIds) !== 'all')}
                        count={catIds.length}
                      >
                        {subs.map(({ sub, tcs }) => {
                          if (tcs.length === 0) return null
                          const subIds = tcs.map((tc) => tc.id)
                          return (
                            <SubcategoryBlock
                              key={sub.id}
                              label={sub.name}
                              state={groupState(subIds)}
                              onToggle={() => setGroup(subIds, groupState(subIds) !== 'all')}
                              count={subIds.length}
                            >
                              {tcs.map((tc) => (
                                <CaseRow
                                  key={tc.id}
                                  tc={tc}
                                  checked={selected.has(tc.id)}
                                  onToggle={() => toggle(tc.id)}
                                />
                              ))}
                            </SubcategoryBlock>
                          )
                        })}
                        {direct.map((tc) => (
                          <CaseRow
                            key={tc.id}
                            tc={tc}
                            checked={selected.has(tc.id)}
                            onToggle={() => toggle(tc.id)}
                          />
                        ))}
                      </CategoryBlock>
                    )
                  })}
                  {visible.orphans.length > 0 &&
                    (() => {
                      const ids = visible.orphans.map((tc) => tc.id)
                      return (
                        <CategoryBlock
                          label="Uncategorized"
                          state={groupState(ids)}
                          onToggle={() => setGroup(ids, groupState(ids) !== 'all')}
                          count={ids.length}
                          muted
                        >
                          {visible.orphans.map((tc) => (
                            <CaseRow
                              key={tc.id}
                              tc={tc}
                              checked={selected.has(tc.id)}
                              onToggle={() => toggle(tc.id)}
                            />
                          ))}
                        </CategoryBlock>
                      )
                    })()}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 flex items-center gap-2 px-5 py-3.5 border-t border-[var(--border)]">
          <span className="mr-auto text-[11.5px] text-[var(--fg-subtle)]">
            <span className="font-mono">+{addedCount}</span> added,{' '}
            <span className="font-mono">−{removedCount}</span> removed
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center h-8 px-3.5 rounded-md border border-[var(--border)] bg-transparent text-[13px] text-[var(--fg-muted)] hover:text-foreground hover:bg-[var(--surface-3)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={assign.isPending || unassign.isPending}
            className="inline-flex items-center h-8 px-3.5 rounded-md bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {assign.isPending || unassign.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── sub-components ──────────────────────────────────────────────────

function GroupCheckbox({
  state,
  disabled = false,
  onClick,
  label,
  compact = false
}: {
  state: GroupState
  disabled?: boolean
  onClick: () => void
  label: string
  compact?: boolean
}): React.JSX.Element {
  const size = compact ? 'size-[12px]' : 'size-[14px]'
  const iconSize = compact ? 'size-[9px]' : 'size-[10px]'
  return (
    <button
      type="button"
      className={[
        'grid shrink-0 place-items-center rounded-[3px] border-[1.2px] transition-[background,border-color,opacity] duration-[120ms]',
        size,
        disabled
          ? 'cursor-not-allowed border-[var(--border)] bg-transparent opacity-30'
          : state === 'all'
            ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
            : state === 'partial'
              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
              : 'border-[var(--border-strong)] bg-[var(--surface-1)] hover:border-[var(--fg-subtle)]'
      ].join(' ')}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onClick()
      }}
      aria-label={label}
      aria-pressed={state === 'all'}
      disabled={disabled}
    >
      {state === 'all' && <Check className={iconSize} strokeWidth={2.4} />}
      {state === 'partial' && (
        <span
          className="block rounded-[1.5px] bg-[var(--accent)]"
          style={{ width: compact ? 6 : 8, height: 1.5 }}
          aria-hidden="true"
        />
      )}
    </button>
  )
}

function CategoryBlock({
  label,
  state,
  onToggle,
  count,
  muted = false,
  children
}: {
  label: string
  state: GroupState
  onToggle: () => void
  count: number
  muted?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="border-t border-[var(--border-soft)] first:border-t-0">
      <div
        className={[
          'flex items-center gap-2 bg-white/[0.015] px-2.5 py-1.5 text-[12px] font-semibold tracking-[-0.005em]',
          muted ? 'text-[var(--fg-muted)]' : 'text-foreground'
        ].join(' ')}
      >
        <GroupCheckbox state={state} onClick={onToggle} label={`Select all cases in ${label}`} />
        <span>{label}</span>
        <span className="font-mono text-[10.5px] font-medium text-[var(--fg-faint)]">{count}</span>
      </div>
      {children}
    </div>
  )
}

function SubcategoryBlock({
  label,
  state,
  onToggle,
  count,
  children
}: {
  label: string
  state: GroupState
  onToggle: () => void
  count: number
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div>
      <div className="flex items-center gap-2 border-t border-[var(--border-soft)] bg-white/[0.01] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
        <GroupCheckbox
          state={state}
          onClick={onToggle}
          label={`Select all cases in ${label}`}
          compact
        />
        <span>{label}</span>
        <span className="font-mono text-[10.5px] font-medium normal-case tracking-normal text-[var(--fg-faint)]">
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}

function CaseRow({
  tc,
  checked,
  onToggle
}: {
  tc: TestCase
  checked: boolean
  onToggle: () => void
}): React.JSX.Element {
  return (
    <div
      className={[
        'grid cursor-pointer items-center gap-2.5 border-t border-[var(--border-soft)] px-5 py-1.5 transition-colors duration-[120ms]',
        checked ? 'bg-[var(--accent-tint)]' : 'hover:bg-white/[0.03]'
      ].join(' ')}
      style={{ gridTemplateColumns: '18px auto 1fr' }}
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
    >
      <span
        className="flex size-[14px] items-center justify-center rounded-[3px] border-[1.2px] transition-colors"
        style={{
          borderColor: checked ? 'hsl(var(--primary))' : 'var(--border-strong)',
          background: checked ? 'hsl(var(--primary))' : 'var(--surface-1)',
          color: 'white'
        }}
      >
        {checked && <Check className="size-[10px]" strokeWidth={2.4} />}
      </span>
      <span className="font-mono text-[11.5px] text-[var(--fg-subtle)]">{tc.display_id}</span>
      <span className="truncate text-[12.5px] text-foreground">{tc.name}</span>
    </div>
  )
}
