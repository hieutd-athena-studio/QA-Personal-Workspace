import { ipcMain, type BrowserWindow } from 'electron'
import {
  autoUpdater,
  type ProgressInfo,
  type UpdateDownloadedEvent,
  type UpdateInfo
} from 'electron-updater'

const SIX_HOURS_MS = 6 * 60 * 60 * 1000

export type UpdaterEventType =
  | 'checking-for-update'
  | 'update-available'
  | 'update-not-available'
  | 'download-progress'
  | 'update-downloaded'
  | 'error'

export interface UpdaterEvent {
  type: UpdaterEventType
  payload?: UpdateInfo | UpdateDownloadedEvent | ProgressInfo | { message: string }
}

interface InitState {
  initialized: boolean
  intervalId: NodeJS.Timeout | null
  handlersRegistered: boolean
  removeListeners: (() => void) | null
}

const state: InitState = {
  initialized: false,
  intervalId: null,
  handlersRegistered: false,
  removeListeners: null
}

function send(window: BrowserWindow, event: UpdaterEvent): void {
  if (window.isDestroyed()) return
  window.webContents.send('updater:event', event)
}

function serializeError(err: unknown): { message: string } {
  if (err instanceof Error) return { message: err.message }
  return { message: String(err) }
}

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  if (process.env.QA_WORKSPACE_NO_UPDATER === '1') return
  if (state.initialized) return
  state.initialized = true

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  const onChecking = (): void => send(mainWindow, { type: 'checking-for-update' })
  const onAvailable = (info: UpdateInfo): void =>
    send(mainWindow, { type: 'update-available', payload: info })
  const onNotAvailable = (info: UpdateInfo): void =>
    send(mainWindow, { type: 'update-not-available', payload: info })
  const onProgress = (info: ProgressInfo): void =>
    send(mainWindow, { type: 'download-progress', payload: info })
  const onDownloaded = (info: UpdateDownloadedEvent): void =>
    send(mainWindow, { type: 'update-downloaded', payload: info })
  const onError = (err: Error): void =>
    send(mainWindow, { type: 'error', payload: serializeError(err) })

  autoUpdater.on('checking-for-update', onChecking)
  autoUpdater.on('update-available', onAvailable)
  autoUpdater.on('update-not-available', onNotAvailable)
  autoUpdater.on('download-progress', onProgress)
  autoUpdater.on('update-downloaded', onDownloaded)
  autoUpdater.on('error', onError)

  state.removeListeners = () => {
    autoUpdater.off('checking-for-update', onChecking)
    autoUpdater.off('update-available', onAvailable)
    autoUpdater.off('update-not-available', onNotAvailable)
    autoUpdater.off('download-progress', onProgress)
    autoUpdater.off('update-downloaded', onDownloaded)
    autoUpdater.off('error', onError)
  }

  if (!state.handlersRegistered) {
    ipcMain.handle('updater:check', async () => {
      try {
        await autoUpdater.checkForUpdates()
        return { ok: true }
      } catch (err) {
        return { ok: false, error: serializeError(err).message }
      }
    })

    ipcMain.handle('updater:download', async () => {
      try {
        await autoUpdater.downloadUpdate()
        return { ok: true }
      } catch (err) {
        return { ok: false, error: serializeError(err).message }
      }
    })

    ipcMain.handle('updater:install', () => {
      autoUpdater.quitAndInstall()
    })

    state.handlersRegistered = true
  }

  void autoUpdater.checkForUpdates().catch((err) => {
    send(mainWindow, { type: 'error', payload: serializeError(err) })
  })

  state.intervalId = setInterval(() => {
    void autoUpdater.checkForUpdates().catch((err) => {
      send(mainWindow, { type: 'error', payload: serializeError(err) })
    })
  }, SIX_HOURS_MS)

  mainWindow.on('closed', () => {
    if (state.intervalId) {
      clearInterval(state.intervalId)
      state.intervalId = null
    }
    if (state.removeListeners) {
      state.removeListeners()
      state.removeListeners = null
    }
    state.initialized = false
  })
}
