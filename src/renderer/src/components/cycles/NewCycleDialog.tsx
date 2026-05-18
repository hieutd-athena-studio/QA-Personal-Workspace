import { useState } from 'react'
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
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { useCreateTestCycle } from '@renderer/hooks/useTestCycles'
import { TEST_CYCLE_ENVIRONMENTS, type TestCycleEnvironment } from '@shared/types/test_cycles'

interface Props {
  projectId: string
  planId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewCycleDialog({
  projectId,
  planId,
  open,
  onOpenChange
}: Props): React.JSX.Element {
  const [name, setName] = useState('')
  const [env, setEnv] = useState<TestCycleEnvironment>('DEV CHEAT')
  const create = useCreateTestCycle(projectId)

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(
      { plan_id: planId, name: name.trim(), environment: env },
      {
        onSuccess: (c) => {
          toast.success(`Created ${c.display_id}`)
          setName('')
          setEnv('DEV CHEAT')
          onOpenChange(false)
        },
        onError: (e) => toast.error(e.message)
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New cycle</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cy-name">Name</Label>
            <Input id="cy-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cy-env">Environment</Label>
            <Select value={env} onValueChange={(v) => setEnv(v as TestCycleEnvironment)}>
              <SelectTrigger id="cy-env">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEST_CYCLE_ENVIRONMENTS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? 'Creating…' : 'Create cycle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
