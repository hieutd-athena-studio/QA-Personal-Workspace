import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  GripVertical,
  X,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Separator } from '@renderer/components/ui/separator'
import { useCreateTestPlan, useUpdateTestPlan } from '@renderer/hooks/useTestPlans'
import type { TestPlanWithTasks } from '@shared/types/test_plans'

// ── Schema ─────────────────────────────────────────────────────────
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

// ── Working days helper ────────────────────────────────────────────
function calcWorkingDays(start: string, end: string): number | null {
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

// ── Date range helpers ─────────────────────────────────────────────
function pad(n: number): string {
  return String(n).padStart(2, '0')
}
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function fmtDisplay(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtMonth(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function monthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(start.getDate() - first.getDay())
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

// ── CalendarMonth ─────────────────────────────────────────────────
interface CalRange {
  start: Date | null
  end: Date | null
}

interface CalendarMonthProps {
  year: number
  month: number
  range: CalRange
  today: Date
  onPick: (d: Date) => void
  onPrev?: () => void
  onNext?: () => void
}

function CalendarMonth({
  year,
  month,
  range,
  today,
  onPick,
  onPrev,
  onNext
}: CalendarMonthProps): React.JSX.Element {
  const days = monthDays(year, month)
  const monthDate = new Date(year, month, 1)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12.5px] font-semibold text-foreground">{fmtMonth(monthDate)}</span>
        <div className="flex gap-0.5">
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous month"
              className="flex size-[22px] items-center justify-center rounded bg-transparent text-[var(--fg-muted)] hover:bg-white/5 hover:text-foreground transition-colors border-0"
            >
              <ChevronLeft className="size-3" />
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next month"
              className="flex size-[22px] items-center justify-center rounded bg-transparent text-[var(--fg-muted)] hover:bg-white/5 hover:text-foreground transition-colors border-0"
            >
              <ChevronRight className="size-3" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-semibold tracking-[0.06em] text-[var(--fg-subtle)] pb-1"
          >
            {d}
          </div>
        ))}
        {days.map((d) => {
          const inMonth = d.getMonth() === month
          const isToday = fmtDate(d) === fmtDate(today)
          const isStart = range.start && fmtDate(d) === fmtDate(range.start)
          const isEnd = range.end && fmtDate(d) === fmtDate(range.end)
          const inRange = range.start && range.end && d > range.start && d < range.end
          const hasEnd = !!(isStart && range.end)
          const hasStart = !!(isEnd && range.start)

          const base =
            'flex h-[26px] cursor-pointer items-center justify-center text-[12px] tabular-nums transition-colors select-none'
          let cls = base
          if (!inMonth) cls += ' text-[var(--fg-faint)]'
          else cls += ' text-[var(--fg-muted)] hover:bg-white/5 hover:text-foreground'
          if (isToday) cls += ' shadow-[inset_0_0_0_1px_var(--accent-ring)]'
          if (isStart || isEnd) {
            cls = `${base} bg-[hsl(var(--primary))] text-white`
            if (isStart && hasEnd) cls += ' rounded-l-[5px]'
            else if (isEnd && hasStart) cls += ' rounded-r-[5px]'
            else cls += ' rounded-[5px]'
          } else if (inRange) {
            cls = `${base} bg-[var(--accent-tint)] text-foreground rounded-none`
          } else {
            cls += ' rounded-[5px]'
          }

          return (
            <div key={fmtDate(d)} className={cls} onClick={() => onPick(d)}>
              {d.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── DateRangePopover ──────────────────────────────────────────────
interface DateRangePopoverProps {
  value: CalRange
  onChange: (r: CalRange) => void
  onClose: () => void
}

function DateRangePopover({ value, onChange, onClose }: DateRangePopoverProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const today = useMemo(() => new Date(), [])
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const next =
    view.month + 1 > 11
      ? { year: view.year + 1, month: 0 }
      : { year: view.year, month: view.month + 1 }

  useEffect(() => {
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  const pick = (d: Date): void => {
    if (!value.start || (value.start && value.end)) {
      onChange({ start: d, end: null })
    } else if (d < value.start) {
      onChange({ start: d, end: value.start })
    } else {
      onChange({ start: value.start, end: d })
    }
  }

  const setPreset = (days: number): void => {
    const start = new Date(today)
    const end = new Date(today)
    end.setDate(end.getDate() + days)
    onChange({ start, end })
  }

  return (
    <div
      ref={ref}
      className="absolute top-[calc(100%+6px)] left-0 z-50 w-[560px] rounded-md border border-[var(--border-strong)] bg-[var(--surface-2)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_14px_36px_rgba(0,0,0,0.45)] anim-pop-in overflow-hidden"
    >
      <div className="grid grid-cols-2 gap-5 p-3 pb-3.5 select-none">
        <CalendarMonth
          year={view.year}
          month={view.month}
          range={value}
          today={today}
          onPick={pick}
          onPrev={() =>
            setView({
              year: view.month === 0 ? view.year - 1 : view.year,
              month: view.month === 0 ? 11 : view.month - 1
            })
          }
        />
        <CalendarMonth
          year={next.year}
          month={next.month}
          range={value}
          today={today}
          onPick={pick}
          onNext={() =>
            setView({
              year: next.month === 11 ? next.year + 1 : next.year,
              month: next.month === 11 ? 0 : next.month + 1
            })
          }
        />
      </div>
      <div className="flex flex-wrap gap-1.5 px-3.5 py-2 pb-3 border-t border-[var(--border)]">
        {[
          { label: 'Next 7 days', days: 7 },
          { label: 'Next 2 weeks', days: 14 },
          { label: 'Next 30 days', days: 30 },
          { label: 'This quarter', days: 90 }
        ].map(({ label, days }) => (
          <button
            key={label}
            type="button"
            onClick={() => setPreset(days)}
            className="h-6 px-2.5 rounded-full border border-[var(--border)] bg-white/[0.03] text-[11.5px] text-[var(--fg-muted)] hover:bg-white/5 hover:text-foreground transition-colors"
          >
            {label}
          </button>
        ))}
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => onChange({ start: null, end: null })}
          className="h-6 px-2.5 rounded-full border border-[var(--border)] bg-white/[0.03] text-[11.5px] text-[var(--fg-muted)] hover:bg-white/5 hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────────
interface Props {
  projectId: string
  mode: 'create' | 'edit'
  initial?: TestPlanWithTasks
  onDone: () => void
}

// ── TestPlanForm ───────────────────────────────────────────────────
export function TestPlanForm({ projectId, mode, initial, onDone }: Props): React.JSX.Element {
  const create = useCreateTestPlan(projectId)
  const update = useUpdateTestPlan(projectId)
  const [dateOpen, setDateOpen] = useState(false)

  // Local date range state (driven from form via effect)
  const [dateRange, setDateRange] = useState<CalRange>({
    start: initial?.start_date ? new Date(initial.start_date) : null,
    end: initial?.end_date ? new Date(initial.end_date) : null
  })

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
  const computed = calcWorkingDays(startDate, endDate)
  const effectiveBudget = override ? parseFloat(override) : (computed ?? 0)
  const taskTotal = form.watch('tasks').reduce((s, t) => s + (Number(t.duration_days) || 0), 0)
  const over = effectiveBudget > 0 && taskTotal > effectiveBudget

  // Sync date range picker → form fields
  const handleDateRangeChange = useCallback(
    (r: CalRange) => {
      setDateRange(r)
      form.setValue('start_date', r.start ? fmtDate(r.start) : '', { shouldDirty: true })
      form.setValue('end_date', r.end ? fmtDate(r.end) : '', { shouldDirty: true })
    },
    [form]
  )

  const [autoSavedAt, setAutoSavedAt] = useState<number | null>(null)

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

  // ── Edit mode: debounced auto-save on change ────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (mode !== 'edit' || !initial) return undefined
    const sub = form.watch((_values, info) => {
      if (!info.name) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (!form.formState.isDirty) return
        void form.handleSubmit((v) => {
          const workingDaysVal =
            v.working_days_override.trim() !== '' ? parseFloat(v.working_days_override) : null
          update.mutate(
            {
              id: initial.id,
              patch: {
                name: v.name,
                description: v.description || null,
                start_date: v.start_date || null,
                end_date: v.end_date || null,
                working_days: workingDaysVal,
                tasks: v.tasks
              }
            },
            {
              onSuccess: () => {
                setAutoSavedAt(Date.now())
                form.reset(form.getValues(), { keepValues: true })
              },
              onError: (e) => toast.error(e.message)
            }
          )
        })()
      }, 700)
    })
    return () => {
      sub.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [mode, initial, form, update])

  return (
    <form onSubmit={submit} className="flex flex-col gap-0">
      {/* ── Plan header ──────────────────────────────────────────── */}
      <div className="mb-6 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {/* PID pill — edit mode */}
          {mode === 'edit' && initial?.display_id && (
            <div className="inline-flex items-center mb-2.5 h-5 px-2 rounded-[4px] font-mono text-[11.5px] text-[var(--fg-subtle)] bg-white/[0.03] border border-[var(--border)]">
              {initial.display_id}
            </div>
          )}
          {/* Editable plan name H1 */}
          <input
            type="text"
            className="w-full bg-transparent border-0 outline-none text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground px-1.5 py-0.5 -mx-1.5 rounded-md transition-colors hover:bg-white/[0.03] focus:bg-[var(--surface-1)] focus:shadow-[inset_0_0_0_1px_var(--accent-ring)]"
            placeholder={mode === 'create' ? 'Untitled plan' : 'Plan name'}
            aria-label="Plan name"
            {...form.register('name')}
          />
        </div>
        {mode === 'create' ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onDone}
              disabled={pending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-[var(--border)] bg-transparent text-[13px] text-[var(--fg-muted)] hover:text-foreground hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {pending ? 'Creating…' : 'Create plan'}
            </button>
          </div>
        ) : (
          <div
            className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-[var(--fg-subtle)]"
            aria-live="polite"
          >
            {pending ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="anim-saving-pulse size-1.5 rounded-full bg-[var(--accent)]" />
                Saving…
              </span>
            ) : autoSavedAt ? (
              <span className="anim-saved-fade inline-flex items-center gap-1.5" key={autoSavedAt}>
                <Check className="size-3 text-[var(--pass)]" />
                Saved
              </span>
            ) : (
              <span className="text-[var(--fg-faint)]">Auto-saves as you edit</span>
            )}
          </div>
        )}
      </div>

      {/* ── Description ──────────────────────────────────────────── */}
      <section className="mb-2">
        <div className="flex items-baseline gap-3 mb-3.5">
          <h3 className="text-[14px] font-semibold text-foreground tracking-[-0.005em]">
            Description
          </h3>
          <span className="text-[12px] text-[var(--fg-subtle)]">
            A one-paragraph summary that surfaces on cards and reports.
          </span>
        </div>
        <textarea
          rows={3}
          className="w-full max-w-[720px] resize-y rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-2 text-[13.5px] leading-[1.55] text-foreground outline-none transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)] placeholder:text-[var(--fg-faint)] min-h-16"
          placeholder="What this plan covers…"
          {...form.register('description')}
        />
      </section>

      <Separator className="my-7" />

      {/* ── Schedule ──────────────────────────────────────────────── */}
      <section className="mb-2">
        <div className="flex items-baseline gap-3 mb-3.5">
          <h3 className="text-[14px] font-semibold text-foreground tracking-[-0.005em]">
            Schedule
          </h3>
          <span className="text-[12px] text-[var(--fg-subtle)]">
            Working days exclude weekends.
          </span>
        </div>

        <div className="grid gap-4 items-end" style={{ gridTemplateColumns: '1fr 200px' }}>
          {/* Date range trigger + popover */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]">
              Date range
            </label>
            <div className="relative inline-flex">
              <button
                type="button"
                onClick={() => setDateOpen((v) => !v)}
                className="inline-flex items-center gap-2 h-[34px] px-3 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-[13px] text-foreground tabular-nums hover:border-[var(--border-strong)] transition-colors"
              >
                <Clock className="size-3.5 text-[var(--fg-muted)]" />
                {dateRange.start && dateRange.end
                  ? `${fmtDisplay(dateRange.start)} → ${fmtDisplay(dateRange.end)}`
                  : 'Pick a date range'}
                <span className="ml-auto text-[var(--fg-faint)]">
                  <ChevronDown className="size-3" />
                </span>
              </button>
              {dateOpen && (
                <DateRangePopover
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  onClose={() => setDateOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Working days budget card */}
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-3.5 py-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)] mb-1.5">
              Working days
            </div>
            <div className="flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-[22px] font-semibold text-foreground">{computed ?? 0}</span>
            </div>
          </div>
        </div>
      </section>

      <Separator className="my-7" />

      {/* ── Tasks ─────────────────────────────────────────────────── */}
      <section className="mb-2">
        <div className="flex items-baseline gap-3 mb-3.5">
          <h3 className="text-[14px] font-semibold text-foreground tracking-[-0.005em]">Tasks</h3>
          <span className="text-[12px] text-[var(--fg-subtle)]">
            0.25-day granularity. Add or trim to fit the schedule.
          </span>
          {/* Budget card inline */}
          <div className="ml-auto flex items-center">
            <div
              className={[
                'min-w-[200px] rounded-md border px-3 py-2',
                over
                  ? 'border-[var(--fail-soft)] bg-[var(--fail-soft)]'
                  : 'border-[var(--border)] bg-[var(--surface-1)]'
              ].join(' ')}
            >
              <div
                className={[
                  'text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1',
                  over ? 'text-[var(--fail)]' : 'text-[var(--fg-subtle)]'
                ].join(' ')}
              >
                {over ? 'Over budget' : 'Total vs budget'}
              </div>
              <div className="flex items-baseline gap-2 font-mono tabular-nums">
                <span
                  className={[
                    'text-[18px] font-semibold',
                    over ? 'text-[var(--fail)]' : 'text-foreground'
                  ].join(' ')}
                >
                  {taskTotal.toFixed(2)}
                </span>
                <span className="text-[12px] text-[var(--fg-subtle)]">
                  / {effectiveBudget.toFixed(0)} days
                </span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={[
                    'h-full transition-[width]',
                    over ? 'bg-[var(--fail)]' : 'bg-[hsl(var(--primary))]'
                  ].join(' ')}
                  style={{
                    width: `${Math.min(100, (taskTotal / Math.max(1, effectiveBudget)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-1.5">
          {fields.length === 0 && (
            <p className="text-[13px] text-[var(--fg-subtle)]">No tasks yet.</p>
          )}

          {fields.map((field, i) => (
            <div
              key={field.id}
              className="grid items-center gap-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-1)] py-2 pl-1.5 pr-3 hover:border-[var(--border-strong)] transition-colors"
              style={{ gridTemplateColumns: '22px 1fr 110px 28px' }}
            >
              {/* Drag handle */}
              <div
                className="flex items-center justify-center cursor-grab text-[var(--fg-faint)]"
                aria-hidden="true"
              >
                <GripVertical className="size-3.5" />
              </div>

              {/* Task name */}
              <input
                type="text"
                placeholder="Task name…"
                className="bg-transparent border-0 outline-none text-[13px] text-foreground px-1.5 py-1 rounded hover:bg-[var(--surface-2)] focus:bg-[var(--surface-2)] focus:shadow-[inset_0_0_0_1px_var(--accent-ring)] transition-colors placeholder:text-[var(--fg-faint)]"
                {...form.register(`tasks.${i}.name`)}
              />

              {/* Duration input + "days" label */}
              <div className="flex items-center h-[26px] rounded-sm border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  className="w-full h-full bg-transparent border-0 outline-none text-right font-mono text-[12.5px] tabular-nums text-foreground px-2"
                  {...form.register(`tasks.${i}.duration_days`, { valueAsNumber: true })}
                />
                <span className="flex-shrink-0 border-l border-[var(--border)] px-2 text-[10.5px] text-[var(--fg-subtle)] h-full flex items-center">
                  days
                </span>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove task ${i + 1}`}
                className="flex size-[26px] items-center justify-center rounded bg-transparent text-[var(--fg-faint)] hover:text-red-300 hover:bg-[var(--fail-soft)] transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}

          {/* Dashed add-task button */}
          <button
            type="button"
            onClick={() => append({ name: '', duration_days: 0.25 })}
            className="flex w-full items-center justify-center gap-1.5 h-8 rounded-md border border-dashed border-[var(--border-strong)] bg-transparent text-[12.5px] text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-ring)] hover:text-foreground transition-colors"
          >
            <Sparkles className="size-3" />
            Add task
          </button>
        </div>
      </section>
    </form>
  )
}
