import { useTestCases } from '@renderer/hooks/useTestCases'
import { useTestPlans } from '@renderer/hooks/useTestPlans'
import { useTestCyclesForProject } from '@renderer/hooks/useTestCycles'
import { useTestTypes } from '@renderer/hooks/useTestTypes'
import type { Project } from '@shared/types/projects'

interface Props {
  project: Project
}

export function DashboardPane({ project }: Props): React.JSX.Element {
  const { data: cases } = useTestCases(project.id)
  const { data: plans } = useTestPlans(project.id)
  const { data: cycles } = useTestCyclesForProject(project.id)
  const { data: types } = useTestTypes(project.id)

  const todayMs = new Date().setHours(0, 0, 0, 0)
  const upcomingDeadlines = (plans ?? [])
    .filter((p) => p.end_date && new Date(p.end_date).getTime() >= todayMs)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
    .slice(0, 6)

  const totalTaskDays = (plans ?? []).reduce((acc, p) => acc + (p.working_days ?? 0), 0)
  const maxDays = Math.max(
    totalTaskDays,
    (plans ?? []).reduce((m, p) => Math.max(m, p.working_days ?? 0), 0),
    1
  )

  return (
    <div className="space-y-7">
      {/* 4-stat row — no border cards, just whitespace + bottom rule */}
      <div
        className="grid grid-cols-2 gap-8 pb-7 sm:grid-cols-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <StatBlock label="Test cases" value={cases?.length ?? 0} />
        <StatBlock label="Test plans" value={plans?.length ?? 0} />
        <StatBlock label="Cycles" value={cycles?.length ?? 0} />
        <StatBlock label="Test types" value={types?.length ?? 0} />
      </div>

      {/* Two-column grid: deadlines (2fr) + budget (1fr) */}
      <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Upcoming deadlines */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-[16px_18px]">
          <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]">
            Upcoming deadlines
          </h3>
          {upcomingDeadlines.length === 0 ? (
            <p className="py-2 text-[13px] text-[var(--fg-muted)]">No upcoming plan deadlines.</p>
          ) : (
            <div>
              {upcomingDeadlines.map((p, idx) => {
                const daysLeft = Math.ceil(
                  (new Date(p.end_date!).getTime() - todayMs) / (1000 * 60 * 60 * 24)
                )
                const tone: 'red' | 'amber' | '' =
                  daysLeft <= 1 ? 'red' : daysLeft <= 7 ? 'amber' : ''
                const dayLabel =
                  daysLeft <= 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`

                const urgColor =
                  tone === 'red'
                    ? 'var(--fail)'
                    : tone === 'amber'
                      ? 'var(--blocked)'
                      : 'var(--fg-faint)'

                const pillClass =
                  tone === 'red'
                    ? 'bg-[var(--fail-soft)] border-[rgba(239,68,68,0.3)] text-[#fca5a5]'
                    : tone === 'amber'
                      ? 'bg-[var(--blocked-soft)] border-[rgba(245,158,11,0.3)] text-[#fcd34d]'
                      : 'border-[var(--border)] text-[var(--fg-muted)]'

                return (
                  <div
                    key={p.id}
                    className="grid items-center gap-3 py-2.5"
                    style={{
                      gridTemplateColumns: '3px auto 1fr auto',
                      borderTop: idx === 0 ? 'none' : '1px solid var(--border)'
                    }}
                  >
                    {/* urgency strip */}
                    <span
                      className="rounded-[2px]"
                      style={{ width: 3, height: 22, background: urgColor }}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[11px] text-[var(--fg-subtle)]">
                      {p.display_id}
                    </span>
                    <span className="truncate text-[13px] text-foreground">{p.name}</span>
                    <span
                      className={`rounded-full border px-2 py-px font-mono text-[11.5px] ${pillClass}`}
                    >
                      {dayLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Task budget card */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-[16px_18px]">
          <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]">
            Task budget
          </h3>
          <div className="mt-1 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            {totalTaskDays.toFixed(2)}
            <span className="ml-1.5 text-[13px] font-normal text-[var(--fg-muted)]">
              / {maxDays.toFixed(0)} days
            </span>
          </div>
          <p className="mt-3 text-[12px] leading-[1.55] text-[var(--fg-muted)]">
            Total planned work across active test plans.{' '}
            <span className="text-[var(--fg-subtle)]">0.25-day granularity.</span>
          </p>
          {/* Progress bar */}
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            role="progressbar"
            aria-valuenow={Math.round((totalTaskDays / maxDays) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-[width] duration-[320ms]"
              style={{
                width: `${Math.min((totalTaskDays / maxDays) * 100, 100)}%`,
                background: totalTaskDays > maxDays ? 'var(--fail)' : 'var(--accent)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
        {label}
      </div>
      <div className="mt-0.5 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] tabular-nums text-foreground">
        {value}
      </div>
    </div>
  )
}
