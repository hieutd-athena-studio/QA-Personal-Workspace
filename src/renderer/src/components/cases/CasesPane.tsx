import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Download, FileJson, FolderPlus, Plus, Search, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Card, CardContent } from '@renderer/components/ui/card'
import { useCategories } from '@renderer/hooks/useCategories'
import {
  useExportTestCases,
  useImportTestCases,
  useSearchTestCases,
  useTestCases
} from '@renderer/hooks/useTestCases'
import { NewProjectCategoryDialog } from './NewProjectCategoryDialog'
import type { Category } from '@shared/types/categories'
import type { TestCase } from '@shared/types/test_cases'

interface Props {
  projectId: string
}

export function CasesPane({ projectId }: Props): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const { data: cats } = useCategories(projectId)
  const { data: cases } = useTestCases(projectId)
  const { data: searchResults } = useSearchTestCases(projectId, query)
  const exportCases = useExportTestCases(projectId)
  const importCases = useImportTestCases(projectId)

  const topCats = (cats ?? []).filter((c) => !c.parent_category_id)
  const subsByParent = new Map<string, Category[]>()
  for (const c of cats ?? []) {
    if (c.parent_category_id) {
      const arr = subsByParent.get(c.parent_category_id) ?? []
      arr.push(c)
      subsByParent.set(c.parent_category_id, arr)
    }
  }

  const casesBySubcat = new Map<string, TestCase[]>()
  const orphanCases: TestCase[] = []
  for (const tc of cases ?? []) {
    if (tc.subcategory_id) {
      const arr = casesBySubcat.get(tc.subcategory_id) ?? []
      arr.push(tc)
      casesBySubcat.set(tc.subcategory_id, arr)
    } else {
      orphanCases.push(tc)
    }
  }

  const handleExport = (): void => {
    exportCases.mutate(undefined, {
      onSuccess: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cases-${projectId.slice(0, 8)}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`Exported ${data.length} cases`)
      },
      onError: (e) => toast.error(e.message)
    })
  }

  const handleImport = (): void => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (): Promise<void> => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const payload = JSON.parse(text)
        if (!Array.isArray(payload)) throw new Error('expected array of test cases')
        const normalized = payload.map((tc) => ({
          project_id: projectId,
          subcategory_id: tc.subcategory_id ?? null,
          name: tc.name,
          description: tc.description ?? null,
          expected_result: tc.expected_result ?? null,
          version: tc.version ?? '1.0',
          steps: (tc.steps ?? []).map((s: { action: string; expected?: string }) => ({
            action: s.action,
            expected: s.expected ?? ''
          }))
        }))
        importCases.mutate(normalized, {
          onSuccess: (n) => toast.success(`Imported ${n} cases`),
          onError: (e) => toast.error(e.message)
        })
      } catch (e) {
        toast.error(`Import failed: ${(e as Error).message}`)
      }
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cases by ID, name, description…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setCatDialogOpen(true)}>
          <FolderPlus className="mr-2 size-4" /> Category
        </Button>
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Upload className="mr-2 size-4" /> Import
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 size-4" /> Export
        </Button>
        <Button size="sm" asChild>
          <Link to="/projects/$projectId/cases/new" params={{ projectId }}>
            <Plus className="mr-2 size-4" /> New case
          </Link>
        </Button>
      </div>

      {query && (
        <Card>
          <CardContent className="py-3">
            <p className="mb-2 text-sm text-muted-foreground">
              {searchResults?.length ?? 0} results for &quot;{query}&quot;
            </p>
            <CaseRowList cases={searchResults ?? []} projectId={projectId} />
          </CardContent>
        </Card>
      )}

      {!query && (
        <>
          {(cases ?? []).length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <FileJson className="size-8 text-muted-foreground" />
                <p className="text-sm">No test cases yet.</p>
                <Button size="sm" asChild>
                  <Link to="/projects/$projectId/cases/new" params={{ projectId }}>
                    <Plus className="mr-2 size-4" /> New case
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {topCats.length === 0 && orphanCases.length > 0 && (
            <Card>
              <CardContent className="py-3">
                <CaseRowList cases={orphanCases} projectId={projectId} />
              </CardContent>
            </Card>
          )}

          {topCats.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="py-3">
                <h3 className="mb-2 text-sm font-semibold">{cat.name}</h3>
                {(subsByParent.get(cat.id) ?? []).map((sub) => (
                  <div key={sub.id} className="mb-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">{sub.name}</p>
                    <CaseRowList cases={casesBySubcat.get(sub.id) ?? []} projectId={projectId} />
                  </div>
                ))}
                {(subsByParent.get(cat.id) ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">No subcategories.</p>
                )}
              </CardContent>
            </Card>
          ))}

          {orphanCases.length > 0 && topCats.length > 0 && (
            <Card>
              <CardContent className="py-3">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Uncategorized</h3>
                <CaseRowList cases={orphanCases} projectId={projectId} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <NewProjectCategoryDialog
        projectId={projectId}
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        categories={cats ?? []}
      />
    </div>
  )
}

function CaseRowList({
  cases,
  projectId
}: {
  cases: TestCase[]
  projectId: string
}): React.JSX.Element {
  if (cases.length === 0) {
    return <p className="text-xs text-muted-foreground">No cases.</p>
  }
  return (
    <ul className="divide-y rounded-md border">
      {cases.map((c) => (
        <li key={c.id}>
          <Link
            to="/projects/$projectId/cases/$caseId"
            params={{ projectId, caseId: c.id }}
            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/40"
          >
            <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
              {c.display_id}
            </span>
            <span className="flex-1 truncate">{c.name}</span>
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              v{c.version}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
