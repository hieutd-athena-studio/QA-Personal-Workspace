import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const meta = sqliteTable('meta', {
  id: integer('id').primaryKey().notNull(),
  schema_version: integer('schema_version').notNull().default(0),
  created_at: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

export type MetaRow = typeof meta.$inferSelect
