import { useFTUE } from '@renderer/hooks/useFTUE'
import { useProjects } from '@renderer/hooks/useProjects'
import { useUIStore } from '@renderer/stores/ui'
import { WelcomeDialog } from './WelcomeDialog'

/**
 * Owns the visibility of the welcome tour. Splitting this off from RootLayout means we
 * can derive open/closed purely from render-time data, without effect-driven setState
 * that the React Compiler lint flags.
 *
 * Lifecycle:
 *  - Auto-open: when FTUE not completed AND zero projects on this machine.
 *  - Manual open: Settings menu calls ftue.reset() then sets showWelcomeOpen=true.
 *  - Close (any path): mark FTUE completed + clear external trigger so it doesn't re-fire.
 */
export function WelcomeController(): React.JSX.Element | null {
  const ftue = useFTUE()
  const { data: projects, isLoading } = useProjects()
  const externalTrigger = useUIStore((s) => s.showWelcomeOpen)
  const setExternalTrigger = useUIStore((s) => s.setShowWelcomeOpen)

  const autoShow = !ftue.completed && !isLoading && (projects ?? []).length === 0
  const shouldShow = autoShow || externalTrigger

  const handleOpenChange = (open: boolean): void => {
    if (open) return
    ftue.markCompleted()
    if (externalTrigger) setExternalTrigger(false)
  }

  const handleComplete = (): void => {
    ftue.markCompleted()
    if (externalTrigger) setExternalTrigger(false)
  }

  if (!shouldShow) return null

  return <WelcomeDialog open onOpenChange={handleOpenChange} onComplete={handleComplete} />
}
