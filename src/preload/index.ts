import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppAPI } from '../shared/types/api'
import type { UpdaterEvent } from '../shared/types/updater'

const api: AppAPI = {
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    get: (id) => ipcRenderer.invoke('projects:get', id),
    create: (input) => ipcRenderer.invoke('projects:create', input),
    update: (id, patch) => ipcRenderer.invoke('projects:update', id, patch),
    delete: (id) => ipcRenderer.invoke('projects:delete', id)
  },
  categories: {
    list: (projectId) => ipcRenderer.invoke('categories:list', projectId),
    listTop: (projectId) => ipcRenderer.invoke('categories:listTop', projectId),
    listSub: (parentId) => ipcRenderer.invoke('categories:listSub', parentId),
    get: (id) => ipcRenderer.invoke('categories:get', id),
    create: (input) => ipcRenderer.invoke('categories:create', input),
    update: (id, patch) => ipcRenderer.invoke('categories:update', id, patch),
    delete: (id) => ipcRenderer.invoke('categories:delete', id)
  },
  cases: {
    list: (projectId) => ipcRenderer.invoke('cases:list', projectId),
    listBySubcategory: (subcategoryId) =>
      ipcRenderer.invoke('cases:listBySubcategory', subcategoryId),
    get: (id) => ipcRenderer.invoke('cases:get', id),
    getWithSteps: (id) => ipcRenderer.invoke('cases:getWithSteps', id),
    search: (projectId, query) => ipcRenderer.invoke('cases:search', projectId, query),
    create: (input) => ipcRenderer.invoke('cases:create', input),
    update: (id, patch) => ipcRenderer.invoke('cases:update', id, patch),
    delete: (id) => ipcRenderer.invoke('cases:delete', id),
    importJson: (projectId, payload) => ipcRenderer.invoke('cases:importJson', projectId, payload),
    exportJson: (projectId) => ipcRenderer.invoke('cases:exportJson', projectId)
  },
  plans: {
    list: (projectId) => ipcRenderer.invoke('plans:list', projectId),
    get: (id) => ipcRenderer.invoke('plans:get', id),
    getWithTasks: (id) => ipcRenderer.invoke('plans:getWithTasks', id),
    create: (input) => ipcRenderer.invoke('plans:create', input),
    update: (id, patch) => ipcRenderer.invoke('plans:update', id, patch),
    delete: (id) => ipcRenderer.invoke('plans:delete', id)
  },
  cycles: {
    list: (planId) => ipcRenderer.invoke('cycles:list', planId),
    listByProject: (projectId) => ipcRenderer.invoke('cycles:listByProject', projectId),
    get: (id) => ipcRenderer.invoke('cycles:get', id),
    create: (input) => ipcRenderer.invoke('cycles:create', input),
    update: (id, patch) => ipcRenderer.invoke('cycles:update', id, patch),
    delete: (id) => ipcRenderer.invoke('cycles:delete', id)
  },
  assignments: {
    list: (cycleId) => ipcRenderer.invoke('assignments:list', cycleId),
    assign: (cycleId, caseIds) => ipcRenderer.invoke('assignments:assign', cycleId, caseIds),
    batchUnassign: (ids) => ipcRenderer.invoke('assignments:batchUnassign', ids),
    setStatus: (id, status, notes) =>
      ipcRenderer.invoke('assignments:setStatus', id, status, notes ?? null),
    update: (id, patch) => ipcRenderer.invoke('assignments:update', id, patch),
    progress: (cycleId) => ipcRenderer.invoke('assignments:progress', cycleId)
  },
  types: {
    list: (projectId) => ipcRenderer.invoke('types:list', projectId),
    get: (id) => ipcRenderer.invoke('types:get', id),
    create: (input) => ipcRenderer.invoke('types:create', input),
    update: (id, patch) => ipcRenderer.invoke('types:update', id, patch),
    delete: (id) => ipcRenderer.invoke('types:delete', id),
    getCases: (id) => ipcRenderer.invoke('types:getCases', id),
    setCases: (id, caseIds) => ipcRenderer.invoke('types:setCases', id, caseIds),
    counts: (projectId) => ipcRenderer.invoke('types:counts', projectId)
  },
  backup: {
    export: () => ipcRenderer.invoke('backup:export'),
    import: () => ipcRenderer.invoke('backup:import')
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onEvent: (cb) => {
      const listener = (_event: IpcRendererEvent, payload: UpdaterEvent): void => cb(payload)
      ipcRenderer.on('updater:event', listener)
      return () => {
        ipcRenderer.off('updater:event', listener)
      }
    }
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
