import { ipcMain } from 'electron'
import { getDb } from '../db/client'
import {
  createProjectVersion,
  deleteProjectVersion,
  getProjectVersion,
  listProjectVersions,
  updateProjectVersion
} from '../db/repos/project_versions'
import type {
  NewProjectVersionInput,
  ProjectVersionPatch
} from '../../shared/types/project_versions'

export function registerProjectVersionsIpc(): void {
  ipcMain.handle('project_versions:list', (_event, projectId: string) =>
    listProjectVersions(getDb().drizzle, projectId)
  )

  ipcMain.handle('project_versions:get', (_event, id: string) =>
    getProjectVersion(getDb().drizzle, id)
  )

  ipcMain.handle('project_versions:create', (_event, input: NewProjectVersionInput) =>
    createProjectVersion(getDb().drizzle, input)
  )

  ipcMain.handle('project_versions:update', (_event, id: string, patch: ProjectVersionPatch) =>
    updateProjectVersion(getDb().drizzle, id, patch)
  )

  ipcMain.handle('project_versions:delete', (_event, id: string) => {
    deleteProjectVersion(getDb().drizzle, id)
  })
}
