import { z } from 'zod'

export const CategorySchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  parent_category_id: z.string().uuid().nullable(),
  name: z.string().min(1).max(100),
  position: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string()
})

export const NewCategorySchema = CategorySchema.pick({
  project_id: true,
  parent_category_id: true,
  name: true
}).extend({
  position: z.number().int().nonnegative().optional()
})

export const CategoryPatchSchema = z
  .object({
    name: z.string().min(1).max(100),
    position: z.number().int().nonnegative()
  })
  .partial()

export type Category = z.infer<typeof CategorySchema>
export type NewCategoryInput = z.infer<typeof NewCategorySchema>
export type CategoryPatch = z.infer<typeof CategoryPatchSchema>
