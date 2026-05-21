/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@renderer/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { useTestCases } from '@renderer/hooks/useTestCases'
import { useCategories } from '@renderer/hooks/useCategories'
import { useSetTestTypeCases, useTestTypeCases } from '@renderer/hooks/useTestTypes'

interface Props {
  projectId: string
  typeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageTypeCasesDialog({
  projectId,
  typeId,
  open,
  onOpenChange
}: Props): React.JSX.Element {
  const { data: cases } = useTestCases(projectId)
  const { data: cats } = useCategories(projectId)
  const { data: memberIds } = useTestTypeCases(typeId)
  const setCases = useSetTestTypeCases(projectId)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [scope, setScope] = useState<string>('all')

  useEffect(() => {
    setSelected(new Set(memberIds ?? []))
  }, [memberIds])

  const topCats = useMemo(() => (cats ?? []).filter((c) => !c.parent_category_id), [cats])
  const subsByParent = useMemo(() => {
    const m = new Map<string, typeof topCats>()
    for (const c of cats ?? []) {
      if (c.parent_category_id) {
        const arr = m.get(c.parent_category_id) ?? []
        arr.push(c)
        m.set(c.parent_category_id, arr)
      }
    }
    return m
  }, [cats])

  // Resolve scope → set of allowed subcategory ids (null = uncategorized)
  const scopeMatches = (subcategoryId: string | null): boolean => {
    if (scope === 'all') return true
    if (scope === 'none') return subcategoryId === null
    if (scope.startsWith('cat:')) {
      const catId = scope.slice(4)
      if (subcategoryId === catId) return true
      const subs = subsByParent.get(catId) ?? []
      return subs.some((s) => s.id === subcategoryId)
    }
    if (scope.startsWith('sub:')) {
      return subcategoryId === scope.slice(4)
    }
    return true
  }

  const lc = filter.trim().toLowerCase()
  const filtered = (cases ?? []).filter(
    (c) =>
      scopeMatches(c.subcategory_id) &&
      (c.name.toLowerCase().includes(lc) || c.display_id.toLowerCase().includes(lc))
  )

  const toggle = (id: string): void => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const allShownSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id))

  const toggleAll = (): void => {
    const next = new Set(selected)
    if (allShownSelected) filtered.forEach((c) => next.delete(c.id))
    else filtered.forEach((c) => next.add(c.id))
    setSelected(next)
  }

  const initialCount = memberIds?.length ?? 0
  const added = Math.max(0, selected.size - initialCount)
  const removed = (memberIds ?? []).filter((id) => !selected.has(id)).length

  const save = (): void => {
    setCases.mutate(
      { id: typeId, caseIds: Array.from(selected) },
      {
        onSuccess: () => {
          toast.success('Saved')
          onOpenChange(false)
        },
        onError: (e) => toast.error(e.message)
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px] max-w-[calc(100%-3rem)] overflow-hidden rounded-[var(--radius-lg)] border-[var(--border-strong)] bg-[var(--surface-2)] p-0 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.55)] anim-dialog-in">
        {/* Header */}
        <DialogHeader className="px-[22px] pb-1 pt-[18px]">
          <DialogTitle className="text-[16px] font-semibold tracking-[-0.005em] text-foreground">
            Manage cases in type
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-[var(--fg-muted)]">
            Toggle which test cases belong to this type.
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="px-[22px] pb-0 pt-2">
          {/* Filter row: scope + search */}
          <div className="mb-3 flex items-center gap-2">
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-8 min-w-[180px] rounded-[var(--radius-md)] border-[var(--border)] bg-[var(--surface-1)] text-[13px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="none">Uncategorized</SelectItem>
                {topCats.map((cat) => {
                  const subs = subsByParent.get(cat.id) ?? []
                  return (
                    <SelectGroup key={cat.id}>
                      <SelectLabel className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
                        {cat.name}
                      </SelectLabel>
                      <SelectItem value={`cat:${cat.id}`}>All of {cat.name}</SelectItem>
                      {subs.map((sub) => (
                        <SelectItem key={sub.id} value={`sub:${sub.id}`}>
                          {cat.name} › {sub.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )
                })}
              </SelectContent>
            </Select>
            <div className="relative flex flex-1 items-center">
              <Search
                className="pointer-events-none absolute left-[9px] size-3.5 text-[var(--fg-subtle)]"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search test cases…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-8 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)] pl-[30px] pr-[30px] text-[13px] text-foreground outline-none placeholder:text-[var(--fg-faint)] transition-colors focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)]"
              />
              {filter && (
                <button
                  className="absolute right-1.5 grid size-5 place-items-center rounded text-[var(--fg-subtle)] transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  onClick={() => setFilter('')}
                  aria-label="Clear filter"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)]">
            {/* Header row with select-all */}
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-white/[0.02] px-2.5 py-2">
              <button
                className={[
                  'grid size-[14px] shrink-0 place-items-center rounded-[3px] border-[1.2px] transition-[background,border-color] duration-[120ms]',
                  allShownSelected
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--border-strong)] bg-[var(--surface-1)]'
                ].join(' ')}
                onClick={toggleAll}
                aria-label="Toggle all shown"
              >
                {allShownSelected && <Check className="size-[10px]" strokeWidth={2.4} />}
              </button>
              <span className="text-[12px] text-[var(--fg-muted)]">
                {allShownSelected ? 'Deselect all' : 'Select all'}
                {lc && ` (${filtered.length} matching)`}
              </span>
              <span className="ml-auto font-mono text-[11.5px] text-[var(--fg-muted)]">
                {selected.size} of {(cases ?? []).length} selected
              </span>
            </div>

            {/* Case list */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-[12px] text-[var(--fg-subtle)]">
                  No cases match.
                </p>
              ) : (
                filtered.map((c, idx) => {
                  const isChecked = selected.has(c.id)
                  return (
                    <div
                      key={c.id}
                      className={[
                        'grid cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors duration-[120ms]',
                        isChecked ? 'bg-[var(--accent-tint)]' : 'hover:bg-white/[0.03]',
                        idx > 0 ? 'border-t border-[var(--border-soft)]' : ''
                      ].join(' ')}
                      style={{ gridTemplateColumns: '18px auto 1fr auto' }}
                      onClick={() => toggle(c.id)}
                      role="checkbox"
                      aria-checked={isChecked}
                    >
                      <span
                        className={[
                          'grid size-[14px] shrink-0 place-items-center rounded-[3px] border-[1.2px] transition-[background,border-color] duration-[120ms]',
                          isChecked
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                            : 'border-[var(--border-strong)] bg-[var(--surface-1)]'
                        ].join(' ')}
                      >
                        <Check
                          className="size-[10px]"
                          strokeWidth={2.4}
                          style={{ opacity: isChecked ? 1 : 0, transition: 'opacity 120ms' }}
                        />
                      </span>
                      <span className="font-mono text-[11.5px] text-[var(--fg-subtle)]">
                        {c.display_id}
                      </span>
                      <span className="truncate text-[12.5px] text-foreground">{c.name}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-[var(--border)] px-[22px] py-3.5">
          <span className="mr-auto text-[11.5px] text-[var(--fg-subtle)]">
            <span className="font-mono">+{added}</span> added,{' '}
            <span className="font-mono">−{removed}</span> removed
          </span>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)] px-3 text-[13px] font-medium text-foreground transition-[background,border-color] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
            onClick={save}
            disabled={setCases.isPending}
          >
            {setCases.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
