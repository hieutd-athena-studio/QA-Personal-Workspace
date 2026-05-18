import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/main/db/schema/*.ts',
  out: './src/main/db/migrations/sql',
  dialect: 'sqlite',
  dbCredentials: {
    url: './dev.db'
  },
  verbose: true,
  strict: true
})
