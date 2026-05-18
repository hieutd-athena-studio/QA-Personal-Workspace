import { z } from 'zod'

export const TestTypeSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

export const NewTestTypeSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional()
})

export const TestTypePatchSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().nullable()
  })
  .partial()

export type TestType = z.infer<typeof TestTypeSchema>
export type NewTestTypeInput = z.infer<typeof NewTestTypeSchema>
export type TestTypePatch = z.infer<typeof TestTypePatchSchema>
