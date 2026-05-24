import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@renderer/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@renderer/components/ui/form'
import { Input } from '@renderer/components/ui/input'
import { useUpdateProject } from '@renderer/hooks/useProjects'
import type { Project, ProjectPatch } from '@shared/types/projects'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
}

const COLOR_PRESETS = [
  '#8b5cf6',
  '#2563eb',
  '#0d9488',
  '#f59e0b',
  '#ec4899',
  '#22c55e',
  '#ef4444',
  '#a855f7'
] as const

const MAX_LOGO_SIDE = 256

async function resizeImageToDataUrl(file: File): Promise<string> {
  const reader = await new Promise<FileReader>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr)
    fr.onerror = () => reject(new Error('Failed to read file'))
    fr.readAsDataURL(file)
  })
  const dataUrl = reader.result as string

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Invalid image'))
    el.src = dataUrl
  })

  const ratio = Math.min(MAX_LOGO_SIDE / img.width, MAX_LOGO_SIDE / img.height, 1)
  const w = Math.round(img.width * ratio)
  const h = Math.round(img.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/png')
}

// Subset schema for the form — only fields the user can edit here.
// Use a fresh non-partial schema so RHF knows these are required at form-submit time.
const EditableSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  logo: z
    .string()
    .max(512_000, 'logo too large (max ~500KB)')
    .refine((v) => v.startsWith('data:image/'), 'logo must be a data:image/* URL')
    .nullable()
})

type EditableValues = z.infer<typeof EditableSchema>

export function EditProjectDialog({ open, onOpenChange, project }: Props): React.JSX.Element {
  const updateProject = useUpdateProject()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoBusy, setLogoBusy] = useState(false)

  const form = useForm<EditableValues>({
    resolver: zodResolver(EditableSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? '',
      color: project.color,
      logo: project.logo
    }
  })

  // Reset form whenever a different project is opened or dialog re-opened.
  useEffect(() => {
    if (open) {
      form.reset({
        name: project.name,
        description: project.description ?? '',
        color: project.color,
        logo: project.logo
      })
    }
  }, [open, project, form])

  const watchedColor = form.watch('color')
  const watchedLogo = form.watch('logo')

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Pick an image file (PNG, JPG, SVG…)')
      return
    }
    setLogoBusy(true)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      form.setValue('logo', dataUrl, { shouldDirty: true })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLogoBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearLogo = (): void => {
    form.setValue('logo', null, { shouldDirty: true })
  }

  const handleSubmit = form.handleSubmit((values) => {
    const patch: ProjectPatch = {
      name: values.name,
      description: values.description?.trim() ? values.description : null,
      color: values.color,
      logo: values.logo
    }
    updateProject.mutate(
      { id: project.id, patch },
      {
        onSuccess: () => {
          toast.success('Project updated')
          onOpenChange(false)
        },
        onError: (err) => toast.error(`Update failed: ${err.message}`)
      }
    )
  })

  const handleClose = (): void => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[520px] gap-0 p-0 overflow-hidden anim-dialog-in"
        showCloseButton={false}
      >
        <DialogHeader className="px-6 pt-6 pb-4 gap-1">
          <DialogTitle className="text-[15px] font-semibold leading-snug">Edit project</DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--fg-muted)]">
            Update display name, description, color, or logo. Prefix{' '}
            <span className="mono text-[12px] text-foreground">{project.display_prefix}</span> is
            locked.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <div className="px-6 pb-4 flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-[12px] font-medium text-[var(--fg-muted)]">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input id="ep-name" className="text-[13px] h-8" {...field} />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-[12px] font-medium text-[var(--fg-muted)]">
                      Description
                    </FormLabel>
                    <FormControl>
                      <textarea
                        id="ep-desc"
                        className="w-full min-h-[72px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[13px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-[color,box-shadow] dark:bg-input/30"
                        placeholder="What this project covers."
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel className="text-[12px] font-medium text-[var(--fg-muted)]">
                      Logo
                    </FormLabel>
                    <FormControl>
                      <input type="hidden" value={field.value ?? ''} onChange={() => {}} />
                    </FormControl>
                    <div className="flex items-center gap-3">
                      <div
                        className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-2)]"
                        aria-label="Project logo"
                      >
                        {watchedLogo ? (
                          <img
                            src={watchedLogo}
                            alt="Project logo preview"
                            className="size-full object-contain"
                          />
                        ) : (
                          <div
                            className="grid size-full place-items-center text-[var(--fg-faint)]"
                            style={{ backgroundColor: watchedColor }}
                            aria-hidden="true"
                          >
                            <ImagePlus className="size-5 opacity-60" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={logoBusy}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {logoBusy ? 'Processing…' : watchedLogo ? 'Replace' : 'Upload image'}
                          </Button>
                          {watchedLogo && (
                            <Button type="button" variant="outline" size="sm" onClick={clearLogo}>
                              <X className="size-3.5" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--fg-subtle)]">
                          PNG, JPG, SVG. Resized to 256×256.
                        </span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void onPickLogo(e)}
                      />
                    </div>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel className="text-[12px] font-medium text-[var(--fg-muted)]">
                      Color
                    </FormLabel>
                    <FormControl>
                      <input type="hidden" {...field} />
                    </FormControl>
                    <div className="flex items-center gap-3">
                      <div
                        className="relative size-11 shrink-0 rounded-[var(--radius-md)] cursor-pointer overflow-hidden"
                        style={{ backgroundColor: watchedColor }}
                        aria-label="Pick color"
                      >
                        <input
                          type="color"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          value={watchedColor}
                          onChange={(e) => field.onChange(e.target.value)}
                          aria-label="Color picker"
                          tabIndex={-1}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="mono text-[13px] font-semibold tracking-wide">
                          {watchedColor.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-[var(--fg-subtle)]">
                          Used in the sidebar swatch and accent flourishes.
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap mt-1">
                      {COLOR_PRESETS.map((preset) => {
                        const isActive = watchedColor.toLowerCase() === preset.toLowerCase()
                        return (
                          <button
                            key={preset}
                            type="button"
                            className="size-6 rounded-[4px] shrink-0 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                            style={{
                              backgroundColor: preset,
                              boxShadow: isActive
                                ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${preset}`
                                : undefined
                            }}
                            aria-label={`Color preset ${preset}`}
                            aria-pressed={isActive}
                            onClick={() => field.onChange(preset)}
                          />
                        )
                      })}
                    </div>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border-soft)] bg-[var(--surface-1)]">
              <span className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={updateProject.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={updateProject.isPending}>
                {updateProject.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
