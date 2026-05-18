import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { test_plans } from './test_plans'

export const test_plan_tasks = sqliteTable('test_plan_tasks', {
  id: text('id').primaryKey().notNull(),
  plan_id: text('plan_id')
    .notNull()
    .references(() => test_plans.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  duration_days: real('duration_days').notNull().default(0.25)
})

export type TestPlanTaskRow = typeof test_plan_tasks.$inferSelect
export type NewTestPlanTaskRow = typeof test_plan_tasks.$inferInsert
