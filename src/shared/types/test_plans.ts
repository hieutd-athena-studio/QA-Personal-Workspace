import { z } from 'zod'

export const TestPlanTaskSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  position: z.number().int().nonnegative(),
  name: z.string().min(1),
  duration_days: z.number().positive().multipleOf(0.25)
})

export const NewTestPlanTaskSchema = z.object({
  name: z.string().min(1),
  duration_days: z.number().positive().multipleOf(0.25).default(0.25)
})

export const TestPlanSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  display_id: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  working_days: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

export const TestPlanWithTasksSchema = TestPlanSchema.extend({
  tasks: z.array(TestPlanTaskSchema)
})

export const NewTestPlanSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  working_days: z.number().positive().nullable().optional(),
  tasks: z.array(NewTestPlanTaskSchema).default([])
})

export const TestPlanPatchSchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().nullable(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    working_days: z.number().positive().nullable(),
    tasks: z.array(NewTestPlanTaskSchema)
  })
  .partial()

export type TestPlanTask = z.infer<typeof TestPlanTaskSchema>
export type NewTestPlanTask = z.infer<typeof NewTestPlanTaskSchema>
export type TestPlan = z.infer<typeof TestPlanSchema>
export type TestPlanWithTasks = z.infer<typeof TestPlanWithTasksSchema>
export type NewTestPlanInput = z.infer<typeof NewTestPlanSchema>
export type TestPlanPatch = z.infer<typeof TestPlanPatchSchema>
