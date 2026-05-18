import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '../schema'
import { runMigrations } from '../migrations/runner'
import {
  NotFoundError,
  UniqueConstraintError,
  createProject,
  deleteProject,
  getProject,
  incrementCaseCounter,
  incrementPlanCounter,
  listProjects,
  updateProject
} from '../repos/projects'

function freshDb(): BetterSQLite3Database<typeof schema> {
  const raw = new Database(':memory:')
  raw.pragma('journal_mode = MEMORY')
  raw.pragma('foreign_keys = ON')
  runMigrations(raw, null)
  return drizzle(raw, { schema })
}

describe('projects repo', () => {
  let db: BetterSQLite3Database<typeof schema>

  beforeEach(() => {
    db = freshDb()
  })

  it('creates a project with generated id and timestamps', () => {
    const project = createProject(db, {
      display_prefix: 'ARR',
      name: 'Arrival',
      description: null,
      color: '#0066ff'
    })
    expect(project.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(project.case_counter).toBe(0)
    expect(project.plan_counter).toBe(0)
    expect(project.created_at).toBe(project.updated_at)
  })

  it('lists projects in DESC creation order', async () => {
    createProject(db, { display_prefix: 'ARR', name: 'A', description: null, color: '#000000' })
    await new Promise((r) => setTimeout(r, 10))
    createProject(db, { display_prefix: 'BRB', name: 'B', description: null, color: '#111111' })
    const rows = listProjects(db)
    expect(rows).toHaveLength(2)
    expect(rows[0]!.display_prefix).toBe('BRB')
    expect(rows[1]!.display_prefix).toBe('ARR')
  })

  it('rejects duplicate display_prefix', () => {
    createProject(db, { display_prefix: 'ARR', name: 'A', description: null, color: '#000000' })
    expect(() =>
      createProject(db, { display_prefix: 'ARR', name: 'B', description: null, color: '#111111' })
    ).toThrow(UniqueConstraintError)
  })

  it('getProject returns null when missing', () => {
    expect(getProject(db, 'nope')).toBeNull()
  })

  it('updateProject changes updated_at and returns new row', async () => {
    const created = createProject(db, {
      display_prefix: 'ARR',
      name: 'A',
      description: null,
      color: '#000000'
    })
    await new Promise((r) => setTimeout(r, 10))
    const updated = updateProject(db, created.id, { name: 'A2' })
    expect(updated.name).toBe('A2')
    expect(updated.updated_at).not.toBe(created.updated_at)
  })

  it('updateProject throws NotFoundError when missing', () => {
    expect(() => updateProject(db, 'nope', { name: 'X' })).toThrow(NotFoundError)
  })

  it('deleteProject removes the row', () => {
    const p = createProject(db, {
      display_prefix: 'ARR',
      name: 'A',
      description: null,
      color: '#000000'
    })
    deleteProject(db, p.id)
    expect(getProject(db, p.id)).toBeNull()
  })

  it('deleteProject throws NotFoundError when missing', () => {
    expect(() => deleteProject(db, 'nope')).toThrow(NotFoundError)
  })

  it('incrementCaseCounter is atomic across two calls', () => {
    const p = createProject(db, {
      display_prefix: 'ARR',
      name: 'A',
      description: null,
      color: '#000000'
    })
    expect(incrementCaseCounter(db, p.id)).toBe(1)
    expect(incrementCaseCounter(db, p.id)).toBe(2)
  })

  it('incrementPlanCounter is independent of case counter', () => {
    const p = createProject(db, {
      display_prefix: 'ARR',
      name: 'A',
      description: null,
      color: '#000000'
    })
    incrementCaseCounter(db, p.id)
    expect(incrementPlanCounter(db, p.id)).toBe(1)
    expect(getProject(db, p.id)!.case_counter).toBe(1)
  })

  it('migration runner is idempotent on second call', () => {
    const raw = new Database(':memory:')
    expect(runMigrations(raw, null).applied).toBe(1)
    expect(runMigrations(raw, null).applied).toBe(0)
  })
})
