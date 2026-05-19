import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteTestCase, useTestCase } from '@renderer/hooks/useTestCases'
import { TestCaseForm } from '@renderer/components/cases/TestCaseForm'

export const Route = createFileRoute('/projects/$projectId/cases/$caseId')({
  component: EditCaseRoute
})

function EditCaseRoute(): React.JSX.Element {
  const { projectId, caseId } = useParams({ from: '/projects/$projectId/cases/$caseId' })
  const navigate = useNavigate()
  const { data: testCase, isLoading } = useTestCase(caseId)
  const deleteCase = useDeleteTestCase(projectId)

  const goBack = (): void => {
    void navigate({
      to: '/projects/$projectId',
      params: { projectId },
      search: { tab: 'cases' }
    })
  }

  if (isLoading) {
    return (
      <div className="overflow-y-auto py-5 px-9">
        <div className="max-w-[920px] mx-auto">
          {/* breadcrumb skeleton */}
          <div className="mb-4 h-4 w-48 animate-pulse rounded bg-[var(--surface-3)]" />
          {/* id pill skeleton */}
          <div className="mb-3 h-5 w-24 animate-pulse rounded bg-[var(--surface-3)]" />
          {/* h1 skeleton */}
          <div className="h-8 w-80 animate-pulse rounded bg-[var(--surface-3)]" />
        </div>
      </div>
    )
  }

  if (!testCase) {
    return (
      <div className="overflow-y-auto py-5 px-9">
        <div className="max-w-[920px] mx-auto">
          <Link
            to="/projects/$projectId"
            params={{ projectId }}
            search={{ tab: 'cases' }}
            className="inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-subtle)] mb-4 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3" />
            <span>Back</span>
            <span className="text-[var(--fg-faint)]">›</span>
            <span className="text-[var(--fg-muted)]">Test cases</span>
          </Link>
          <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            Test case not found.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto scrollbar-thin py-5 px-9 pb-16">
      <div className="max-w-[920px] mx-auto">
        {/* Back breadcrumb */}
        <Link
          to="/projects/$projectId"
          params={{ projectId }}
          search={{ tab: 'cases' }}
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-subtle)] mb-4 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" />
          <span>Back</span>
          <span className="text-[var(--fg-faint)]">›</span>
          <span className="text-[var(--fg-muted)]">Test cases</span>
        </Link>

        <TestCaseForm
          projectId={projectId}
          mode="edit"
          initial={testCase}
          onDone={goBack}
          onDeleteSuccess={() => {
            deleteCase.mutate(caseId, {
              onSuccess: () => {
                toast.success('Test case deleted')
                goBack()
              },
              onError: (e) => toast.error(e.message)
            })
          }}
        />
      </div>
    </div>
  )
}
