import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey().notNull(),
    display_prefix: text('display_prefix').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color').notNull(),
    logo: text('logo'),
    metadata: text('metadata'),
    current_version_id: text('current_version_id'),
    case_counter: integer('case_counter').notNull().default(0),
    plan_counter: integer('plan_counter').notNull().default(0),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull()
  },
  (table) => ({
    displayPrefixIdx: uniqueIndex('projects_display_prefix_idx').on(table.display_prefix)
  })
)

export type ProjectRow = typeof projects.$inferSelect
export type NewProjectRow = typeof projects.$inferInsert
