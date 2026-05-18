import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { closeDb, getDb, getUserDataPath } from './db/client'
import { runMigrations } from './db/migrations/runner'
import { registerProjectsIpc } from './ipc/projects'
import { registerCategoriesIpc } from './ipc/categories'
import { registerTestCasesIpc } from './ipc/test_cases'
import { registerTestPlansIpc } from './ipc/test_plans'
import { registerTestCyclesIpc } from './ipc/test_cycles'
import { registerAssignmentsIpc } from './ipc/assignments'
import { registerTestTypesIpc } from './ipc/test_types'
import { registerBackupIpc } from './ipc/backup'
import { initAutoUpdater } from './updater'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (!is.dev) {
      initAutoUpdater(mainWindow)
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const url = new URL(details.url)
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        shell.openExternal(details.url)
      }
    } catch {
      // ignore invalid URLs
    }
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    let allowed = false
    try {
      const parsed = new URL(url)
      allowed = parsed.protocol === 'file:' || Boolean(devUrl && url.startsWith(devUrl))
    } catch {
      allowed = false
    }
    if (!allowed) event.preventDefault()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('studio.athena.qa-workspace')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const { raw } = getDb()
  runMigrations(raw, getUserDataPath())

  registerProjectsIpc()
  registerCategoriesIpc()
  registerTestCasesIpc()
  registerTestPlansIpc()
  registerTestCyclesIpc()
  registerAssignmentsIpc()
  registerTestTypesIpc()
  registerBackupIpc()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  closeDb()
})
