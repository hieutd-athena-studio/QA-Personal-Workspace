import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ActiveProjectState {
  id: string | null
  setId: (id: string | null) => void
}

export const useActiveProjectStore = create<ActiveProjectState>()(
  persist(
    (set) => ({
      id: null,
      setId: (id) => set({ id })
    }),
    { name: 'qa-workspace-active-project' }
  )
)
