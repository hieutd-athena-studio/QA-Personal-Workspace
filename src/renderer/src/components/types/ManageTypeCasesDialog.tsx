/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { useTestCases } from '@renderer/hooks/useTestCases'
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
  const { data: memberIds } = useTestTypeCases(typeId)
  const setCases = useSetTestTypeCases(projectId)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setSelected(new Set(memberIds ?? []))
  }, [memberIds])

  const filtered = (cases ?? []).filter(
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage cases in type</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Filter cases…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="max-h-96 overflow-auto rounded-md border">
            {filtered.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No cases.</p>
            ) : (
              <ul className="divide-y">
                {filtered.map((c) => (
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
            {selected.size} of {(cases ?? []).length} selected
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={setCases.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
