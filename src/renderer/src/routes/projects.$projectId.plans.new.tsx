import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { TestPlanForm } from '@renderer/components/plans/TestPlanForm'

export const Route = createFileRoute('/projects/$projectId/plans/new')({
  component: NewPlanRoute
})

function NewPlanRoute(): React.JSX.Element {
  const { projectId } = useParams({ from: '/projects/$projectId/plans/new' })
  const navigate = useNavigate()
  return (
    <div className="overflow-y-auto scrollbar-thin py-5 px-9 pb-16">
      <div className="max-w-[920px] mx-auto">
        {/* Back breadcrumb */}
        <Link
          to="/projects/$projectId"
          params={{ projectId }}
          search={{ tab: 'plans' }}
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-subtle)] mb-4 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" />
          <span>Back</span>
          <span className="text-[var(--fg-faint)]">›</span>
          <span className="text-[var(--fg-muted)]">Plans &amp; cycles</span>
        </Link>

        {/* NEW pill */}
        <div className="mb-3">
          <span className="inline-flex items-center h-5 px-2 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">
            NEW
          </span>
        </div>

        <TestPlanForm
          projectId={projectId}
          mode="create"
          onDone={() =>
            void navigate({
              to: '/projects/$projectId',
              params: { projectId },
              search: { tab: 'plans' }
            })
          }
        />
      </div>
    </div>
  )
}
