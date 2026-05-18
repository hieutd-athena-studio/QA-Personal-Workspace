import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { useTestCases } from '@renderer/hooks/useTestCases'
import { useTestPlans } from '@renderer/hooks/useTestPlans'
import { useTestCyclesForProject } from '@renderer/hooks/useTestCycles'
import { useTestTypes } from '@renderer/hooks/useTestTypes'
import type { Project } from '@shared/types/projects'

interface Props {
  project: Project
}

export function DashboardPane({ project }: Props): React.JSX.Element {
  const { data: cases } = useTestCases(project.id)
  const { data: plans } = useTestPlans(project.id)
  const { data: cycles } = useTestCyclesForProject(project.id)
  const { data: types } = useTestTypes(project.id)

  const today = new Date().setHours(0, 0, 0, 0)
  const upcomingDeadlines = (plans ?? [])
    .filter((p) => p.end_date && new Date(p.end_date).getTime() >= today)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
    .slice(0, 5)

  const totalTaskDays = (plans ?? []).reduce((acc, p) => acc + (p.working_days ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Test cases" value={cases?.length ?? 0} />
        <Stat label="Test plans" value={plans?.length ?? 0} />
        <Stat label="Cycles" value={cycles?.length ?? 0} />
        <Stat label="Test types" value={types?.length ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming plan deadlines.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingDeadlines.map((p) => {
                const days = Math.ceil(
                  (new Date(p.end_date!).getTime() - today) / (1000 * 60 * 60 * 24)
                )
                const tone =
                  days <= 2
                    ? 'text-destructive'
                    : days <= 7
                      ? 'text-amber-600'
                      : 'text-muted-foreground'
                return (
                  <li key={p.id} className="flex items-baseline justify-between text-sm">
                    <span>
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        {p.display_id}
                      </span>
                      {p.name}
                    </span>
                    <span className={tone}>
                      {days === 0 ? 'today' : days === 1 ? '1 day' : `${days} days`}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task budget</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Total planned working days across all plans:{' '}
            <span className="font-mono font-semibold">{totalTaskDays.toFixed(2)}</span>
          </p>
          <p className="mt-1 text-muted-foreground">
            Per-plan tasks track 0.25-day granularity; this is the sum of working_days fields.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
