import { ipcMain } from 'electron'
import { getDb } from '../db/client'
import {
  createTestType,
  deleteTestType,
  getTestType,
  getTestTypeCaseIds,
  getTestTypeCounts,
  listTestTypes,
  setTestTypeCases,
  updateTestType
} from '../db/repos/test_types'
import type { NewTestTypeInput, TestTypePatch } from '../../shared/types/test_types'

export function registerTestTypesIpc(): void {
  ipcMain.handle('types:list', (_e, projectId: string) => listTestTypes(getDb().drizzle, projectId))
  ipcMain.handle('types:get', (_e, id: string) => getTestType(getDb().drizzle, id))
  ipcMain.handle('types:create', (_e, input: NewTestTypeInput) =>
    createTestType(getDb().drizzle, input)
  )
  ipcMain.handle('types:update', (_e, id: string, patch: TestTypePatch) =>
    updateTestType(getDb().drizzle, id, patch)
  )
  ipcMain.handle('types:delete', (_e, id: string) => {
    deleteTestType(getDb().drizzle, id)
  })
  ipcMain.handle('types:getCases', (_e, id: string) => getTestTypeCaseIds(getDb().drizzle, id))
  ipcMain.handle('types:setCases', (_e, id: string, caseIds: string[]) => {
    setTestTypeCases(getDb().drizzle, id, caseIds)
  })
  ipcMain.handle('types:counts', (_e, projectId: string) =>
    getTestTypeCounts(getDb().drizzle, projectId)
  )
}
