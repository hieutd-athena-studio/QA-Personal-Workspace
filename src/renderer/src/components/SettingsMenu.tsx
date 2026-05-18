import { useState } from 'react'
import { RefreshCw, Settings as SettingsIcon } from 'lucide-react'
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

export function SettingsMenu(): React.JSX.Element {
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
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Updates</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(Boolean(checked))}
        >
          Check for updates automatically
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!enabled || checking}
          onSelect={(event) => {
            event.preventDefault()
            void handleCheckNow()
          }}
        >
          <RefreshCw className={`size-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking…' : 'Check for updates now'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
