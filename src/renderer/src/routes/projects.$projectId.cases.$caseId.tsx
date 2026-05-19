import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import { useDeleteTestCase, useTestCase } from '@renderer/hooks/useTestCases'
import { useCategories } from '@renderer/hooks/useCategories'
import { TestCaseForm } from '@renderer/components/cases/TestCaseForm'

export const Route = createFileRoute('/projects/$projectId/cases/$caseId')({
  component: EditCaseRoute
})

function EditCaseRoute(): React.JSX.Element {
  const { projectId, caseId } = useParams({ from: '/projects/$projectId/cases/$caseId' })
  const navigate = useNavigate()
  const { data: testCase, isLoading } = useTestCase(caseId)
  const { data: cats } = useCategories(projectId)
  const deleteCase = useDeleteTestCase(projectId)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mb-3 h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-9 w-80 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (!testCase) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link
          to="/projects/$projectId"
          params={{ projectId }}
          search={{ tab: 'cases' }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to cases
        </Link>
        <div className="mt-6 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Test case not found.
        </div>
      </div>
    )
  }

  // Resolve subcategory label for display
  const subcat = cats?.find((c) => c.id === testCase.subcategory_id)
  const parentCat = subcat ? cats?.find((c) => c.id === subcat.parent_category_id) : undefined

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Back navigation */}
      <Link
        to="/projects/$projectId"
        params={{ projectId }}
        search={{ tab: 'cases' }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to cases
      </Link>

      {/* Page header */}
      <div className="mt-5 mb-6">
        {/* Display ID badge */}
        <div className="mb-2">
          <span className="inline-flex items-center rounded-md border bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground select-all">
            {testCase.display_id}
          </span>
        </div>

        {/* Case name + delete action */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">{testCase.name}</h1>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (!window.confirm('Delete this test case? This cannot be undone.')) return
              deleteCase.mutate(caseId, {
                onSuccess: () => {
                  toast.success('Test case deleted')
                  navigate({
                    to: '/projects/$projectId',
                    params: { projectId },
                    search: { tab: 'cases' }
                  })
                },
                onError: (e) => toast.error(e.message)
              })
            }}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Delete
          </Button>
        </div>

        {/* Metadata status row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Version pill */}
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            v{testCase.version}
          </span>
          {/* Subcategory breadcrumb */}
          {subcat && (
            <>
              <span className="text-xs text-muted-foreground">/</span>
              {parentCat && (
                <>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {parentCat.name}
                  </span>
                  <span className="text-xs text-muted-foreground">/</span>
                </>
              )}
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {subcat.name}
              </span>
            </>
          )}
          {!subcat && (
            <span className="text-xs text-muted-foreground">No subcategory assigned</span>
          )}
        </div>
      </div>

      <Separator className="mb-6" />

      <TestCaseForm
        projectId={projectId}
        mode="edit"
        initial={testCase}
        onDone={() =>
          navigate({ to: '/projects/$projectId', params: { projectId }, search: { tab: 'cases' } })
        }
      />
    </div>
  )
}
