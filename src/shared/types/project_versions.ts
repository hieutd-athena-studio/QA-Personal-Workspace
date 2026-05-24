import { z } from 'zod'

export const ProjectVersionSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  version: z.string().min(1).max(64),
  notes: z.string().nullable(),
  released_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

export const NewProjectVersionSchema = ProjectVersionSchema.pick({
  project_id: true,
  version: true,
  notes: true,
  released_at: true
}).extend({
  notes: z.string().nullable().optional(),
  released_at: z.string().nullable().optional()
})

export const ProjectVersionPatchSchema = z
  .object({
    version: z.string().min(1).max(64),
    notes: z.string().nullable(),
    released_at: z.string().nullable()
  })
  .partial()

export type ProjectVersion = z.infer<typeof ProjectVersionSchema>
export type NewProjectVersionInput = z.infer<typeof NewProjectVersionSchema>
export type ProjectVersionPatch = z.infer<typeof ProjectVersionPatchSchema>
