import { useEffect } from 'react'
import { useThemeStore } from '@renderer/stores/theme'

export function useThemeEffect(): void {
  const mode = useThemeStore((s) => s.mode)
  useEffect(() => {
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [mode])
}
