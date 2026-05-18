import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Play, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useDeleteTestCycle, useTestCyclesForPlan } from '@renderer/hooks/useTestCycles'
import { NewCycleDialog } from './NewCycleDialog'
import { ManageAssignmentsDialog } from './ManageAssignmentsDialog'

interface Props {
  projectId: string
  planId: string
}

export function TestCyclesPanel({ projectId, planId }: Props): React.JSX.Element {
  const { data: cycles } = useTestCyclesForPlan(planId)
  const deleteCycle = useDeleteTestCycle(projectId)
  const [newOpen, setNewOpen] = useState(false)
  const [manageId, setManageId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 size-4" /> New cycle
        </Button>
      </div>

      {(cycles ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">No cycles for this plan yet.</p>
      )}

      {(cycles ?? []).map((cycle) => (
        <Card key={cycle.id}>
          <CardContent className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-muted-foreground">{cycle.display_id}</span>
                <span className="truncate font-medium">{cycle.name}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                  {cycle.environment}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setManageId(cycle.id)}>
              Manage cases
            </Button>
            <Button size="sm" asChild>
              <Link to="/cycles/$cycleId/execute" params={{ cycleId: cycle.id }}>
                <Play className="mr-1 size-3" /> Execute
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (!confirm(`Delete cycle "${cycle.name}"?`)) return
                deleteCycle.mutate(cycle.id, {
                  onSuccess: () => toast.success('Deleted'),
                  onError: (e) => toast.error(e.message)
                })
              }}
              aria-label={`Delete ${cycle.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </CardContent>
        </Card>
      ))}

      <NewCycleDialog
        projectId={projectId}
        planId={planId}
        open={newOpen}
        onOpenChange={setNewOpen}
      />
      {manageId && (
        <ManageAssignmentsDialog
          projectId={projectId}
          cycleId={manageId}
          open={Boolean(manageId)}
          onOpenChange={(o) => !o && setManageId(null)}
        />
      )}
    </div>
  )
}
