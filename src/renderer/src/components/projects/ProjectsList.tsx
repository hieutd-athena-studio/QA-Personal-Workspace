import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight, Trash2 } from 'lucide-react'
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
import { useDeleteProject } from '@renderer/hooks/useProjects'
import { useActiveProjectStore } from '@renderer/stores/active-project'
import type { Project } from '@shared/types/projects'

interface Props {
  projects: Project[]
}

interface DeleteTarget {
  id: string
  name: string
  prefix: string
}

export function ProjectsList({ projects }: Props): React.JSX.Element {
  const deleteProject = useDeleteProject()
  const activeId = useActiveProjectStore((s) => s.id)
  const setActiveId = useActiveProjectStore((s) => s.setId)
  const [confirmTarget, setConfirmTarget] = useState<DeleteTarget | null>(null)

  const handleDeleteConfirm = (): void => {
    if (!confirmTarget) return
    const { id, name } = confirmTarget
    deleteProject.mutate(id, {
      onSuccess: () => {
        if (activeId === id) setActiveId(null)
        toast.success(`Deleted ${name}`)
        setConfirmTarget(null)
      },
      onError: (err) => {
        toast.error(`Delete failed: ${err.message}`)
        setConfirmTarget(null)
      }
    })
  }

  return (
    <>
      {/* List container — 1px hairline gap between rows via gap + border-coloured bg */}
      <div
        className="flex flex-col gap-px rounded-[var(--radius-lg)] border border-border overflow-hidden"
        style={{ background: 'hsl(var(--border))' }}
        role="list"
        aria-label="Projects"
      >
        {projects.map((project, i) => (
          <ProjectRow
            key={project.id}
            project={project}
            index={i}
            onDeleteRequest={(p) =>
              setConfirmTarget({
                id: p.id,
                name: p.name,
                prefix: p.display_prefix
              })
            }
          />
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmTarget?.name ?? 'project'}?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>
                {confirmTarget?.prefix} — {confirmTarget?.name}
              </strong>{' '}
              and all its test cases, plans, and cycles will be removed. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* ─── ProjectRow ────────────────────────────────────────────────── */

interface RowProps {
  project: Project
  index: number
  onDeleteRequest: (project: Project) => void
}

function ProjectRow({ project, index, onDeleteRequest }: RowProps): React.JSX.Element {
  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className="group block bg-[var(--surface-1)] hover:bg-[var(--surface-2)] transition-colors duration-[var(--duration-fast)] anim-row-enter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
      style={{ animationDelay: `${Math.min(index, 7) * 30}ms` }}
      aria-label={project.name}
      role="listitem"
    >
      {/* 6-column grid: swatch | prefix | name+desc | spacer | stats | actions */}
      <div
        className="grid items-center gap-4 px-5 py-4"
        style={{ gridTemplateColumns: '14px auto auto 1fr auto auto' }}
      >
        {/* Logo or color swatch — 12×12px */}
        {project.logo ? (
          <span
            className="block size-3 shrink-0 overflow-hidden rounded-[3px] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.2)]"
            aria-hidden="true"
          >
            <img src={project.logo} alt="" className="size-full object-cover" />
          </span>
        ) : (
          <span
            className="block size-3 shrink-0 rounded-[3px] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.2)]"
            style={{ backgroundColor: project.color }}
            aria-hidden="true"
          />
        )}

        {/* Prefix */}
        <span className="mono text-[11.5px] tracking-[0.05em] text-[var(--fg-subtle)] shrink-0">
          {project.display_prefix}
        </span>

        {/* Name + description */}
        <div className="min-w-0">
          <div className="text-[14.5px] font-semibold tracking-[-0.005em] leading-snug">
            {project.name}
          </div>
          {project.description && (
            <div className="text-[12.5px] text-[var(--fg-muted)] mt-0.5 truncate max-w-[60ch]">
              {project.description}
            </div>
          )}
        </div>

        {/* Spacer — takes the 1fr column */}
        <div aria-hidden="true" />

        {/* Stats — case_counter + plan_counter */}
        <div className="flex gap-3.5 text-[11.5px] text-[var(--fg-subtle)] whitespace-nowrap shrink-0">
          <span>
            <b className="mono font-semibold tabular-nums text-foreground pr-0.5">
              {project.case_counter}
            </b>
            cases
          </span>
          <span>
            <b className="mono font-semibold tabular-nums text-foreground pr-0.5">
              {project.plan_counter}
            </b>
            plans
          </span>
        </div>

        {/* Actions — opacity 0, reveal on group-hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)]">
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--fg-subtle)] hover:text-destructive hover:bg-destructive/10 transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label={`Delete ${project.name}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDeleteRequest(project)
            }}
          >
            <Trash2 className="size-[14px]" />
          </button>

          <span
            className="text-[var(--fg-faint)] group-hover:text-[var(--fg-muted)] group-hover:translate-x-0.5 transition-[color,transform] duration-[var(--duration-fast)]"
            aria-hidden="true"
          >
            <ChevronRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
