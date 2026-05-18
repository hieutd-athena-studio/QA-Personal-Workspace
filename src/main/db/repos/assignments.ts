import { and, asc, eq, inArray } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { randomUUID } from 'crypto'
import { assignments } from '../schema/assignments'
import { test_cases } from '../schema/test_cases'
import type * as schema from '../schema'
import {
  AssignmentUpdateSchema,
  type Assignment,
  type AssignmentStatus,
  type AssignmentUpdate
} from '../../../shared/types/assignments'
import { NotFoundError } from './errors'

type Db = BetterSQLite3Database<typeof schema>

export function listAssignments(db: Db, cycleId: string): Assignment[] {
  return db
    .select()
    .from(assignments)
    .where(eq(assignments.cycle_id, cycleId))
    .orderBy(asc(assignments.created_at))
    .all() as Assignment[]
}

export function listAssignmentsWithCase(
  db: Db,
  cycleId: string
): Array<Assignment & { test_case_display_id: string; test_case_name: string }> {
  const rows = db
    .select({
      a: assignments,
      tc_display: test_cases.display_id,
      tc_name: test_cases.name
    })
    .from(assignments)
    .innerJoin(test_cases, eq(assignments.test_case_id, test_cases.id))
    .where(eq(assignments.cycle_id, cycleId))
    .orderBy(asc(test_cases.display_id))
    .all()
  return rows.map((r) => ({
    ...(r.a as Assignment),
    test_case_display_id: r.tc_display as string,
    test_case_name: r.tc_name as string
  }))
}

export function getAssignment(db: Db, id: string): Assignment | null {
  const row = db.select().from(assignments).where(eq(assignments.id, id)).get()
  return (row as Assignment | undefined) ?? null
}

export function assignCasesToCycle(
  db: Db,
  cycleId: string,
  testCaseIds: string[]
): { inserted: number } {
  if (testCaseIds.length === 0) return { inserted: 0 }
  const existing = db
    .select({ tc: assignments.test_case_id })
    .from(assignments)
    .where(and(eq(assignments.cycle_id, cycleId), inArray(assignments.test_case_id, testCaseIds)))
    .all()
  const existingIds = new Set(existing.map((r) => r.tc as string))
  const toInsert = testCaseIds.filter((id) => !existingIds.has(id))
  if (toInsert.length === 0) return { inserted: 0 }

  const now = new Date().toISOString()
  const rows: Assignment[] = toInsert.map((tcId) => ({
    id: randomUUID(),
    cycle_id: cycleId,
    test_case_id: tcId,
    status: 'Unexecuted',
    notes: null,
    executed_at: null,
    created_at: now,
    updated_at: now
  }))
  db.insert(assignments).values(rows).run()
  return { inserted: rows.length }
}

export function batchUnassign(db: Db, assignmentIds: string[]): { removed: number } {
  if (assignmentIds.length === 0) return { removed: 0 }
  const result = db.delete(assignments).where(inArray(assignments.id, assignmentIds)).run()
  return { removed: result.changes }
}

export function updateAssignment(db: Db, id: string, patch: AssignmentUpdate): Assignment {
  const parsed = AssignmentUpdateSchema.parse(patch)
  const existing = getAssignment(db, id)
  if (!existing) throw new NotFoundError('assignment', id)
  const now = new Date().toISOString()
  const executed_at =
    parsed.status && parsed.status !== 'Unexecuted'
      ? now
      : parsed.status === 'Unexecuted'
        ? null
        : existing.executed_at
  const next: Assignment = { ...existing, ...parsed, executed_at, updated_at: now }
  db.update(assignments)
    .set({ ...parsed, executed_at, updated_at: now })
    .where(eq(assignments.id, id))
    .run()
  return next
}

export function setAssignmentStatus(
  db: Db,
  id: string,
  status: AssignmentStatus,
  notes?: string | null
): Assignment {
  return updateAssignment(db, id, { status, notes: notes ?? null })
}

export interface CycleProgress {
  total: number
  pass: number
  fail: number
  blocked: number
  unexecuted: number
}

export function getCycleProgress(db: Db, cycleId: string): CycleProgress {
  const rows = db
    .select()
    .from(assignments)
    .where(eq(assignments.cycle_id, cycleId))
    .all() as Assignment[]
  const p: CycleProgress = { total: rows.length, pass: 0, fail: 0, blocked: 0, unexecuted: 0 }
  for (const a of rows) {
    if (a.status === 'Pass') p.pass++
    else if (a.status === 'Fail') p.fail++
    else if (a.status === 'Blocked') p.blocked++
    else p.unexecuted++
  }
  return p
}
