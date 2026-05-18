import { ipcMain } from 'electron'
import { getDb } from '../db/client'
import {
  assignCasesToCycle,
  batchUnassign,
  getCycleProgress,
  listAssignmentsWithCase,
  setAssignmentStatus,
  updateAssignment
} from '../db/repos/assignments'
import type { AssignmentStatus, AssignmentUpdate } from '../../shared/types/assignments'

export function registerAssignmentsIpc(): void {
  ipcMain.handle('assignments:list', (_e, cycleId: string) =>
    listAssignmentsWithCase(getDb().drizzle, cycleId)
  )
  ipcMain.handle('assignments:assign', (_e, cycleId: string, caseIds: string[]) =>
    assignCasesToCycle(getDb().drizzle, cycleId, caseIds)
  )
  ipcMain.handle('assignments:batchUnassign', (_e, ids: string[]) =>
    batchUnassign(getDb().drizzle, ids)
  )
  ipcMain.handle(
    'assignments:setStatus',
    (_e, id: string, status: AssignmentStatus, notes?: string | null) =>
      setAssignmentStatus(getDb().drizzle, id, status, notes ?? null)
  )
  ipcMain.handle('assignments:update', (_e, id: string, patch: AssignmentUpdate) =>
    updateAssignment(getDb().drizzle, id, patch)
  )
  ipcMain.handle('assignments:progress', (_e, cycleId: string) =>
    getCycleProgress(getDb().drizzle, cycleId)
  )
}
