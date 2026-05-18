import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useProject } from '@renderer/hooks/useProjects'
import { useActiveProjectStore } from '@renderer/stores/active-project'
import { ProjectDetail } from '@renderer/components/projects/ProjectDetail'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectDetailRoute
})

function ProjectDetailRoute(): React.JSX.Element {
  const { projectId } = useParams({ from: '/projects/$projectId' })
  const { data: project, isLoading, error } = useProject(projectId)
  const setActiveId = useActiveProjectStore((s) => s.setId)

  useEffect(() => {
    setActiveId(projectId)
  }, [projectId, setActiveId])

  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    )

  if (error || !project)
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message ?? 'Project not found.'}
        </div>
      </div>
    )

  return <ProjectDetail project={project} />
}
