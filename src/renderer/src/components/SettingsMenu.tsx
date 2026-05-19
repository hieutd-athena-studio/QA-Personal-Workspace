import { useState } from 'react'
import { FileText, Info, Keyboard, RefreshCw, Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { useSettingsStore } from '@renderer/stores/settings'

interface Props {
  onShowShortcuts: () => void
}

export function SettingsMenu({ onShowShortcuts }: Props): React.JSX.Element {
  const enabled = useSettingsStore((s) => s.autoUpdateEnabled)
  const setEnabled = useSettingsStore((s) => s.setAutoUpdateEnabled)
  const [checking, setChecking] = useState(false)

  const handleCheckNow = async (): Promise<void> => {
    if (!window.api?.updater) return
    setChecking(true)
    try {
      const result = await window.api.updater.check()
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to check for updates')
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <SettingsIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Updates group */}
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
          Updates
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(Boolean(checked))}
        >
          Check for updates automatically
        </DropdownMenuCheckboxItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            void handleCheckNow()
          }}
        >
          {checking ? <RefreshCw className="size-4 anim-spin" /> : <RefreshCw className="size-4" />}
          {checking ? 'Checking…' : 'Check for updates now'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Help group */}
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
          Help
        </DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => {
            onShowShortcuts()
          }}
        >
          <Keyboard className="size-4" />
          Keyboard shortcuts
          <span className="ml-auto font-mono text-[10.5px] text-[var(--fg-subtle)]">?</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Info className="size-4" />
          About QA Workspace
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Bottom item */}
        <DropdownMenuItem>
          <FileText className="size-4" />
          Open log file…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
