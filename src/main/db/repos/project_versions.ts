import { desc, eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { randomUUID } from 'crypto'
import { project_versions } from '../schema/project_versions'
import type * as schema from '../schema'
import {
  NewProjectVersionSchema,
  ProjectVersionPatchSchema,
  type NewProjectVersionInput,
  type ProjectVersion,
  type ProjectVersionPatch
} from '../../../shared/types/project_versions'
import { NotFoundError, UniqueConstraintError } from './errors'

type Db = BetterSQLite3Database<typeof schema>

export function listProjectVersions(db: Db, projectId: string): ProjectVersion[] {
  return db
    .select()
    .from(project_versions)
    .where(eq(project_versions.project_id, projectId))
    .orderBy(desc(project_versions.created_at))
    .all() as ProjectVersion[]
}

export function getProjectVersion(db: Db, id: string): ProjectVersion | null {
  const row = db.select().from(project_versions).where(eq(project_versions.id, id)).get()
  return (row as ProjectVersion | undefined) ?? null
}

export function createProjectVersion(db: Db, input: NewProjectVersionInput): ProjectVersion {
  const parsed = NewProjectVersionSchema.parse(input)
  const now = new Date().toISOString()
  const row: ProjectVersion = {
    id: randomUUID(),
    project_id: parsed.project_id,
    version: parsed.version,
    notes: parsed.notes ?? null,
    released_at: parsed.released_at ?? null,
    created_at: now,
    updated_at: now
  }

  try {
    db.insert(project_versions).values(row).run()
  } catch (err) {
    if (err instanceof Error && /UNIQUE constraint failed/i.test(err.message)) {
      throw new UniqueConstraintError('version', parsed.version)
    }
    throw err
  }

  return row
}

export function updateProjectVersion(
  db: Db,
  id: string,
  patch: ProjectVersionPatch
): ProjectVersion {
  const parsed = ProjectVersionPatchSchema.parse(patch)
  const existing = getProjectVersion(db, id)
  if (!existing) throw new NotFoundError('project_version', id)
  const now = new Date().toISOString()
  const next: ProjectVersion = { ...existing, ...parsed, updated_at: now }
  try {
    db.update(project_versions)
      .set({ ...parsed, updated_at: now })
      .where(eq(project_versions.id, id))
      .run()
  } catch (err) {
    if (err instanceof Error && /UNIQUE constraint failed/i.test(err.message)) {
      throw new UniqueConstraintError('version', parsed.version ?? existing.version)
    }
    throw err
  }
  return next
}

export function deleteProjectVersion(db: Db, id: string): void {
  const existing = getProjectVersion(db, id)
  if (!existing) throw new NotFoundError('project_version', id)
  db.delete(project_versions).where(eq(project_versions.id, id)).run()
}
