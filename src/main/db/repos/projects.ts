import { desc, eq, sql } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { randomUUID } from 'crypto'
import { projects } from '../schema/projects'
import type * as schema from '../schema'
import {
  NewProjectSchema,
  ProjectPatchSchema,
  ProjectMetadataSchema,
  type NewProjectInput,
  type Project,
  type ProjectMetadata,
  type ProjectPatch
} from '../../../shared/types/projects'
import { NotFoundError, UniqueConstraintError } from './errors'

export { NotFoundError, UniqueConstraintError }

type Db = BetterSQLite3Database<typeof schema>

// SQLite stores `metadata` as JSON-encoded TEXT. Hydrate on read, serialize on write.
interface ProjectRowShape {
  id: string
  display_prefix: string
  name: string
  description: string | null
  color: string
  logo: string | null
  metadata: string | null
  current_version_id: string | null
  case_counter: number
  plan_counter: number
  created_at: string
  updated_at: string
}

function hydrate(row: ProjectRowShape): Project {
  let metadata: ProjectMetadata | null = null
  if (row.metadata) {
    try {
      const parsed = JSON.parse(row.metadata)
      metadata = ProjectMetadataSchema.parse(parsed)
    } catch {
      metadata = null
    }
  }
  return {
    id: row.id,
    display_prefix: row.display_prefix,
    name: row.name,
    description: row.description,
    color: row.color,
    logo: row.logo,
    metadata,
    current_version_id: row.current_version_id,
    case_counter: row.case_counter,
    plan_counter: row.plan_counter,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export function listProjects(db: Db): Project[] {
  const rows = db.select().from(projects).orderBy(desc(projects.created_at)).all()
  return (rows as ProjectRowShape[]).map(hydrate)
}

export function getProject(db: Db, id: string): Project | null {
  const row = db.select().from(projects).where(eq(projects.id, id)).get()
  return row ? hydrate(row as ProjectRowShape) : null
}

export function createProject(db: Db, input: NewProjectInput): Project {
  const parsed = NewProjectSchema.parse(input)
  const now = new Date().toISOString()
  const row: ProjectRowShape = {
    id: randomUUID(),
    display_prefix: parsed.display_prefix,
    name: parsed.name,
    description: parsed.description ?? null,
    color: parsed.color,
    logo: parsed.logo ?? null,
    metadata: null,
    current_version_id: null,
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

  return hydrate(row)
}

export function updateProject(db: Db, id: string, patch: ProjectPatch): Project {
  const parsed = ProjectPatchSchema.parse(patch)
  const existing = getProject(db, id)
  if (!existing) throw new NotFoundError('project', id)

  const now = new Date().toISOString()
  const dbPatch: Record<string, unknown> = { updated_at: now }
  if (parsed.name !== undefined) dbPatch.name = parsed.name
  if (parsed.description !== undefined) dbPatch.description = parsed.description
  if (parsed.color !== undefined) dbPatch.color = parsed.color
  if (parsed.display_prefix !== undefined) dbPatch.display_prefix = parsed.display_prefix
  if (parsed.logo !== undefined) dbPatch.logo = parsed.logo
  if (parsed.metadata !== undefined) {
    dbPatch.metadata = parsed.metadata === null ? null : JSON.stringify(parsed.metadata)
  }
  if (parsed.current_version_id !== undefined) {
    dbPatch.current_version_id = parsed.current_version_id
  }

  db.update(projects).set(dbPatch).where(eq(projects.id, id)).run()

  const updated = getProject(db, id)
  if (!updated) throw new NotFoundError('project', id)
  return updated
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
