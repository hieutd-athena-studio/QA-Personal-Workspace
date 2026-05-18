import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { useCategories } from '@renderer/hooks/useCategories'
import { useCreateTestCase, useUpdateTestCase } from '@renderer/hooks/useTestCases'
import type { TestCaseWithSteps } from '@shared/types/test_cases'

const FormSchema = z.object({
  name: z.string().min(1, 'Required').max(200),
  subcategory_id: z.string().nullable(),
  version: z.string().min(1),
  description: z.string(),
  expected_result: z.string(),
  steps: z.array(
    z.object({
      action: z.string().min(1, 'Action required'),
      expected: z.string()
    })
  )
})

type FormValues = z.infer<typeof FormSchema>

interface Props {
  projectId: string
  mode: 'create' | 'edit'
  initial?: TestCaseWithSteps
  onDone: () => void
}

const NONE = '__none__'

export function TestCaseForm({ projectId, mode, initial, onDone }: Props): React.JSX.Element {
  const { data: cats } = useCategories(projectId)
  const subcats = (cats ?? []).filter((c) => c.parent_category_id)
  const createCase = useCreateTestCase(projectId)
  const updateCase = useUpdateTestCase(projectId)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      subcategory_id: initial?.subcategory_id ?? null,
      version: initial?.version ?? '1.0',
      description: initial?.description ?? '',
      expected_result: initial?.expected_result ?? '',
      steps: initial?.steps.map((s) => ({ action: s.action, expected: s.expected })) ?? []
    }
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'steps' })

  const submit = form.handleSubmit((values) => {
    if (mode === 'create') {
      createCase.mutate(
        {
          project_id: projectId,
          subcategory_id: values.subcategory_id,
          name: values.name,
          description: values.description || null,
          expected_result: values.expected_result || null,
          version: values.version,
          steps: values.steps
        },
        {
          onSuccess: (tc) => {
            toast.success(`Created ${tc.display_id}`)
            onDone()
          },
          onError: (e) => toast.error(e.message)
        }
      )
    } else if (initial) {
      updateCase.mutate(
        {
          id: initial.id,
          patch: {
            subcategory_id: values.subcategory_id,
            name: values.name,
            description: values.description || null,
            expected_result: values.expected_result || null,
            version: values.version,
            steps: values.steps
          }
        },
        {
          onSuccess: () => {
            toast.success('Saved')
            onDone()
          },
          onError: (e) => toast.error(e.message)
        }
      )
    }
  })

  const pending = createCase.isPending || updateCase.isPending

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register('name')} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subcat">Subcategory</Label>
          <Select
            value={form.watch('subcategory_id') ?? NONE}
            onValueChange={(v) => form.setValue('subcategory_id', v === NONE ? null : v)}
          >
            <SelectTrigger id="subcat">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {subcats.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input id="version" {...form.register('version')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <textarea
          id="desc"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...form.register('description')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp">Expected result (overall)</Label>
        <textarea
          id="exp"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...form.register('expected_result')}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Steps</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ action: '', expected: '' })}
          >
            <Plus className="mr-1 size-3" /> Add step
          </Button>
        </div>
        {fields.length === 0 && (
          <p className="text-xs text-muted-foreground">No steps. Click &quot;Add step&quot;.</p>
        )}
        {fields.map((field, i) => (
          <div key={field.id} className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => remove(i)}
                aria-label={`Remove step ${i + 1}`}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <textarea
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Action"
                {...form.register(`steps.${i}.action`)}
              />
              <textarea
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Expected"
                {...form.register(`steps.${i}.expected`)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
