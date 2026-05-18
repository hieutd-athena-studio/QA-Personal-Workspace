import { useState } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useDeleteTestType, useTestTypeCounts, useTestTypes } from '@renderer/hooks/useTestTypes'
import { useTestCases } from '@renderer/hooks/useTestCases'
import { NewTestTypeDialog } from './NewTestTypeDialog'
import { ManageTypeCasesDialog } from './ManageTypeCasesDialog'

interface Props {
  projectId: string
}

export function TypesPane({ projectId }: Props): React.JSX.Element {
  const { data: types } = useTestTypes(projectId)
  const { data: counts } = useTestTypeCounts(projectId)
  const { data: cases } = useTestCases(projectId)
  const del = useDeleteTestType(projectId)
  const [newOpen, setNewOpen] = useState(false)
  const [manageId, setManageId] = useState<string | null>(null)

  const total = cases?.length ?? 0

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 size-4" /> New type
        </Button>
      </div>

      {(types ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="size-8 text-muted-foreground" />
            <p className="text-sm">No test types yet.</p>
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus className="mr-2 size-4" /> New type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {(types ?? []).map((t) => (
            <li key={t.id}>
              <Card>
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.name}</p>
                    {t.description && (
                      <p className="truncate text-xs text-muted-foreground">{t.description}</p>
                    )}
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {counts?.[t.id] ?? 0} / {total}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setManageId(t.id)}>
                    Manage cases
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!confirm(`Delete test type "${t.name}"?`)) return
                      del.mutate(t.id, {
                        onSuccess: () => toast.success('Deleted'),
                        onError: (e) => toast.error(e.message)
                      })
                    }}
                    aria-label={`Delete ${t.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <NewTestTypeDialog projectId={projectId} open={newOpen} onOpenChange={setNewOpen} />
      {manageId && (
        <ManageTypeCasesDialog
          projectId={projectId}
          typeId={manageId}
          open={Boolean(manageId)}
          onOpenChange={(o) => !o && setManageId(null)}
        />
      )}
    </div>
  )
}
