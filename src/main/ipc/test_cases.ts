import { ipcMain } from 'electron'
import { getDb } from '../db/client'
import {
  createTestCase,
  deleteTestCase,
  exportTestCasesJson,
  getTestCase,
  getTestCaseWithSteps,
  importTestCasesJson,
  listTestCases,
  listTestCasesBySubcategory,
  searchTestCases,
  updateTestCase
} from '../db/repos/test_cases'
import type { NewTestCaseInput, TestCasePatch } from '../../shared/types/test_cases'

export function registerTestCasesIpc(): void {
  ipcMain.handle('cases:list', (_e, projectId: string) => listTestCases(getDb().drizzle, projectId))
  ipcMain.handle('cases:listBySubcategory', (_e, subcategoryId: string) =>
    listTestCasesBySubcategory(getDb().drizzle, subcategoryId)
  )
  ipcMain.handle('cases:get', (_e, id: string) => getTestCase(getDb().drizzle, id))
  ipcMain.handle('cases:getWithSteps', (_e, id: string) =>
    getTestCaseWithSteps(getDb().drizzle, id)
  )
  ipcMain.handle('cases:search', (_e, projectId: string, query: string) =>
    searchTestCases(getDb().drizzle, projectId, query)
  )
  ipcMain.handle('cases:create', (_e, input: NewTestCaseInput) =>
    createTestCase(getDb().drizzle, input)
  )
  ipcMain.handle('cases:update', (_e, id: string, patch: TestCasePatch) =>
    updateTestCase(getDb().drizzle, id, patch)
  )
  ipcMain.handle('cases:delete', (_e, id: string) => {
    deleteTestCase(getDb().drizzle, id)
  })
  ipcMain.handle('cases:importJson', (_e, projectId: string, payload: NewTestCaseInput[]) =>
    importTestCasesJson(getDb().drizzle, projectId, payload)
  )
  ipcMain.handle('cases:exportJson', (_e, projectId: string) =>
    exportTestCasesJson(getDb().drizzle, projectId)
  )
}
