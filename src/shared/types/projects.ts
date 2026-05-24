import { z } from 'zod'

const LogoSchema = z
  .string()
  .max(512_000, 'logo too large (max ~500KB)')
  .refine((v) => v.startsWith('data:image/'), 'logo must be a data:image/* URL')

export const ProjectMetadataSchema = z.object({
  store_link_ios: z.string().max(2048).nullable().optional(),
  store_link_android: z.string().max(2048).nullable().optional(),
  max_sdk_admob_ad_id: z.string().max(256).nullable().optional(),
  max_sdk_inter_ad_unit_id: z.string().max(256).nullable().optional(),
  max_sdk_rewarded_ad_unit_id: z.string().max(256).nullable().optional(),
  max_sdk_banner_ad_unit_id: z.string().max(256).nullable().optional(),
  adjust_app_token: z.string().max(256).nullable().optional(),
  adjust_iap_event_token: z.string().max(256).nullable().optional(),
  meta_app_id: z.string().max(256).nullable().optional(),
  meta_client_token: z.string().max(256).nullable().optional()
})

export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>

export const EMPTY_PROJECT_METADATA: ProjectMetadata = {
  store_link_ios: null,
  store_link_android: null,
  max_sdk_admob_ad_id: null,
  max_sdk_inter_ad_unit_id: null,
  max_sdk_rewarded_ad_unit_id: null,
  max_sdk_banner_ad_unit_id: null,
  adjust_app_token: null,
  adjust_iap_event_token: null,
  meta_app_id: null,
  meta_client_token: null
}

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  display_prefix: z.string().regex(/^[A-Z]{2,5}$/, 'display_prefix must be 2-5 uppercase letters'),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'color must be 6-digit hex'),
  logo: LogoSchema.nullable(),
  metadata: ProjectMetadataSchema.nullable(),
  current_version_id: z.string().uuid().nullable(),
  case_counter: z.number().int().nonnegative(),
  plan_counter: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string()
})

export const NewProjectSchema = ProjectSchema.pick({
  display_prefix: true,
  name: true,
  description: true,
  color: true,
  logo: true
}).extend({
  description: z.string().nullable().optional(),
  logo: LogoSchema.nullable().optional()
})

export const ProjectPatchSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().nullable(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    display_prefix: z.string().regex(/^[A-Z]{2,5}$/),
    logo: LogoSchema.nullable(),
    metadata: ProjectMetadataSchema.nullable(),
    current_version_id: z.string().uuid().nullable()
  })
  .partial()

export type Project = z.infer<typeof ProjectSchema>
export type NewProjectInput = z.infer<typeof NewProjectSchema>
export type ProjectPatch = z.infer<typeof ProjectPatchSchema>
