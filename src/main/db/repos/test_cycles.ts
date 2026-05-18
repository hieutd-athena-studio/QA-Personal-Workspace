import { asc, eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { randomUUID } from 'crypto'
import { test_cycles } from '../schema/test_cycles'
import { test_plans } from '../schema/test_plans'
import type * as schema from '../schema'
import {
  NewTestCycleSchema,
  TestCyclePatchSchema,
  type NewTestCycleInput,
  type TestCycle,
  type TestCyclePatch
} from '../../../shared/types/test_cycles'
import { NotFoundError } from './errors'

type Db = BetterSQLite3Database<typeof schema>

function nextCycleDisplayId(db: Db, planId: string): string {
  const plan = db.select().from(test_plans).where(eq(test_plans.id, planId)).get()
  if (!plan) throw new NotFoundError('test plan', planId)
  const existing = db.select().from(test_cycles).where(eq(test_cycles.plan_id, planId)).all()
  const next = existing.length + 1
  return `${plan.display_id}-CY${String(next).padStart(2, '0')}`
}

export function listTestCycles(db: Db, planId: string): TestCycle[] {
  return db
    .select()
    .from(test_cycles)
    .where(eq(test_cycles.plan_id, planId))
    .orderBy(asc(test_cycles.display_id))
    .all() as TestCycle[]
}

export function listAllProjectCycles(db: Db, projectId: string): TestCycle[] {
  const plans = db.select().from(test_plans).where(eq(test_plans.project_id, projectId)).all()
  if (plans.length === 0) return []
  const planIds = plans.map((p) => p.id)
  const all: TestCycle[] = []
  for (const pid of planIds) {
    all.push(...listTestCycles(db, pid))
  }
  return all
}

export function getTestCycle(db: Db, id: string): TestCycle | null {
  const row = db.select().from(test_cycles).where(eq(test_cycles.id, id)).get()
  return (row as TestCycle | undefined) ?? null
}

export function createTestCycle(db: Db, input: NewTestCycleInput): TestCycle {
  const parsed = NewTestCycleSchema.parse(input)
  const now = new Date().toISOString()
  const display_id = nextCycleDisplayId(db, parsed.plan_id)
  const row: TestCycle = {
    id: randomUUID(),
    plan_id: parsed.plan_id,
    display_id,
    name: parsed.name,
    environment: parsed.environment,
    created_at: now,
    updated_at: now
  }
  db.insert(test_cycles).values(row).run()
  return row
}

export function updateTestCycle(db: Db, id: string, patch: TestCyclePatch): TestCycle {
  const parsed = TestCyclePatchSchema.parse(patch)
  const existing = getTestCycle(db, id)
  if (!existing) throw new NotFoundError('test cycle', id)
  const now = new Date().toISOString()
  const next: TestCycle = { ...existing, ...parsed, updated_at: now }
  db.update(test_cycles)
    .set({ ...parsed, updated_at: now })
    .where(eq(test_cycles.id, id))
    .run()
  return next
}

export function deleteTestCycle(db: Db, id: string): void {
  const existing = getTestCycle(db, id)
  if (!existing) throw new NotFoundError('test cycle', id)
  db.delete(test_cycles).where(eq(test_cycles.id, id)).run()
}
