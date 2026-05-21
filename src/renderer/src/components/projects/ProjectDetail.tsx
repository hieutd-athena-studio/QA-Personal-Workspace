import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ChevronLeft,
  Download,
  FileSpreadsheet,
  MoreHorizontal,
  Trash2,
  Upload
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { DashboardPane } from './DashboardPane'
import { CasesPane } from '../cases/CasesPane'
import { PlansPane } from '../plans/PlansPane'
import { TypesPane } from '../types/TypesPane'
import { ReportsPane } from '../reports/ReportsPane'
import { useExportBackup, useImportBackup } from '@renderer/hooks/useBackup'
import { useTestCases } from '@renderer/hooks/useTestCases'
import { useTestPlans } from '@renderer/hooks/useTestPlans'
import { useTestTypes } from '@renderer/hooks/useTestTypes'
import type { Project } from '@shared/types/projects'

interface Props {
  project: Project
  defaultTab?: string
}

const TAB_KEYS = ['dashboard', 'cases', 'plans', 'types', 'reports'] as const
type TabKey = (typeof TAB_KEYS)[number]

// Sliding underline tab bar — uses measured-rect approach (no Framer Motion needed)
function SlidingTabBar({
  tabs,
  value,
  onChange
}: {
  tabs: { key: TabKey; label: string; badge?: number }[]
  value: TabKey
  onChange: (k: TabKey) => void
}): React.JSX.Element {
  const barRef = useRef<HTMLDivElement>(null)
  const [ind, setInd] = useState({ left: 0, width: 0 })

  const measure = (): void => {
    const btn = barRef.current?.querySelector<HTMLElement>(`[data-tabkey="${value}"]`)
    if (!btn || !barRef.current) return
    const parent = barRef.current.getBoundingClientRect()
    const r = btn.getBoundingClientRect()
    setInd({ left: r.left - parent.left, width: r.width })
  }

  useLayoutEffect(() => {
    measure()
  }, [value, tabs.length])

  // resize observer
  useLayoutEffect(() => {
    const el = barRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [value])

  return (
    <div
      ref={barRef}
      role="tablist"
      className="relative flex gap-0 border-b border-[var(--border)] px-8 flex-shrink-0"
      style={{ marginTop: 22 }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          data-tabkey={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={[
            'relative inline-flex h-[38px] cursor-pointer items-center gap-2 border-0 bg-transparent px-3.5 text-[13px] font-medium transition-colors',
            value === t.key
              ? 'font-semibold text-foreground'
              : 'text-[var(--fg-muted)] hover:text-foreground'
          ].join(' ')}
        >
          {t.label}
          {t.badge != null && (
            <span className="rounded-full border border-[var(--border)] bg-white/[0.04] px-1.5 py-px font-mono text-[10.5px] font-medium text-[var(--fg-subtle)]">
              {t.badge}
            </span>
          )}
        </button>
      ))}
      {/* Sliding indicator */}
      <div
        className="pointer-events-none absolute bottom-[-1.5px] h-[3px] rounded-full bg-[var(--accent)]"
        style={{
          left: ind.left,
          width: ind.width,
          boxShadow: '0 1px 6px var(--accent-soft)',
          transition: 'left 200ms var(--ease-out-back), width 200ms var(--ease-out-back)'
        }}
      />
    </div>
  )
}

export function ProjectDetail({ project, defaultTab }: Props): React.JSX.Element {
  const [tab, setTab] = useState<TabKey>((defaultTab as TabKey) ?? 'dashboard')
  const exportBackup = useExportBackup()
  const importBackup = useImportBackup()

  // badge counts
  const { data: cases } = useTestCases(project.id)
  const { data: plans } = useTestPlans(project.id)
  const { data: types } = useTestTypes(project.id)

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'cases', label: 'Test Cases', badge: cases?.length },
    { key: 'plans', label: 'Plans & Cycles', badge: plans?.length },
    { key: 'types', label: 'Test Types', badge: types?.length },
    { key: 'reports', label: 'Reports' }
  ]

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Project header */}
      <div className="flex-shrink-0 px-8 pt-[22px]">
        <Link
          to="/"
          className="mb-3.5 inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-subtle)] transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3" />
          All projects
        </Link>

        <div className="flex items-start gap-3.5">
          {/* Logo or color swatch */}
          {project.logo ? (
            <span
              className="mt-0.5 grid size-12 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]"
              aria-hidden="true"
            >
              <img src={project.logo} alt="" className="size-full object-contain" />
            </span>
          ) : (
            <span
              className="mt-0.5 size-9 shrink-0 rounded-[var(--radius-md)]"
              style={{
                backgroundColor: project.color,
                boxShadow:
                  'inset 0 0 0 0.5px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.25)'
              }}
              aria-hidden="true"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11.5px] tracking-[0.04em] text-[var(--fg-subtle)]">
              {project.display_prefix}
            </div>
            <h1 className="mt-0.5 mb-1 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-[13px] text-[var(--fg-muted)] max-w-[72ch] mt-0.5">
                {project.description}
              </p>
            )}
          </div>

          {/* ••• dropdown */}
          <div className="ml-auto flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-8 items-center justify-center rounded-[var(--radius-md)] border border-transparent bg-transparent text-[var(--fg-muted)] transition-colors hover:bg-white/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                aria-label="More project options"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px]">
                <DropdownMenuItem
                  onSelect={() =>
                    exportBackup.mutate(undefined, {
                      onSuccess: (r) => {
                        if (!r.canceled) toast.success(`Backup saved to ${r.path}`)
                      },
                      onError: (e) => toast.error(e.message)
                    })
                  }
                >
                  <Download className="mr-2 size-4" />
                  Backup project…
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    importBackup.mutate(undefined, {
                      onSuccess: (r) => {
                        if (!r.canceled) toast.success('Workspace restored from backup')
                      },
                      onError: (e) => toast.error(e.message)
                    })
                  }
                >
                  <Upload className="mr-2 size-4" />
                  Restore from backup…
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <FileSpreadsheet className="mr-2 size-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 size-4" />
                  Delete project…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Custom sliding tab bar */}
      <SlidingTabBar tabs={tabs} value={tab} onChange={setTab} />

      {/* Tab content — using shadcn Tabs underneath for a11y but the visual tabs are above */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabKey)}
        className="flex flex-1 min-h-0 flex-col"
      >
        {/* Hidden TabsList keeps Radix a11y happy */}
        <TabsList className="sr-only">
          {TAB_KEYS.map((k) => (
            <TabsTrigger key={k} value={k}>
              {k}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent
          value="dashboard"
          className="anim-pane-fade flex-1 min-h-0 overflow-y-auto px-8 py-6 pb-8 scrollbar-thin"
        >
          <DashboardPane project={project} />
        </TabsContent>
        <TabsContent
          value="cases"
          className="anim-pane-fade relative flex-1 min-h-0 overflow-y-auto px-8 py-6 pb-8 scrollbar-thin"
        >
          <CasesPane projectId={project.id} />
        </TabsContent>
        <TabsContent
          value="plans"
          className="anim-pane-fade flex-1 min-h-0 overflow-y-auto px-8 py-6 pb-8 scrollbar-thin"
        >
          <PlansPane projectId={project.id} />
        </TabsContent>
        <TabsContent
          value="types"
          className="anim-pane-fade flex-1 min-h-0 overflow-y-auto px-8 py-6 pb-8 scrollbar-thin"
        >
          <TypesPane projectId={project.id} />
        </TabsContent>
        <TabsContent
          value="reports"
          className="anim-pane-fade flex-1 min-h-0 overflow-y-auto px-8 py-6 pb-8 scrollbar-thin"
        >
          <ReportsPane projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
