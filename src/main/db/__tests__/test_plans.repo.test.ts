import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../schema'
import { runMigrations } from '../migrations/runner'
import { createProject } from '../repos/projects'
import {
  computeWorkingDays,
  createTestPlan,
  deleteTestPlan,
  getTestPlan,
  getTestPlanTasks,
  getTestPlanWithTasks,
  listTestPlans,
  sumTaskDays,
  updateTestPlan
} from '../repos/test_plans'
import { NotFoundError } from '../repos/errors'

function freshDb(): BetterSQLite3Database<typeof schema> {
  const raw = new Database(':memory:')
  raw.pragma('journal_mode = MEMORY')
  raw.pragma('foreign_keys = ON')
  runMigrations(raw, null)
  return drizzle(raw, { schema })
}

describe('test_plans repo', () => {
  let db: BetterSQLite3Database<typeof schema>
  let projectId: string

  beforeEach(() => {
    db = freshDb()
    const proj = createProject(db, {
      display_prefix: 'PL',
      name: 'Plan Project',
      description: null,
      color: '#001122'
    })
    projectId = proj.id
  })

  it('creates a plan with display_id format {PREFIX}-PL{NNN} zero-padded to 3', () => {
    const plan = createTestPlan(db, {
      project_id: projectId,
      name: 'Sprint 1',
      tasks: []
    })
    expect(plan.display_id).toBe('PL-PL001')
  })

  it('second plan gets PL002', () => {
    createTestPlan(db, { project_id: projectId, name: 'Plan A', tasks: [] })
    const plan2 = createTestPlan(db, { project_id: projectId, name: 'Plan B', tasks: [] })
    expect(plan2.display_id).toBe('PL-PL002')
  })

  it('createTestPlan stores tasks with positions 0..n', () => {
    const plan = createTestPlan(db, {
      project_id: projectId,
      name: 'Tasked Plan',
      tasks: [
        { name: 'Task A', duration_days: 1 },
        { name: 'Task B', duration_days: 0.5 },
        { name: 'Task C', duration_days: 0.25 }
      ]
    })
    expect(plan.tasks).toHaveLength(3)
    expect(plan.tasks[0]!.position).toBe(0)
    expect(plan.tasks[0]!.name).toBe('Task A')
    expect(plan.tasks[1]!.position).toBe(1)
    expect(plan.tasks[2]!.position).toBe(2)
    // Verify from DB
    const fromDb = getTestPlanTasks(db, plan.id)
    expect(fromDb).toHaveLength(3)
    expect(fromDb[0]!.duration_days).toBe(1)
    expect(fromDb[1]!.duration_days).toBe(0.5)
    expect(fromDb[2]!.duration_days).toBe(0.25)
  })

  it('task list accepts duration_days 0.25 multiples', () => {
    const plan = createTestPlan(db, {
      project_id: projectId,
      name: 'Quarter Day Plan',
      tasks: [
        { name: 'Quarter', duration_days: 0.25 },
        { name: 'Half', duration_days: 0.5 },
        { name: 'Full', duration_days: 1 },
        { name: 'Day and a half', duration_days: 1.5 }
      ]
    })
    expect(plan.tasks).toHaveLength(4)
    expect(plan.tasks[0]!.duration_days).toBe(0.25)
    expect(plan.tasks[1]!.duration_days).toBe(0.5)
    expect(plan.tasks[2]!.duration_days).toBe(1)
    expect(plan.tasks[3]!.duration_days).toBe(1.5)
  })

  it('updateTestPlan with new tasks replaces all previous tasks', () => {
    const plan = createTestPlan(db, {
      project_id: projectId,
      name: 'Replace Tasks',
      tasks: [
        { name: 'Old Task 1', duration_days: 1 },
        { name: 'Old Task 2', duration_days: 2 }
      ]
    })
    const updated = updateTestPlan(db, plan.id, {
      tasks: [{ name: 'New Task', duration_days: 0.5 }]
    })
    expect(updated.tasks).toHaveLength(1)
    expect(updated.tasks[0]!.name).toBe('New Task')
    expect(getTestPlanTasks(db, plan.id)).toHaveLength(1)
  })

  it('deleteTestPlan throws NotFoundError when missing', () => {
    expect(() => deleteTestPlan(db, 'nonexistent')).toThrow(NotFoundError)
  })

  it('getTestPlan returns null for missing id', () => {
    expect(getTestPlan(db, 'missing')).toBeNull()
  })

  it('getTestPlanWithTasks returns null for missing id', () => {
    expect(getTestPlanWithTasks(db, 'missing')).toBeNull()
  })

  it('listTestPlans returns plans in display_id order', () => {
    createTestPlan(db, { project_id: projectId, name: 'Plan A', tasks: [] })
    createTestPlan(db, { project_id: projectId, name: 'Plan B', tasks: [] })
    createTestPlan(db, { project_id: projectId, name: 'Plan C', tasks: [] })
    const plans = listTestPlans(db, projectId)
    expect(plans).toHaveLength(3)
    expect(plans[0]!.display_id).toBe('PL-PL001')
    expect(plans[1]!.display_id).toBe('PL-PL002')
    expect(plans[2]!.display_id).toBe('PL-PL003')
  })

  describe('computeWorkingDays', () => {
    it('Mon-Fri span = 5 working days', () => {
      // 2024-01-01 is Monday, 2024-01-05 is Friday
      expect(computeWorkingDays('2024-01-01', '2024-01-05')).toBe(5)
    })

    it('Mon-Sun span = 5 working days (excludes weekend)', () => {
      // 2024-01-01 Mon to 2024-01-07 Sun: Mon,Tue,Wed,Thu,Fri = 5 days
      expect(computeWorkingDays('2024-01-01', '2024-01-07')).toBe(5)
    })

    it('Sat-Sun span = 0 working days', () => {
      // 2024-01-06 Sat to 2024-01-07 Sun
      expect(computeWorkingDays('2024-01-06', '2024-01-07')).toBe(0)
    })

    it('single Monday = 1 working day', () => {
      expect(computeWorkingDays('2024-01-01', '2024-01-01')).toBe(1)
    })

    it('single Saturday = 0 working days', () => {
      expect(computeWorkingDays('2024-01-06', '2024-01-06')).toBe(0)
    })

    it('two full weeks Mon-Sun = 10 working days', () => {
      // 2024-01-01 to 2024-01-14
      expect(computeWorkingDays('2024-01-01', '2024-01-14')).toBe(10)
    })

    it('returns null when start is null', () => {
      expect(computeWorkingDays(null, '2024-01-05')).toBeNull()
    })

    it('returns null when end is null', () => {
      expect(computeWorkingDays('2024-01-01', null)).toBeNull()
    })

    it('returns null when start is after end', () => {
      expect(computeWorkingDays('2024-01-10', '2024-01-05')).toBeNull()
    })

    it('returns null for invalid date strings', () => {
      expect(computeWorkingDays('not-a-date', '2024-01-05')).toBeNull()
    })
  })

  it('createTestPlan auto-computes working_days from start/end dates when not provided', () => {
    // 2024-01-01 Mon to 2024-01-05 Fri = 5 working days
    const plan = createTestPlan(db, {
      project_id: projectId,
      name: 'Auto Working Days',
      start_date: '2024-01-01',
      end_date: '2024-01-05',
      tasks: []
    })
    expect(plan.working_days).toBe(5)
  })

  it('createTestPlan preserves user-provided working_days override', () => {
    // Even though Mon-Fri normally = 5, user says 4
    const plan = createTestPlan(db, {
      project_id: projectId,
      name: 'Override Working Days',
      start_date: '2024-01-01',
      end_date: '2024-01-05',
      working_days: 4,
      tasks: []
    })
    expect(plan.working_days).toBe(4)
  })

  it('updateTestPlan recomputes working_days when dates change but override not provided', () => {
    const plan = createTestPlan(db, {
      project_id: projectId,
      name: 'Recompute',
      start_date: '2024-01-01',
      end_date: '2024-01-05',
      tasks: []
    })
    expect(plan.working_days).toBe(5)
    // Extend end to include next week Mon
    const updated = updateTestPlan(db, plan.id, { end_date: '2024-01-08' })
    // Mon-Mon = 6 working days
    expect(updated.working_days).toBe(6)
  })

  it('updateTestPlan preserves working_days override when explicitly set', () => {
    const plan = createTestPlan(db, {
      project_id: projectId,
      name: 'Preserve Override',
      start_date: '2024-01-01',
      end_date: '2024-01-05',
      tasks: []
    })
    const updated = updateTestPlan(db, plan.id, { working_days: 3 })
    expect(updated.working_days).toBe(3)
  })

  describe('sumTaskDays', () => {
    it('sums all task duration_days correctly', () => {
      const tasks = [
        { id: '1', plan_id: 'p', position: 0, name: 'A', duration_days: 1 },
        { id: '2', plan_id: 'p', position: 1, name: 'B', duration_days: 0.5 },
        { id: '3', plan_id: 'p', position: 2, name: 'C', duration_days: 0.25 }
      ]
      expect(sumTaskDays(tasks)).toBeCloseTo(1.75)
    })

    it('returns 0 for empty task list', () => {
      expect(sumTaskDays([])).toBe(0)
    })

    it('returns exact sum for multiple 0.25 tasks', () => {
      const tasks = [
        { id: '1', plan_id: 'p', position: 0, name: 'A', duration_days: 0.25 },
        { id: '2', plan_id: 'p', position: 1, name: 'B', duration_days: 0.25 },
        { id: '3', plan_id: 'p', position: 2, name: 'C', duration_days: 0.25 },
        { id: '4', plan_id: 'p', position: 3, name: 'D', duration_days: 0.25 }
      ]
      expect(sumTaskDays(tasks)).toBeCloseTo(1)
    })
  })
})
