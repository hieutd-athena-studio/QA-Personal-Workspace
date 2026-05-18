import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../schema'
import { runMigrations } from '../migrations/runner'
import { createProject } from '../repos/projects'
import { createTestPlan } from '../repos/test_plans'
import {
  createTestCycle,
  deleteTestCycle,
  getTestCycle,
  listAllProjectCycles,
  listTestCycles,
  updateTestCycle
} from '../repos/test_cycles'
import { NotFoundError } from '../repos/errors'

function freshDb(): BetterSQLite3Database<typeof schema> {
  const raw = new Database(':memory:')
  raw.pragma('journal_mode = MEMORY')
  raw.pragma('foreign_keys = ON')
  runMigrations(raw, null)
  return drizzle(raw, { schema })
}

describe('test_cycles repo', () => {
  let db: BetterSQLite3Database<typeof schema>
  let projectId: string
  let planId: string
  let planDisplayId: string

  beforeEach(() => {
    db = freshDb()
    const proj = createProject(db, {
      display_prefix: 'CY',
      name: 'Cycle Project',
      description: null,
      color: '#334455'
    })
    projectId = proj.id
    const plan = createTestPlan(db, {
      project_id: projectId,
      name: 'Sprint Plan',
      tasks: []
    })
    planId = plan.id
    planDisplayId = plan.display_id // 'CY-PL001'
  })

  it('creates cycle with display_id format {PLAN_DISPLAY}-CY{NN} zero-padded to 2', () => {
    const cycle = createTestCycle(db, {
      plan_id: planId,
      name: 'Cycle 1',
      environment: 'DEV CHEAT'
    })
    expect(cycle.display_id).toBe(`${planDisplayId}-CY01`)
  })

  it('second cycle for same plan gets CY02', () => {
    createTestCycle(db, { plan_id: planId, name: 'Cycle 1', environment: 'DEV CHEAT' })
    const cycle2 = createTestCycle(db, {
      plan_id: planId,
      name: 'Cycle 2',
      environment: 'DEV CHEAT'
    })
    expect(cycle2.display_id).toBe(`${planDisplayId}-CY02`)
  })

  it('cycle display_id uses plan display_id as prefix (not plan id)', () => {
    const cycle = createTestCycle(db, {
      plan_id: planId,
      name: 'Prefix Check',
      environment: 'PROD CHEAT'
    })
    expect(cycle.display_id).toContain(planDisplayId)
    expect(cycle.display_id).toContain('-CY01')
  })

  it('validates environment against TEST_CYCLE_ENVIRONMENTS enum', () => {
    // Valid environments must not throw
    expect(() =>
      createTestCycle(db, { plan_id: planId, name: 'Dev', environment: 'DEV CHEAT' })
    ).not.toThrow()
    expect(() =>
      createTestCycle(db, { plan_id: planId, name: 'ProdCheat', environment: 'PROD CHEAT' })
    ).not.toThrow()
    expect(() =>
      createTestCycle(db, { plan_id: planId, name: 'ProdNonCheat', environment: 'PROD NON-CHEAT' })
    ).not.toThrow()
  })

  it('rejects invalid environment value', () => {
    expect(() =>
      createTestCycle(db, {
        plan_id: planId,
        name: 'Bad Env',
        environment: 'STAGING' as 'DEV CHEAT'
      })
    ).toThrow()
  })

  it('listTestCycles returns only cycles for the given plan', () => {
    const plan2 = createTestPlan(db, { project_id: projectId, name: 'Plan B', tasks: [] })
    createTestCycle(db, { plan_id: planId, name: 'P1 Cycle 1', environment: 'DEV CHEAT' })
    createTestCycle(db, { plan_id: planId, name: 'P1 Cycle 2', environment: 'DEV CHEAT' })
    createTestCycle(db, { plan_id: plan2.id, name: 'P2 Cycle 1', environment: 'DEV CHEAT' })
    const cycles1 = listTestCycles(db, planId)
    expect(cycles1).toHaveLength(2)
    expect(cycles1.every((c) => c.plan_id === planId)).toBe(true)
    const cycles2 = listTestCycles(db, plan2.id)
    expect(cycles2).toHaveLength(1)
    expect(cycles2[0]!.plan_id).toBe(plan2.id)
  })

  it('listAllProjectCycles aggregates cycles across multiple plans', () => {
    const plan2 = createTestPlan(db, { project_id: projectId, name: 'Plan B', tasks: [] })
    const plan3 = createTestPlan(db, { project_id: projectId, name: 'Plan C', tasks: [] })
    createTestCycle(db, { plan_id: planId, name: 'CY A1', environment: 'DEV CHEAT' })
    createTestCycle(db, { plan_id: planId, name: 'CY A2', environment: 'DEV CHEAT' })
    createTestCycle(db, { plan_id: plan2.id, name: 'CY B1', environment: 'PROD CHEAT' })
    createTestCycle(db, { plan_id: plan3.id, name: 'CY C1', environment: 'PROD NON-CHEAT' })
    const all = listAllProjectCycles(db, projectId)
    expect(all).toHaveLength(4)
  })

  it('listAllProjectCycles returns empty array when project has no plans', () => {
    const emptyProj = createProject(db, {
      display_prefix: 'EMP',
      name: 'Empty',
      description: null,
      color: '#000000'
    })
    const result = listAllProjectCycles(db, emptyProj.id)
    expect(result).toHaveLength(0)
  })

  it('getTestCycle returns null for missing id', () => {
    expect(getTestCycle(db, 'missing')).toBeNull()
  })

  it('deleteTestCycle throws NotFoundError when missing', () => {
    expect(() => deleteTestCycle(db, 'nonexistent')).toThrow(NotFoundError)
  })

  it('deleteTestCycle removes the cycle', () => {
    const cycle = createTestCycle(db, {
      plan_id: planId,
      name: 'To Delete',
      environment: 'DEV CHEAT'
    })
    deleteTestCycle(db, cycle.id)
    expect(getTestCycle(db, cycle.id)).toBeNull()
  })

  it('updateTestCycle throws NotFoundError when missing', () => {
    expect(() => updateTestCycle(db, 'nonexistent', { name: 'X' })).toThrow(NotFoundError)
  })

  it('updateTestCycle changes name and environment', async () => {
    const cycle = createTestCycle(db, {
      plan_id: planId,
      name: 'Original',
      environment: 'DEV CHEAT'
    })
    await new Promise((r) => setTimeout(r, 10))
    const updated = updateTestCycle(db, cycle.id, {
      name: 'Updated',
      environment: 'PROD CHEAT'
    })
    expect(updated.name).toBe('Updated')
    expect(updated.environment).toBe('PROD CHEAT')
    expect(updated.updated_at).not.toBe(cycle.updated_at)
  })

  it('cycles from different plans for same project get independent numbering', () => {
    const plan2 = createTestPlan(db, { project_id: projectId, name: 'Plan B', tasks: [] })
    const c1 = createTestCycle(db, { plan_id: planId, name: 'P1-C1', environment: 'DEV CHEAT' })
    const c2 = createTestCycle(db, { plan_id: plan2.id, name: 'P2-C1', environment: 'DEV CHEAT' })
    // Both are CY01 for their respective plans
    expect(c1.display_id).toMatch(/-CY01$/)
    expect(c2.display_id).toMatch(/-CY01$/)
    // But they have different plan prefixes
    expect(c1.display_id).not.toBe(c2.display_id)
  })
})
