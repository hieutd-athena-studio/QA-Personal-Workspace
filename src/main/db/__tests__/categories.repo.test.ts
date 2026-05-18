import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../schema'
import { runMigrations } from '../migrations/runner'
import { createProject } from '../repos/projects'
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  listSubcategories,
  listTopCategories,
  updateCategory
} from '../repos/categories'
import { NotFoundError } from '../repos/errors'

function freshDb(): BetterSQLite3Database<typeof schema> {
  const raw = new Database(':memory:')
  raw.pragma('journal_mode = MEMORY')
  raw.pragma('foreign_keys = ON')
  runMigrations(raw, null)
  return drizzle(raw, { schema })
}

describe('categories repo', () => {
  let db: BetterSQLite3Database<typeof schema>
  let projectId: string

  beforeEach(() => {
    db = freshDb()
    const proj = createProject(db, {
      display_prefix: 'CAT',
      name: 'Cat Project',
      description: null,
      color: '#aabbcc'
    })
    projectId = proj.id
  })

  it('creates a top-level category with generated id', () => {
    const cat = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Top Level'
    })
    expect(cat.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(cat.parent_category_id).toBeNull()
    expect(cat.name).toBe('Top Level')
    expect(cat.project_id).toBe(projectId)
  })

  it('creates a subcategory under a top-level category', () => {
    const parent = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Parent'
    })
    const sub = createCategory(db, {
      project_id: projectId,
      parent_category_id: parent.id,
      name: 'Sub'
    })
    expect(sub.parent_category_id).toBe(parent.id)
  })

  it('enforces 2-level depth: creating subcategory of subcategory throws', () => {
    const parent = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Level 1'
    })
    const child = createCategory(db, {
      project_id: projectId,
      parent_category_id: parent.id,
      name: 'Level 2'
    })
    expect(() =>
      createCategory(db, {
        project_id: projectId,
        parent_category_id: child.id,
        name: 'Level 3 - forbidden'
      })
    ).toThrow('cannot nest categories more than 2 levels')
  })

  it('listCategories orders by position then name', () => {
    createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Zebra',
      position: 1
    })
    createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Alpha',
      position: 1
    })
    createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Middle',
      position: 0
    })
    const all = listCategories(db, projectId)
    expect(all).toHaveLength(3)
    expect(all[0]!.name).toBe('Middle') // position 0 first
    expect(all[1]!.name).toBe('Alpha') // position 1, alphabetical
    expect(all[2]!.name).toBe('Zebra') // position 1, alphabetical
  })

  it('listTopCategories filters to parent_category_id IS NULL only', () => {
    const top1 = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Top1'
    })
    const top2 = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Top2'
    })
    createCategory(db, { project_id: projectId, parent_category_id: top1.id, name: 'Sub1' })
    const tops = listTopCategories(db, projectId)
    expect(tops).toHaveLength(2)
    expect(tops.map((t) => t.id)).toContain(top1.id)
    expect(tops.map((t) => t.id)).toContain(top2.id)
  })

  it('listSubcategories filters by parent id only', () => {
    const parentA = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'ParentA'
    })
    const parentB = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'ParentB'
    })
    createCategory(db, { project_id: projectId, parent_category_id: parentA.id, name: 'SubA1' })
    createCategory(db, { project_id: projectId, parent_category_id: parentA.id, name: 'SubA2' })
    createCategory(db, { project_id: projectId, parent_category_id: parentB.id, name: 'SubB1' })
    const subsA = listSubcategories(db, parentA.id)
    expect(subsA).toHaveLength(2)
    expect(subsA.every((s) => s.parent_category_id === parentA.id)).toBe(true)
    const subsB = listSubcategories(db, parentB.id)
    expect(subsB).toHaveLength(1)
  })

  it('updateCategory throws NotFoundError for missing id', () => {
    expect(() => updateCategory(db, 'nonexistent', { name: 'New Name' })).toThrow(NotFoundError)
  })

  it('deleteCategory throws NotFoundError for missing id', () => {
    expect(() => deleteCategory(db, 'nonexistent')).toThrow(NotFoundError)
  })

  it('updateCategory changes name and updated_at', async () => {
    const cat = createCategory(db, { project_id: projectId, parent_category_id: null, name: 'Old' })
    await new Promise((r) => setTimeout(r, 10))
    const updated = updateCategory(db, cat.id, { name: 'New' })
    expect(updated.name).toBe('New')
    expect(updated.updated_at).not.toBe(cat.updated_at)
  })

  it('deleteCategory removes the row', () => {
    const cat = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'ToDelete'
    })
    deleteCategory(db, cat.id)
    expect(getCategory(db, cat.id)).toBeNull()
  })

  it('cascade delete: deleting parent category removes subcategories', () => {
    const parent = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Parent'
    })
    const sub1 = createCategory(db, {
      project_id: projectId,
      parent_category_id: parent.id,
      name: 'Sub1'
    })
    const sub2 = createCategory(db, {
      project_id: projectId,
      parent_category_id: parent.id,
      name: 'Sub2'
    })
    deleteCategory(db, parent.id)
    // The migration defines FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE CASCADE
    // With foreign_keys = ON, deleting the parent cascades to remove subcategories
    expect(getCategory(db, parent.id)).toBeNull()
    expect(getCategory(db, sub1.id)).toBeNull()
    expect(getCategory(db, sub2.id)).toBeNull()
  })
})
