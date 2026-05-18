import { and, asc, eq, like, or } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { randomUUID } from 'crypto'
import { test_cases } from '../schema/test_cases'
import { test_case_steps } from '../schema/test_case_steps'
import { projects } from '../schema/projects'
import type * as schema from '../schema'
import {
  NewTestCaseSchema,
  TestCasePatchSchema,
  type NewTestCaseInput,
  type TestCase,
  type TestCasePatch,
  type TestCaseStep,
  type TestCaseWithSteps
} from '../../../shared/types/test_cases'
import { NotFoundError } from './errors'

type Db = BetterSQLite3Database<typeof schema>

function nextDisplayId(db: Db, projectId: string): string {
  const proj = db.select().from(projects).where(eq(projects.id, projectId)).get()
  if (!proj) throw new NotFoundError('project', projectId)
  const next = (proj.case_counter as number) + 1
  db.update(projects)
    .set({ case_counter: next, updated_at: new Date().toISOString() })
    .where(eq(projects.id, projectId))
    .run()
  return `${proj.display_prefix}-TC${String(next).padStart(3, '0')}`
}

export function listTestCases(db: Db, projectId: string): TestCase[] {
  return db
    .select()
    .from(test_cases)
    .where(eq(test_cases.project_id, projectId))
    .orderBy(asc(test_cases.display_id))
    .all() as TestCase[]
}

export function listTestCasesBySubcategory(db: Db, subcategoryId: string): TestCase[] {
  return db
    .select()
    .from(test_cases)
    .where(eq(test_cases.subcategory_id, subcategoryId))
    .orderBy(asc(test_cases.display_id))
    .all() as TestCase[]
}

export function getTestCase(db: Db, id: string): TestCase | null {
  const row = db.select().from(test_cases).where(eq(test_cases.id, id)).get()
  return (row as TestCase | undefined) ?? null
}

export function getTestCaseSteps(db: Db, testCaseId: string): TestCaseStep[] {
  return db
    .select()
    .from(test_case_steps)
    .where(eq(test_case_steps.test_case_id, testCaseId))
    .orderBy(asc(test_case_steps.position))
    .all() as TestCaseStep[]
}

export function getTestCaseWithSteps(db: Db, id: string): TestCaseWithSteps | null {
  const tc = getTestCase(db, id)
  if (!tc) return null
  return { ...tc, steps: getTestCaseSteps(db, id) }
}

export function searchTestCases(db: Db, projectId: string, query: string): TestCase[] {
  const q = `%${query.toLowerCase()}%`
  return db
    .select()
    .from(test_cases)
    .where(
      and(
        eq(test_cases.project_id, projectId),
        or(
          like(test_cases.name, q),
          like(test_cases.display_id, q),
          like(test_cases.description, q)
        )
      )
    )
    .orderBy(asc(test_cases.display_id))
    .all() as TestCase[]
}

export function createTestCase(db: Db, input: NewTestCaseInput): TestCaseWithSteps {
  const parsed = NewTestCaseSchema.parse(input)
  const now = new Date().toISOString()
  const id = randomUUID()
  const display_id = nextDisplayId(db, parsed.project_id)

  const row: TestCase = {
    id,
    project_id: parsed.project_id,
    subcategory_id: parsed.subcategory_id,
    display_id,
    name: parsed.name,
    description: parsed.description ?? null,
    expected_result: parsed.expected_result ?? null,
    version: parsed.version,
    created_at: now,
    updated_at: now
  }
  db.insert(test_cases).values(row).run()

  const steps: TestCaseStep[] = parsed.steps.map((s, i) => ({
    id: randomUUID(),
    test_case_id: id,
    position: i,
    action: s.action,
    expected: s.expected
  }))
  if (steps.length > 0) {
    db.insert(test_case_steps).values(steps).run()
  }

  return { ...row, steps }
}

export function updateTestCase(db: Db, id: string, patch: TestCasePatch): TestCaseWithSteps {
  const parsed = TestCasePatchSchema.parse(patch)
  const existing = getTestCase(db, id)
  if (!existing) throw new NotFoundError('test case', id)

  const now = new Date().toISOString()
  const { steps, ...rest } = parsed
  const merged: TestCase = { ...existing, ...rest, updated_at: now }
  db.update(test_cases)
    .set({ ...rest, updated_at: now })
    .where(eq(test_cases.id, id))
    .run()

  if (steps !== undefined) {
    db.delete(test_case_steps).where(eq(test_case_steps.test_case_id, id)).run()
    if (steps.length > 0) {
      const newSteps: TestCaseStep[] = steps.map((s, i) => ({
        id: randomUUID(),
        test_case_id: id,
        position: i,
        action: s.action,
        expected: s.expected
      }))
      db.insert(test_case_steps).values(newSteps).run()
    }
  }

  return { ...merged, steps: getTestCaseSteps(db, id) }
}

export function deleteTestCase(db: Db, id: string): void {
  const existing = getTestCase(db, id)
  if (!existing) throw new NotFoundError('test case', id)
  db.delete(test_cases).where(eq(test_cases.id, id)).run()
}

export function importTestCasesJson(
  db: Db,
  projectId: string,
  payload: NewTestCaseInput[]
): number {
  let count = 0
  for (const tc of payload) {
    createTestCase(db, { ...tc, project_id: projectId })
    count++
  }
  return count
}

export function exportTestCasesJson(db: Db, projectId: string): TestCaseWithSteps[] {
  const list = listTestCases(db, projectId)
  return list.map((tc) => ({ ...tc, steps: getTestCaseSteps(db, tc.id) }))
}
