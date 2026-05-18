import { ipcMain } from 'electron'
import { getDb } from '../db/client'
import {
  createTestCycle,
  deleteTestCycle,
  getTestCycle,
  listAllProjectCycles,
  listTestCycles,
  updateTestCycle
} from '../db/repos/test_cycles'
import type { NewTestCycleInput, TestCyclePatch } from '../../shared/types/test_cycles'

export function registerTestCyclesIpc(): void {
  ipcMain.handle('cycles:list', (_e, planId: string) => listTestCycles(getDb().drizzle, planId))
  ipcMain.handle('cycles:listByProject', (_e, projectId: string) =>
    listAllProjectCycles(getDb().drizzle, projectId)
  )
  ipcMain.handle('cycles:get', (_e, id: string) => getTestCycle(getDb().drizzle, id))
  ipcMain.handle('cycles:create', (_e, input: NewTestCycleInput) =>
    createTestCycle(getDb().drizzle, input)
  )
  ipcMain.handle('cycles:update', (_e, id: string, patch: TestCyclePatch) =>
    updateTestCycle(getDb().drizzle, id, patch)
  )
  ipcMain.handle('cycles:delete', (_e, id: string) => {
    deleteTestCycle(getDb().drizzle, id)
  })
}
