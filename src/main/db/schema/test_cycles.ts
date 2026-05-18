import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { test_plans } from './test_plans'

export const TEST_CYCLE_ENVIRONMENTS = ['DEV CHEAT', 'PROD CHEAT', 'PROD NON-CHEAT'] as const
export type TestCycleEnvironment = (typeof TEST_CYCLE_ENVIRONMENTS)[number]

export const test_cycles = sqliteTable('test_cycles', {
  id: text('id').primaryKey().notNull(),
  plan_id: text('plan_id')
    .notNull()
    .references(() => test_plans.id, { onDelete: 'cascade' }),
  display_id: text('display_id').notNull(),
  name: text('name').notNull(),
  environment: text('environment').notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

export type TestCycleRow = typeof test_cycles.$inferSelect
export type NewTestCycleRow = typeof test_cycles.$inferInsert
