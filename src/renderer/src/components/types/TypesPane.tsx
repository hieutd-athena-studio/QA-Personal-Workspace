import { useState } from 'react'
import { Plus, Sparkles, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'
import { useDeleteTestType, useTestTypeCounts, useTestTypes } from '@renderer/hooks/useTestTypes'
import { useTestCases } from '@renderer/hooks/useTestCases'
import { NewTestTypeDialog } from './NewTestTypeDialog'
import { ManageTypeCasesDialog } from './ManageTypeCasesDialog'
import type { TestType } from '@shared/types/test_types'

interface Props {
  projectId: string
}

export function TypesPane({ projectId }: Props): React.JSX.Element {
  const { data: types } = useTestTypes(projectId)
  const { data: counts } = useTestTypeCounts(projectId)
  const { data: cases } = useTestCases(projectId)
  const del = useDeleteTestType(projectId)
  const [newOpen, setNewOpen] = useState(false)
  const [manageId, setManageId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const total = cases?.length ?? 0
  const confirmType = (types ?? []).find((t) => t.id === confirmId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center">
        <span className="eyebrow">Test types · {(types ?? []).length}</span>
        <span className="flex-1" />
        <button
          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          onClick={() => setNewOpen(true)}
        >
          <Sparkles className="size-[13px]" />
          New type
        </button>
      </div>

      {(types ?? []).length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center text-[var(--fg-muted)]">
          <div className="mb-3 flex justify-center">
            <Users className="size-5 text-[var(--fg-faint)]" />
          </div>
          <h4 className="mb-1 text-[14px] font-semibold text-foreground">No test types yet</h4>
          <p className="mb-4 text-[13px]">
            Test types group cases orthogonally — Smoke, Regression, API…
          </p>
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            onClick={() => setNewOpen(true)}
          >
            <Plus className="size-3.5" />
            New type
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {(types ?? []).map((t) => (
            <TypeRow
              key={t.id}
              type={t}
              assigned={counts?.[t.id] ?? 0}
              total={total}
              onManage={() => setManageId(t.id)}
              onDelete={() => setConfirmId(t.id)}
            />
          ))}
        </div>
      )}

      {/* Confirm delete */}
      <AlertDialog open={Boolean(confirmId)} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete type &quot;{confirmType?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Case assignments to this type will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!confirmId) return
                del.mutate(confirmId, {
                  onSuccess: () => {
                    toast.success('Deleted')
                    setConfirmId(null)
                  },
                  onError: (e) => toast.error(e.message)
                })
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewTestTypeDialog projectId={projectId} open={newOpen} onOpenChange={setNewOpen} />
      {manageId && (
        <ManageTypeCasesDialog
          projectId={projectId}
          typeId={manageId}
          open={Boolean(manageId)}
          onOpenChange={(o) => !o && setManageId(null)}
        />
      )}
    </div>
  )
}

function TypeRow({
  type,
  assigned,
  total,
  onManage,
  onDelete
}: {
  type: TestType
  assigned: number
  total: number
  onManage: () => void
  onDelete: () => void
}): React.JSX.Element {
  return (
    <div
      className="grid items-center gap-[18px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3.5"
      style={{ gridTemplateColumns: '1fr auto auto' }}
    >
      {/* Name + description */}
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-foreground">{type.name}</p>
        {type.description && (
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--fg-muted)]">{type.description}</p>
        )}
      </div>

      {/* Count badge */}
      <span className="whitespace-nowrap rounded-full border border-[var(--border)] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[11.5px] text-[var(--fg-muted)] tabular-nums">
        {assigned}
        <span className="text-[var(--fg-faint)]">/{total}</span>{' '}
        <span className="text-[var(--fg-subtle)]">cases</span>
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-md)] border border-transparent bg-transparent px-3 text-[13px] font-medium text-[var(--fg-muted)] transition-[background,color] hover:bg-white/[0.04] hover:text-foreground"
          onClick={onManage}
        >
          Manage cases
        </button>
        <button
          className="grid size-7 place-items-center rounded-[var(--radius-md)] text-[var(--fg-subtle)] transition-[background,color] hover:bg-[var(--fail-soft)] hover:text-[#fca5a5]"
          onClick={onDelete}
          aria-label={`Delete ${type.name}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}
