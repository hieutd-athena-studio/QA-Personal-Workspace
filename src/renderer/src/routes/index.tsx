import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@renderer/components/projects/ProjectsPage'

export const Route = createFileRoute('/')({
  component: ProjectsPage
})
