import { useQuery } from '@tanstack/react-query'
import { ExternalLink, HardDrive, Heart, Mail } from 'lucide-react'
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
}

export function AboutDialog({ open, onOpenChange }: Props): React.JSX.Element {
  const { data: info } = useQuery({
    queryKey: ['app', 'info'],
    queryFn: () => window.api.app.info(),
    enabled: open,
    staleTime: Infinity
  })

  const platformLabel = info
    ? `${info.platform === 'darwin' ? 'macOS' : info.platform === 'win32' ? 'Windows' : info.platform} · ${info.arch}`
    : '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[480px] gap-0 p-0 overflow-hidden anim-dialog-in"
        showCloseButton={false}
      >
        <DialogHeader className="px-7 pt-7 pb-2 gap-2">
          <div className="flex items-center gap-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-[10px] font-mono text-[18px] font-bold text-white"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--primary)), hsl(262 72% 42%))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.4)'
              }}
              aria-hidden="true"
            >
              Q
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-[17px] font-semibold leading-tight tracking-[-0.01em]">
                QA Personal Workspace
              </DialogTitle>
              <p className="mt-0.5 font-mono text-[12px] text-[var(--fg-muted)]">
                v{info?.version ?? '—'}
              </p>
            </div>
          </div>
          <DialogDescription className="mt-2 text-[13px] leading-[1.55] text-[var(--fg-muted)]">
            A fully local, offline-first QA test case management tool. Your data lives on this
            machine in a single SQLite file — no cloud, no sync, no account required.
          </DialogDescription>
        </DialogHeader>

        <div className="px-7 pb-3 pt-3">
          <h4 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
            Build
          </h4>
          <dl className="grid gap-1.5 text-[12.5px]">
            <Row label="Version" value={info?.version ?? '—'} />
            <Row label="Platform" value={platformLabel} />
            <Row label="Electron" value={info?.electronVersion ?? '—'} />
            <Row label="Chromium" value={info?.chromeVersion ?? '—'} />
            <Row label="Node" value={info?.nodeVersion ?? '—'} />
          </dl>
        </div>

        <div className="px-7 pb-3 pt-2">
          <h4 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
            Built with
          </h4>
          <p className="text-[12.5px] leading-[1.55] text-[var(--fg-muted)]">
            Electron · React 19 · TypeScript · TanStack Router & Query · Drizzle ORM ·
            better-sqlite3 · Tailwind v4 · shadcn/ui · Radix Primitives
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border-soft)] bg-[var(--surface-1)] px-7 py-4">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-subtle)]">
            <Heart className="size-3.5" aria-hidden="true" />
            Made by Hieu @ Athena Studio
          </span>
          <span className="flex-1" />
          <a
            href="mailto:hieutd@athena.studio"
            className="inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-[12px] text-[var(--fg-muted)] transition-colors hover:bg-white/[0.05] hover:text-foreground"
            aria-label="Email author"
          >
            <Mail className="size-3.5" />
            Contact
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-[12px] text-[var(--fg-muted)] transition-colors hover:bg-white/[0.05] hover:text-foreground"
            aria-label="View source"
          >
            <ExternalLink className="size-3.5" />
            Source
          </a>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        {/* Data location hint */}
        <div className="border-t border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-7 py-2.5 text-[11px] text-[var(--fg-subtle)]">
          <span className="inline-flex items-center gap-1.5">
            <HardDrive className="size-3" aria-hidden="true" />
            Data stored in the app&apos;s user-data folder. Export backups from any project menu.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="grid items-baseline gap-2" style={{ gridTemplateColumns: '110px 1fr' }}>
      <dt className="text-[var(--fg-subtle)]">{label}</dt>
      <dd className="min-w-0 truncate font-mono text-foreground" title={value}>
        {value}
      </dd>
    </div>
  )
}
