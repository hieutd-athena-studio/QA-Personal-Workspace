import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  autoUpdateEnabled: boolean
  setAutoUpdateEnabled: (enabled: boolean) => void
  toggleAutoUpdate: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      autoUpdateEnabled: true,
      setAutoUpdateEnabled: (autoUpdateEnabled) => set({ autoUpdateEnabled }),
      toggleAutoUpdate: () => set({ autoUpdateEnabled: !get().autoUpdateEnabled })
    }),
    { name: 'qa-workspace-settings' }
  )
)
