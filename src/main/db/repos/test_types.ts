import { asc, eq, inArray } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { randomUUID } from 'crypto'
import { test_types } from '../schema/test_types'
import { test_type_cases } from '../schema/test_type_cases'
import type * as schema from '../schema'
import {
  NewTestTypeSchema,
  TestTypePatchSchema,
  type NewTestTypeInput,
  type TestType,
  type TestTypePatch
} from '../../../shared/types/test_types'
import { NotFoundError } from './errors'

type Db = BetterSQLite3Database<typeof schema>

export function listTestTypes(db: Db, projectId: string): TestType[] {
  return db
    .select()
    .from(test_types)
    .where(eq(test_types.project_id, projectId))
    .orderBy(asc(test_types.name))
    .all() as TestType[]
}

export function getTestType(db: Db, id: string): TestType | null {
  const row = db.select().from(test_types).where(eq(test_types.id, id)).get()
  return (row as TestType | undefined) ?? null
}

export function createTestType(db: Db, input: NewTestTypeInput): TestType {
  const parsed = NewTestTypeSchema.parse(input)
  const now = new Date().toISOString()
  const row: TestType = {
    id: randomUUID(),
    project_id: parsed.project_id,
    name: parsed.name,
    description: parsed.description ?? null,
    created_at: now,
    updated_at: now
  }
  db.insert(test_types).values(row).run()
  return row
}

export function updateTestType(db: Db, id: string, patch: TestTypePatch): TestType {
  const parsed = TestTypePatchSchema.parse(patch)
  const existing = getTestType(db, id)
  if (!existing) throw new NotFoundError('test type', id)
  const now = new Date().toISOString()
  const next: TestType = { ...existing, ...parsed, updated_at: now }
  db.update(test_types)
    .set({ ...parsed, updated_at: now })
    .where(eq(test_types.id, id))
    .run()
  return next
}

export function deleteTestType(db: Db, id: string): void {
  const existing = getTestType(db, id)
  if (!existing) throw new NotFoundError('test type', id)
  db.delete(test_types).where(eq(test_types.id, id)).run()
}

export function getTestTypeCaseIds(db: Db, testTypeId: string): string[] {
  const rows = db
    .select({ id: test_type_cases.test_case_id })
    .from(test_type_cases)
    .where(eq(test_type_cases.test_type_id, testTypeId))
    .all()
  return rows.map((r) => r.id as string)
}

export function setTestTypeCases(db: Db, testTypeId: string, caseIds: string[]): void {
  const existing = getTestType(db, testTypeId)
  if (!existing) throw new NotFoundError('test type', testTypeId)
  db.delete(test_type_cases).where(eq(test_type_cases.test_type_id, testTypeId)).run()
  if (caseIds.length > 0) {
    db.insert(test_type_cases)
      .values(caseIds.map((cid) => ({ test_type_id: testTypeId, test_case_id: cid })))
      .run()
  }
}

export function getTestTypeCounts(db: Db, projectId: string): Record<string, number> {
  const types = listTestTypes(db, projectId)
  if (types.length === 0) return {}
  const ids = types.map((t) => t.id)
  const rows = db
    .select({ tid: test_type_cases.test_type_id })
    .from(test_type_cases)
    .where(inArray(test_type_cases.test_type_id, ids))
    .all()
  const out: Record<string, number> = {}
  for (const t of types) out[t.id] = 0
  for (const r of rows) {
    const k = r.tid as string
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}
