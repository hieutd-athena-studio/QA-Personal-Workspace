import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Separator } from '@renderer/components/ui/separator'
import { TestCaseForm } from '@renderer/components/cases/TestCaseForm'

export const Route = createFileRoute('/projects/$projectId/cases/new')({
  component: NewCaseRoute
})

function NewCaseRoute(): React.JSX.Element {
  const { projectId } = useParams({ from: '/projects/$projectId/cases/new' })
  const navigate = useNavigate()

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
        <div className="mb-1">
          <span className="inline-flex items-center rounded-md border bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            NEW
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight">New test case</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Fill in the details below. A unique ID will be assigned on creation.
        </p>
      </div>

      <Separator className="mb-6" />

      <TestCaseForm
        projectId={projectId}
        mode="create"
        onDone={() =>
          navigate({ to: '/projects/$projectId', params: { projectId }, search: { tab: 'cases' } })
        }
      />
    </div>
  )
}
