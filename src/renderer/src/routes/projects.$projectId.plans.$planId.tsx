import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useTestPlan } from '@renderer/hooks/useTestPlans'
import { TestPlanForm } from '@renderer/components/plans/TestPlanForm'
import { TestCyclesPanel } from '@renderer/components/cycles/TestCyclesPanel'

export const Route = createFileRoute('/projects/$projectId/plans/$planId')({
  component: EditPlanRoute
})

function EditPlanRoute(): React.JSX.Element {
  const { projectId, planId } = useParams({ from: '/projects/$projectId/plans/$planId' })
  const navigate = useNavigate()
  const { data: plan, isLoading } = useTestPlan(planId)

  if (isLoading)
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      </div>
    )
  if (!plan) return <div className="mx-auto max-w-4xl px-6 py-10">Plan not found.</div>

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-10">
      <section>
        <h1 className="mb-2 text-2xl font-bold">
          <span className="mr-2 font-mono text-sm text-muted-foreground">{plan.display_id}</span>
          {plan.name}
        </h1>
        <TestPlanForm
          projectId={projectId}
          mode="edit"
          initial={plan}
          onDone={() => navigate({ to: '/projects/$projectId', params: { projectId } })}
        />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Cycles</h2>
        <TestCyclesPanel projectId={projectId} planId={planId} />
      </section>
    </div>
  )
}
