import { create } from 'zustand'

interface UIState {
  newProjectOpen: boolean
  setNewProjectOpen: (open: boolean) => void
  openNewProject: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  newProjectOpen: false,
  setNewProjectOpen: (newProjectOpen) => set({ newProjectOpen }),
  openNewProject: () => set({ newProjectOpen: true })
}))
