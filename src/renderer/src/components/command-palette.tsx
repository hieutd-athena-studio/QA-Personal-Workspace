import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Flag, Keyboard, Layers } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from '@renderer/components/ui/command'
import { useProjects } from '@renderer/hooks/useProjects'
import { useActiveProjectStore } from '@renderer/stores/active-project'

interface Props {
  onNewProject: () => void
  onShowShortcuts?: () => void
}

export function CommandPalette({ onNewProject, onShowShortcuts }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: projects } = useProjects()
  const setActiveId = useActiveProjectStore((s) => s.setId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const run = (fn: () => void): void => {
    setOpen(false)
    fn()
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search test cases, jump to cycle, run command…"
      showCloseButton={false}
      className="w-[560px] max-w-[calc(100%-48px)] overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.55)] anim-palette-in [&_.anim-palette-overlay]:anim-palette-overlay"
    >
      <CommandInput
        placeholder="Search test cases, jump to cycle, run command…"
        className="h-11 border-b border-[var(--border-strong)] bg-transparent px-3.5 text-sm text-foreground placeholder:text-[var(--fg-subtle)]"
      />

      <CommandList className="max-h-[400px] overflow-y-auto scrollbar-thin">
        <CommandEmpty className="py-6 text-center text-[13px] text-[var(--fg-subtle)]">
          No results.
        </CommandEmpty>

        {/* Actions group */}
        <CommandGroup
          heading="Actions"
          className="[&_[cmdk-group-heading]]:px-3.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-[var(--fg-subtle)]"
        >
          {/* Jump to next failed — highlighted as "active" by default selection */}
          <CommandItem
            value="jump to next failed case"
            onSelect={() =>
              run(() => {
                /* TODO: wire to cycle navigation */
              })
            }
            className="gap-2.5 px-3.5 py-1.5 text-[13px] text-foreground data-[selected=true]:bg-[var(--accent-soft)] data-[selected=true]:text-foreground"
          >
            <Flag size={14} className="shrink-0 text-[var(--fail)]" aria-hidden="true" />
            <span className="flex-1">Jump to next failed case</span>
            <CommandShortcut>
              <span className="kbd">N</span>
            </CommandShortcut>
          </CommandItem>

          <CommandItem
            value="jump to next blocked case"
            onSelect={() =>
              run(() => {
                /* TODO: wire to cycle navigation */
              })
            }
            className="gap-2.5 px-3.5 py-1.5 text-[13px] text-foreground data-[selected=true]:bg-[var(--accent-soft)] data-[selected=true]:text-foreground"
          >
            <AlertTriangle
              size={14}
              className="shrink-0 text-[var(--blocked)]"
              aria-hidden="true"
            />
            <span className="flex-1">Jump to next blocked case</span>
            <CommandShortcut>
              <span className="kbd">B</span>
            </CommandShortcut>
          </CommandItem>

          <CommandItem
            value="manage cycle assignments"
            onSelect={() =>
              run(() => {
                /* TODO: wire to assignments dialog */
              })
            }
            className="gap-2.5 px-3.5 py-1.5 text-[13px] text-foreground data-[selected=true]:bg-[var(--accent-soft)] data-[selected=true]:text-foreground"
          >
            <Layers size={14} className="shrink-0 text-[var(--fg-muted)]" aria-hidden="true" />
            <span className="flex-1">Manage cycle assignments…</span>
            <CommandShortcut className="flex gap-0.5">
              <span className="kbd dim">⌘</span>
              <span className="kbd dim">M</span>
            </CommandShortcut>
          </CommandItem>

          <CommandItem
            value="show keyboard shortcuts"
            onSelect={() =>
              run(() => {
                onShowShortcuts?.()
              })
            }
            className="gap-2.5 px-3.5 py-1.5 text-[13px] text-foreground data-[selected=true]:bg-[var(--accent-soft)] data-[selected=true]:text-foreground"
          >
            <Keyboard size={14} className="shrink-0 text-[var(--fg-muted)]" aria-hidden="true" />
            <span className="flex-1">Show keyboard shortcuts</span>
            <CommandShortcut>
              <span className="kbd dim">?</span>
            </CommandShortcut>
          </CommandItem>

          <CommandItem
            value="new project create"
            onSelect={() => run(onNewProject)}
            className="gap-2.5 px-3.5 py-1.5 text-[13px] text-foreground data-[selected=true]:bg-[var(--accent-soft)] data-[selected=true]:text-foreground"
          >
            <span className="flex-1">New project…</span>
            <CommandShortcut>
              <span className="kbd dim">⌘N</span>
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {/* Projects group */}
        {projects && projects.length > 0 && (
          <>
            <CommandSeparator className="bg-[var(--border-soft)]" />
            <CommandGroup
              heading="Test cases · this cycle"
              className="[&_[cmdk-group-heading]]:px-3.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-[var(--fg-subtle)]"
            >
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.display_prefix} ${p.name}`}
                  onSelect={() =>
                    run(() => {
                      setActiveId(p.id)
                      void navigate({ to: '/' })
                    })
                  }
                  className="gap-2.5 px-3.5 py-1.5 text-[13px] text-foreground data-[selected=true]:bg-[var(--accent-soft)] data-[selected=true]:text-foreground"
                >
                  <span
                    className="size-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: p.color }}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[11.5px] text-[var(--fg-subtle)]">
                    {p.display_prefix}
                  </span>
                  <span className="flex-1 truncate">{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer hints */}
      <div className="flex items-center gap-3.5 border-t border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-3.5 py-2 text-[11.5px] text-[var(--fg-subtle)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="kbd">↵</span> open
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="kbd">↑</span>
          <span className="kbd">↓</span> navigate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="kbd">esc</span> dismiss
        </span>
      </div>
    </CommandDialog>
  )
}
