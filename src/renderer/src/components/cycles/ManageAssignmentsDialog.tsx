/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Layers, Search, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useTestCycle } from '@renderer/hooks/useTestCycles'
import { useTestPlan } from '@renderer/hooks/useTestPlans'
import { useTestCases } from '@renderer/hooks/useTestCases'
import { useTestTypes } from '@renderer/hooks/useTestTypes'
import { useAssignCases, useAssignments, useBatchUnassign } from '@renderer/hooks/useAssignments'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@renderer/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'

interface Props {
  projectId: string
  cycleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
  const { data: testTypes } = useTestTypes(effectiveProjectId)
  const { data: assigned } = useAssignments(cycleId)
  const assign = useAssignCases(cycleId)
  const unassign = useBatchUnassign(cycleId)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [importingType, setImportingType] = useState(false)

  const importFromType = async (typeId: string): Promise<void> => {
    if (!typeId) return
    setImportingType(true)
    try {
      const ids = await window.api.types.getCases(typeId)
      if (ids.length === 0) {
        toast.message('Test type has no cases')
        return
      }
      const before = selected.size
      setSelected((prev) => {
        const next = new Set(prev)
        for (const id of ids) next.add(id)
        return next
      })
      const newlyAdded = ids.filter((id) => !selected.has(id)).length
      toast.success(
        `Added ${newlyAdded} case${newlyAdded === 1 ? '' : 's'} from test type` +
          (before === 0 ? '' : ` (already had ${before})`)
      )
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setImportingType(false)
    }
  }

  useEffect(() => {
    setSelected(new Set((assigned ?? []).map((a) => a.test_case_id)))
  }, [assigned])

  const lc = filter.trim().toLowerCase()
  const filteredCases = (allCases ?? []).filter(
    (c) => !lc || c.name.toLowerCase().includes(lc) || c.display_id.toLowerCase().includes(lc)
  )

  const toggle = (id: string): void => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const allShownSelected =
    filteredCases.length > 0 && filteredCases.every((c) => selected.has(c.id))

  const toggleAll = (): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allShownSelected) filteredCases.forEach((c) => next.delete(c.id))
      else filteredCases.forEach((c) => next.add(c.id))
      return next
    })
  }

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
            Pick the test cases this cycle covers.{cycle?.name ? ` ${cycle.name}.` : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-col gap-3 px-5 py-3 flex-1 min-h-0 overflow-y-auto">
          {/* Quick import + Search row */}
          <div className="flex items-center gap-2">
            <Select
              value=""
              onValueChange={(v) => void importFromType(v)}
              disabled={!testTypes || testTypes.length === 0 || importingType}
            >
              <SelectTrigger
                className="h-8 min-w-[200px] rounded-md border-[var(--border)] bg-[var(--surface-1)] text-[12.5px]"
                aria-label="Import cases from test type"
              >
                <span className="inline-flex items-center gap-1.5 truncate text-[var(--fg-muted)]">
                  <Layers className="size-3.5" />
                  <SelectValue
                    placeholder={
                      !testTypes || testTypes.length === 0
                        ? 'No test types'
                        : importingType
                          ? 'Importing…'
                          : 'Import from test type…'
                    }
                  />
                </span>
              </SelectTrigger>
              <SelectContent>
                {(testTypes ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-1 items-center gap-2 h-8 rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2.5 focus-within:border-[var(--accent-ring)] focus-within:bg-[var(--surface-2)] transition-colors">
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
          </div>

          {/* Checklist */}
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
            {/* Checklist header */}
            <div className="flex items-center gap-2 px-2.5 py-2 border-b border-[var(--border)] bg-white/[0.02]">
              <button
                type="button"
                onClick={toggleAll}
                aria-label="Toggle all"
                className="flex size-3.5 items-center justify-center rounded-[3px] border-[1.2px] transition-colors"
                style={{
                  borderColor: allShownSelected ? 'hsl(var(--primary))' : 'var(--border-strong)',
                  background: allShownSelected ? 'hsl(var(--primary))' : 'var(--surface-1)',
                  color: 'white'
                }}
              >
                {allShownSelected && <Check className="size-2.5" strokeWidth={2.4} />}
              </button>
              <span className="text-[12px] text-[var(--fg-muted)]">
                {allShownSelected ? 'Deselect all' : 'Select all'}
                {lc && ` (${filteredCases.length} matching)`}
              </span>
              <span className="ml-auto font-mono text-[11.5px] text-[var(--fg-muted)]">
                {selected.size} of {(allCases ?? []).length} selected
              </span>
            </div>

            {/* Case rows */}
            <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
              {filteredCases.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12px] text-[var(--fg-subtle)]">
                  No cases match.
                </div>
              ) : (
                filteredCases.map((c, idx) => {
                  const checked = selected.has(c.id)
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggle(c.id)}
                      className={[
                        'grid items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors',
                        idx > 0 ? 'border-t border-[var(--border-soft)]' : '',
                        checked ? 'bg-[var(--accent-tint)]' : 'hover:bg-white/[0.03]'
                      ].join(' ')}
                      style={{ gridTemplateColumns: '18px auto 1fr auto' }}
                    >
                      {/* Checkbox */}
                      <span
                        className="flex size-3.5 items-center justify-center rounded-[3px] border-[1.2px] transition-colors"
                        style={{
                          borderColor: checked ? 'hsl(var(--primary))' : 'var(--border-strong)',
                          background: checked ? 'hsl(var(--primary))' : 'var(--surface-1)',
                          color: 'white'
                        }}
                      >
                        {checked && <Check className="size-2.5" strokeWidth={2.4} />}
                      </span>
                      {/* ID */}
                      <span className="font-mono text-[11.5px] text-[var(--fg-subtle)]">
                        {c.display_id}
                      </span>
                      {/* Name */}
                      <span className="text-[12.5px] text-foreground truncate">{c.name}</span>
                      {/* Sub */}
                      <span className="font-mono text-[10.5px] text-[var(--fg-faint)]">
                        {/* subcategory label would need join with categories hook — showing display_id for now */}
                      </span>
                    </div>
                  )
                })
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
