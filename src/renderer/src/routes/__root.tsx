import { useState } from 'react'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import { CommandPalette } from '@renderer/components/command-palette'
import { ThemeToggle } from '@renderer/components/theme-toggle'
import { UpdateBanner } from '@renderer/components/UpdateBanner'
import { SettingsMenu } from '@renderer/components/SettingsMenu'
import { KbdShortcutsOverlay } from '@renderer/components/KbdShortcutsOverlay'
import { WelcomeController } from '@renderer/components/WelcomeController'
import { useAccentEffect } from '@renderer/hooks/useAccentEffect'
import { useThemeEffect } from '@renderer/hooks/useThemeEffect'
import { useUIStore } from '@renderer/stores/ui'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout
})

function RootLayout(): React.JSX.Element {
  useThemeEffect()
  useAccentEffect()

  const openNewProject = useUIStore((s) => s.openNewProject)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const openPalette = (): void => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
        {/* ── Header ── 48px, backdrop-blur, 1px bottom border ── */}
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2.5 border-b border-[var(--border-strong)] bg-background/70 px-3 backdrop-blur-[20px] backdrop-saturate-[160%]">
          {/* Brand */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-foreground no-underline hover:opacity-80"
            aria-label="QA Workspace home"
          >
            <span
              className="flex size-[22px] shrink-0 items-center justify-center rounded font-mono text-xs font-semibold text-white"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--primary)), hsl(262 72% 42%))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.4)'
              }}
              aria-hidden="true"
            >
              Q
            </span>
            <span className="text-[13px] font-semibold tracking-[-0.01em]">QA Workspace</span>
          </Link>

          {/* Brand separator */}
          <span
            className="mx-1 h-[18px] w-px shrink-0 bg-[var(--border-strong)]"
            aria-hidden="true"
          />

          {/* Breadcrumb slot — spacer when no context */}
          <div className="min-w-0 flex-1" aria-hidden="true" />

          {/* Search trigger — 280px ghost button with ⌘K chip */}
          <button
            onClick={openPalette}
            aria-label="Open command palette"
            className="flex h-7 w-[280px] min-w-0 shrink items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[rgba(255,255,255,0.03)] px-2.5 text-[var(--fg-subtle)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--fg-muted)] dark:bg-[rgba(255,255,255,0.03)]"
          >
            <Search size={14} className="shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate text-left text-[12.5px] leading-none">
              Search test cases, jump to cycle…
            </span>
            <span className="flex shrink-0 items-center gap-0.5" aria-hidden="true">
              <span className="kbd">⌘</span>
              <span className="kbd">K</span>
            </span>
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Settings menu */}
          <SettingsMenu onShowShortcuts={() => setShortcutsOpen(true)} />
        </header>

        {/* Update banner slot */}
        <UpdateBanner />

        {/* Page content — flex-1 so full-height panes can use min-h-0 */}
        <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <Outlet />
        </main>

        {/* Global toast renderer */}
        <Toaster richColors closeButton position="bottom-right" />

        {/* Command palette — ⌘K */}
        <CommandPalette
          onNewProject={openNewProject}
          onShowShortcuts={() => setShortcutsOpen(true)}
        />

        {/* Keyboard shortcuts overlay — ? key */}
        <KbdShortcutsOverlay open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

        {/* First-time welcome tour — owns its own visibility decisions */}
        <WelcomeController />
      </div>
    </TooltipProvider>
  )
}
