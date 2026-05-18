import { useState } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useProjects } from '@renderer/hooks/useProjects'
import { NewProjectDialog } from './NewProjectDialog'
import { ProjectsList } from './ProjectsList'

export function ProjectsPage(): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: projects, isLoading, error } = useProjects()

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Test case management projects on this machine.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 size-4" /> New project
        </Button>
      </header>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load projects: {error.message}
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && !error && projects && projects.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <FolderOpen className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="text-sm text-muted-foreground">
            Create your first project to start managing test cases.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 size-4" /> New project
          </Button>
        </div>
      )}

      {!isLoading && !error && projects && projects.length > 0 && (
        <ProjectsList projects={projects} />
      )}

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
