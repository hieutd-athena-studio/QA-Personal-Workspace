import { and, asc, eq, isNull } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { randomUUID } from 'crypto'
import { categories } from '../schema/categories'
import type * as schema from '../schema'
import {
  CategoryPatchSchema,
  NewCategorySchema,
  type Category,
  type CategoryPatch,
  type NewCategoryInput
} from '../../../shared/types/categories'
import { NotFoundError } from './errors'

type Db = BetterSQLite3Database<typeof schema>

export function listCategories(db: Db, projectId: string): Category[] {
  return db
    .select()
    .from(categories)
    .where(eq(categories.project_id, projectId))
    .orderBy(asc(categories.position), asc(categories.name))
    .all() as Category[]
}

export function listTopCategories(db: Db, projectId: string): Category[] {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.project_id, projectId), isNull(categories.parent_category_id)))
    .orderBy(asc(categories.position), asc(categories.name))
    .all() as Category[]
}

export function listSubcategories(db: Db, parentId: string): Category[] {
  return db
    .select()
    .from(categories)
    .where(eq(categories.parent_category_id, parentId))
    .orderBy(asc(categories.position), asc(categories.name))
    .all() as Category[]
}

export function getCategory(db: Db, id: string): Category | null {
  const row = db.select().from(categories).where(eq(categories.id, id)).get()
  return (row as Category | undefined) ?? null
}

export function createCategory(db: Db, input: NewCategoryInput): Category {
  const parsed = NewCategorySchema.parse(input)
  if (parsed.parent_category_id) {
    const parent = getCategory(db, parsed.parent_category_id)
    if (!parent) throw new NotFoundError('category', parsed.parent_category_id)
    if (parent.parent_category_id) {
      throw new Error('cannot nest categories more than 2 levels')
    }
  }
  const now = new Date().toISOString()
  const row: Category = {
    id: randomUUID(),
    project_id: parsed.project_id,
    parent_category_id: parsed.parent_category_id ?? null,
    name: parsed.name,
    position: parsed.position ?? 0,
    created_at: now,
    updated_at: now
  }
  db.insert(categories).values(row).run()
  return row
}

export function updateCategory(db: Db, id: string, patch: CategoryPatch): Category {
  const parsed = CategoryPatchSchema.parse(patch)
  const existing = getCategory(db, id)
  if (!existing) throw new NotFoundError('category', id)
  const now = new Date().toISOString()
  const next: Category = { ...existing, ...parsed, updated_at: now }
  db.update(categories)
    .set({ ...parsed, updated_at: now })
    .where(eq(categories.id, id))
    .run()
  return next
}

export function deleteCategory(db: Db, id: string): void {
  const existing = getCategory(db, id)
  if (!existing) throw new NotFoundError('category', id)
  db.delete(categories).where(eq(categories.id, id)).run()
}
