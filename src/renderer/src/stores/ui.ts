import { create } from 'zustand'

interface UIState {
  newProjectOpen: boolean
  setNewProjectOpen: (open: boolean) => void
  openNewProject: () => void
  showWelcomeOpen: boolean
  setShowWelcomeOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  newProjectOpen: false,
  setNewProjectOpen: (newProjectOpen) => set({ newProjectOpen }),
  openNewProject: () => set({ newProjectOpen: true }),
  showWelcomeOpen: false,
  setShowWelcomeOpen: (showWelcomeOpen) => set({ showWelcomeOpen })
}))
