# Reports — Design Spec

|                    |                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Prototype HTML** | `Brain/UI Design/Pages/Reports.html`                                                                                        |
| **Prototype JSX**  | `Brain/UI Design/Components/reports.jsx`, `reports-compare.jsx`                                                             |
| **Prototype CSS**  | `Brain/UI Design/Stylesheets/reports.css`                                                                                   |
| **Implementation** | `src/renderer/src/components/reports/ReportsPane.tsx`, `MultiCycleReport.tsx`, `export-csv.ts`, `export-multi-cycle-csv.ts` |
| **Tokens map**     | `Brain/UI Design/DESIGN-TOKENS.md`                                                                                          |
| **Patterns**       | `Brain/UI Design/DESIGN-PATTERNS.md`                                                                                        |

---

## Page intent

Two report modes:

1. **Single cycle** — a 5-stat row + a per-case status breakdown table for one cycle.
2. **Compare cycles** — a dot-grid showing P/F/B/U per case across N selected cycles + a per-cycle summary table.

A segmented control toggles between them. Both modes share the same picker pattern + Export CSV affordance.

---

## Layout

```
.rep-page             flex-1 flex flex-col min-h-0 overflow-hidden
└── .rep-scroll       flex-1 overflow-y-auto p-[22px_36px_48px]
    └── .rep-inner    max-w-[1080px] mx-auto   (wider than the 920px content max — reports need room)
        ├── .tc-back  breadcrumb
        ├── .rep-head h1 + p
        ├── RepSegments  (Single / Compare)
        └── pane-specific content
```

---

## Header

- **`.tc-back`** — same breadcrumb pattern as Plan Detail / Test Case
- **`.rep-head`**:
  - h1: `text-[24px] font-semibold tracking-[-0.02em] text-foreground mb-1`
  - p: `text-[13px] text-muted-foreground`
- **`.rep-tabs`** — segmented control (see DESIGN-PATTERNS.md → "Segmented control"):
  - `inline-flex bg-surface-1 border border-border rounded-md p-0.5 gap-px mt-1 mb-4.5`
  - Thumb: `absolute top-0.5 bottom-0.5 rounded-[5px] bg-white/[0.08]` with sliding transition
  - Segments: `bg-transparent px-3.5 py-1.5 text-[12.5px] font-medium`
    - active: `text-foreground`
    - inactive: `text-muted-foreground hover:text-foreground`

---

## Cycle picker (`.cycle-picker`)

Used in both modes (single = `<select>`, compare = chip bar). Same row layout:

```
flex items-center gap-3 flex-wrap mb-4.5
```

- `.lbl`: 11 / 600 / 0.08em uppercase / `text-[var(--fg-subtle)]` — "Cycle" / "Cycles"
- Either:
  - **Native `<select>`** (single mode), min-w-[280px], custom chevron via background-image. Same styling as test-case `.tc-select`.
  - **Chip bar** (compare mode) — see below.
- Spacer + **Export CSV** button (`.btn.subtle` with arrow icon)

### Chip tag (`.chip-tag`)

```
inline-flex items-center gap-2 h-7 pl-2.5 pr-1.5 rounded-full
bg-accent-tint border border-[rgba(139,92,246,0.22)]
text-[12px] text-foreground font-mono tracking-[0.02em]
```

Includes the cycle display_id as label, plus an 18px round X button on the right
(transparent → `bg-black/30 text-foreground` on hover).

### Add chip (`.add-chip`)

Dashed pill button:

```
inline-flex items-center gap-1.5 h-7 px-3 rounded-full
border-dashed border-[var(--border-strong)] bg-transparent
text-[11.5px] text-muted-foreground
hover: bg-white/[0.04] text-foreground
```

Click opens `AddCyclePopover` (a `.popover.left` showing remaining cycles).

---

## Single cycle mode

### Stat row (`.stat-row`)

```
grid grid-cols-5 gap-7 pt-3 pb-7 border-b border-border mb-7
```

Five stats: Total / Pass / Fail / Blocked / Unexecuted. Each:

- **`.label`**: 10.5 / 600 / 0.1em uppercase / `text-[var(--fg-subtle)]`
  - For status stats: leading 6px dot in matching color
- **`.num`**: 32 / 600 / -0.02em / tabular-nums / `text-foreground` / leading 1.1
  - Inline percent: `.num.pct` → 14 / muted, with 8px left margin
- **`.sub`**: 11.5 / `text-[var(--fg-subtle)]` — context line ("no defects", "of total", etc)

### Per-case breakdown (`.case-bd-table`)

A single bordered container with internal row separators:

```
border border-border rounded-lg bg-surface-1 overflow-hidden
```

`.case-bd-row`:

```
grid grid-cols-[auto_auto_1fr_auto_auto] gap-3.5 items-center
p-2.5 px-3.5 text-[12.5px]
hover: bg-white/[0.03]
+ between rows: border-t border-[var(--border-soft)]
```

Cells: status dot, ID (mono / 11.5 / subtle), name (truncate / `text-foreground`), version (mono / 10.5 / faint), when (11 / `text-[var(--fg-faint)]` / tabular-nums).

Section head above: standard h3 + "Sorted by execution order. Click an ID to open the case."

---

## Compare cycles mode

### Filter toolbar (`.toolbar-row`)

```
flex items-center gap-2 mb-3.5
```

Contains a smaller `RepSegments` (status filter: All / Differing / Has failures / Has blockers / Has unexecuted) + spacer + Export CSV button.

### Comparison grid (`.cmp-grid`)

Single container, 2.2fr lead column + 1fr min(60px) per cycle column:

```
border border-border rounded-lg bg-surface-1 overflow-hidden
```

- **`.cmp-thead`** (header row): `grid p-2.5 px-3.5 bg-white/[0.02] border-b border-border`
  - 10.5 / 600 / 0.08em uppercase / `text-[var(--fg-subtle)]`
  - Cycle columns show short ID (`'AUR-CY-042'.replace('AUR-', '')` → `CY-042`)
- **`.cmp-trow`** (per-case row): `grid p-2.5 px-3.5 border-t border-[var(--border-soft)]`
  - Hover: `bg-white/[0.03]`
  - Lead cell: `gap-2.5 justify-start text-foreground`; ID mono + truncate name
  - Status cells: `display: grid; place-items: center` with a `.cmp-dot`

### Status dot in compare grid (`.cmp-dot`)

```
relative size-5 rounded-full grid place-items-center
::after { content: ''; width: 9px; height: 9px; border-radius: 50%; }
```

- `.pass::after` / `.fail::after` / `.blocked::after` → matching `bg-*`
- `.unexec::after` → transparent + 1.5px inset shadow `var(--unexec)` (ring-only)
- Hover tooltip via `::before` content from `data-label` attribute:
  - Position above the dot, `bg-surface-3 border-border-strong rounded-sm px-1.5 py-0.75`
  - 10.5px text, white-space nowrap, z-5

### Per-cycle summary (`.cmp-sum`)

Same border-wrap as `.cmp-grid`. Row template: `1fr 80px 80px 80px 80px 240px`.

First row is the header (`bg-white/[0.02]`, 10.5/600/uppercase). Data rows:

- Lead: ID mono + name (font-medium foreground)
- Four numeric columns (`.n`): mono / tabular-nums / centered / 13px. Colored: `.n.pass` → `text-pass`, `.n.fail` → `text-fail`, etc.
- Last column (`.bar`): stacked progress bar (6px tall, `bg-white/[0.05]` track, P/F/B fills via i.pass/fail/blocked)

Section head above: "Cycle summary" + "P/F/B/U mix per cycle, with a stacked-bar visual."

---

## Empty / filtered-empty states

When the filter yields no rows:

```
p-9 text-center text-[var(--fg-subtle)] text-[12.5px]
```

Text: "No cases match this filter."

(No illustration here — keep it light; the user is one chip away from seeing data.)

---

## Add cycle popover (`AddCyclePopover`)

```
.popover.left  min-w-[280px], top: calc(100% + 6px)
```

Items use the standard `.menu-item` chrome (see Overlays). Each item:

- ID in `font-mono text-[11px] text-[var(--fg-subtle)] min-w-[76px]`
- Name takes `flex-1`
- Env pill at the end, 16px tall, 10px / px-1.5

Click-outside dismisses.

---

## Anti-patterns

- ❌ Don't add charts/graphs. The brief is dot-grid + numbers — sparser is more scanable.
- ❌ Don't use color to distinguish cycles in the compare table (no cycle-specific tints). Use dots to encode status, position to encode cycle. Mixing two color axes makes the grid unreadable.
- ❌ Don't render an empty state when 0 cycles are picked in Compare. Just show empty grid; the chip-bar already invites the user to add cycles.
- ❌ Don't lock Compare to exactly 2 cycles. The chip bar handles N (typically 3–5).
- ❌ Don't recompute percentages in the table cells. Compute totals once with `tally()`; render numbers, derive bar widths.
