import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../schema'
import { runMigrations } from '../migrations/runner'
import { createProject } from '../repos/projects'
import { createCategory } from '../repos/categories'
import { createTestCase } from '../repos/test_cases'
import { createTestPlan } from '../repos/test_plans'
import { createTestCycle } from '../repos/test_cycles'
import {
  assignCasesToCycle,
  batchUnassign,
  getCycleProgress,
  getAssignment,
  listAssignments,
  setAssignmentStatus,
  updateAssignment
} from '../repos/assignments'
import { NotFoundError } from '../repos/errors'

function freshDb(): BetterSQLite3Database<typeof schema> {
  const raw = new Database(':memory:')
  raw.pragma('journal_mode = MEMORY')
  raw.pragma('foreign_keys = ON')
  runMigrations(raw, null)
  return drizzle(raw, { schema })
}

describe('assignments repo', () => {
  let db: BetterSQLite3Database<typeof schema>
  let cycleId: string
  let tc1Id: string
  let tc2Id: string
  let tc3Id: string

  beforeEach(() => {
    db = freshDb()
    const proj = createProject(db, {
      display_prefix: 'AS',
      name: 'Assignment Project',
      description: null,
      color: '#aabbcc'
    })
    const projectId = proj.id
    const parent = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Parent'
    })
    const sub = createCategory(db, {
      project_id: projectId,
      parent_category_id: parent.id,
      name: 'Sub'
    })
    const tc1 = createTestCase(db, {
      project_id: projectId,
      subcategory_id: sub.id,
      name: 'Test Case 1',
      version: '1.0',
      steps: []
    })
    const tc2 = createTestCase(db, {
      project_id: projectId,
      subcategory_id: sub.id,
      name: 'Test Case 2',
      version: '1.0',
      steps: []
    })
    const tc3 = createTestCase(db, {
      project_id: projectId,
      subcategory_id: sub.id,
      name: 'Test Case 3',
      version: '1.0',
      steps: []
    })
    tc1Id = tc1.id
    tc2Id = tc2.id
    tc3Id = tc3.id
    const plan = createTestPlan(db, {
      project_id: projectId,
      name: 'Sprint',
      tasks: []
    })
    const cycle = createTestCycle(db, {
      plan_id: plan.id,
      name: 'Cycle 1',
      environment: 'DEV CHEAT'
    })
    cycleId = cycle.id
  })

  it('assignCasesToCycle inserts new assignments and returns inserted count', () => {
    const result = assignCasesToCycle(db, cycleId, [tc1Id, tc2Id])
    expect(result.inserted).toBe(2)
    const assignments = listAssignments(db, cycleId)
    expect(assignments).toHaveLength(2)
  })

  it('assignCasesToCycle deduplicates: re-assigning already-assigned cases inserts 0 new', () => {
    assignCasesToCycle(db, cycleId, [tc1Id, tc2Id])
    const result = assignCasesToCycle(db, cycleId, [tc1Id, tc2Id])
    expect(result.inserted).toBe(0)
    expect(listAssignments(db, cycleId)).toHaveLength(2)
  })

  it('assignCasesToCycle partial dedup: only new cases are inserted', () => {
    assignCasesToCycle(db, cycleId, [tc1Id])
    const result = assignCasesToCycle(db, cycleId, [tc1Id, tc2Id, tc3Id])
    expect(result.inserted).toBe(2)
    expect(listAssignments(db, cycleId)).toHaveLength(3)
  })

  it('assignCasesToCycle with empty array returns 0 inserted', () => {
    const result = assignCasesToCycle(db, cycleId, [])
    expect(result.inserted).toBe(0)
    expect(listAssignments(db, cycleId)).toHaveLength(0)
  })

  it('new assignments default to Unexecuted status with null executed_at', () => {
    assignCasesToCycle(db, cycleId, [tc1Id])
    const assignments = listAssignments(db, cycleId)
    expect(assignments[0]!.status).toBe('Unexecuted')
    expect(assignments[0]!.executed_at).toBeNull()
    expect(assignments[0]!.notes).toBeNull()
  })

  it('batchUnassign removes only requested assignment ids', () => {
    assignCasesToCycle(db, cycleId, [tc1Id, tc2Id, tc3Id])
    const all = listAssignments(db, cycleId)
    expect(all).toHaveLength(3)
    const toRemove = all.filter((a) => a.test_case_id === tc1Id || a.test_case_id === tc2Id)
    const result = batchUnassign(
      db,
      toRemove.map((a) => a.id)
    )
    expect(result.removed).toBe(2)
    const remaining = listAssignments(db, cycleId)
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.test_case_id).toBe(tc3Id)
  })

  it('batchUnassign with empty array returns 0 removed', () => {
    assignCasesToCycle(db, cycleId, [tc1Id])
    const result = batchUnassign(db, [])
    expect(result.removed).toBe(0)
    expect(listAssignments(db, cycleId)).toHaveLength(1)
  })

  it('batchUnassign with non-existent ids returns 0 removed', () => {
    const result = batchUnassign(db, ['fake-id-1', 'fake-id-2'])
    expect(result.removed).toBe(0)
  })

  it('setAssignmentStatus updates executed_at when status is Pass', async () => {
    assignCasesToCycle(db, cycleId, [tc1Id])
    const assignment = listAssignments(db, cycleId)[0]!
    expect(assignment.executed_at).toBeNull()
    await new Promise((r) => setTimeout(r, 5))
    const updated = setAssignmentStatus(db, assignment.id, 'Pass')
    expect(updated.status).toBe('Pass')
    expect(updated.executed_at).not.toBeNull()
  })

  it('setAssignmentStatus updates executed_at when status is Fail', async () => {
    assignCasesToCycle(db, cycleId, [tc1Id])
    const assignment = listAssignments(db, cycleId)[0]!
    await new Promise((r) => setTimeout(r, 5))
    const updated = setAssignmentStatus(db, assignment.id, 'Fail')
    expect(updated.status).toBe('Fail')
    expect(updated.executed_at).not.toBeNull()
  })

  it('setAssignmentStatus updates executed_at when status is Blocked', async () => {
    assignCasesToCycle(db, cycleId, [tc1Id])
    const assignment = listAssignments(db, cycleId)[0]!
    await new Promise((r) => setTimeout(r, 5))
    const updated = setAssignmentStatus(db, assignment.id, 'Blocked')
    expect(updated.status).toBe('Blocked')
    expect(updated.executed_at).not.toBeNull()
  })

  it('setAssignmentStatus clears executed_at when set back to Unexecuted', async () => {
    assignCasesToCycle(db, cycleId, [tc1Id])
    const assignment = listAssignments(db, cycleId)[0]!
    // First set to Pass to get executed_at set
    await new Promise((r) => setTimeout(r, 5))
    setAssignmentStatus(db, assignment.id, 'Pass')
    // Now reset to Unexecuted
    const reset = setAssignmentStatus(db, assignment.id, 'Unexecuted')
    expect(reset.status).toBe('Unexecuted')
    expect(reset.executed_at).toBeNull()
  })

  it('updateAssignment throws NotFoundError for missing id', () => {
    expect(() => updateAssignment(db, 'nonexistent', { status: 'Pass' })).toThrow(NotFoundError)
  })

  it('getAssignment returns null for missing id', () => {
    expect(getAssignment(db, 'missing')).toBeNull()
  })

  describe('getCycleProgress', () => {
    it('counts each status bucket correctly', () => {
      assignCasesToCycle(db, cycleId, [tc1Id, tc2Id, tc3Id])
      const all = listAssignments(db, cycleId)
      // Set statuses: tc1=Pass, tc2=Fail, tc3=Unexecuted (default)
      setAssignmentStatus(db, all.find((a) => a.test_case_id === tc1Id)!.id, 'Pass')
      setAssignmentStatus(db, all.find((a) => a.test_case_id === tc2Id)!.id, 'Fail')
      // tc3 stays Unexecuted

      const progress = getCycleProgress(db, cycleId)
      expect(progress.total).toBe(3)
      expect(progress.pass).toBe(1)
      expect(progress.fail).toBe(1)
      expect(progress.blocked).toBe(0)
      expect(progress.unexecuted).toBe(1)
    })

    it('total equals sum of all status buckets', () => {
      assignCasesToCycle(db, cycleId, [tc1Id, tc2Id, tc3Id])
      const all = listAssignments(db, cycleId)
      setAssignmentStatus(db, all[0]!.id, 'Pass')
      setAssignmentStatus(db, all[1]!.id, 'Blocked')

      const progress = getCycleProgress(db, cycleId)
      expect(progress.total).toBe(
        progress.pass + progress.fail + progress.blocked + progress.unexecuted
      )
    })

    it('returns all zeros for empty cycle', () => {
      const progress = getCycleProgress(db, cycleId)
      expect(progress.total).toBe(0)
      expect(progress.pass).toBe(0)
      expect(progress.fail).toBe(0)
      expect(progress.blocked).toBe(0)
      expect(progress.unexecuted).toBe(0)
    })

    it('counts Blocked status correctly', () => {
      assignCasesToCycle(db, cycleId, [tc1Id, tc2Id])
      const all = listAssignments(db, cycleId)
      setAssignmentStatus(db, all[0]!.id, 'Blocked')
      setAssignmentStatus(db, all[1]!.id, 'Blocked')

      const progress = getCycleProgress(db, cycleId)
      expect(progress.blocked).toBe(2)
      expect(progress.total).toBe(2)
    })
  })
})
