import { z } from 'zod'

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  display_prefix: z
    .string()
    .regex(/^[A-Z]{2,5}$/, 'display_prefix must be 2-5 uppercase letters'),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'color must be 6-digit hex'),
  case_counter: z.number().int().nonnegative(),
  plan_counter: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string()
})

export const NewProjectSchema = ProjectSchema.pick({
  display_prefix: true,
  name: true,
  description: true,
  color: true
}).extend({
  description: z.string().nullable().optional()
})

export const ProjectPatchSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().nullable(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    display_prefix: z.string().regex(/^[A-Z]{2,5}$/)
  })
  .partial()

export type Project = z.infer<typeof ProjectSchema>
export type NewProjectInput = z.infer<typeof NewProjectSchema>
export type ProjectPatch = z.infer<typeof ProjectPatchSchema>
