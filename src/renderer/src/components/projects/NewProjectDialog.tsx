import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { useCreateProject } from '@renderer/hooks/useProjects'
import { NewProjectSchema, type NewProjectInput } from '@shared/types/projects'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function NewProjectDialog({ open, onOpenChange }: Props): React.JSX.Element {
  const createProject = useCreateProject()
  const form = useForm<NewProjectInput>({
    resolver: zodResolver(NewProjectSchema),
    defaultValues: {
      display_prefix: '',
      name: '',
      description: '',
      color: '#8b5cf6'
    }
  })

  const watchedPrefix = form.watch('display_prefix')
  const watchedColor = form.watch('color')

  const handleSubmit = form.handleSubmit((values) => {
    createProject.mutate(values, {
      onSuccess: (project) => {
        toast.success(`Created ${project.name}`)
        form.reset()
        onOpenChange(false)
      },
      onError: (err) => toast.error(`Create failed: ${err.message}`)
    })
  })

  const handleClose = (): void => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[520px] gap-0 p-0 overflow-hidden anim-dialog-in"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 gap-1">
          <DialogTitle className="text-[15px] font-semibold leading-snug">New project</DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--fg-muted)]">
            Projects scope test cases, plans, and cycles. Each gets a unique prefix and color.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit}>
            {/* Body */}
            <div className="px-6 pb-4 flex flex-col gap-4">
              {/* Prefix + Name row */}
              <div className="flex gap-3 items-start">
                {/* Prefix — fixed 110px */}
                <FormField
                  control={form.control}
                  name="display_prefix"
                  render={({ field }) => (
                    <FormItem className="flex-none w-[110px] gap-1">
                      <FormLabel className="text-[12px] font-medium text-[var(--fg-muted)]">
                        Prefix
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="np-prefix"
                          className="font-mono text-[13px] uppercase tracking-wider h-8"
                          placeholder="AUR"
                          maxLength={6}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                          }
                        />
                      </FormControl>
                      <p className="text-[11px] text-[var(--fg-subtle)]">2–6 letters; uppercase</p>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {/* Name — flex 1 */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1 gap-1">
                      <FormLabel className="text-[12px] font-medium text-[var(--fg-muted)]">
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="np-name"
                          className="text-[13px] h-8"
                          placeholder="Aurora"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[11px] text-[var(--fg-subtle)]">
                        Display name shown on the project card.
                      </p>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
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
                        id="np-desc"
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

              {/* Color block */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel className="text-[12px] font-medium text-[var(--fg-muted)]">
                      Color
                    </FormLabel>
                    <FormControl>
                      {/* invisible wrapper needed so FormControl id wires to the hidden input */}
                      <input type="hidden" {...field} />
                    </FormControl>

                    {/* Swatch + meta row */}
                    <div className="flex items-center gap-3">
                      {/* 44px swatch with native color input overlaid */}
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
                      {/* Meta column */}
                      <div className="flex flex-col gap-0.5">
                        <span className="mono text-[13px] font-semibold tracking-wide">
                          {watchedColor.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-[var(--fg-subtle)]">
                          Used in the sidebar swatch and accent flourishes.
                        </span>
                      </div>
                    </div>

                    {/* Preset chips */}
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

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border-soft)] bg-[var(--surface-1)]">
              {/* Left hint */}
              <span className="flex-1 mono text-[11px] text-[var(--fg-subtle)] truncate">
                {watchedPrefix.length >= 2
                  ? `${watchedPrefix}-001 will be the first case ID`
                  : null}
              </span>
              {/* Right buttons */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={createProject.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createProject.isPending}>
                {createProject.isPending ? 'Creating…' : 'Create project'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
