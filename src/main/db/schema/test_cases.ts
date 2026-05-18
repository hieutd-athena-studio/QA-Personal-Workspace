import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { projects } from './projects'
import { categories } from './categories'

export const test_cases = sqliteTable('test_cases', {
  id: text('id').primaryKey().notNull(),
  project_id: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  subcategory_id: text('subcategory_id').references(() => categories.id, {
    onDelete: 'set null'
  }),
  display_id: text('display_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  expected_result: text('expected_result'),
  version: text('version').notNull().default('1.0'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

export type TestCaseRow = typeof test_cases.$inferSelect
export type NewTestCaseRow = typeof test_cases.$inferInsert
