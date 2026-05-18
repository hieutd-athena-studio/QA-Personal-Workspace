import { z } from 'zod'

export const TestCaseStepSchema = z.object({
  id: z.string().uuid(),
  test_case_id: z.string().uuid(),
  position: z.number().int().nonnegative(),
  action: z.string().min(1),
  expected: z.string()
})

export const NewTestCaseStepSchema = z.object({
  action: z.string().min(1),
  expected: z.string().default('')
})

export const TestCaseSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  subcategory_id: z.string().uuid().nullable(),
  display_id: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  expected_result: z.string().nullable(),
  version: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string()
})

export const TestCaseWithStepsSchema = TestCaseSchema.extend({
  steps: z.array(TestCaseStepSchema)
})

export const NewTestCaseSchema = z.object({
  project_id: z.string().uuid(),
  subcategory_id: z.string().uuid().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  expected_result: z.string().nullable().optional(),
  version: z.string().min(1).default('1.0'),
  steps: z.array(NewTestCaseStepSchema).default([])
})

export const TestCasePatchSchema = z
  .object({
    subcategory_id: z.string().uuid().nullable(),
    name: z.string().min(1).max(200),
    description: z.string().nullable(),
    expected_result: z.string().nullable(),
    version: z.string().min(1),
    steps: z.array(NewTestCaseStepSchema)
  })
  .partial()

export type TestCaseStep = z.infer<typeof TestCaseStepSchema>
export type NewTestCaseStep = z.infer<typeof NewTestCaseStepSchema>
export type TestCase = z.infer<typeof TestCaseSchema>
export type TestCaseWithSteps = z.infer<typeof TestCaseWithStepsSchema>
export type NewTestCaseInput = z.infer<typeof NewTestCaseSchema>
export type TestCasePatch = z.infer<typeof TestCasePatchSchema>
