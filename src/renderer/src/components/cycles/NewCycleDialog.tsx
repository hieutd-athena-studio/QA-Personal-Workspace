import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@renderer/components/ui/dialog'
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
  projectId: _projectId,
  planId,
  open,
  onOpenChange
}: Props): React.JSX.Element {
  const [name, setName] = useState('')
  const [env, setEnv] = useState<TestCycleEnvironment>('DEV CHEAT')
  const [build, setBuild] = useState('')
  const create = useCreateTestCycle(_projectId)

  const reset = (): void => {
    setName('')
    setEnv('DEV CHEAT')
    setBuild('')
  }

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(
      { plan_id: planId, name: name.trim(), environment: env },
      {
        onSuccess: (c) => {
          toast.success(`Created ${c.display_id}`)
          reset()
          onOpenChange(false)
        },
        onError: (err) => toast.error(err.message)
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--surface-2)] border-[var(--border-strong)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.55)] anim-dialog-in max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold tracking-[-0.005em]">
            New test cycle
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-[var(--fg-muted)]">
            A cycle is one execution of a plan against a specific build.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-3.5 py-2">
          {/* Cycle name */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="nc-name"
              className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]"
            >
              Cycle name
            </Label>
            <input
              id="nc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Smoke Pass — Production"
              autoFocus
              className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2.5 text-[13.5px] text-foreground outline-none transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)] placeholder:text-[var(--fg-faint)]"
            />
          </div>

          {/* Environment + Build row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="nc-env"
                className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]"
              >
                Environment
              </Label>
              <Select value={env} onValueChange={(v) => setEnv(v as TestCycleEnvironment)}>
                <SelectTrigger
                  id="nc-env"
                  className="h-8 w-full bg-[var(--surface-1)] border-[var(--border)] text-[13.5px] hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)]"
                >
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

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="nc-build"
                className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]"
              >
                Build / version
              </Label>
              <input
                id="nc-build"
                type="text"
                value={build}
                onChange={(e) => setBuild(e.target.value)}
                placeholder="checkout-web @ 2.4.0-rc.3"
                className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2.5 font-mono text-[13.5px] text-foreground outline-none transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)] placeholder:text-[var(--fg-faint)]"
              />
            </div>
          </div>

          <DialogFooter className="mt-1 border-t border-[var(--border)] pt-3.5">
            <span className="mr-auto text-[11.5px] text-[var(--fg-subtle)]">
              Next: pick which test cases this cycle covers.
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center h-8 px-3.5 rounded-md border border-[var(--border)] bg-transparent text-[13px] text-[var(--fg-muted)] hover:text-foreground hover:bg-[var(--surface-3)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending || !name.trim()}
              className="inline-flex items-center h-8 px-3.5 rounded-md bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {create.isPending ? 'Creating…' : 'Create cycle'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
