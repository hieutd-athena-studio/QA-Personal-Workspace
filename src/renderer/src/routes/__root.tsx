import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'

export const Route = createRootRoute({
  component: RootLayout
})

function RootLayout(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
      <Toaster richColors closeButton position="bottom-right" />
    </div>
  )
}
