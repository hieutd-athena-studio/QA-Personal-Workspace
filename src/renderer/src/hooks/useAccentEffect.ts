import { useEffect } from 'react'
import { useProjects } from './useProjects'
import { useActiveProjectStore } from '@renderer/stores/active-project'

function hexToHsl(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) return null
  const n = parseInt(m[1]!, 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`
}

export function useAccentEffect(): void {
  const activeId = useActiveProjectStore((s) => s.id)
  const { data: projects } = useProjects()

  useEffect(() => {
    const root = document.documentElement

    if (!activeId || !projects) {
      root.style.removeProperty('--primary')
      root.style.removeProperty('--ring')
      root.style.removeProperty('--accent-hover')
      root.style.removeProperty('--accent-soft')
      root.style.removeProperty('--accent-tint')
      root.style.removeProperty('--accent-ring')
      return
    }

    const active = projects.find((p) => p.id === activeId)
    if (!active) return

    // Parse hex to r/g/b integers for rgba derivations
    const m = /^#([0-9a-f]{6})$/i.exec(active.color)
    if (!m) return
    const n = parseInt(m[1]!, 16)
    const ri = (n >> 16) & 255
    const gi = (n >> 8) & 255
    const bi = n & 255

    const hsl = hexToHsl(active.color)
    if (!hsl) return

    // Write project-derived design tokens
    root.style.setProperty('--primary', hsl)
    root.style.setProperty('--ring', hsl)
    root.style.setProperty('--accent-hover', active.color)
    root.style.setProperty('--accent-soft', `rgba(${ri}, ${gi}, ${bi}, 0.14)`)
    root.style.setProperty('--accent-tint', `rgba(${ri}, ${gi}, ${bi}, 0.08)`)
    root.style.setProperty('--accent-ring', `rgba(${ri}, ${gi}, ${bi}, 0.55)`)
  }, [activeId, projects])
}
