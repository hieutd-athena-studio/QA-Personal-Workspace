import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { useCreateTestPlan, useUpdateTestPlan } from '@renderer/hooks/useTestPlans'
import type { TestPlanWithTasks } from '@shared/types/test_plans'

const FormSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  working_days_override: z.string(),
  tasks: z.array(
    z.object({
      name: z.string().min(1, 'Required'),
      duration_days: z.number().positive().multipleOf(0.25)
    })
  )
})

type FormValues = z.infer<typeof FormSchema>

function workingDays(start: string, end: string): number | null {
  if (!start || !end) return null
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return null
  let days = 0
  const cur = new Date(s)
  while (cur <= e) {
    const d = cur.getDay()
    if (d !== 0 && d !== 6) days++
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

interface Props {
  projectId: string
  mode: 'create' | 'edit'
  initial?: TestPlanWithTasks
  onDone: () => void
}

export function TestPlanForm({ projectId, mode, initial, onDone }: Props): React.JSX.Element {
  const create = useCreateTestPlan(projectId)
  const update = useUpdateTestPlan(projectId)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      start_date: initial?.start_date ?? '',
      end_date: initial?.end_date ?? '',
      working_days_override: initial?.working_days?.toString() ?? '',
      tasks: initial?.tasks.map((t) => ({ name: t.name, duration_days: t.duration_days })) ?? []
    }
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'tasks' })
  const startDate = form.watch('start_date')
  const endDate = form.watch('end_date')
  const override = form.watch('working_days_override')
  const computed = workingDays(startDate, endDate)
  const effectiveBudget = override ? parseFloat(override) : (computed ?? 0)
  const taskTotal = form.watch('tasks').reduce((s, t) => s + (Number(t.duration_days) || 0), 0)

  const submit = form.handleSubmit((values) => {
    const workingDaysVal =
      values.working_days_override.trim() !== '' ? parseFloat(values.working_days_override) : null
    if (mode === 'create') {
      create.mutate(
        {
          project_id: projectId,
          name: values.name,
          description: values.description || null,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
          working_days: workingDaysVal,
          tasks: values.tasks
        },
        {
          onSuccess: (p) => {
            toast.success(`Created ${p.display_id}`)
            onDone()
          },
          onError: (e) => toast.error(e.message)
        }
      )
    } else if (initial) {
      update.mutate(
        {
          id: initial.id,
          patch: {
            name: values.name,
            description: values.description || null,
            start_date: values.start_date || null,
            end_date: values.end_date || null,
            working_days: workingDaysVal,
            tasks: values.tasks
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

  const pending = create.isPending || update.isPending
  const budgetOverflow = effectiveBudget > 0 && taskTotal > effectiveBudget

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="pname">Name</Label>
        <Input id="pname" {...form.register('name')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pdesc">Description</Label>
        <textarea
          id="pdesc"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...form.register('description')}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start">Start</Label>
          <Input id="start" type="date" {...form.register('start_date')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">End</Label>
          <Input id="end" type="date" {...form.register('end_date')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wd">Working days {computed !== null && `(auto: ${computed})`}</Label>
          <Input
            id="wd"
            type="number"
            step="0.25"
            placeholder={computed !== null ? String(computed) : '—'}
            {...form.register('working_days_override')}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Tasks (0.25-day granularity)</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ name: '', duration_days: 0.25 })}
          >
            <Plus className="mr-1 size-3" /> Add task
          </Button>
        </div>
        {fields.length === 0 && <p className="text-xs text-muted-foreground">No tasks.</p>}
        {fields.map((field, i) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              placeholder="Task name"
              className="flex-1"
              {...form.register(`tasks.${i}.name`)}
            />
            <Input
              type="number"
              step="0.25"
              min="0.25"
              className="w-28"
              {...form.register(`tasks.${i}.duration_days`, { valueAsNumber: true })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              aria-label={`Remove task ${i + 1}`}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
        <p
          className={
            budgetOverflow
              ? 'text-xs font-medium text-destructive'
              : 'text-xs text-muted-foreground'
          }
        >
          Task total: {taskTotal.toFixed(2)} / {effectiveBudget.toFixed(2)} working days
          {budgetOverflow && ' — over budget'}
        </p>
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
