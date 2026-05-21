import { desc, eq, sql } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { randomUUID } from 'crypto'
import { projects } from '../schema/projects'
import type * as schema from '../schema'
import {
  NewProjectSchema,
  ProjectPatchSchema,
  type NewProjectInput,
  type Project,
  type ProjectPatch
} from '../../../shared/types/projects'
import { NotFoundError, UniqueConstraintError } from './errors'

export { NotFoundError, UniqueConstraintError }

type Db = BetterSQLite3Database<typeof schema>

export function listProjects(db: Db): Project[] {
  return db.select().from(projects).orderBy(desc(projects.created_at)).all() as Project[]
}

export function getProject(db: Db, id: string): Project | null {
  const row = db.select().from(projects).where(eq(projects.id, id)).get()
  return (row as Project | undefined) ?? null
}

export function createProject(db: Db, input: NewProjectInput): Project {
  const parsed = NewProjectSchema.parse(input)
  const now = new Date().toISOString()
  const row = {
    id: randomUUID(),
    display_prefix: parsed.display_prefix,
    name: parsed.name,
    description: parsed.description ?? null,
    color: parsed.color,
    logo: parsed.logo ?? null,
    case_counter: 0,
    plan_counter: 0,
    created_at: now,
    updated_at: now
  }

  try {
    db.insert(projects).values(row).run()
  } catch (err) {
    if (err instanceof Error && /UNIQUE constraint failed/i.test(err.message)) {
      throw new UniqueConstraintError('display_prefix', parsed.display_prefix)
    }
    throw err
  }

  return row as Project
}

export function updateProject(db: Db, id: string, patch: ProjectPatch): Project {
  const parsed = ProjectPatchSchema.parse(patch)
  const existing = getProject(db, id)
  if (!existing) throw new NotFoundError('project', id)

  const now = new Date().toISOString()
  const next = { ...existing, ...parsed, updated_at: now }

  db.update(projects)
    .set({ ...parsed, updated_at: now })
    .where(eq(projects.id, id))
    .run()

  return next
}

export function deleteProject(db: Db, id: string): void {
  const existing = getProject(db, id)
  if (!existing) throw new NotFoundError('project', id)
  db.delete(projects).where(eq(projects.id, id)).run()
}

export function incrementCaseCounter(db: Db, id: string): number {
  const row = db
    .update(projects)
    .set({ case_counter: sql`${projects.case_counter} + 1`, updated_at: new Date().toISOString() })
    .where(eq(projects.id, id))
    .returning({ value: projects.case_counter })
    .get()
  if (!row) throw new NotFoundError('project', id)
  return row.value
}

export function incrementPlanCounter(db: Db, id: string): number {
  const row = db
    .update(projects)
    .set({ plan_counter: sql`${projects.plan_counter} + 1`, updated_at: new Date().toISOString() })
    .where(eq(projects.id, id))
    .returning({ value: projects.plan_counter })
    .get()
  if (!row) throw new NotFoundError('project', id)
  return row.value
}
