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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { useCreateCategory } from '@renderer/hooks/useCategories'
import type { Category } from '@shared/types/categories'

interface Props {
  projectId: string
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ROOT = '__root__'

export function NewProjectCategoryDialog({
  projectId,
  categories,
  open,
  onOpenChange
}: Props): React.JSX.Element {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<string>(ROOT)
  const create = useCreateCategory(projectId)

  const topCats = categories.filter((c) => !c.parent_category_id)

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(
      {
        project_id: projectId,
        parent_category_id: parentId === ROOT ? null : parentId,
        name: name.trim()
      },
      {
        onSuccess: () => {
          toast.success(`Created ${name.trim()}`)
          setName('')
          setParentId(ROOT)
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
          <DialogTitle>New category</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-parent">Parent (optional)</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger id="cat-parent">
                <SelectValue placeholder="Top-level category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT}>Top-level category</SelectItem>
                {topCats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} (as subcategory)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? 'Creating…' : 'Create category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
