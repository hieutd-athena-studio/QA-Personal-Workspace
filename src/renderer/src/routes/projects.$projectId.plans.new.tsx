import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { TestPlanForm } from '@renderer/components/plans/TestPlanForm'

export const Route = createFileRoute('/projects/$projectId/plans/new')({
  component: NewPlanRoute
})

function NewPlanRoute(): React.JSX.Element {
  const { projectId } = useParams({ from: '/projects/$projectId/plans/new' })
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">New test plan</h1>
      <TestPlanForm
        projectId={projectId}
        mode="create"
        onDone={() => navigate({ to: '/projects/$projectId', params: { projectId } })}
      />
    </div>
  )
}
