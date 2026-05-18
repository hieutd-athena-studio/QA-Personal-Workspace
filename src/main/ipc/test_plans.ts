import { ipcMain } from 'electron'
import { getDb } from '../db/client'
import {
  createTestPlan,
  deleteTestPlan,
  getTestPlan,
  getTestPlanWithTasks,
  listTestPlans,
  updateTestPlan
} from '../db/repos/test_plans'
import type { NewTestPlanInput, TestPlanPatch } from '../../shared/types/test_plans'

export function registerTestPlansIpc(): void {
  ipcMain.handle('plans:list', (_e, projectId: string) => listTestPlans(getDb().drizzle, projectId))
  ipcMain.handle('plans:get', (_e, id: string) => getTestPlan(getDb().drizzle, id))
  ipcMain.handle('plans:getWithTasks', (_e, id: string) =>
    getTestPlanWithTasks(getDb().drizzle, id)
  )
  ipcMain.handle('plans:create', (_e, input: NewTestPlanInput) =>
    createTestPlan(getDb().drizzle, input)
  )
  ipcMain.handle('plans:update', (_e, id: string, patch: TestPlanPatch) =>
    updateTestPlan(getDb().drizzle, id, patch)
  )
  ipcMain.handle('plans:delete', (_e, id: string) => {
    deleteTestPlan(getDb().drizzle, id)
  })
}
