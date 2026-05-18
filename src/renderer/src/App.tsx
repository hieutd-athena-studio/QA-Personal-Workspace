import { useState } from 'react'
import { cn } from './lib/utils'

function App(): React.JSX.Element {
  const [dark, setDark] = useState(false)

  return (
    <div className={cn(dark && 'dark', 'min-h-screen bg-background text-foreground')}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">QA Workspace</h1>
        <p className="text-muted-foreground">
          Local-only, offline-first test case management. Tailwind v4 smoke test.
        </p>

        <button
          onClick={() => setDark((v) => !v)}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Toggle {dark ? 'light' : 'dark'} mode
        </button>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {(['primary', 'secondary', 'destructive'] as const).map((tone) => (
            <div
              key={tone}
              className={cn(
                'rounded-lg p-4 text-sm font-medium',
                tone === 'primary' && 'bg-primary text-primary-foreground',
                tone === 'secondary' && 'bg-secondary text-secondary-foreground',
                tone === 'destructive' && 'bg-destructive text-destructive-foreground'
              )}
            >
              {tone}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
