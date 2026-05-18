import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useDeleteProject } from '@renderer/hooks/useProjects'
import type { Project } from '@shared/types/projects'

interface Props {
  projects: Project[]
}

export function ProjectsList({ projects }: Props): React.JSX.Element {
  const deleteProject = useDeleteProject()

  const handleDelete = (id: string, name: string): void => {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return
    deleteProject.mutate(id, {
      onSuccess: () => toast.success(`Deleted ${name}`),
      onError: (err) => toast.error(`Delete failed: ${err.message}`)
    })
  }

  return (
    <ul className="space-y-3">
      {projects.map((project) => (
        <li key={project.id}>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <span
                className="size-10 shrink-0 rounded-md"
                style={{ backgroundColor: project.color }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {project.display_prefix}
                  </span>
                  <span className="truncate font-medium">{project.name}</span>
                </div>
                {project.description && (
                  <p className="truncate text-sm text-muted-foreground">{project.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(project.id, project.name)}
                aria-label={`Delete ${project.name}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
