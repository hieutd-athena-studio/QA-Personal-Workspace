import { useMemo, useState } from 'react'
import { Check, Pencil, Plus, Star, Trash2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { useUpdateProject } from '@renderer/hooks/useProjects'
import {
  useCreateProjectVersion,
  useDeleteProjectVersion,
  useProjectVersions,
  useUpdateProjectVersion
} from '@renderer/hooks/useProjectVersions'
import type { Project } from '@shared/types/projects'
import type { ProjectVersion } from '@shared/types/project_versions'

interface Props {
  project: Project
}

export function ChangelogCard({ project }: Props): React.JSX.Element {
  const { data: versions, isLoading } = useProjectVersions(project.id)
  // Tracks an explicit user choice; falls back to project's "current" or newest version.
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ProjectVersion | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ProjectVersion | null>(null)

  const sorted = useMemo(() => versions ?? [], [versions])

  const selectedId = useMemo(() => {
    if (sorted.length === 0) return null
    if (userSelectedId && sorted.some((v) => v.id === userSelectedId)) return userSelectedId
    const fallback = sorted.find((v) => v.id === project.current_version_id) ?? sorted[0]
    return fallback?.id ?? null
  }, [sorted, userSelectedId, project.current_version_id])

  const selected = sorted.find((v) => v.id === selectedId) ?? null

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-[16px_18px] flex flex-col min-h-[220px]">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]">
          Changelog
        </h3>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[11.5px] text-[var(--fg-muted)] transition-colors hover:bg-white/[0.05] hover:text-foreground"
          aria-label="Add version"
        >
          <Plus className="size-3" />
          New version
        </button>
      </header>

      {/* Version selector */}
      <div className="mb-3 flex items-center gap-2">
        <Select
          value={selectedId ?? undefined}
          onValueChange={(v) => setUserSelectedId(v)}
          disabled={sorted.length === 0}
        >
          <SelectTrigger className="h-8 w-[200px] text-[12.5px]">
            <SelectValue placeholder={isLoading ? 'Loading…' : 'No versions yet'} />
          </SelectTrigger>
          <SelectContent>
            {sorted.map((v) => (
              <SelectItem key={v.id} value={v.id} className="text-[12.5px]">
                <span className="mono font-semibold">v{v.version}</span>
                {v.released_at && (
                  <span className="ml-2 text-[11px] text-[var(--fg-subtle)]">{v.released_at}</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selected && (
          <div className="ml-auto flex items-center gap-1">
            <CurrentToggleButton project={project} version={selected} />
            <IconButton
              icon={<Pencil className="size-3.5" />}
              label={`Edit v${selected.version}`}
              onClick={() => setEditTarget(selected)}
            />
            <IconButton
              icon={<Trash2 className="size-3.5" />}
              label={`Delete v${selected.version}`}
              danger
              onClick={() => setConfirmDelete(selected)}
            />
          </div>
        )}
      </div>

      {/* Notes body */}
      <div className="flex-1 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white/[0.015] px-3 py-2.5 scrollbar-thin">
        {!selected ? (
          <p className="text-[12.5px] text-[var(--fg-muted)]">
            Create a version to track release notes.
          </p>
        ) : selected.notes ? (
          <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-[1.55] text-foreground">
            {selected.notes}
          </pre>
        ) : (
          <p className="text-[12.5px] text-[var(--fg-muted)]">No notes for this version.</p>
        )}
      </div>

      {newOpen && (
        <VersionDialog
          mode="create"
          open={newOpen}
          onOpenChange={setNewOpen}
          projectId={project.id}
        />
      )}

      {editTarget && (
        <VersionDialog
          mode="edit"
          open={Boolean(editTarget)}
          onOpenChange={(o) => !o && setEditTarget(null)}
          projectId={project.id}
          existing={editTarget}
        />
      )}

      <DeleteVersionConfirm
        project={project}
        target={confirmDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function CurrentToggleButton({
  project,
  version
}: {
  project: Project
  version: ProjectVersion
}): React.JSX.Element {
  const updateProject = useUpdateProject()
  const isCurrent = project.current_version_id === version.id

  const handleClick = (): void => {
    updateProject.mutate(
      {
        id: project.id,
        patch: { current_version_id: isCurrent ? null : version.id }
      },
      {
        onSuccess: () => {
          toast.success(
            isCurrent ? 'Cleared current version' : `Set current to v${version.version}`
          )
        },
        onError: (err) => toast.error(err.message)
      }
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={updateProject.isPending}
      title={isCurrent ? 'Current version' : 'Mark as current version'}
      aria-label={isCurrent ? 'Current version' : 'Mark as current version'}
      className={`grid size-7 place-items-center rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-fast)] ${
        isCurrent
          ? 'text-[#fcd34d]'
          : 'text-[var(--fg-subtle)] hover:bg-white/[0.05] hover:text-foreground'
      }`}
    >
      {isCurrent ? <Check className="size-3.5" /> : <Star className="size-3.5" />}
    </button>
  )
}

function IconButton({
  icon,
  label,
  onClick,
  danger
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={
        danger
          ? 'grid size-7 place-items-center rounded-[var(--radius-sm)] text-[var(--fg-subtle)] transition-colors duration-[var(--duration-fast)] hover:bg-destructive/10 hover:text-destructive'
          : 'grid size-7 place-items-center rounded-[var(--radius-sm)] text-[var(--fg-subtle)] transition-colors duration-[var(--duration-fast)] hover:bg-white/[0.05] hover:text-foreground'
      }
    >
      {icon}
    </button>
  )
}

interface VersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  mode: 'create' | 'edit'
  existing?: ProjectVersion
}

function VersionDialog({
  open,
  onOpenChange,
  projectId,
  mode,
  existing
}: VersionDialogProps): React.JSX.Element {
  // Component is mount-unmounted by the parent on each open, so useState initializers
  // run fresh every time the dialog opens — no effect needed to sync from props.
  const createVersion = useCreateProjectVersion(projectId)
  const updateVersion = useUpdateProjectVersion(projectId)
  const [version, setVersion] = useState(existing?.version ?? '')
  const [releasedAt, setReleasedAt] = useState(existing?.released_at ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const pending = createVersion.isPending || updateVersion.isPending

  const handleSubmit = (): void => {
    if (!version.trim()) {
      toast.error('Version label is required')
      return
    }
    if (mode === 'create') {
      createVersion.mutate(
        {
          project_id: projectId,
          version: version.trim(),
          notes: notes.trim() ? notes : null,
          released_at: releasedAt.trim() ? releasedAt : null
        },
        {
          onSuccess: () => {
            toast.success(`Created v${version.trim()}`)
            onOpenChange(false)
          },
          onError: (err) => toast.error(`Create failed: ${err.message}`)
        }
      )
    } else if (existing) {
      updateVersion.mutate(
        {
          id: existing.id,
          patch: {
            version: version.trim(),
            notes: notes.trim() ? notes : null,
            released_at: releasedAt.trim() ? releasedAt : null
          }
        },
        {
          onSuccess: () => {
            toast.success('Version updated')
            onOpenChange(false)
          },
          onError: (err) => toast.error(`Update failed: ${err.message}`)
        }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[520px] gap-0 p-0 overflow-hidden anim-dialog-in"
        showCloseButton={false}
      >
        <DialogHeader className="px-6 pt-6 pb-3 gap-1">
          <DialogTitle className="text-[15px] font-semibold leading-snug">
            {mode === 'create' ? 'New version' : 'Edit version'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--fg-muted)]">
            Record a release label, optional date, and changelog notes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 pb-4">
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[12px] font-medium text-[var(--fg-muted)]">Version</span>
              <Input
                className="h-8 text-[13px] font-mono"
                placeholder="1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[12px] font-medium text-[var(--fg-muted)]">
                Released at (optional)
              </span>
              <Input
                type="date"
                className="h-8 text-[13px]"
                value={releasedAt}
                onChange={(e) => setReleasedAt(e.target.value)}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[var(--fg-muted)]">Changelog notes</span>
            <textarea
              className="w-full min-h-[160px] resize-y rounded-md border border-input bg-transparent px-3 py-2 text-[13px] font-mono leading-[1.55] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-[color,box-shadow] dark:bg-input/30"
              placeholder="- Added thing\n- Fixed bug"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border-soft)] bg-[var(--surface-1)]">
          <span className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit} disabled={pending}>
            {pending ? 'Saving…' : mode === 'create' ? 'Create version' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteVersionConfirm({
  project,
  target,
  onClose
}: {
  project: Project
  target: ProjectVersion | null
  onClose: () => void
}): React.JSX.Element {
  const deleteVersion = useDeleteProjectVersion(project.id)
  const updateProject = useUpdateProject()

  const handleConfirm = (): void => {
    if (!target) return
    const id = target.id
    const label = target.version

    const finalize = (): void => {
      deleteVersion.mutate(id, {
        onSuccess: () => {
          toast.success(`Deleted v${label}`)
          onClose()
        },
        onError: (err) => toast.error(err.message)
      })
    }

    // If we're deleting the current version, clear the pointer first to avoid a dangling reference.
    if (project.current_version_id === id) {
      updateProject.mutate(
        { id: project.id, patch: { current_version_id: null } },
        { onSuccess: finalize, onError: (err) => toast.error(err.message) }
      )
    } else {
      finalize()
    }
  }

  return (
    <AlertDialog open={Boolean(target)} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete v{target?.version}?</AlertDialogTitle>
          <AlertDialogDescription>
            The version and its changelog will be removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteVersion.isPending || updateProject.isPending}
          >
            {deleteVersion.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
