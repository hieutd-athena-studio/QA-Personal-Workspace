import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@renderer/components/ui/dialog'
import { Dialog as DialogPrimitive } from 'radix-ui'

interface ShortcutRowProps {
  label: string
  keys: string[]
}

function ShortcutRow({ label, keys }: ShortcutRowProps): React.JSX.Element {
  return (
    <div className="flex items-center border-t border-[var(--border-soft)] py-1.5 first:border-t-0">
      <span className="flex-1 text-[12.5px] text-[var(--fg-muted)]">{label}</span>
      <span className="flex gap-1">
        {keys.map((k, i) => (
          <span key={i} className="kbd">
            {k}
          </span>
        ))}
      </span>
    </div>
  )
}

interface ShortcutGroupProps {
  title: string
  rows: ShortcutRowProps[]
}

function ShortcutGroup({ title, rows }: ShortcutGroupProps): React.JSX.Element {
  return (
    <div>
      <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]">
        {title}
      </h4>
      {rows.map((r) => (
        <ShortcutRow key={r.label} label={r.label} keys={r.keys} />
      ))}
    </div>
  )
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KbdShortcutsOverlay({ open, onOpenChange }: Props): React.JSX.Element {
  // Global `?` key handler — skip when focus is in an input/textarea
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== '?' || e.metaKey || e.ctrlKey) return
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase() ?? ''
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        (e.target as HTMLElement | null)?.isContentEditable
      )
        return
      e.preventDefault()
      onOpenChange(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onOpenChange])

  const groups: ShortcutGroupProps[] = [
    {
      title: 'Global',
      rows: [
        { label: 'Open command palette', keys: ['⌘', 'K'] },
        { label: 'Show keyboard shortcuts', keys: ['?'] },
        { label: 'Toggle theme', keys: ['⌘', '⇧', 'L'] },
        { label: 'Go to projects', keys: ['⌘', '1'] }
      ]
    },
    {
      title: 'Navigation',
      rows: [
        { label: 'Next case', keys: ['→'] },
        { label: 'Previous case', keys: ['←'] },
        { label: 'Jump to next failed', keys: ['N'] },
        { label: 'Jump to next blocked', keys: ['B'] }
      ]
    },
    {
      title: 'Execution',
      rows: [
        { label: 'Mark Pass', keys: ['P'] },
        { label: 'Mark Fail', keys: ['F'] },
        { label: 'Mark Blocked', keys: ['B'] },
        { label: 'Clear status', keys: ['U'] },
        { label: 'Focus notes', keys: ['⌘', '/'] }
      ]
    },
    {
      title: 'Editing',
      rows: [
        { label: 'New test case', keys: ['⌘', 'N'] },
        { label: 'Save (if not auto-saving)', keys: ['⌘', 'S'] },
        { label: 'Delete', keys: ['⌘', '⌫'] },
        { label: 'Add step', keys: ['⌘', '↵'] }
      ]
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="anim-dialog-overlay bg-[var(--overlay)] backdrop-blur-[6px]" />
        <DialogPrimitive.Content
          aria-labelledby="kbd-title"
          className="fixed left-1/2 top-1/2 z-50 flex w-[680px] max-w-[calc(100%-48px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] shadow-[0_24px_60px_rgba(0,0,0,0.55)] outline-none anim-dialog-in"
          style={{ maxHeight: 'calc(100% - 64px)' }}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center border-b border-[var(--border-strong)] px-[22px] py-4">
            <DialogTitle id="kbd-title" className="m-0 text-sm font-semibold text-foreground">
              Keyboard shortcuts
            </DialogTitle>
            <DialogPrimitive.Close
              className="ml-auto flex size-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-[var(--fg-muted)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-3)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-[var(--accent-ring)]"
              aria-label="Close"
            >
              <X size={15} />
            </DialogPrimitive.Close>
          </header>

          {/* Two-column grid of groups */}
          <div className="scrollbar-thin grid grid-cols-2 gap-x-8 gap-y-7 overflow-y-auto p-[22px]">
            {groups.map((g) => (
              <ShortcutGroup key={g.title} title={g.title} rows={g.rows} />
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
