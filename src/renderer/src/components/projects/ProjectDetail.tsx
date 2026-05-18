import { Link } from '@tanstack/react-router'
import { ChevronLeft, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { DashboardPane } from './DashboardPane'
import { CasesPane } from '../cases/CasesPane'
import { PlansPane } from '../plans/PlansPane'
import { TypesPane } from '../types/TypesPane'
import { ReportsPane } from '../reports/ReportsPane'
import { useExportBackup, useImportBackup } from '@renderer/hooks/useBackup'
import type { Project } from '@shared/types/projects'

interface Props {
  project: Project
}

export function ProjectDetail({ project }: Props): React.JSX.Element {
  const exportBackup = useExportBackup()
  const importBackup = useImportBackup()

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> All projects
      </Link>

      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className="mt-1 size-12 shrink-0 rounded-md"
            style={{ backgroundColor: project.color }}
            aria-hidden="true"
          />
          <div>
            <h1 className="flex items-baseline gap-3 text-3xl font-bold tracking-tight">
              <span className="font-mono text-base text-muted-foreground">
                {project.display_prefix}
              </span>
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportBackup.mutate(undefined, {
                onSuccess: (r) => {
                  if (!r.canceled) toast.success(`Backup saved to ${r.path}`)
                },
                onError: (e) => toast.error(e.message)
              })
            }
          >
            <Download className="mr-2 size-4" /> Backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              importBackup.mutate(undefined, {
                onSuccess: (r) => {
                  if (!r.canceled) toast.success('Workspace restored from backup')
                },
                onError: (e) => toast.error(e.message)
              })
            }
          >
            <Upload className="mr-2 size-4" /> Restore
          </Button>
        </div>
      </header>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="cases">Test Cases</TabsTrigger>
          <TabsTrigger value="plans">Plans &amp; Cycles</TabsTrigger>
          <TabsTrigger value="types">Test Types</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-6">
          <DashboardPane project={project} />
        </TabsContent>
        <TabsContent value="cases" className="mt-6">
          <CasesPane projectId={project.id} />
        </TabsContent>
        <TabsContent value="plans" className="mt-6">
          <PlansPane projectId={project.id} />
        </TabsContent>
        <TabsContent value="types" className="mt-6">
          <TypesPane projectId={project.id} />
        </TabsContent>
        <TabsContent value="reports" className="mt-6">
          <ReportsPane projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
