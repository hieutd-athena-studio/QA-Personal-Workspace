import { useCallback, useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GripVertical, X, Sparkles, ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Separator } from '@renderer/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'
import { useCategories } from '@renderer/hooks/useCategories'
import { useCreateTestCase, useUpdateTestCase } from '@renderer/hooks/useTestCases'
import type { TestCaseWithSteps } from '@shared/types/test_cases'

// ── Schema ────────────────────────────────────────────────────────
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
  onDeleteSuccess?: () => void
}

const NONE = '__none__'

// ── SaveIndicator ─────────────────────────────────────────────────
type SaveState = 'idle' | 'saving' | 'saved'

function SaveIndicator({
  state,
  agoText
}: {
  state: SaveState
  agoText: string
}): React.JSX.Element {
  if (state === 'idle') return <></>
  return (
    <div className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--fg-subtle)]">
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          state === 'saving'
            ? 'bg-[var(--blocked)] shadow-[0_0_8px_var(--blocked)] anim-saving-pulse'
            : 'bg-[var(--pass)] shadow-[0_0_8px_var(--pass)]'
        ].join(' ')}
        aria-hidden="true"
      />
      {state === 'saving' ? 'Saving…' : `Saved ${agoText}`}
    </div>
  )
}

// ── StepRow ───────────────────────────────────────────────────────
interface StepRowProps {
  index: number
  total: number
  isNew: boolean
  actionValue: string
  expectedValue: string
  onActionChange: (v: string) => void
  onExpectedChange: (v: string) => void
  onRemove: () => void
  draggingIdx: number | null
  dropIdx: number | null
  onDragStart: (e: React.DragEvent, i: number) => void
  onDragOver: (e: React.DragEvent, i: number) => void
  onDrop: (e: React.DragEvent, i: number) => void
  onDragEnd: () => void
  actionError?: string
}

function StepRow({
  index,
  total,
  isNew,
  actionValue,
  expectedValue,
  onActionChange,
  onExpectedChange,
  onRemove,
  draggingIdx,
  dropIdx,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  actionError
}: StepRowProps): React.JSX.Element {
  const dragging = draggingIdx === index
  const dropTarget = dropIdx === index && draggingIdx !== index && draggingIdx != null

  return (
    <div
      className={[
        'grid gap-2.5 rounded-lg border bg-[var(--surface-1)] p-3 pr-3.5 transition-colors',
        'hover:border-[var(--border-strong)]',
        dragging ? 'opacity-40 bg-[var(--surface-2)]' : '',
        dropTarget ? 'border-[var(--accent-ring)] shadow-[0_0_0_1px_var(--accent-ring)]' : '',
        isNew ? 'anim-step-enter' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ gridTemplateColumns: '22px 28px 1fr 1fr 28px', alignItems: 'stretch' }}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Drag handle */}
      <div
        className="flex items-start justify-center pt-1 cursor-grab active:cursor-grabbing text-[var(--fg-faint)] hover:text-[var(--fg-muted)] rounded hover:bg-white/5 h-[22px]"
        title="Drag to reorder"
        aria-hidden="true"
      >
        <GripVertical className="size-3.5" />
      </div>

      {/* Step number */}
      <div className="flex items-start justify-center pt-[3px]">
        <span className="flex size-6 items-center justify-center rounded-full bg-[var(--accent-soft)] border border-[rgba(139,92,246,0.18)] font-mono text-[11.5px] font-semibold text-[#c4b5fd]">
          {index + 1}
        </span>
      </div>

      {/* Action column */}
      <div className="flex flex-col gap-1">
        <div className="eyebrow">Action</div>
        <textarea
          rows={2}
          value={actionValue}
          placeholder="Describe the action taken…"
          onChange={(e) => onActionChange(e.target.value)}
          className="w-full resize-none bg-transparent border-0 outline-none text-[13px] leading-[1.5] text-foreground placeholder:text-[var(--fg-faint)] min-h-[38px]"
          aria-label={`Step ${index + 1} action`}
        />
        {actionError && <p className="text-xs text-destructive">{actionError}</p>}
      </div>

      {/* Expected column */}
      <div className="flex flex-col gap-1">
        <div className="eyebrow">Expected</div>
        <textarea
          rows={2}
          value={expectedValue}
          placeholder="What the system should do…"
          onChange={(e) => onExpectedChange(e.target.value)}
          className="w-full resize-none bg-transparent border-0 outline-none text-[13px] leading-[1.5] text-foreground placeholder:text-[var(--fg-faint)] min-h-[38px]"
          aria-label={`Step ${index + 1} expected`}
        />
      </div>

      {/* Remove button */}
      <div className="flex items-start justify-center pt-[2px]">
        <button
          type="button"
          onClick={onRemove}
          disabled={total <= 1}
          aria-label={`Remove step ${index + 1}`}
          className="flex size-6 items-center justify-center rounded text-[var(--fg-faint)] hover:text-red-300 hover:bg-[var(--fail-soft)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── TestCaseForm ──────────────────────────────────────────────────
export function TestCaseForm({
  projectId,
  mode,
  initial,
  onDone,
  onDeleteSuccess
}: Props): React.JSX.Element {
  const { data: cats } = useCategories(projectId)
  const createCase = useCreateTestCase(projectId)
  const updateCase = useUpdateTestCase(projectId)

  // Save state for edit mode
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSavedAgo, setLastSavedAgo] = useState('just now')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const savedAtRef = useRef<number | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Drag state
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)
  const [newStepIds, setNewStepIds] = useState<Set<string>>(new Set())

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

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'steps'
  })

  // Build subcategory option groups grouped by parent
  const subcatGroups = (() => {
    const parents = (cats ?? []).filter((c) => !c.parent_category_id)
    const children = (cats ?? []).filter((c) => c.parent_category_id)
    return parents.map((p) => ({
      id: p.id,
      name: p.name,
      subs: children.filter((c) => c.parent_category_id === p.id)
    }))
  })()

  // ── Auto-save (edit mode) ─────────────────────────────────────
  const triggerAutoSave = useCallback(
    (values: FormValues) => {
      if (mode !== 'edit' || !initial) return
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      setSaveState('saving')
      autoSaveTimerRef.current = setTimeout(() => {
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
              setSaveState('saved')
              savedAtRef.current = Date.now()
              setLastSavedAgo('just now')
            },
            onError: (e) => {
              setSaveState('idle')
              toast.error(e.message)
            }
          }
        )
      }, 700)
    },
    [mode, initial, updateCase]
  )

  // Age the "saved X ago" caption
  useEffect(() => {
    if (saveState !== 'saved') return
    const interval = setInterval(() => {
      const s = Math.round((Date.now() - (savedAtRef.current ?? Date.now())) / 1000)
      if (s < 5) setLastSavedAgo('just now')
      else if (s < 60) setLastSavedAgo(`${s}s ago`)
      else setLastSavedAgo(`${Math.floor(s / 60)}m ago`)
    }, 1000)
    return () => clearInterval(interval)
  }, [saveState])

  // Watch form changes for auto-save in edit mode
  useEffect(() => {
    if (mode !== 'edit') return
    const sub = form.watch((values) => {
      triggerAutoSave(values as FormValues)
    })
    return () => sub.unsubscribe()
  }, [form, mode, triggerAutoSave])

  // ── Create mode submit ────────────────────────────────────────
  const submit = form.handleSubmit((values) => {
    if (mode !== 'create') return
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
  })

  // ── Step drag handlers ────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, i: number): void => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(i))
    setDraggingIdx(i)
  }
  const onDragOver = (e: React.DragEvent, i: number): void => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dropIdx !== i) setDropIdx(i)
  }
  const onDrop = (e: React.DragEvent, i: number): void => {
    e.preventDefault()
    const from = Number(e.dataTransfer.getData('text/plain'))
    if (Number.isNaN(from) || from === i) {
      setDraggingIdx(null)
      setDropIdx(null)
      return
    }
    move(from, i)
    setDraggingIdx(null)
    setDropIdx(null)
    if (mode === 'edit') triggerAutoSave(form.getValues())
  }
  const onDragEnd = (): void => {
    setDraggingIdx(null)
    setDropIdx(null)
  }

  const addStep = (): void => {
    const tempId = `s_${Date.now()}`
    append({ action: '', expected: '' })
    setNewStepIds((s) => new Set(s).add(tempId))
    setTimeout(() => {
      setNewStepIds((s) => {
        const next = new Set(s)
        next.delete(tempId)
        return next
      })
    }, 220)
  }

  const pending = createCase.isPending || updateCase.isPending

  // Resolve display labels for header
  const subcat = cats?.find((c) => c.id === form.watch('subcategory_id'))
  const parentCat = subcat ? cats?.find((c) => c.id === subcat.parent_category_id) : undefined

  return (
    <div className="flex flex-col min-h-0">
      <form onSubmit={submit} className="flex flex-col gap-0">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3.5 mb-1.5">
          {/* ID pill — edit mode only */}
          {mode === 'edit' && initial?.display_id && (
            <span className="mt-2 shrink-0 inline-flex items-center h-6 px-2.5 rounded-[5px] bg-[var(--accent-soft)] border border-[rgba(139,92,246,0.18)] font-mono text-[11.5px] font-medium text-[#c4b5fd] select-all">
              {initial.display_id}
            </span>
          )}

          <div className="flex-1 min-w-0">
            {/* Editable name */}
            <input
              type="text"
              className="w-full bg-transparent border-0 outline-none text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground px-1.5 py-0.5 -mx-1.5 rounded-md transition-colors hover:bg-white/[0.03] focus:bg-[var(--surface-1)] focus:shadow-[inset_0_0_0_1px_var(--accent-ring)]"
              placeholder={mode === 'create' ? 'Untitled test case' : 'Case name'}
              aria-label="Case name"
              spellCheck={false}
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-0.5 px-1.5">
                {form.formState.errors.name.message}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-3 px-0.5">
              {/* Version pill */}
              <span className="inline-flex items-center h-[22px] px-2.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[11.5px] text-[var(--fg-muted)]">
                {form.watch('version') || '1.0'}
              </span>
              {/* Category breadcrumb */}
              {(parentCat || subcat) && (
                <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11.5px] text-[var(--fg-muted)]">
                  {parentCat && (
                    <>
                      <span>{parentCat.name}</span>
                      <span className="text-[var(--fg-faint)]">›</span>
                    </>
                  )}
                  {subcat && <span>{subcat.name}</span>}
                </span>
              )}
              <span className="flex-1" />
              {/* Save indicator — edit mode only */}
              {mode === 'edit' && <SaveIndicator state={saveState} agoText={lastSavedAgo} />}
            </div>
          </div>

          {/* Delete action — edit mode only */}
          {mode === 'edit' && onDeleteSuccess && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-2 shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border)] bg-transparent text-[var(--fg-muted)] text-[13px] hover:text-red-300 hover:bg-[var(--fail-soft)] hover:border-red-500/30 transition-colors"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          )}
        </div>

        <Separator className="my-7" />

        {/* ── Basic info ─────────────────────────────────────────── */}
        <section className="mb-2">
          <div className="flex items-baseline gap-3 mb-3.5">
            <h3 className="text-[14px] font-semibold text-foreground tracking-[-0.005em]">
              Basic info
            </h3>
            <span className="text-[12px] text-[var(--fg-subtle)]">
              How the case appears in lists and reports.
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Subcategory + Version row */}
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 160px' }}>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="tc-subcat"
                  className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]"
                >
                  Subcategory
                </label>
                <Select
                  value={form.watch('subcategory_id') ?? NONE}
                  onValueChange={(v) =>
                    form.setValue('subcategory_id', v === NONE ? null : v, {
                      shouldDirty: true
                    })
                  }
                >
                  <SelectTrigger
                    id="tc-subcat"
                    className="w-full h-9 bg-[var(--surface-1)] border-[var(--border)] text-[13.5px] hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)]"
                  >
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {subcatGroups.map((group) =>
                      group.subs.length > 0 ? (
                        <SelectGroup key={group.id}>
                          <SelectLabel>{group.name}</SelectLabel>
                          {group.subs.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="tc-version"
                  className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]"
                >
                  Version
                </label>
                <input
                  id="tc-version"
                  className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2.5 font-mono text-[13.5px] text-foreground outline-none transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)] placeholder:text-[var(--fg-faint)]"
                  placeholder="1.0"
                  {...form.register('version')}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tc-desc"
                className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]"
              >
                Description
              </label>
              <textarea
                id="tc-desc"
                rows={3}
                className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-2 text-[13.5px] leading-[1.55] text-foreground outline-none transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)] placeholder:text-[var(--fg-faint)] min-h-16"
                placeholder="Briefly describe what this test case covers…"
                {...form.register('description')}
              />
              <p className="text-[11.5px] text-[var(--fg-faint)]">
                Plain-language summary. Markdown isn&apos;t rendered here yet.
              </p>
            </div>

            {/* Expected result */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tc-exp"
                className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]"
              >
                Expected result
              </label>
              <textarea
                id="tc-exp"
                rows={3}
                className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-2 text-[13.5px] leading-[1.55] text-foreground outline-none transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)] placeholder:text-[var(--fg-faint)] min-h-16"
                placeholder="The single authoritative 'what should happen' statement."
                {...form.register('expected_result')}
              />
              <p className="text-[11.5px] text-[var(--fg-faint)]">
                The single authoritative &quot;what should happen&quot; statement.
              </p>
            </div>
          </div>
        </section>

        <Separator className="my-7" />

        {/* ── Steps ──────────────────────────────────────────────── */}
        <section className="mb-2">
          <div className="flex items-baseline gap-3 mb-3.5">
            <h3 className="text-[14px] font-semibold text-foreground tracking-[-0.005em]">
              Test steps
            </h3>
            <span className="font-mono text-[11px] text-[var(--fg-faint)]">{fields.length}</span>
            <span className="text-[12px] text-[var(--fg-subtle)]">Drag the handle to reorder.</span>
            <div className="ml-auto">
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-[var(--border)] bg-transparent text-[12px] text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-ring)] hover:text-foreground transition-colors"
              >
                <Sparkles className="size-3" />
                Add step
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {fields.length === 0 && (
              <div className="rounded-lg border border-dashed py-8 text-center">
                <p className="text-sm font-medium text-[var(--fg-subtle)]">No steps added yet</p>
                <p className="mt-1 text-xs text-[var(--fg-faint)]">
                  Click &quot;Add step&quot; to define the test procedure.
                </p>
              </div>
            )}

            {fields.map((field, i) => (
              <StepRow
                key={field.id}
                index={i}
                total={fields.length}
                isNew={newStepIds.has(field.id)}
                actionValue={form.watch(`steps.${i}.action`)}
                expectedValue={form.watch(`steps.${i}.expected`)}
                onActionChange={(v) => form.setValue(`steps.${i}.action`, v, { shouldDirty: true })}
                onExpectedChange={(v) =>
                  form.setValue(`steps.${i}.expected`, v, { shouldDirty: true })
                }
                onRemove={() => remove(i)}
                draggingIdx={draggingIdx}
                dropIdx={dropIdx}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                actionError={form.formState.errors.steps?.[i]?.action?.message}
              />
            ))}
          </div>

          {/* Dashed add-step footer button */}
          <button
            type="button"
            onClick={addStep}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 h-8 rounded-md border border-dashed border-[var(--border-strong)] bg-transparent text-[12.5px] text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-ring)] hover:text-foreground transition-colors"
          >
            <Sparkles className="size-3" />
            Add step
          </button>
        </section>

        {/* ── Footer — create mode only ─────────────────────────── */}
        {mode === 'create' && (
          <>
            <Separator className="my-7" />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onDone}
                disabled={pending}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-[var(--border)] bg-transparent text-[13px] text-[var(--fg-muted)] hover:text-foreground hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="size-3.5" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {pending ? 'Creating…' : 'Create case'}
              </button>
            </div>
          </>
        )}

        {/* ── Edit mode cancel ──────────────────────────────────── */}
        {mode === 'edit' && (
          <>
            <Separator className="my-7" />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onDone}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-[var(--border)] bg-transparent text-[13px] text-[var(--fg-muted)] hover:text-foreground hover:bg-[var(--surface-2)] transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Back
              </button>
            </div>
          </>
        )}
      </form>

      {/* ── Delete confirmation AlertDialog ──────────────────────── */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this test case?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-foreground">
                {initial?.display_id} — {initial?.name}
              </strong>{' '}
              will be removed from this project, including its steps and any cycle assignments. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setShowDeleteConfirm(false)
                onDeleteSuccess?.()
              }}
            >
              Delete case
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
