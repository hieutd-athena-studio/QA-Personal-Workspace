import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { test_cases } from './test_cases'

export const test_case_steps = sqliteTable('test_case_steps', {
  id: text('id').primaryKey().notNull(),
  test_case_id: text('test_case_id')
    .notNull()
    .references(() => test_cases.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  action: text('action').notNull(),
  expected: text('expected').notNull().default('')
})

export type TestCaseStepRow = typeof test_case_steps.$inferSelect
export type NewTestCaseStepRow = typeof test_case_steps.$inferInsert
