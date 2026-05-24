import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projects } from './projects'

export const project_versions = sqliteTable(
  'project_versions',
  {
    id: text('id').primaryKey().notNull(),
    project_id: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    notes: text('notes'),
    released_at: text('released_at'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull()
  },
  (table) => ({
    projectVersionIdx: uniqueIndex('project_versions_project_version_idx').on(
      table.project_id,
      table.version
    )
  })
)

export type ProjectVersionRow = typeof project_versions.$inferSelect
export type NewProjectVersionRow = typeof project_versions.$inferInsert
