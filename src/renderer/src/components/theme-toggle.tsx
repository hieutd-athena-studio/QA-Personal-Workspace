import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@renderer/stores/theme'

export function ThemeToggle(): React.JSX.Element {
  const mode = useThemeStore((s) => s.mode)
  const toggle = useThemeStore((s) => s.toggle)

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      data-mode={mode}
      className="relative flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border-0 bg-transparent text-[var(--fg-muted)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-3)] hover:text-[var(--fg-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-ring)]"
    >
      <Sun
        size={15}
        aria-hidden="true"
        className={[
          'icon-sun absolute transition-[transform,opacity] duration-[var(--duration-base)]',
          mode === 'light' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
        ].join(' ')}
      />
      <Moon
        size={15}
        aria-hidden="true"
        className={[
          'icon-moon absolute transition-[transform,opacity] duration-[var(--duration-base)]',
          mode === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'
        ].join(' ')}
      />
    </button>
  )
}
