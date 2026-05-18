import { ipcMain } from 'electron'
import { getDb } from '../db/client'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from '../db/repos/projects'
import type { NewProjectInput, ProjectPatch } from '../../shared/types/projects'

export function registerProjectsIpc(): void {
  ipcMain.handle('projects:list', () => listProjects(getDb().drizzle))

  ipcMain.handle('projects:get', (_event, id: string) => getProject(getDb().drizzle, id))

  ipcMain.handle('projects:create', (_event, input: NewProjectInput) =>
    createProject(getDb().drizzle, input)
  )

  ipcMain.handle('projects:update', (_event, id: string, patch: ProjectPatch) =>
    updateProject(getDb().drizzle, id, patch)
  )

  ipcMain.handle('projects:delete', (_event, id: string) => {
    deleteProject(getDb().drizzle, id)
  })
}
