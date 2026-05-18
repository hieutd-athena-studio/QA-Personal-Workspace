import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { useCreateTestType } from '@renderer/hooks/useTestTypes'

interface Props {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewTestTypeDialog({ projectId, open, onOpenChange }: Props): React.JSX.Element {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const create = useCreateTestType(projectId)

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(
      { project_id: projectId, name: name.trim(), description: desc.trim() || null },
      {
        onSuccess: () => {
          toast.success('Created')
          setName('')
          setDesc('')
          onOpenChange(false)
        },
        onError: (e) => toast.error(e.message)
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New test type</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tt-name">Name</Label>
            <Input id="tt-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tt-desc">Description (optional)</Label>
            <Input id="tt-desc" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
