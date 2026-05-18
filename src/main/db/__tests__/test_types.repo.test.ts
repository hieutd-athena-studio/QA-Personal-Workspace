import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../schema'
import { runMigrations } from '../migrations/runner'
import { createProject } from '../repos/projects'
import { createCategory } from '../repos/categories'
import { createTestCase } from '../repos/test_cases'
import {
  createTestType,
  deleteTestType,
  getTestType,
  getTestTypeCaseIds,
  getTestTypeCounts,
  listTestTypes,
  setTestTypeCases,
  updateTestType
} from '../repos/test_types'
import { NotFoundError } from '../repos/errors'

function freshDb(): BetterSQLite3Database<typeof schema> {
  const raw = new Database(':memory:')
  raw.pragma('journal_mode = MEMORY')
  raw.pragma('foreign_keys = ON')
  runMigrations(raw, null)
  return drizzle(raw, { schema })
}

describe('test_types repo', () => {
  let db: BetterSQLite3Database<typeof schema>
  let projectId: string
  let tc1Id: string
  let tc2Id: string
  let tc3Id: string

  beforeEach(() => {
    db = freshDb()
    const proj = createProject(db, {
      display_prefix: 'TT',
      name: 'TestType Project',
      description: null,
      color: '#667788'
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
    const tc1 = createTestCase(db, {
      project_id: projectId,
      subcategory_id: sub.id,
      name: 'TC One',
      version: '1.0',
      steps: []
    })
    const tc2 = createTestCase(db, {
      project_id: projectId,
      subcategory_id: sub.id,
      name: 'TC Two',
      version: '1.0',
      steps: []
    })
    const tc3 = createTestCase(db, {
      project_id: projectId,
      subcategory_id: sub.id,
      name: 'TC Three',
      version: '1.0',
      steps: []
    })
    tc1Id = tc1.id
    tc2Id = tc2.id
    tc3Id = tc3.id
  })

  it('creates a test type with generated id and timestamps', () => {
    const tt = createTestType(db, {
      project_id: projectId,
      name: 'Smoke',
      description: 'Smoke tests'
    })
    expect(tt.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(tt.name).toBe('Smoke')
    expect(tt.description).toBe('Smoke tests')
    expect(tt.project_id).toBe(projectId)
  })

  it('listTestTypes returns types in alphabetical order by name', () => {
    createTestType(db, { project_id: projectId, name: 'Regression' })
    createTestType(db, { project_id: projectId, name: 'Smoke' })
    createTestType(db, { project_id: projectId, name: 'Acceptance' })
    const types = listTestTypes(db, projectId)
    expect(types).toHaveLength(3)
    expect(types[0]!.name).toBe('Acceptance')
    expect(types[1]!.name).toBe('Regression')
    expect(types[2]!.name).toBe('Smoke')
  })

  it('updateTestType throws NotFoundError for missing id', () => {
    expect(() => updateTestType(db, 'nonexistent', { name: 'New' })).toThrow(NotFoundError)
  })

  it('deleteTestType throws NotFoundError for missing id', () => {
    expect(() => deleteTestType(db, 'nonexistent')).toThrow(NotFoundError)
  })

  it('getTestType returns null for missing id', () => {
    expect(getTestType(db, 'missing')).toBeNull()
  })

  it('deleteTestType removes the test type', () => {
    const tt = createTestType(db, { project_id: projectId, name: 'ToDelete' })
    deleteTestType(db, tt.id)
    expect(getTestType(db, tt.id)).toBeNull()
  })

  it('setTestTypeCases assigns cases to the type', () => {
    const tt = createTestType(db, { project_id: projectId, name: 'Smoke' })
    setTestTypeCases(db, tt.id, [tc1Id, tc2Id])
    const ids = getTestTypeCaseIds(db, tt.id)
    expect(ids).toHaveLength(2)
    expect(ids).toContain(tc1Id)
    expect(ids).toContain(tc2Id)
  })

  it('setTestTypeCases replaces full membership (not additive)', () => {
    const tt = createTestType(db, { project_id: projectId, name: 'Smoke' })
    setTestTypeCases(db, tt.id, [tc1Id, tc2Id])
    // Now replace with only tc3
    setTestTypeCases(db, tt.id, [tc3Id])
    const ids = getTestTypeCaseIds(db, tt.id)
    expect(ids).toHaveLength(1)
    expect(ids).toContain(tc3Id)
    expect(ids).not.toContain(tc1Id)
    expect(ids).not.toContain(tc2Id)
  })

  it('setTestTypeCases with empty array clears all cases', () => {
    const tt = createTestType(db, { project_id: projectId, name: 'Smoke' })
    setTestTypeCases(db, tt.id, [tc1Id, tc2Id, tc3Id])
    setTestTypeCases(db, tt.id, [])
    const ids = getTestTypeCaseIds(db, tt.id)
    expect(ids).toHaveLength(0)
  })

  it('getTestTypeCaseIds returns empty array for type with no cases', () => {
    const tt = createTestType(db, { project_id: projectId, name: 'Empty Type' })
    const ids = getTestTypeCaseIds(db, tt.id)
    expect(Array.isArray(ids)).toBe(true)
    expect(ids).toHaveLength(0)
  })

  it('setTestTypeCases throws NotFoundError for unknown type id', () => {
    expect(() => setTestTypeCases(db, 'nonexistent', [tc1Id])).toThrow(NotFoundError)
  })

  describe('getTestTypeCounts', () => {
    it('returns 0 for types with no cases', () => {
      createTestType(db, { project_id: projectId, name: 'Empty A' })
      createTestType(db, { project_id: projectId, name: 'Empty B' })
      const counts = getTestTypeCounts(db, projectId)
      expect(Object.values(counts).every((v) => v === 0)).toBe(true)
    })

    it('returns exact count for populated types', () => {
      const ttA = createTestType(db, { project_id: projectId, name: 'Type A' })
      const ttB = createTestType(db, { project_id: projectId, name: 'Type B' })
      setTestTypeCases(db, ttA.id, [tc1Id, tc2Id, tc3Id])
      setTestTypeCases(db, ttB.id, [tc1Id])
      const counts = getTestTypeCounts(db, projectId)
      expect(counts[ttA.id]).toBe(3)
      expect(counts[ttB.id]).toBe(1)
    })

    it('returns empty object when project has no test types', () => {
      const emptyProj = createProject(db, {
        display_prefix: 'EMP',
        name: 'Empty Project',
        description: null,
        color: '#000000'
      })
      const counts = getTestTypeCounts(db, emptyProj.id)
      expect(counts).toEqual({})
    })

    it('each test type id appears as key with correct count', () => {
      const tt1 = createTestType(db, { project_id: projectId, name: 'Smoke' })
      const tt2 = createTestType(db, { project_id: projectId, name: 'Regression' })
      setTestTypeCases(db, tt1.id, [tc1Id, tc2Id])
      // tt2 has no cases
      const counts = getTestTypeCounts(db, projectId)
      expect(counts).toHaveProperty(tt1.id)
      expect(counts).toHaveProperty(tt2.id)
      expect(counts[tt1.id]).toBe(2)
      expect(counts[tt2.id]).toBe(0)
    })
  })

  it('cascade delete: deleting test_type removes its test_type_cases rows', () => {
    const tt = createTestType(db, { project_id: projectId, name: 'Deletable' })
    setTestTypeCases(db, tt.id, [tc1Id, tc2Id])
    expect(getTestTypeCaseIds(db, tt.id)).toHaveLength(2)
    // Delete the test type - FK ON DELETE CASCADE removes test_type_cases
    deleteTestType(db, tt.id)
    expect(getTestType(db, tt.id)).toBeNull()
    // After deletion, querying case ids for this type should return empty
    // (The type is gone, so the FK rows were cascaded away)
    const ids = getTestTypeCaseIds(db, tt.id)
    expect(ids).toHaveLength(0)
  })
})
