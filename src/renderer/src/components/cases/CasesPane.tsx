import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Check,
  ChevronDown,
  Download,
  FolderPlus,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'
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
  const [debounced, setDebounced] = useState('')
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const qc = useQueryClient()
  const { data: cats } = useCategories(projectId)
  const { data: cases } = useTestCases(projectId)
  const { data: searchResults } = useSearchTestCases(projectId, query)
  const exportCases = useExportTestCases(projectId)
  const importCases = useImportTestCases(projectId)

  // Debounce — controls the pulse-line indicator
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200)
    return () => clearTimeout(t)
  }, [query])
  const searching = query.trim() !== debounced.trim()

  // Category tree
  const topCats = (cats ?? []).filter((c) => !c.parent_category_id)
  const subsByParent = useMemo(() => {
    const m = new Map<string, Category[]>()
    for (const c of cats ?? []) {
      if (c.parent_category_id) {
        const arr = m.get(c.parent_category_id) ?? []
        arr.push(c)
        m.set(c.parent_category_id, arr)
      }
    }
    return m
  }, [cats])

  const casesBySubcat = useMemo(() => {
    const m = new Map<string, TestCase[]>()
    const orphans: TestCase[] = []
    for (const tc of cases ?? []) {
      if (tc.subcategory_id) {
        const arr = m.get(tc.subcategory_id) ?? []
        arr.push(tc)
        m.set(tc.subcategory_id, arr)
      } else {
        orphans.push(tc)
      }
    }
    return { bySubcat: m, orphans }
  }, [cases])

  const toggleSelect = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCat = (catId: string): void => {
    setCollapsedCats((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const handleBatchDelete = async (): Promise<void> => {
    if (selectedIds.size === 0) return
    setDeleting(true)
    try {
      await Promise.all([...selectedIds].map((id) => window.api.cases.delete(id)))
      await qc.invalidateQueries({ queryKey: ['cases', projectId] })
      setSelectedIds(new Set())
      toast.success(`Deleted ${selectedIds.size} case${selectedIds.size > 1 ? 's' : ''}`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
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
        const parsed: unknown = JSON.parse(text)

        type RawStep = { action: string; expected?: string; step?: number }
        type RawCase = {
          name?: string
          title?: string
          description?: string
          expected_result?: string
          version?: string
          category?: string
          subcategory_id?: string
          subcategory?: string
          steps?: RawStep[]
        }

        let rawCases: RawCase[]
        let isExternal = false

        if (Array.isArray(parsed)) {
          rawCases = parsed as RawCase[]
        } else if (
          parsed !== null &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as Record<string, unknown>).test_cases)
        ) {
          rawCases = (parsed as { test_cases: RawCase[] }).test_cases
          isExternal = true
        } else {
          throw new Error('expected array of test cases or object with test_cases key')
        }

        let allCats = cats ?? []
        let created = 0

        if (isExternal) {
          const neededParents = new Set<string>()
          const neededSubs = new Map<string, string>()
          for (const tc of rawCases) {
            const parentName = tc.category?.trim()
            const subName = tc.subcategory?.trim()
            if (
              parentName &&
              !allCats.some(
                (c) => !c.parent_category_id && c.name.toLowerCase() === parentName.toLowerCase()
              )
            ) {
              neededParents.add(parentName)
            }
            if (subName && parentName) neededSubs.set(subName, parentName)
          }
          for (const parentName of neededParents) {
            const newCat = await window.api.categories.create({
              project_id: projectId,
              name: parentName,
              parent_category_id: null
            })
            allCats = [...allCats, newCat]
            created++
          }
          for (const [subName, parentName] of neededSubs) {
            const alreadyExists = allCats.some(
              (c) => c.parent_category_id !== null && c.name.toLowerCase() === subName.toLowerCase()
            )
            if (!alreadyExists) {
              const parent = allCats.find(
                (c) => !c.parent_category_id && c.name.toLowerCase() === parentName.toLowerCase()
              )
              if (parent) {
                const newSub = await window.api.categories.create({
                  project_id: projectId,
                  name: subName,
                  parent_category_id: parent.id
                })
                allCats = [...allCats, newSub]
                created++
              }
            }
          }
          if (created > 0) void qc.invalidateQueries({ queryKey: ['categories', projectId] })
        }

        let matched = 0
        const normalized = rawCases.map((tc) => {
          let subcategoryId: string | null = tc.subcategory_id ?? null
          if (isExternal && tc.subcategory) {
            const found = allCats.find(
              (c) =>
                c.parent_category_id !== null &&
                c.name.toLowerCase() === tc.subcategory!.toLowerCase()
            )
            if (found) {
              subcategoryId = found.id
              matched++
            }
          }
          return {
            project_id: projectId,
            subcategory_id: subcategoryId,
            name: tc.title ?? tc.name ?? '',
            description: tc.description ?? null,
            expected_result: tc.expected_result ?? null,
            version: tc.version ?? '1.0',
            steps: (tc.steps ?? []).map((s) => ({ action: s.action, expected: s.expected ?? '' }))
          }
        })
        importCases.mutate(normalized, {
          onSuccess: (n) =>
            toast.success(
              isExternal
                ? `Imported ${n} cases (${matched} matched subcategory${created > 0 ? `, ${created} categories created` : ''})`
                : `Imported ${n} cases`
            ),
          onError: (e) => toast.error(e.message)
        })
      } catch (e) {
        toast.error(`Import failed: ${(e as Error).message}`)
      }
    }
    input.click()
  }

  const isSearching = Boolean(query.trim())
  const totalCases = (cases ?? []).length

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="mb-[22px] flex flex-wrap items-center gap-2">
        {/* Animated search input */}
        <div className="relative flex min-w-0 max-w-[360px] flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-[9px] size-3.5 text-[var(--fg-subtle)]"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search test cases…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-1)] pl-[30px] pr-[30px] text-[13px] text-foreground outline-none placeholder:text-[var(--fg-faint)] transition-colors focus:border-[var(--accent-ring)] focus:bg-[var(--surface-2)]"
          />
          {query && (
            <button
              className="absolute right-1.5 grid size-5 place-items-center rounded text-[var(--fg-subtle)] transition-colors hover:bg-white/[0.06] hover:text-foreground"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
          {/* Pulse line indicator */}
          <span
            className="pointer-events-none absolute bottom-[-1px] left-2 right-2 h-[1.5px] rounded-full bg-[var(--accent)]"
            style={{
              opacity: searching ? 1 : 0,
              transformOrigin: 'left',
              animation: searching ? 'pulseLine 800ms infinite var(--ease-out-back)' : 'none',
              transition: 'opacity 120ms'
            }}
            aria-hidden="true"
          />
        </div>

        <GhostBtn
          icon={<Layers className="size-[13px]" />}
          label="Category"
          onClick={() => setCatDialogOpen(true)}
        />
        <GhostBtn icon={<Upload className="size-[13px]" />} label="Import" onClick={handleImport} />
        <GhostBtn
          icon={<Download className="size-[13px]" />}
          label="Export"
          onClick={handleExport}
        />
        <span className="flex-1" />
        <Link
          to="/projects/$projectId/cases/new"
          params={{ projectId }}
          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          <Sparkles className="size-[13px]" />
          New case
        </Link>
      </div>

      {/* Search results */}
      {isSearching && (
        <div>
          {(searchResults ?? []).length === 0 ? (
            <EmptyState
              icon={<Search className="size-5 text-[var(--fg-faint)]" />}
              headline={`No matches for "${debounced}"`}
              sub="Try a different query or clear the search."
            />
          ) : (
            <div>
              <p className="mb-2.5 text-[12px] text-[var(--fg-muted)]">
                <strong className="font-semibold text-foreground">{searchResults!.length}</strong>{' '}
                case{searchResults!.length === 1 ? '' : 's'} matching &quot;{debounced}&quot;
              </p>
              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-2">
                {(searchResults ?? []).map((c) => (
                  <CaseRow
                    key={c.id}
                    tc={c}
                    projectId={projectId}
                    selected={selectedIds.has(c.id)}
                    onToggle={() => toggleSelect(c.id)}
                    showMeta
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grouped category tree */}
      {!isSearching && (
        <>
          {totalCases === 0 && topCats.length === 0 && (
            <EmptyState
              icon={<Sparkles className="size-5 text-[var(--fg-faint)]" />}
              headline="No test cases yet"
              sub="Create your first test case to get started."
              cta={
                <Link
                  to="/projects/$projectId/cases/new"
                  params={{ projectId }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                  <Plus className="size-3.5" />
                  New case
                </Link>
              }
            />
          )}

          {/* Orphan cases (no subcategory, no parent cats) */}
          {casesBySubcat.orphans.length > 0 && topCats.length === 0 && (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-2">
              {casesBySubcat.orphans.map((c) => (
                <CaseRow
                  key={c.id}
                  tc={c}
                  projectId={projectId}
                  selected={selectedIds.has(c.id)}
                  onToggle={() => toggleSelect(c.id)}
                />
              ))}
            </div>
          )}

          {topCats.map((cat) => {
            const subs = subsByParent.get(cat.id) ?? []
            const total =
              subs.reduce((s, sub) => s + (casesBySubcat.bySubcat.get(sub.id)?.length ?? 0), 0) +
              (casesBySubcat.bySubcat.get(cat.id)?.length ?? 0)
            const isCollapsed = collapsedCats.has(cat.id)

            return (
              <section key={cat.id} className="mb-7">
                {/* Category header */}
                <header
                  className={[
                    'mb-1.5 flex items-baseline gap-3 border-b border-[var(--border)] pb-2.5',
                    isCollapsed ? '[&_.toggle-icon]:rotate-[-90deg]' : ''
                  ].join(' ')}
                >
                  <h3 className="text-[13px] font-semibold tracking-[-0.005em] text-foreground m-0">
                    {cat.name}
                  </h3>
                  <span className="font-mono text-[11px] text-[var(--fg-subtle)]">{total}</span>
                  <button
                    className="toggle-icon ml-auto grid size-6 place-items-center rounded text-[var(--fg-subtle)] transition-[background,color,transform] duration-200 hover:bg-white/[0.04] hover:text-foreground"
                    onClick={() => toggleCat(cat.id)}
                    aria-label={isCollapsed ? `Expand ${cat.name}` : `Collapse ${cat.name}`}
                    aria-expanded={!isCollapsed}
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                </header>

                {!isCollapsed && (
                  <>
                    {subs.map((sub) => {
                      const subCases = casesBySubcat.bySubcat.get(sub.id) ?? []
                      return (
                        <div key={sub.id} className="mb-[18px] mt-2">
                          <div className="flex items-center gap-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
                            <span>{sub.name}</span>
                            <span className="font-mono text-[10.5px] font-medium normal-case tracking-normal text-[var(--fg-faint)]">
                              {subCases.length}
                            </span>
                          </div>
                          {subCases.length === 0 ? (
                            <p className="py-1 pl-1 text-[12px] text-[var(--fg-faint)]">
                              No cases.
                            </p>
                          ) : (
                            subCases.map((c) => (
                              <CaseRow
                                key={c.id}
                                tc={c}
                                projectId={projectId}
                                selected={selectedIds.has(c.id)}
                                onToggle={() => toggleSelect(c.id)}
                              />
                            ))
                          )}
                        </div>
                      )
                    })}

                    {/* Direct-cat orphan cases (attached to cat but no sub) */}
                    {(casesBySubcat.bySubcat.get(cat.id) ?? []).map((c) => (
                      <CaseRow
                        key={c.id}
                        tc={c}
                        projectId={projectId}
                        selected={selectedIds.has(c.id)}
                        onToggle={() => toggleSelect(c.id)}
                      />
                    ))}

                    {subs.length === 0 &&
                      (casesBySubcat.bySubcat.get(cat.id) ?? []).length === 0 && (
                        <p className="py-2 pl-1 text-[12px] text-[var(--fg-faint)]">
                          No subcategories or cases.
                        </p>
                      )}
                  </>
                )}
              </section>
            )
          })}

          {/* Orphan cases when cats exist */}
          {casesBySubcat.orphans.length > 0 && topCats.length > 0 && (
            <section className="mb-7">
              <header className="mb-1.5 flex items-baseline gap-3 border-b border-[var(--border)] pb-2.5">
                <h3 className="text-[13px] font-semibold tracking-[-0.005em] text-[var(--fg-muted)] m-0">
                  Uncategorized
                </h3>
                <span className="font-mono text-[11px] text-[var(--fg-subtle)]">
                  {casesBySubcat.orphans.length}
                </span>
              </header>
              {casesBySubcat.orphans.map((c) => (
                <CaseRow
                  key={c.id}
                  tc={c}
                  projectId={projectId}
                  selected={selectedIds.has(c.id)}
                  onToggle={() => toggleSelect(c.id)}
                />
              ))}
            </section>
          )}
        </>
      )}

      {/* Selection action bar */}
      {selectedIds.size > 0 && (
        <div className="anim-selbar-in pointer-events-none absolute bottom-6 right-6 z-50">
          <div
            className="pointer-events-auto flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-2)] pl-3.5 pr-1.5 py-1.5"
            style={{
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 14px 40px rgba(0,0,0,0.45)'
            }}
            role="toolbar"
            aria-label="Selection actions"
          >
            <span className="text-[12.5px] font-medium text-[var(--fg-muted)]">
              <b className="font-mono font-semibold text-foreground">{selectedIds.size}</b> selected
            </span>
            <span className="mx-0.5 h-[18px] w-px bg-[var(--border)]" aria-hidden="true" />
            <SelBarBtn icon={<Layers className="size-3.5" />} title="Add to test type" />
            <SelBarBtn icon={<FolderPlus className="size-3.5" />} title="Move to subcategory" />
            <span className="mx-0.5 h-[18px] w-px bg-[var(--border)]" aria-hidden="true" />
            <SelBarBtn
              icon={<Trash2 className="size-3.5" />}
              title="Delete selected"
              danger
              onClick={() => setDeleteDialogOpen(true)}
            />
            <SelBarBtn
              icon={<X className="size-3.5" />}
              title="Clear selection"
              onClick={() => setSelectedIds(new Set())}
            />
          </div>
        </div>
      )}

      {/* Batch delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} case{selectedIds.size > 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleBatchDelete()}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewProjectCategoryDialog
        projectId={projectId}
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        categories={cats ?? []}
      />
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CaseRow({
  tc,
  projectId,
  selected,
  onToggle,
  showMeta = false
}: {
  tc: TestCase
  projectId: string
  selected: boolean
  onToggle: () => void
  showMeta?: boolean
}): React.JSX.Element {
  return (
    <div
      className={[
        'group relative grid h-9 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border-l-2 py-0 pl-[9px] pr-3 transition-[background,border-color] duration-[120ms]',
        selected
          ? 'border-[var(--accent)] bg-[var(--accent-tint)]'
          : 'border-transparent hover:bg-white/[0.03]'
      ].join(' ')}
      style={{ gridTemplateColumns: '18px auto 1fr auto auto' }}
    >
      {/* Checkbox */}
      <button
        className={[
          'grid size-[14px] shrink-0 place-items-center rounded-[3px] border-[1.2px] transition-[background,border-color] duration-[120ms]',
          selected
            ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
            : 'border-[var(--border-strong)] bg-[var(--surface-1)] group-hover:border-[var(--fg-subtle)]'
        ].join(' ')}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        aria-label="Select case"
        aria-pressed={selected}
      >
        <Check
          className="size-[10px]"
          strokeWidth={2.4}
          style={{ opacity: selected ? 1 : 0, transition: 'opacity 120ms' }}
        />
      </button>

      {/* ID */}
      <span className="min-w-[64px] font-mono text-[11.5px] text-[var(--fg-subtle)]">
        {tc.display_id}
      </span>

      {/* Name + meta */}
      <Link
        to="/projects/$projectId/cases/$caseId"
        params={{ projectId, caseId: tc.id }}
        className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-foreground"
        tabIndex={-1}
      >
        {tc.name}
        {showMeta && (
          <span className="ml-2 font-mono text-[10.5px] text-[var(--fg-faint)]">
            {/* category info not available directly on TestCase — skip in search view */}
          </span>
        )}
      </Link>

      {/* Version pill */}
      <span className="rounded-full border border-[var(--border)] bg-white/[0.04] px-[7px] py-px font-mono text-[10.5px] text-[var(--fg-subtle)]">
        {tc.version}
      </span>
    </div>
  )
}

function GhostBtn({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}): React.JSX.Element {
  return (
    <button
      className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-transparent bg-transparent px-3 text-[13px] font-medium text-[var(--fg-muted)] transition-[background,color] hover:bg-white/[0.04] hover:text-foreground"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}

function SelBarBtn({
  icon,
  title,
  danger = false,
  onClick
}: {
  icon: React.ReactNode
  title: string
  danger?: boolean
  onClick?: () => void
}): React.JSX.Element {
  return (
    <button
      className={[
        'grid size-7 place-items-center rounded-[6px] transition-[background,color] duration-[120ms]',
        danger
          ? 'text-[#fca5a5] hover:bg-[var(--fail-soft)] hover:text-[#fecaca]'
          : 'text-[var(--fg-muted)] hover:bg-white/[0.06] hover:text-foreground'
      ].join(' ')}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {icon}
    </button>
  )
}

function EmptyState({
  icon,
  headline,
  sub,
  cta
}: {
  icon: React.ReactNode
  headline: string
  sub: string
  cta?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center text-[var(--fg-muted)]">
      <div className="mb-3 flex justify-center">{icon}</div>
      <h4 className="mb-1 text-[14px] font-semibold text-foreground">{headline}</h4>
      <p className="mb-4 text-[13px]">{sub}</p>
      {cta}
    </div>
  )
}
