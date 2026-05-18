import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
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
        <header className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b bg-background/80 px-6 py-3 backdrop-blur">
          <SettingsMenu />
          <ThemeToggle />
        </header>
        <UpdateBanner />
        <Outlet />
        <Toaster richColors closeButton position="bottom-right" />
        <CommandPalette onNewProject={openNewProject} />
      </div>
    </TooltipProvider>
  )
}
