import { Link } from '@tanstack/react-router'
import { CalendarDays, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useDeleteTestPlan, useTestPlans } from '@renderer/hooks/useTestPlans'
import { useTestCyclesForProject } from '@renderer/hooks/useTestCycles'
import { Trash2 } from 'lucide-react'

interface Props {
  projectId: string
}

export function PlansPane({ projectId }: Props): React.JSX.Element {
  const { data: plans } = useTestPlans(projectId)
  const { data: allCycles } = useTestCyclesForProject(projectId)
  const deletePlan = useDeleteTestPlan(projectId)

  const cyclesByPlan = new Map<string, number>()
  for (const c of allCycles ?? []) {
    cyclesByPlan.set(c.plan_id, (cyclesByPlan.get(c.plan_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" asChild>
          <Link to="/projects/$projectId/plans/new" params={{ projectId }}>
            <Plus className="mr-2 size-4" /> New plan
          </Link>
        </Button>
      </div>

      {(plans ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <CalendarDays className="size-8 text-muted-foreground" />
            <p className="text-sm">No test plans yet.</p>
            <Button size="sm" asChild>
              <Link to="/projects/$projectId/plans/new" params={{ projectId }}>
                <Plus className="mr-2 size-4" /> New plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {(plans ?? []).map((plan) => (
            <li key={plan.id}>
              <Card>
                <CardContent className="flex items-center gap-4 py-4">
                  <Link
                    to="/projects/$projectId/plans/$planId"
                    params={{ projectId, planId: plan.id }}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {plan.display_id}
                      </span>
                      <span className="truncate font-medium">{plan.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {plan.start_date && plan.end_date
                        ? `${plan.start_date} → ${plan.end_date}`
                        : 'No dates set'}
                      {plan.working_days !== null && ` · ${plan.working_days} working days`}
                      {' · '}
                      {cyclesByPlan.get(plan.id) ?? 0} cycle
                      {(cyclesByPlan.get(plan.id) ?? 0) === 1 ? '' : 's'}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!confirm(`Delete plan "${plan.name}"?`)) return
                      deletePlan.mutate(plan.id, {
                        onSuccess: () => toast.success('Deleted'),
                        onError: (e) => toast.error(e.message)
                      })
                    }}
                    aria-label={`Delete ${plan.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
