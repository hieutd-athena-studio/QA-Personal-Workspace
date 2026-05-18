import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { test_cycles } from './test_cycles'
import { test_cases } from './test_cases'

export const ASSIGNMENT_STATUSES = ['Pass', 'Fail', 'Blocked', 'Unexecuted'] as const
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]

export const assignments = sqliteTable(
  'assignments',
  {
    id: text('id').primaryKey().notNull(),
    cycle_id: text('cycle_id')
      .notNull()
      .references(() => test_cycles.id, { onDelete: 'cascade' }),
    test_case_id: text('test_case_id')
      .notNull()
      .references(() => test_cases.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('Unexecuted'),
    notes: text('notes'),
    executed_at: text('executed_at'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull()
  },
  (table) => ({
    uniqAssignment: uniqueIndex('assignments_cycle_case_idx').on(table.cycle_id, table.test_case_id)
  })
)

export type AssignmentRow = typeof assignments.$inferSelect
export type NewAssignmentRow = typeof assignments.$inferInsert
