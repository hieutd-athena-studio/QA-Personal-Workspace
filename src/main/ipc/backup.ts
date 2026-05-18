import { dialog, ipcMain } from 'electron'
import { closeDb, getDb, getDbPath, getUserDataPath } from '../db/client'
import { exportDatabase, importDatabase } from '../db/backup'
import { runMigrations } from '../db/migrations/runner'

export function registerBackupIpc(): void {
  ipcMain.handle('backup:export', async () => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Export workspace backup',
      defaultPath: `qa-workspace-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'SQLite database', extensions: ['db'] }]
    })
    if (canceled || !filePath) return { canceled: true, path: null }
    exportDatabase(getDb().raw, filePath)
    return { canceled: false, path: filePath }
  })

  ipcMain.handle('backup:import', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Restore workspace from backup',
      properties: ['openFile'],
      filters: [{ name: 'SQLite database', extensions: ['db'] }]
    })
    if (canceled || filePaths.length === 0) return { canceled: true }

    const confirm = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Cancel', 'Replace current workspace'],
      defaultId: 0,
      cancelId: 0,
      message: 'Replace current workspace with imported backup?',
      detail:
        'This action overwrites your current database. A snapshot of the current state will be saved first.'
    })
    if (confirm.response !== 1) return { canceled: true }

    closeDb()
    importDatabase(filePaths[0]!, getDbPath())
    const { raw } = getDb()
    runMigrations(raw, getUserDataPath())
    return { canceled: false }
  })
}
