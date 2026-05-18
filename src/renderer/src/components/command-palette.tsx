import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FolderOpen, Moon, Plus, Sun } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@renderer/components/ui/command'
import { useProjects } from '@renderer/hooks/useProjects'
import { useThemeStore } from '@renderer/stores/theme'
import { useActiveProjectStore } from '@renderer/stores/active-project'

interface Props {
  onNewProject: () => void
}

export function CommandPalette({ onNewProject }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: projects } = useProjects()
  const toggleTheme = useThemeStore((s) => s.toggle)
  const themeMode = useThemeStore((s) => s.mode)
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
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(onNewProject)}>
            <Plus className="mr-2 size-4" /> New project
          </CommandItem>
          <CommandItem onSelect={() => run(toggleTheme)}>
            {themeMode === 'dark' ? (
              <Sun className="mr-2 size-4" />
            ) : (
              <Moon className="mr-2 size-4" />
            )}
            Toggle {themeMode === 'dark' ? 'light' : 'dark'} mode
          </CommandItem>
          <CommandItem onSelect={() => run(() => navigate({ to: '/' }))}>
            <FolderOpen className="mr-2 size-4" /> Go to Projects
          </CommandItem>
        </CommandGroup>
        {projects && projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.display_prefix} ${p.name}`}
                  onSelect={() => run(() => setActiveId(p.id))}
                >
                  <span
                    className="mr-2 size-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: p.color }}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.display_prefix}
                  </span>
                  <span className="ml-2 truncate">{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
