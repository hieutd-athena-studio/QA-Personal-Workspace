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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
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

const textareaClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none'

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
    <form onSubmit={submit} className="space-y-4">
      {/* ── Section 1: Basic info ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Basic info</CardTitle>
          <CardDescription>Name, category placement, and version.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Case name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Login with valid credentials"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Subcategory + Version row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="version">Version</Label>
              <Input id="version" placeholder="1.0" {...form.register('version')} />
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <textarea
              id="desc"
              rows={3}
              className={textareaClass}
              placeholder="Briefly describe what this test case covers…"
              {...form.register('description')}
            />
          </div>

          {/* Expected result (overall) */}
          <div className="space-y-1.5">
            <Label htmlFor="exp">Overall expected result</Label>
            <textarea
              id="exp"
              rows={2}
              className={textareaClass}
              placeholder="What should the system state be after all steps succeed?"
              {...form.register('expected_result')}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Test steps ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Test steps</CardTitle>
              <CardDescription className="mt-1">
                Add the actions and expected outcomes for each step.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => append({ action: '', expected: '' })}
            >
              <Plus className="mr-1.5 size-3.5" />
              Add step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Column header — visible only when steps exist */}
          {fields.length > 0 && (
            <div className="hidden grid-cols-[2rem_1fr_1fr_2rem] gap-3 sm:grid">
              <div />
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Action
              </p>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Expected
              </p>
              <div />
            </div>
          )}

          {/* Empty state */}
          {fields.length === 0 && (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">No steps added yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click &quot;Add step&quot; to define the test procedure.
              </p>
            </div>
          )}

          {/* Step rows */}
          {fields.map((field, i) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[2rem_1fr_1fr_2rem] sm:items-start sm:rounded-md sm:border-0 sm:bg-transparent sm:p-0"
            >
              {/* Step number badge */}
              <div className="flex items-center gap-2 sm:justify-center sm:pt-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
                  {i + 1}
                </span>
                {/* Mobile: label */}
                <span className="text-xs font-medium text-muted-foreground sm:hidden">
                  Step {i + 1}
                </span>
              </div>

              {/* Action */}
              <div className="space-y-1">
                <Label className="sr-only sm:hidden" htmlFor={`step-action-${i}`}>
                  Action
                </Label>
                <textarea
                  id={`step-action-${i}`}
                  rows={2}
                  className={textareaClass}
                  placeholder="Action…"
                  {...form.register(`steps.${i}.action`)}
                />
                {form.formState.errors.steps?.[i]?.action && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.steps[i]?.action?.message}
                  </p>
                )}
              </div>

              {/* Expected */}
              <div className="space-y-1">
                <Label className="sr-only sm:hidden" htmlFor={`step-expected-${i}`}>
                  Expected
                </Label>
                <textarea
                  id={`step-expected-${i}`}
                  rows={2}
                  className={textareaClass}
                  placeholder="Expected outcome…"
                  {...form.register(`steps.${i}.expected`)}
                />
              </div>

              {/* Remove */}
              <div className="flex justify-end sm:justify-center sm:pt-1.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(i)}
                  aria-label={`Remove step ${i + 1}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Form actions ──────────────────────────────────────────────── */}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create case' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
