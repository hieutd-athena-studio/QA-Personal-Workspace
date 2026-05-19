import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useTestPlan } from '@renderer/hooks/useTestPlans'
import { TestPlanForm } from '@renderer/components/plans/TestPlanForm'
import { TestCyclesPanel } from '@renderer/components/cycles/TestCyclesPanel'
import { Separator } from '@renderer/components/ui/separator'

export const Route = createFileRoute('/projects/$projectId/plans/$planId')({
  component: EditPlanRoute
})

function EditPlanRoute(): React.JSX.Element {
  const { projectId, planId } = useParams({ from: '/projects/$projectId/plans/$planId' })
  const navigate = useNavigate()
  const { data: plan, isLoading } = useTestPlan(planId)

  if (isLoading) {
    return (
      <div className="overflow-y-auto py-5 px-9">
        <div className="max-w-[920px] mx-auto">
          <div className="h-4 w-36 animate-pulse rounded bg-[var(--surface-3)] mb-4" />
          <div className="h-8 w-64 animate-pulse rounded bg-[var(--surface-3)]" />
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="overflow-y-auto py-5 px-9">
        <div className="max-w-[920px] mx-auto">Plan not found.</div>
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
          search={{ tab: 'plans' }}
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-subtle)] mb-4 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" />
          <span>Back</span>
          <span className="text-[var(--fg-faint)]">›</span>
          <span className="text-[var(--fg-muted)]">Plans &amp; cycles</span>
        </Link>

        <TestPlanForm
          projectId={projectId}
          mode="edit"
          initial={plan}
          onDone={() =>
            void navigate({
              to: '/projects/$projectId',
              params: { projectId },
              search: { tab: 'plans' }
            })
          }
        />

        <Separator className="my-8" />

        <TestCyclesPanel projectId={projectId} planId={planId} />
      </div>
    </div>
  )
}
