import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { TestCaseForm } from '@renderer/components/cases/TestCaseForm'

export const Route = createFileRoute('/projects/$projectId/cases/new')({
  component: NewCaseRoute
})

function NewCaseRoute(): React.JSX.Element {
  const { projectId } = useParams({ from: '/projects/$projectId/cases/new' })
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">New test case</h1>
      <TestCaseForm
        projectId={projectId}
        mode="create"
        onDone={() => navigate({ to: '/projects/$projectId', params: { projectId } })}
      />
    </div>
  )
}
