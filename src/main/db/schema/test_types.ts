import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { projects } from './projects'

export const test_types = sqliteTable('test_types', {
  id: text('id').primaryKey().notNull(),
  project_id: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

export type TestTypeRow = typeof test_types.$inferSelect
export type NewTestTypeRow = typeof test_types.$inferInsert
