import { asc, eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { randomUUID } from 'crypto'
import { test_plans } from '../schema/test_plans'
import { test_plan_tasks } from '../schema/test_plan_tasks'
import { projects } from '../schema/projects'
import { incrementPlanCounter } from './projects'
import type * as schema from '../schema'
import {
  NewTestPlanSchema,
  TestPlanPatchSchema,
  type NewTestPlanInput,
  type TestPlan,
  type TestPlanPatch,
  type TestPlanTask,
  type TestPlanWithTasks
} from '../../../shared/types/test_plans'
import { NotFoundError } from './errors'

type Db = BetterSQLite3Database<typeof schema>

function nextDisplayId(db: Db, projectId: string): string {
  const proj = db.select().from(projects).where(eq(projects.id, projectId)).get()
  if (!proj) throw new NotFoundError('project', projectId)
  const next = incrementPlanCounter(db, projectId)
  return `${proj.display_prefix}-PL${String(next).padStart(3, '0')}`
}

export function listTestPlans(db: Db, projectId: string): TestPlan[] {
  return db
    .select()
    .from(test_plans)
    .where(eq(test_plans.project_id, projectId))
    .orderBy(asc(test_plans.display_id))
    .all() as TestPlan[]
}

export function getTestPlan(db: Db, id: string): TestPlan | null {
  const row = db.select().from(test_plans).where(eq(test_plans.id, id)).get()
  return (row as TestPlan | undefined) ?? null
}

export function getTestPlanTasks(db: Db, planId: string): TestPlanTask[] {
  return db
    .select()
    .from(test_plan_tasks)
    .where(eq(test_plan_tasks.plan_id, planId))
    .orderBy(asc(test_plan_tasks.position))
    .all() as TestPlanTask[]
}

export function getTestPlanWithTasks(db: Db, id: string): TestPlanWithTasks | null {
  const plan = getTestPlan(db, id)
  if (!plan) return null
  return { ...plan, tasks: getTestPlanTasks(db, id) }
}

export function computeWorkingDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return null
  let days = 0
  const cursor = new Date(s)
  while (cursor <= e) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) days++
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function createTestPlan(db: Db, input: NewTestPlanInput): TestPlanWithTasks {
  const parsed = NewTestPlanSchema.parse(input)
  const now = new Date().toISOString()
  const id = randomUUID()
  const display_id = nextDisplayId(db, parsed.project_id)
  const start = parsed.start_date ?? null
  const end = parsed.end_date ?? null
  const working = parsed.working_days ?? computeWorkingDays(start, end)

  const row: TestPlan = {
    id,
    project_id: parsed.project_id,
    display_id,
    name: parsed.name,
    description: parsed.description ?? null,
    start_date: start,
    end_date: end,
    working_days: working,
    created_at: now,
    updated_at: now
  }
  db.insert(test_plans).values(row).run()

  const tasks: TestPlanTask[] = parsed.tasks.map((t, i) => ({
    id: randomUUID(),
    plan_id: id,
    position: i,
    name: t.name,
    duration_days: t.duration_days
  }))
  if (tasks.length > 0) {
    db.insert(test_plan_tasks).values(tasks).run()
  }

  return { ...row, tasks }
}

export function updateTestPlan(db: Db, id: string, patch: TestPlanPatch): TestPlanWithTasks {
  const parsed = TestPlanPatchSchema.parse(patch)
  const existing = getTestPlan(db, id)
  if (!existing) throw new NotFoundError('test plan', id)

  const now = new Date().toISOString()
  const { tasks, ...rest } = parsed
  const next: TestPlan = {
    ...existing,
    ...rest,
    working_days:
      rest.working_days !== undefined
        ? rest.working_days
        : rest.start_date !== undefined || rest.end_date !== undefined
          ? computeWorkingDays(
              rest.start_date ?? existing.start_date,
              rest.end_date ?? existing.end_date
            )
          : existing.working_days,
    updated_at: now
  }

  db.update(test_plans)
    .set({
      ...rest,
      working_days: next.working_days,
      updated_at: now
    })
    .where(eq(test_plans.id, id))
    .run()

  if (tasks !== undefined) {
    db.delete(test_plan_tasks).where(eq(test_plan_tasks.plan_id, id)).run()
    if (tasks.length > 0) {
      const newTasks: TestPlanTask[] = tasks.map((t, i) => ({
        id: randomUUID(),
        plan_id: id,
        position: i,
        name: t.name,
        duration_days: t.duration_days
      }))
      db.insert(test_plan_tasks).values(newTasks).run()
    }
  }

  return { ...next, tasks: getTestPlanTasks(db, id) }
}

export function deleteTestPlan(db: Db, id: string): void {
  const existing = getTestPlan(db, id)
  if (!existing) throw new NotFoundError('test plan', id)
  db.delete(test_plans).where(eq(test_plans.id, id)).run()
}

export function sumTaskDays(tasks: TestPlanTask[]): number {
  return tasks.reduce((sum, t) => sum + t.duration_days, 0)
}
