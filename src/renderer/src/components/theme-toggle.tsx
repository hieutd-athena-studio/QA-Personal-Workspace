import { Moon, Sun } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useThemeStore } from '@renderer/stores/theme'

export function ThemeToggle(): React.JSX.Element {
  const mode = useThemeStore((s) => s.mode)
  const toggle = useThemeStore((s) => s.toggle)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {mode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
