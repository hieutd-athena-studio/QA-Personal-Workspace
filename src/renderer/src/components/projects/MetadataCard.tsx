import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { useUpdateProject } from '@renderer/hooks/useProjects'
import { EMPTY_PROJECT_METADATA, type Project, type ProjectMetadata } from '@shared/types/projects'

interface Props {
  project: Project
}

type MetaField = keyof ProjectMetadata

interface FieldSpec {
  key: MetaField
  label: string
  placeholder: string
}

interface FieldGroup {
  title: string
  fields: FieldSpec[]
}

const GROUPS: FieldGroup[] = [
  {
    title: 'Store Link',
    fields: [
      { key: 'store_link_ios', label: 'iOS', placeholder: 'https://apps.apple.com/…' },
      { key: 'store_link_android', label: 'Android', placeholder: 'https://play.google.com/…' }
    ]
  },
  {
    title: 'MAX SDK',
    fields: [
      { key: 'max_sdk_admob_ad_id', label: 'Admob Ad ID', placeholder: 'ca-app-pub-…' },
      { key: 'max_sdk_inter_ad_unit_id', label: 'Inter Ad Unit ID', placeholder: 'inter_…' },
      {
        key: 'max_sdk_rewarded_ad_unit_id',
        label: 'Rewarded Ad Unit ID',
        placeholder: 'rewarded_…'
      },
      { key: 'max_sdk_banner_ad_unit_id', label: 'Banner Ad Unit ID', placeholder: 'banner_…' }
    ]
  },
  {
    title: 'Adjust',
    fields: [
      { key: 'adjust_app_token', label: 'Adjust App Token', placeholder: 'abcdefghijkl' },
      { key: 'adjust_iap_event_token', label: 'iAP Event Token', placeholder: 'token' },
      { key: 'meta_app_id', label: 'Meta App ID', placeholder: '1234567890' },
      { key: 'meta_client_token', label: 'Meta Client Token', placeholder: 'CT…' }
    ]
  }
]

export function MetadataCard({ project }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const metadata = project.metadata ?? EMPTY_PROJECT_METADATA

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-[16px_18px]">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-subtle)]">
          Metadata
        </h3>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[11.5px] text-[var(--fg-muted)] transition-colors hover:bg-white/[0.05] hover:text-foreground"
          aria-label="Edit metadata"
        >
          <Pencil className="size-3" />
          Edit
        </button>
      </header>

      <div className="flex flex-col gap-3.5">
        {GROUPS.map((group) => (
          <FieldGroupView key={group.title} group={group} metadata={metadata} />
        ))}
      </div>

      {open && (
        <MetadataDialog open={open} onOpenChange={setOpen} project={project} metadata={metadata} />
      )}
    </div>
  )
}

function FieldGroupView({
  group,
  metadata
}: {
  group: FieldGroup
  metadata: ProjectMetadata
}): React.JSX.Element {
  return (
    <div>
      <h4 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-faint)]">
        {group.title}
      </h4>
      <dl className="grid gap-1.5">
        {group.fields.map((f) => (
          <FieldRow key={f.key} label={f.label} value={metadata[f.key] ?? null} />
        ))}
      </dl>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string | null }): React.JSX.Element {
  return (
    <div className="grid items-baseline gap-2" style={{ gridTemplateColumns: '160px 1fr' }}>
      <dt className="text-[12px] text-[var(--fg-subtle)]">{label}</dt>
      <dd className="min-w-0 truncate font-mono text-[12px] text-foreground" title={value ?? ''}>
        {value ? value : <span className="text-[var(--fg-faint)]">—</span>}
      </dd>
    </div>
  )
}

interface MetadataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  metadata: ProjectMetadata
}

function MetadataDialog({
  open,
  onOpenChange,
  project,
  metadata
}: MetadataDialogProps): React.JSX.Element {
  // Parent mounts this only when open, so the initializer runs fresh each time.
  const updateProject = useUpdateProject()
  const [values, setValues] = useState<ProjectMetadata>(metadata)

  const handleSave = (): void => {
    // Coerce blank strings to null so we don't litter the DB with empty values.
    const cleaned: ProjectMetadata = Object.fromEntries(
      (Object.keys(EMPTY_PROJECT_METADATA) as MetaField[]).map((k) => [
        k,
        values[k]?.trim() ? values[k] : null
      ])
    ) as ProjectMetadata

    updateProject.mutate(
      { id: project.id, patch: { metadata: cleaned } },
      {
        onSuccess: () => {
          toast.success('Metadata saved')
          onOpenChange(false)
        },
        onError: (err) => toast.error(`Save failed: ${err.message}`)
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[640px] gap-0 p-0 overflow-hidden anim-dialog-in"
        showCloseButton={false}
      >
        <DialogHeader className="px-6 pt-6 pb-3 gap-1">
          <DialogTitle className="text-[15px] font-semibold leading-snug">
            Edit metadata
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--fg-muted)]">
            All fields are optional. Leave blank if not applicable.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto px-6 pb-4 scrollbar-thin">
          {GROUPS.map((group) => (
            <fieldset key={group.title} className="flex flex-col gap-2">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
                {group.title}
              </legend>
              {group.fields.map((f) => (
                <label key={f.key} className="flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[var(--fg-muted)]">{f.label}</span>
                  <Input
                    className="h-8 text-[13px] font-mono"
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </label>
              ))}
            </fieldset>
          ))}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border-soft)] bg-[var(--surface-1)]">
          <span className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={updateProject.isPending}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={updateProject.isPending}>
            {updateProject.isPending ? 'Saving…' : 'Save metadata'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
