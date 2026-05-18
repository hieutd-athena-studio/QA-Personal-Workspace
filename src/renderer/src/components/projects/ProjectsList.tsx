import { Link } from '@tanstack/react-router'
import { ChevronRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useDeleteProject } from '@renderer/hooks/useProjects'
import { useActiveProjectStore } from '@renderer/stores/active-project'
import type { Project } from '@shared/types/projects'

interface Props {
  projects: Project[]
}

export function ProjectsList({ projects }: Props): React.JSX.Element {
  const deleteProject = useDeleteProject()
  const activeId = useActiveProjectStore((s) => s.id)
  const setActiveId = useActiveProjectStore((s) => s.setId)

  const handleDelete = (e: React.MouseEvent, id: string, name: string): void => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return
    deleteProject.mutate(id, {
      onSuccess: () => {
        if (activeId === id) setActiveId(null)
        toast.success(`Deleted ${name}`)
      },
      onError: (err) => toast.error(`Delete failed: ${err.message}`)
    })
  }

  return (
    <ul className="space-y-3">
      {projects.map((project) => (
        <li key={project.id}>
          <Link to="/projects/$projectId" params={{ projectId: project.id }} className="block">
            <Card className="cursor-pointer transition-colors hover:bg-accent/40">
              <CardContent className="flex items-center gap-4 py-4">
                <span
                  className="size-10 shrink-0 rounded-md"
                  style={{ backgroundColor: project.color }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
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
                  onClick={(e) => handleDelete(e, project.id, project.name)}
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}
