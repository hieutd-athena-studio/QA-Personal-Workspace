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
import { useCreateTestType } from '@renderer/hooks/useTestTypes'

interface Props {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewTestTypeDialog({ projectId, open, onOpenChange }: Props): React.JSX.Element {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const create = useCreateTestType(projectId)

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(
      { project_id: projectId, name: name.trim(), description: desc.trim() || null },
      {
        onSuccess: () => {
          toast.success('Created')
          setName('')
          setDesc('')
          onOpenChange(false)
        },
        onError: (e) => toast.error(e.message)
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[520px] max-w-[calc(100%-3rem)] overflow-hidden rounded-[var(--radius-lg)] border-[var(--border-strong)] bg-[var(--surface-2)] p-0 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.55)] anim-dialog-in">
        {/* Header */}
        <DialogHeader className="px-[22px] pb-1 pt-[18px]">
          <DialogTitle className="text-[16px] font-semibold tracking-[-0.005em] text-foreground">
            New test type
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-[var(--fg-muted)]">
            Test types are an orthogonal grouping — Smoke, Regression, API. A case can belong to
            many types.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          {/* Body */}
          <div className="space-y-3.5 px-[22px] py-4">
            <FormField id="nt-name" label="Name" hint="e.g. Smoke, Regression, API">
              <input
                id="nt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Smoke"
                autoFocus
                className="h-8 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)] px-2.5 text-[13.5px] text-foreground outline-none placeholder:text-[var(--fg-faint)] transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)]"
              />
            </FormField>

            <FormField id="nt-desc" label="Description">
              <textarea
                id="nt-desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Critical-path coverage that must pass for every release."
                rows={3}
                className="w-full resize-vertical rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-2 text-[13.5px] leading-[1.5] text-foreground outline-none placeholder:text-[var(--fg-faint)] transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)]"
              />
            </FormField>
          </div>

          {/* Footer */}
          <DialogFooter className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-[22px] py-3.5">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)] px-3 text-[13px] font-medium text-foreground transition-[background,border-color] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending || !name.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {create.isPending ? 'Creating…' : 'Create type'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FormField({
  id,
  label,
  hint,
  children
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]"
      >
        {label}
      </label>
      {children}
      {hint && <span className="text-[11px] text-[var(--fg-faint)]">{hint}</span>}
    </div>
  )
}
