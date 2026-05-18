import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { projects } from './projects'

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().notNull(),
  project_id: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  parent_category_id: text('parent_category_id'),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

export type CategoryRow = typeof categories.$inferSelect
export type NewCategoryRow = typeof categories.$inferInsert
