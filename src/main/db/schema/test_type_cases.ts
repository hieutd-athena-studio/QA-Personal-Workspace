import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { test_types } from './test_types'
import { test_cases } from './test_cases'

export const test_type_cases = sqliteTable(
  'test_type_cases',
  {
    test_type_id: text('test_type_id')
      .notNull()
      .references(() => test_types.id, { onDelete: 'cascade' }),
    test_case_id: text('test_case_id')
      .notNull()
      .references(() => test_cases.id, { onDelete: 'cascade' })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.test_type_id, table.test_case_id] })
  })
)

export type TestTypeCaseRow = typeof test_type_cases.$inferSelect
