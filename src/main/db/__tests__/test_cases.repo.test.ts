import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../schema'
import { runMigrations } from '../migrations/runner'
import { createProject, getProject } from '../repos/projects'
import { createCategory } from '../repos/categories'
import {
  createTestCase,
  deleteTestCase,
  exportTestCasesJson,
  getTestCase,
  getTestCaseSteps,
  getTestCaseWithSteps,
  importTestCasesJson,
  searchTestCases,
  updateTestCase
} from '../repos/test_cases'
import { NotFoundError } from '../repos/errors'

function freshDb(): BetterSQLite3Database<typeof schema> {
  const raw = new Database(':memory:')
  raw.pragma('journal_mode = MEMORY')
  raw.pragma('foreign_keys = ON')
  runMigrations(raw, null)
  return drizzle(raw, { schema })
}

describe('test_cases repo', () => {
  let db: BetterSQLite3Database<typeof schema>
  let projectId: string
  let subcategoryId: string

  beforeEach(() => {
    db = freshDb()
    const proj = createProject(db, {
      display_prefix: 'TC',
      name: 'TC Project',
      description: null,
      color: '#112233'
    })
    projectId = proj.id
    const parent = createCategory(db, {
      project_id: projectId,
      parent_category_id: null,
      name: 'Parent Cat'
    })
    const sub = createCategory(db, {
      project_id: projectId,
      parent_category_id: parent.id,
      name: 'Sub Cat'
    })
    subcategoryId = sub.id
  })

  it('creates a test case with display_id format {PREFIX}-TC{NNN} zero-padded to 3', () => {
    const tc = createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'First Test',
      version: '1.0',
      steps: []
    })
    expect(tc.display_id).toBe('TC-TC001')
  })

  it('second test case gets TC002', () => {
    createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'First',
      version: '1.0',
      steps: []
    })
    const tc2 = createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Second',
      version: '1.0',
      steps: []
    })
    expect(tc2.display_id).toBe('TC-TC002')
  })

  it('createTestCase increments project case_counter', () => {
    expect(getProject(db, projectId)!.case_counter).toBe(0)
    createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'First',
      version: '1.0',
      steps: []
    })
    expect(getProject(db, projectId)!.case_counter).toBe(1)
    createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Second',
      version: '1.0',
      steps: []
    })
    expect(getProject(db, projectId)!.case_counter).toBe(2)
  })

  it('steps persist with positions 0..n in order', () => {
    const tc = createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'With Steps',
      version: '1.0',
      steps: [
        { action: 'Action 0', expected: 'Result 0' },
        { action: 'Action 1', expected: 'Result 1' },
        { action: 'Action 2', expected: 'Result 2' }
      ]
    })
    expect(tc.steps).toHaveLength(3)
    expect(tc.steps[0]!.position).toBe(0)
    expect(tc.steps[0]!.action).toBe('Action 0')
    expect(tc.steps[1]!.position).toBe(1)
    expect(tc.steps[2]!.position).toBe(2)
    // Verify from DB directly
    const fromDb = getTestCaseSteps(db, tc.id)
    expect(fromDb).toHaveLength(3)
    expect(fromDb[0]!.position).toBe(0)
    expect(fromDb[1]!.position).toBe(1)
    expect(fromDb[2]!.position).toBe(2)
  })

  it('createTestCase with no steps stores empty steps array', () => {
    const tc = createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'No Steps',
      version: '1.0',
      steps: []
    })
    expect(tc.steps).toHaveLength(0)
    expect(getTestCaseSteps(db, tc.id)).toHaveLength(0)
  })

  it('updateTestCase with new steps replaces all (delete + insert)', () => {
    const tc = createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Updateable',
      version: '1.0',
      steps: [
        { action: 'Old Step 1', expected: '' },
        { action: 'Old Step 2', expected: '' }
      ]
    })
    const updated = updateTestCase(db, tc.id, {
      steps: [{ action: 'New Step Only', expected: 'New Expected' }]
    })
    expect(updated.steps).toHaveLength(1)
    expect(updated.steps[0]!.action).toBe('New Step Only')
    expect(updated.steps[0]!.position).toBe(0)
    // Old steps are gone
    const fromDb = getTestCaseSteps(db, tc.id)
    expect(fromDb).toHaveLength(1)
    expect(fromDb[0]!.action).toBe('New Step Only')
  })

  it('updateTestCase with empty steps array clears all steps', () => {
    const tc = createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Clear Steps',
      version: '1.0',
      steps: [{ action: 'Step', expected: '' }]
    })
    const updated = updateTestCase(db, tc.id, { steps: [] })
    expect(updated.steps).toHaveLength(0)
    expect(getTestCaseSteps(db, tc.id)).toHaveLength(0)
  })

  it('updateTestCase without steps field leaves existing steps unchanged', () => {
    const tc = createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Preserve Steps',
      version: '1.0',
      steps: [{ action: 'Keep Me', expected: '' }]
    })
    const updated = updateTestCase(db, tc.id, { name: 'Renamed' })
    expect(updated.name).toBe('Renamed')
    expect(updated.steps).toHaveLength(1)
    expect(updated.steps[0]!.action).toBe('Keep Me')
  })

  it('deleteTestCase throws NotFoundError when missing', () => {
    expect(() => deleteTestCase(db, 'nonexistent')).toThrow(NotFoundError)
  })

  it('getTestCaseWithSteps returns null for missing id', () => {
    expect(getTestCaseWithSteps(db, 'missing')).toBeNull()
  })

  it('searchTestCases matches by name', () => {
    createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Login Flow',
      version: '1.0',
      steps: []
    })
    createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Logout Flow',
      version: '1.0',
      steps: []
    })
    createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Profile Update',
      version: '1.0',
      steps: []
    })
    const results = searchTestCases(db, projectId, 'flow')
    expect(results).toHaveLength(2)
    expect(results.every((r) => r.name.toLowerCase().includes('flow'))).toBe(true)
  })

  it('searchTestCases matches by display_id', () => {
    const tc = createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Unrelated Name',
      version: '1.0',
      steps: []
    })
    const results = searchTestCases(db, projectId, tc.display_id)
    expect(results).toHaveLength(1)
    expect(results[0]!.id).toBe(tc.id)
  })

  it('searchTestCases matches by description', () => {
    createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Name Only',
      description: 'Validates the checkout process end to end',
      version: '1.0',
      steps: []
    })
    createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Other',
      description: null,
      version: '1.0',
      steps: []
    })
    const results = searchTestCases(db, projectId, 'checkout')
    expect(results).toHaveLength(1)
    expect(results[0]!.name).toBe('Name Only')
  })

  it('searchTestCases returns empty array for no matches', () => {
    createTestCase(db, {
      project_id: projectId,
      subcategory_id: null,
      name: 'Something',
      version: '1.0',
      steps: []
    })
    const results = searchTestCases(db, projectId, 'zzznomatch')
    expect(results).toHaveLength(0)
  })

  it('importJson + exportJson roundtrip preserves steps', () => {
    const payload = [
      {
        project_id: projectId,
        subcategory_id: null,
        name: 'Import TC 1',
        description: 'Desc 1',
        expected_result: 'Pass',
        version: '2.0',
        steps: [
          { action: 'Do A', expected: 'See A' },
          { action: 'Do B', expected: 'See B' }
        ]
      },
      {
        project_id: projectId,
        subcategory_id: null,
        name: 'Import TC 2',
        description: null,
        version: '1.0',
        steps: []
      }
    ]
    const count = importTestCasesJson(db, projectId, payload)
    expect(count).toBe(2)

    const exported = exportTestCasesJson(db, projectId)
    expect(exported).toHaveLength(2)

    const tc1 = exported.find((t) => t.name === 'Import TC 1')!
    expect(tc1).toBeDefined()
    expect(tc1.steps).toHaveLength(2)
    expect(tc1.steps[0]!.action).toBe('Do A')
    expect(tc1.steps[0]!.expected).toBe('See A')
    expect(tc1.steps[1]!.action).toBe('Do B')
    expect(tc1.version).toBe('2.0')

    const tc2 = exported.find((t) => t.name === 'Import TC 2')!
    expect(tc2).toBeDefined()
    expect(tc2.steps).toHaveLength(0)
  })

  it('getTestCase returns null for missing id', () => {
    expect(getTestCase(db, 'missing')).toBeNull()
  })

  it('test case stores subcategory_id when provided', () => {
    const tc = createTestCase(db, {
      project_id: projectId,
      subcategory_id: subcategoryId,
      name: 'Categorized',
      version: '1.0',
      steps: []
    })
    expect(tc.subcategory_id).toBe(subcategoryId)
  })
})
