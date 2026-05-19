import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { CommandPalette } from '@renderer/components/command-palette'
import { ThemeToggle } from '@renderer/components/theme-toggle'
import { UpdateBanner } from '@renderer/components/UpdateBanner'
import { SettingsMenu } from '@renderer/components/SettingsMenu'
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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/80 px-6 py-3 backdrop-blur">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight hover:opacity-80"
          >
            <span className="flex size-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
              Q
            </span>
            QA Workspace
          </Link>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent md:flex"
                  onClick={() =>
                    document.dispatchEvent(
                      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
                    )
                  }
                >
                  <span>Search</span>
                  <kbd className="font-mono">⌘K</kbd>
                </button>
              </TooltipTrigger>
              <TooltipContent>Open command palette</TooltipContent>
            </Tooltip>
            <SettingsMenu />
            <ThemeToggle />
          </div>
        </header>
        <UpdateBanner />
        <Outlet />
        <Toaster richColors closeButton position="bottom-right" />
        <CommandPalette onNewProject={openNewProject} />
      </div>
    </TooltipProvider>
  )
}
