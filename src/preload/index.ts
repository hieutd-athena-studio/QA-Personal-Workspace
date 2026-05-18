import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppAPI } from '../shared/types/api'
import type { NewProjectInput, ProjectPatch } from '../shared/types/projects'

const api: AppAPI = {
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    get: (id: string) => ipcRenderer.invoke('projects:get', id),
    create: (input: NewProjectInput) => ipcRenderer.invoke('projects:create', input),
    update: (id: string, patch: ProjectPatch) => ipcRenderer.invoke('projects:update', id, patch),
    delete: (id: string) => ipcRenderer.invoke('projects:delete', id)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error contextIsolation disabled fallback
  window.electron = electronAPI
  // @ts-expect-error contextIsolation disabled fallback
  window.api = api
}
