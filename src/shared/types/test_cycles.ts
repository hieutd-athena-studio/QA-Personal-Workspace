import { z } from 'zod'

export const TEST_CYCLE_ENVIRONMENTS = ['DEV CHEAT', 'PROD CHEAT', 'PROD NON-CHEAT'] as const
export const TestCycleEnvironmentSchema = z.enum(TEST_CYCLE_ENVIRONMENTS)
export type TestCycleEnvironment = z.infer<typeof TestCycleEnvironmentSchema>

export const TestCycleSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  display_id: z.string(),
  name: z.string().min(1).max(200),
  environment: TestCycleEnvironmentSchema,
  created_at: z.string(),
  updated_at: z.string()
})

export const NewTestCycleSchema = z.object({
  plan_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  environment: TestCycleEnvironmentSchema
})

export const TestCyclePatchSchema = z
  .object({
    name: z.string().min(1).max(200),
    environment: TestCycleEnvironmentSchema
  })
  .partial()

export type TestCycle = z.infer<typeof TestCycleSchema>
export type NewTestCycleInput = z.infer<typeof NewTestCycleSchema>
export type TestCyclePatch = z.infer<typeof TestCyclePatchSchema>
