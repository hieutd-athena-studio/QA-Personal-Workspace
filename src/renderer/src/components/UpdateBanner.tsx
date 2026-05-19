/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Check, RefreshCw, Sparkles, X } from 'lucide-react'
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
  const pct = Math.round(state.progress?.percent ?? 0)

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
      className="relative flex items-center gap-3 border-b border-[rgba(139,92,246,0.18)] bg-[var(--accent-tint)] px-4 py-2.5 text-[12.5px]"
    >
      {/* Left icon badge */}
      <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-hover)]">
        {state.phase === 'available' && <Sparkles size={12} aria-hidden="true" />}
        {state.phase === 'downloading' && (
          <RefreshCw size={12} aria-hidden="true" className="anim-spin" />
        )}
        {state.phase === 'downloaded' && <Check size={12} aria-hidden="true" />}
      </span>

      {/* Message */}
      <span className="flex-1 text-foreground">
        {state.phase === 'available' && (
          <>
            <strong className="font-semibold">Update available</strong> — {versionLabel} is ready to
            download.
          </>
        )}
        {state.phase === 'downloading' && (
          <>
            <strong className="font-semibold">Downloading update</strong> · {pct}%
          </>
        )}
        {state.phase === 'downloaded' && (
          <>
            <strong className="font-semibold">Update ready</strong> — Install when you&apos;re
            ready. Your work is preserved.
          </>
        )}
      </span>

      {/* Actions */}
      <span className="flex shrink-0 items-center gap-1.5">
        {state.phase === 'available' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11.5px] text-[var(--fg-subtle)] hover:text-foreground"
            >
              Release notes
            </Button>
            <Button size="sm" className="h-6 px-2.5 text-[11.5px]" onClick={handleDownload}>
              Download
            </Button>
          </>
        )}
        {state.phase === 'downloaded' && (
          <Button size="sm" className="h-6 px-2.5 text-[11.5px]" onClick={handleInstall}>
            Install &amp; restart
          </Button>
        )}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss update banner"
          className="flex size-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-[var(--fg-muted)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-3)] hover:text-foreground"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </span>

      {/* Progress line at bottom edge during downloading */}
      {state.phase === 'downloading' && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] bg-primary transition-[width] duration-[var(--duration-slow)] ease-linear"
          style={{ width: `${pct}%` }}
        />
      )}
    </div>
  )
}
