import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useTestCase } from '@renderer/hooks/useTestCases'
import { TestCaseForm } from '@renderer/components/cases/TestCaseForm'

export const Route = createFileRoute('/projects/$projectId/cases/$caseId')({
  component: EditCaseRoute
})

function EditCaseRoute(): React.JSX.Element {
  const { projectId, caseId } = useParams({ from: '/projects/$projectId/cases/$caseId' })
  const navigate = useNavigate()
  const { data: testCase, isLoading } = useTestCase(caseId)

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      </div>
    )

  if (!testCase) return <div className="mx-auto max-w-3xl px-6 py-10">Test case not found.</div>

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">
        <span className="mr-2 font-mono text-sm text-muted-foreground">{testCase.display_id}</span>
        {testCase.name}
      </h1>
      <TestCaseForm
        projectId={projectId}
        mode="edit"
        initial={testCase}
        onDone={() => navigate({ to: '/projects/$projectId', params: { projectId } })}
      />
    </div>
  )
}
