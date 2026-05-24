import { useCallback, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Database,
  FolderKanban,
  ListChecks,
  Sparkles
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

interface Step {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  bullets: string[]
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to QA Workspace',
    description:
      'A fully local, offline-first tool for managing QA test cases, plans, and execution cycles. Your data lives on this machine — no cloud, no sync, no account.',
    bullets: [
      'Everything is stored in a single SQLite file on your computer.',
      'Use ⌘K (Ctrl K on Windows) at any time to jump anywhere.',
      'Press ? to see the full keyboard shortcut sheet.'
    ]
  },
  {
    icon: FolderKanban,
    title: '1. Create a project',
    description:
      'Projects are the top-level container. Each gets a unique prefix (e.g. AUR), a color, and an optional logo. All cases, plans, and cycles live under a project.',
    bullets: [
      'Click "New project" on the Projects page.',
      'Pick a 2–5 letter prefix — it becomes the ID of every test case.',
      'You can edit name, color, and logo later from the project page.'
    ]
  },
  {
    icon: ListChecks,
    title: '2. Build your test library',
    description:
      'Inside a project, open the "Test Cases" tab to add cases. Organize them with categories and subcategories. Each case has steps and expected results.',
    bullets: [
      'Group related cases into categories and subcategories.',
      'Each case can have multiple ordered steps with an expected result.',
      'Import/export JSON anytime if you need to move data.'
    ]
  },
  {
    icon: CalendarDays,
    title: '3. Plan & execute cycles',
    description:
      'A Test Plan groups cycles for a release. A Cycle is a run of selected cases against an environment. Assign cases, then execute and mark Pass/Fail/Blocked.',
    bullets: [
      'Create plans with start/end dates and working days.',
      'Each plan can have multiple cycles (e.g. dev, staging, prod).',
      'Run cycles in Execution view — keyboard-first with P/F/B shortcuts.'
    ]
  },
  {
    icon: Database,
    title: '4. Reports & backup',
    description:
      'Track progress in the Dashboard and Reports tabs. Back up the whole workspace at any time — restore on this or another machine.',
    bullets: [
      'Dashboard shows progress, deadlines, and task budget.',
      'Reports tab aggregates results across cycles.',
      'Use the project menu to export a backup ZIP — and restore from one.'
    ]
  }
]

export function WelcomeDialog({ open, onOpenChange, onComplete }: Props): React.JSX.Element {
  // Parent mount-unmounts this on each open so the initializer resets the step automatically.
  const [step, setStep] = useState(0)

  const current = STEPS[step]!
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1
  const Icon = current.icon

  const handleNext = useCallback((): void => {
    if (isLast) {
      onComplete()
      onOpenChange(false)
    } else {
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
    }
  }, [isLast, onComplete, onOpenChange])

  const handlePrev = useCallback((): void => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const handleSkip = useCallback((): void => {
    onComplete()
    onOpenChange(false)
  }, [onComplete, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[600px] gap-0 p-0 overflow-hidden anim-dialog-in"
        showCloseButton={false}
      >
        <DialogHeader className="px-7 pt-7 pb-2 gap-1">
          <div
            className="mb-4 grid size-12 place-items-center rounded-[12px] bg-[var(--accent-soft)] text-[var(--accent)]"
            aria-hidden="true"
          >
            <Icon className="size-6" />
          </div>
          <DialogTitle className="text-[20px] font-semibold leading-tight tracking-[-0.01em]">
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-[13.5px] leading-[1.55] text-[var(--fg-muted)]">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2 px-7 pb-2 pt-4">
          {current.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-[var(--fg-muted)]">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-[var(--accent)]"
                aria-hidden="true"
              />
              <span className="leading-[1.55]">{b}</span>
            </li>
          ))}
        </ul>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 px-7 pt-5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              aria-current={i === step}
              className={`h-1.5 rounded-full transition-[width,background] duration-[var(--duration-fast)] ${
                i === step
                  ? 'w-6 bg-[var(--accent)]'
                  : 'w-1.5 bg-[var(--border-strong)] hover:bg-[var(--fg-faint)]'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center gap-3 border-t border-[var(--border-soft)] bg-[var(--surface-1)] px-7 py-4">
          <button
            type="button"
            onClick={handleSkip}
            className="text-[12.5px] text-[var(--fg-subtle)] transition-colors hover:text-foreground"
          >
            Skip tour
          </button>
          <span className="flex-1" />
          {!isFirst && (
            <Button variant="outline" size="sm" onClick={handlePrev}>
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
          )}
          <Button size="sm" onClick={handleNext}>
            {isLast ? (
              'Get started'
            ) : (
              <>
                Next
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
