import { ipcMain } from 'electron'
import { getDb } from '../db/client'
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  listSubcategories,
  listTopCategories,
  updateCategory
} from '../db/repos/categories'
import type { CategoryPatch, NewCategoryInput } from '../../shared/types/categories'

export function registerCategoriesIpc(): void {
  ipcMain.handle('categories:list', (_e, projectId: string) =>
    listCategories(getDb().drizzle, projectId)
  )
  ipcMain.handle('categories:listTop', (_e, projectId: string) =>
    listTopCategories(getDb().drizzle, projectId)
  )
  ipcMain.handle('categories:listSub', (_e, parentId: string) =>
    listSubcategories(getDb().drizzle, parentId)
  )
  ipcMain.handle('categories:get', (_e, id: string) => getCategory(getDb().drizzle, id))
  ipcMain.handle('categories:create', (_e, input: NewCategoryInput) =>
    createCategory(getDb().drizzle, input)
  )
  ipcMain.handle('categories:update', (_e, id: string, patch: CategoryPatch) =>
    updateCategory(getDb().drizzle, id, patch)
  )
  ipcMain.handle('categories:delete', (_e, id: string) => {
    deleteCategory(getDb().drizzle, id)
  })
}
