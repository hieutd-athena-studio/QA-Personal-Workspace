import { z } from 'zod'

export const ASSIGNMENT_STATUSES = ['Pass', 'Fail', 'Blocked', 'Unexecuted'] as const
export const AssignmentStatusSchema = z.enum(ASSIGNMENT_STATUSES)
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>

export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  cycle_id: z.string().uuid(),
  test_case_id: z.string().uuid(),
  status: AssignmentStatusSchema,
  notes: z.string().nullable(),
  executed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

export const AssignmentUpdateSchema = z
  .object({
    status: AssignmentStatusSchema,
    notes: z.string().nullable()
  })
  .partial()

export type Assignment = z.infer<typeof AssignmentSchema>
export type AssignmentUpdate = z.infer<typeof AssignmentUpdateSchema>
