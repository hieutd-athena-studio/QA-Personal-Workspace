import { dialog, ipcMain } from 'electron'
import { closeDb, getDb, getDbPath, getUserDataPath } from '../db/client'
import { exportDatabase, importDatabase, snapshotDatabase } from '../db/backup'
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
        'A snapshot of the current workspace will be saved first; you can restore it later from userData/snapshots if anything goes wrong.'
    })
    if (confirm.response !== 1) return { canceled: true }

    snapshotDatabase(getDb().raw, getUserDataPath())
    closeDb()
    try {
      importDatabase(filePaths[0]!, getDbPath())
    } catch (err) {
      // Re-open existing DB so the app stays functional after a failed import.
      getDb()
      throw err
    }
    const { raw } = getDb()
    runMigrations(raw, getUserDataPath())
    return { canceled: false }
  })
}
