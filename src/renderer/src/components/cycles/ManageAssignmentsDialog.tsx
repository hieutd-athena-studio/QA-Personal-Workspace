/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTestCycle } from '@renderer/hooks/useTestCycles'
import { useTestPlan } from '@renderer/hooks/useTestPlans'
import { useTestCases } from '@renderer/hooks/useTestCases'
import { useAssignCases, useAssignments, useBatchUnassign } from '@renderer/hooks/useAssignments'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'

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
  const { data: allCases } = useTestCases(plan?.project_id ?? projectId)
  const { data: assigned } = useAssignments(cycleId)
  const assign = useAssignCases(cycleId)
  const unassign = useBatchUnassign(cycleId)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setSelected(new Set((assigned ?? []).map((a) => a.test_case_id)))
  }, [assigned])

  const filteredCases = (allCases ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.display_id.toLowerCase().includes(filter.toLowerCase())
  )

  const toggle = (id: string): void => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleSave = (): void => {
    const currentlyAssigned = new Set((assigned ?? []).map((a) => a.test_case_id))
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage test cases for cycle</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Filter cases…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="max-h-96 overflow-auto rounded-md border">
            {filteredCases.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No cases.</p>
            ) : (
              <ul className="divide-y">
                {filteredCases.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-accent/40">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                      />
                      <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                        {c.display_id}
                      </span>
                      <span className="flex-1 truncate">{c.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {selected.size} of {(allCases ?? []).length} selected
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={assign.isPending || unassign.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
