import { Layers, Sparkles } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useProjects } from '@renderer/hooks/useProjects'
import { useUIStore } from '@renderer/stores/ui'
import { NewProjectDialog } from './NewProjectDialog'
import { ProjectsList } from './ProjectsList'

export function ProjectsPage(): React.JSX.Element {
  const dialogOpen = useUIStore((s) => s.newProjectOpen)
  const setDialogOpen = useUIStore((s) => s.setNewProjectOpen)
  const openNewProject = useUIStore((s) => s.openNewProject)
  const { data: projects, isLoading, error } = useProjects()

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin px-9 py-8 pb-12">
        <div className="mx-auto max-w-[920px]">
          {/* Header */}
          <header className="flex items-end gap-4 mb-7">
            <div className="flex-1 min-w-0">
              <h1 className="text-[28px] font-semibold tracking-[-0.02em] leading-[1.15] mb-1.5">
                Projects
              </h1>
              <div className="flex items-center gap-1.5 text-[13px] text-[var(--fg-muted)]">
                <span>Open one to browse cases, plans, and cycles.</span>
                <span className="text-[var(--fg-faint)]" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1">
                  Press
                  <span className="inline-flex gap-0.5">
                    <span className="kbd">
                      {typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
                        ? '⌘'
                        : 'Ctrl'}
                    </span>
                    <span className="kbd">K</span>
                  </span>
                  to jump anywhere.
                </span>
              </div>
            </div>
            <Button onClick={openNewProject} className="shrink-0">
              <Sparkles className="size-[13px]" />
              New project
            </Button>
          </header>

          {/* Error banner */}
          {error && (
            <div className="mb-5 rounded-[var(--radius-md)] border border-[var(--fail)]/30 bg-[var(--fail-soft)] px-4 py-3 text-[13px] text-[var(--fail)]">
              Failed to load projects: {error.message}
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div
              className="flex flex-col gap-px rounded-[var(--radius-lg)] border border-border overflow-hidden"
              style={{ background: 'hsl(var(--border))' }}
              aria-label="Loading projects"
              aria-busy="true"
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[68px] animate-pulse bg-[var(--surface-2)]"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && projects && projects.length === 0 && (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-white/[0.012] dark:bg-white/[0.012] py-14 px-6 text-center text-[var(--fg-muted)]">
              <div className="size-10 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent-hover)] grid place-items-center mx-auto mb-3.5">
                <Layers className="size-[18px]" />
              </div>
              <h4 className="text-[15px] font-semibold text-foreground mb-1">No projects yet</h4>
              <p className="text-[13px] mb-4">
                Create one to start tracking test cases and execution cycles.
              </p>
              <Button onClick={openNewProject}>
                <Sparkles className="size-[13px]" />
                Create your first project
              </Button>
            </div>
          )}

          {/* Projects list */}
          {!isLoading && !error && projects && projects.length > 0 && (
            <ProjectsList projects={projects} />
          )}
        </div>
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
