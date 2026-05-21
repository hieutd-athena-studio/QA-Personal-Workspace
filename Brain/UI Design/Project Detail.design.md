# Project Detail — Design Spec

|                    |                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| **Prototype HTML** | `Brain/UI Design/Pages/Project Detail.html`                                                          |
| **Prototype JSX**  | `Brain/UI Design/Components/project-detail.jsx`, `project-data.jsx`                                  |
| **Prototype CSS**  | `Brain/UI Design/Stylesheets/project.css`                                                            |
| **Implementation** | `src/renderer/src/components/projects/ProjectDetail.tsx`, `DashboardPane.tsx`, and the per-tab panes |
| **Tokens map**     | `Brain/UI Design/DESIGN-TOKENS.md`                                                                   |
| **Patterns**       | `Brain/UI Design/DESIGN-PATTERNS.md`                                                                 |

---

## Page intent

The work-area shell for one project. Five tabs (Dashboard, Test Cases, Plans & Cycles, Test
Types, Reports) sharing a fixed page header. **Test Cases is the hero tab** — most
polish goes there. The rest are content panes with the same outer chrome.

---

## Page structure

```
.project-page                        flex-1 flex flex-col min-h-0 overflow-hidden
├── .proj-head                       px-8 pt-[22px]                ← fixed
│   ├── back link                    "‹ All projects"
│   ├── color swatch (36×36)
│   ├── prefix + h1 + description (max 72ch)
│   └── "..." dropdown (right)
├── .tab-bar                         px-8, mt-[22px], border-b     ← fixed
└── .tab-pane                        flex-1 overflow-y-auto px-8 py-6 pb-8
```

Only the tab pane scrolls.

---

## Header

### Back link

```
inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-subtle)] mb-3.5
hover: text-foreground
```

Leading `<ChevronLeft className="size-3" />`.

### Identity row

```
flex items-start gap-3.5
```

1. **Color swatch:** `mt-0.5 size-9 shrink-0 rounded-md`, `style={{ backgroundColor: project.color, boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.25)' }}`
2. **Body** (`min-w-0 flex-1`):
   - Prefix: `font-mono text-[11.5px] tracking-[0.04em] text-[var(--fg-subtle)]`
   - Title: `mt-0.5 mb-1 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]`
   - Description: `text-[13px] text-[var(--fg-muted)] max-w-[72ch] mt-0.5` (optional)
3. **"..." button:** `.ghost-btn.square`, `size-8`, with `<MoreHorizontal className="size-4" />`

Dropdown menu (shadcn `DropdownMenu`):

- Backup project… → triggers `useExportBackup`
- Restore from backup…
- Export as CSV (disabled placeholder)
- ─ separator
- Delete project… (destructive text color)

---

## Tab bar

Custom sliding underline — implemented as `SlidingTabBar` in `ProjectDetail.tsx`. Specs:

- `relative flex border-b border-border px-8 mt-[22px] flex-shrink-0`
- Tabs: `h-[38px] px-3.5 text-[13px] font-medium gap-2`
  - Inactive: `text-[var(--fg-muted)] hover:text-foreground`
  - Active: `font-semibold text-foreground`
- Badges (case/plan/type counts): see `DESIGN-PATTERNS.md` → "Count badge"
- Sliding indicator:
  - `pointer-events-none absolute bottom-[-1px] h-[2px] rounded-[1px] bg-primary`
  - Transition: `left 200ms var(--ease-out-back), width 200ms var(--ease-out-back)`
  - Measured via `getBoundingClientRect` on the active button + parent. Re-measure on
    `ResizeObserver` and on `value`/`tabs.length` change.

Tab order: Dashboard, Test Cases, Plans & Cycles, Test Types, Reports.

---

## Tab: Dashboard

Two zones, separated by a horizontal divider at `border-bottom: 1px solid var(--border)`.

### Stat grid (top)

```
grid grid-cols-4 gap-8 pt-2 pb-7 border-b border-border mb-7
```

Each stat:

```
.label   10.5/600 tracking 0.1em uppercase text-[var(--fg-subtle)]
.num     32/600 tracking -0.02em tabular-nums text-foreground mt-0.5 leading-[1.1]
.sub     11.5  text-[var(--fg-subtle)] mt-0.5
```

### Lower row — `grid-cols-[2fr_1fr] gap-6`

- **Upcoming deadlines card** (left, 2fr): see "Card with rows" below.
- **Task budget card** (right, 1fr): big number 32 / 600 with `var(--fg-muted)` `/ {days} days` suffix; 6px-tall progress bar (`bg-white/[0.05] rounded-full`) with `bg-primary` fill.

### Card with rows

```
.deadline-card
  border border-border rounded-lg bg-surface-1 p-4
  h3: text-[12px] font-semibold tracking-[0.06em] uppercase text-[var(--fg-subtle)] mb-3
.deadline-row
  grid grid-cols-[3px_auto_1fr_auto] gap-3 items-center py-2.5
  border-t border-border (none on first child)
  .urg          3×22 rounded-sm — fg-faint default, fail when ≤1d, blocked when ≤7d
  .id           font-mono text-[11px] text-[var(--fg-subtle)]
  .name         text-foreground text-[13px]
  .days         font-mono text-[11.5px] px-2 py-px rounded-full border border-border
                tinted bg + matching text when urgent
```

---

## Tab: Test Cases (hero)

### Toolbar

```
.cases-toolbar  flex items-center gap-2 mb-5.5 flex-wrap
```

Order: search → "Category" subtle btn → "Import" → "Export" → spacer → "+ New case" (primary).

### Search input (`.search-input`)

- Container: relative, max-width 360px, flex-1, min-w-0
- Input: 32px tall, `bg-surface-1`, border, rounded-md, `pl-7.5 pr-7.5`, 13px
- Leading 14px search icon at `left-[9px]`, `text-[var(--fg-subtle)]`
- Trailing clear button (only when query): 20×20 square, hover bg `white/6`
- Focus: border `var(--accent-ring)`, bg `var(--surface-2)`
- Pulse line: 1.5px `bg-primary` bar at `bottom-[-1px]`, invisible by default. When debounce is in flight (`query !== debounced`), `anim-pulse-line` plays.

### Grouped view (default)

Categories with subcategories with case rows. Collapsible by category head.

```
.cat-section   mb-7
.cat-head      flex items-baseline gap-3 pb-2.5 border-b border-border mb-1.5
  h3           text-[13px] font-semibold tracking-[-0.005em] text-foreground
  .cat-count   font-mono text-[11px] text-[var(--fg-subtle)]
  .toggle      size-6 ghost button on right; rotates -90deg when collapsed (200ms transition)

.subcat        my-4.5 mt-2
.subcat-head   flex items-center gap-2 py-1.5 text-[11px] font-semibold tracking-[0.08em]
               uppercase text-[var(--fg-subtle)]
  .ct          font-mono text-[10.5px] font-medium text-[var(--fg-faint)] no-tracking lowercase
```

### Case row (`.case-row`)

```
display: grid
grid-template-columns: 18px auto 1fr auto auto
gap: 12px; height: 36px; padding: 0 12px 0 9px
rounded-md; border-left: 2px solid transparent
transitions: background, border-left-color (120ms)
```

Cells:

- **Checkbox** (`.cb`): 14×14, `rounded-[3px]`, 1.2px border `var(--border-strong)`,
  `bg-surface-1`. Checked: `bg-primary border-primary`, white check svg fades in (opacity 0→1, 120ms)
- **ID**: `font-mono text-[11.5px] text-[var(--fg-subtle)] min-w-[64px]`
- **Name**: `text-[13px] text-foreground` truncate
- **Meta** (search-results only): `font-mono text-[10.5px] text-[var(--fg-faint)]` — "Category · Subcategory"
- **Version**: `font-mono text-[10.5px] text-[var(--fg-subtle)] bg-white/[0.04] border border-border rounded-full px-1.5 py-px`

Row hover: `bg-white/[0.03]`. Click anywhere except checkbox → `onOpenCase`.
Row selected: `bg-accent-tint border-l-primary`.

### Selection bar

See `DESIGN-PATTERNS.md` → "Selection action bar". Appears when `selected.size > 0`,
absolute bottom-right of the scroll pane (24px from each edge).

### Search-results view

Replaces the grouped layout. Single bordered list in `var(--surface-1)`, 8px padding,
rows render with `showMeta` so category breadcrumbs are visible. A meta line above:
`<strong>{n}</strong> cases matching "{q}"`.

### Empty state (no matches)

Dashed-border card centered: search icon 20px in `text-[var(--fg-faint)]`, h4 14 / 600,
p 13 / `text-muted-foreground`.

---

## Tab: Plans & Cycles

Header row: `.eyebrow` left ("All plans · N"), `+ New plan` primary right.

`.plan-row`:

```
grid grid-cols-[auto_1fr_auto] gap-4.5 items-center p-3.5 px-4
border border-border rounded-md bg-surface-1 mb-2.5
```

- ID pill (eyebrow style with mono)
- Name (14 / 500) + description (12.5 / muted) + meta line (11.5 / subtle, `·`-separated)
- Progress bar (220px min) with stacked P/F/B + count, then bottom row of subtle "Execute" + "Open" buttons (right-aligned)

---

## Tab: Test Types

Header row: same eyebrow + primary button pattern.

`.type-row`:

```
grid grid-cols-[1fr_220px_auto] gap-4.5 items-center
border border-border rounded-md bg-surface-1 p-3.5 mb-2.5
```

- Name + description (left)
- Progress bar (220px), `bg-white/[0.05]` track, `bg-primary` fill, `transition-[width] duration-slow`
- "Manage cases" subtle button (right)

---

## Tab: Reports

Stub. `.eyebrow` left, primary "Open Reports" button right. Below: dashed border card
explaining what Reports is. Reports lives on its own page (`/projects/$id/reports`).

---

## Pane transitions

When switching tabs, panes use `anim-pane-fade` (200ms, slide-up 4px + fade).

---

## Anti-patterns

- ❌ Don't replace `SlidingTabBar` with bare shadcn `<Tabs>`. The custom sliding indicator
  is part of the brand. The current implementation already pairs `SlidingTabBar` (visual)
  with hidden shadcn `<TabsList>` for accessibility — keep that arrangement.
- ❌ Don't lose the `key={tab}` on tab panes (or equivalent). Pane fade animation needs to
  re-mount when switching.
- ❌ Don't use a sidebar layout for the tabs. The header-mounted tabs let the case list
  consume the entire pane width.
- ❌ Don't add visible borders between sub-categories. The eyebrow label is enough; the
  density depends on subtle spacing, not lines.
- ❌ Don't replace selection bar with inline row actions. It's deliberately a floating
  toolbar so multi-select feels persistent across scroll.
