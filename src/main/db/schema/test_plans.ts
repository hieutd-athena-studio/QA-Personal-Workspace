import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { projects } from './projects'

export const test_plans = sqliteTable('test_plans', {
  id: text('id').primaryKey().notNull(),
  project_id: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  display_id: text('display_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  start_date: text('start_date'),
  end_date: text('end_date'),
  working_days: real('working_days'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

export type TestPlanRow = typeof test_plans.$inferSelect
export type NewTestPlanRow = typeof test_plans.$inferInsert
