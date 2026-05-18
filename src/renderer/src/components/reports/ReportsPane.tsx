import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { useTestCyclesForProject } from '@renderer/hooks/useTestCycles'
import { useTestPlans } from '@renderer/hooks/useTestPlans'
import { useCycleProgress } from '@renderer/hooks/useAssignments'
import { exportCycleCsv } from './export-csv'

interface Props {
  projectId: string
}

export function ReportsPane({ projectId }: Props): React.JSX.Element {
  const { data: cycles } = useTestCyclesForProject(projectId)
  const { data: plans } = useTestPlans(projectId)
  const [cycleId, setCycleId] = useState<string>('')
  const { data: progress } = useCycleProgress(cycleId || undefined)

  const selectedCycle = (cycles ?? []).find((c) => c.id === cycleId)
  const selectedPlan = (plans ?? []).find((p) => p.id === selectedCycle?.plan_id)

  const handleExport = async (): Promise<void> => {
    if (!cycleId) return
    try {
      await exportCycleCsv(cycleId)
      toast.success('CSV exported')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="size-5 text-muted-foreground" />
            <h3 className="font-medium">Cycle report</h3>
          </div>
          <Select value={cycleId} onValueChange={setCycleId}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a cycle…" />
            </SelectTrigger>
            <SelectContent>
              {(cycles ?? []).length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">No cycles.</div>
              ) : (
                (cycles ?? []).map((c) => {
                  const plan = (plans ?? []).find((p) => p.id === c.plan_id)
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      {c.display_id} · {c.name}
                      {plan && ` (${plan.display_id})`}
                    </SelectItem>
                  )
                })
              )}
            </SelectContent>
          </Select>

          {selectedCycle && progress && (
            <div className="grid grid-cols-5 gap-3 rounded-md border p-3">
              <Stat label="Total" value={progress.total} tone="muted" />
              <Stat label="Pass" value={progress.pass} tone="emerald" />
              <Stat label="Fail" value={progress.fail} tone="red" />
              <Stat label="Blocked" value={progress.blocked} tone="amber" />
              <Stat label="Unexec." value={progress.unexecuted} tone="muted" />
            </div>
          )}

          {selectedCycle && (
            <p className="text-xs text-muted-foreground">
              Plan {selectedPlan?.display_id} · Environment {selectedCycle.environment}
            </p>
          )}

          <Button onClick={handleExport} disabled={!cycleId}>
            <Download className="mr-2 size-4" /> Export CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({
  label,
  value,
  tone
}: {
  label: string
  value: number
  tone: 'emerald' | 'red' | 'amber' | 'muted'
}): React.JSX.Element {
  const cls =
    tone === 'emerald'
      ? 'text-emerald-600'
      : tone === 'red'
        ? 'text-destructive'
        : tone === 'amber'
          ? 'text-amber-600'
          : 'text-foreground'
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${cls}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
