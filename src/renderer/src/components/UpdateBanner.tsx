/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Download, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { useSettingsStore } from '@renderer/stores/settings'
import type {
  UpdaterDownloadedInfo,
  UpdaterEvent,
  UpdaterProgressInfo,
  UpdaterUpdateInfo
} from '@shared/types/updater'

type Phase = 'idle' | 'available' | 'downloading' | 'downloaded'

interface BannerState {
  phase: Phase
  info: UpdaterUpdateInfo | null
  progress: UpdaterProgressInfo | null
  dismissed: boolean
}

const initial: BannerState = {
  phase: 'idle',
  info: null,
  progress: null,
  dismissed: false
}

export function UpdateBanner(): React.JSX.Element | null {
  const enabled = useSettingsStore((s) => s.autoUpdateEnabled)
  const [state, setState] = useState<BannerState>(initial)

  useEffect(() => {
    if (!enabled) {
      setState(initial)
      return
    }
    if (typeof window === 'undefined' || !window.api?.updater) return

    const unsubscribe = window.api.updater.onEvent((event: UpdaterEvent) => {
      switch (event.type) {
        case 'checking-for-update':
          break
        case 'update-available': {
          const info = event.payload as UpdaterUpdateInfo | undefined
          setState((s) => ({
            ...s,
            phase: 'available',
            info: info ?? s.info,
            dismissed: false
          }))
          break
        }
        case 'update-not-available':
          setState((s) => (s.phase === 'idle' ? s : initial))
          break
        case 'download-progress': {
          const progress = event.payload as UpdaterProgressInfo | undefined
          setState((s) => ({
            ...s,
            phase: 'downloading',
            progress: progress ?? s.progress
          }))
          break
        }
        case 'update-downloaded': {
          const info = event.payload as UpdaterDownloadedInfo | undefined
          setState((s) => ({
            ...s,
            phase: 'downloaded',
            info: info ?? s.info,
            progress: null,
            dismissed: false
          }))
          break
        }
        case 'error': {
          const payload = event.payload as { message: string } | undefined
          toast.error(payload?.message ?? 'Update error')
          break
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [enabled])

  if (!enabled) return null
  if (state.dismissed) return null
  if (state.phase === 'idle') return null

  const versionLabel = state.info?.version ? `v${state.info.version}` : 'new version'

  const handleDownload = async (): Promise<void> => {
    setState((s) => ({ ...s, phase: 'downloading' }))
    const result = await window.api.updater.download()
    if (!result.ok) {
      toast.error(result.error ?? 'Failed to start download')
      setState((s) => ({ ...s, phase: 'available' }))
    }
  }

  const handleInstall = async (): Promise<void> => {
    await window.api.updater.install()
  }

  const handleDismiss = (): void => {
    setState((s) => ({ ...s, dismissed: true }))
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 border-b bg-primary/10 px-6 py-2 text-sm"
    >
      <div className="flex min-w-0 items-center gap-3">
        {state.phase === 'downloading' ? (
          <RefreshCw className="size-4 shrink-0 animate-spin text-primary" />
        ) : (
          <Download className="size-4 shrink-0 text-primary" />
        )}
        <BannerMessage state={state} versionLabel={versionLabel} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {state.phase === 'available' && (
          <Button size="sm" onClick={handleDownload}>
            Download
          </Button>
        )}
        {state.phase === 'downloaded' && (
          <Button size="sm" onClick={handleInstall}>
            Install and restart
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={handleDismiss} aria-label="Dismiss">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function BannerMessage({
  state,
  versionLabel
}: {
  state: BannerState
  versionLabel: string
}): React.JSX.Element {
  if (state.phase === 'available') {
    return (
      <p className="truncate">
        An update is available <span className="font-medium">({versionLabel})</span>. Download now?
      </p>
    )
  }
  if (state.phase === 'downloading') {
    const pct = Math.round(state.progress?.percent ?? 0)
    return (
      <p className="truncate">
        Downloading update {versionLabel} — <span className="font-medium">{pct}%</span>
      </p>
    )
  }
  if (state.phase === 'downloaded') {
    return (
      <p className="truncate">Update {versionLabel} downloaded. Install and restart to apply.</p>
    )
  }
  return <p className="truncate">Checking for updates…</p>
}
