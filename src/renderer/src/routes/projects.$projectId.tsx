import { createFileRoute, Outlet, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useActiveProjectStore } from '@renderer/stores/active-project'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectLayout
})

function ProjectLayout(): React.JSX.Element {
  const { projectId } = useParams({ from: '/projects/$projectId' })
  const setActiveId = useActiveProjectStore((s) => s.setId)

  useEffect(() => {
    setActiveId(projectId)
  }, [projectId, setActiveId])

  return <Outlet />
}
