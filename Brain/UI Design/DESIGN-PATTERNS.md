# Design patterns — reusable building blocks

Recurring patterns across `Brain/UI Design/` prototypes. Build the component **once** and reuse —
do not re-implement per screen, and do not invent a third variant when these exist.

If you find yourself building one of these freshly, stop and check `src/renderer/src/components/ui/`
to see if it's already there; if not, copy the prototype CSS into the component and add to this
catalogue.

---

## Buttons

Three variants in the prototype CSS (`project.css`). Match in code via `Button` component variants.

```
.btn          ↔ <Button variant="secondary">   surface-1 bg, border, fg
.btn.primary  ↔ <Button>                        primary bg, white text, no border
.btn.subtle   ↔ <Button variant="ghost">        transparent bg, fg-muted, hover bg-white/4
.btn.danger   ↔ <Button variant="destructive">  fail-soft bg, fail-border, light-red fg
```

All buttons: height `32px` (regular) / `28px` (compact), `text-[13px] font-medium`, `gap-1.5`,
`rounded-md`, `transition` 120ms ease-out.

## Ghost icon button (`.ghost-btn`)

- 28×28 or 32×32 square (`size-7` / `size-8`)
- `rounded-md`, transparent bg
- Hover: `bg-white/[0.05]`, text → foreground
- Used for "•••" dropdowns, theme toggle, close buttons

```tsx
<button
  className="inline-flex size-8 items-center justify-center rounded-md border border-transparent
                   bg-transparent text-muted-foreground transition-colors
                   hover:bg-white/[0.05] hover:text-foreground
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
>
  <MoreHorizontal className="size-4" />
</button>
```

---

## Pills & badges

### ID pill (case / cycle / plan display_id)

- `inline-flex items-center h-6 px-2 rounded-[5px]`
- bg: `var(--accent-soft)` with `1px solid rgba(139,92,246,0.18)`
- text: `font-mono text-[11.5px] font-medium text-violet-300` (`#c4b5fd`)
- Used on Test Case, Execution, Plan headers

### Eyebrow ID (in lists)

- `font-mono text-[11.5px] tracking-[0.04em] text-[var(--fg-subtle)]`
- No background

### Generic pill

- `inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full`
- bg `var(--surface-2)`, border `var(--border)`
- `text-[11.5px] text-muted-foreground`
- Mono variant: `font-mono text-[11px]`

### Env pill

- 20px tall, `rounded-full`, 11px medium
- Tints from env tokens (prod/stage/dev/local), 1px border in matching alpha
- Leading `::before` 5px dot in `currentColor`

### Count badge (on tabs)

- `font-mono text-[10.5px] font-medium`
- bg `rgba(255,255,255,0.04)`, border `var(--border)`, `rounded-full px-1.5 py-px`
- color `var(--fg-subtle)`

---

## Keyboard chip (`.kbd`)

Already provided as `.kbd` utility class in `main.css` — **reuse, don't re-implement**.

```tsx
<span className="kbd">⌘K</span>
<span className="kbd dim">⌘</span>     // 55% opacity variant
```

---

## Status dots & rows

Two dot styles depending on context:

| Variant                          | Style                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Filled (sidebar list, breakdown) | `size-2 rounded-full bg-{status}`                                             |
| Ring-only (unexec, legend)       | `size-2 rounded-full bg-transparent shadow-[inset_0_0_0_1.5px_var(--unexec)]` |
| Pulse on apply                   | add `anim-dot-pulse` for 280ms                                                |

Status row left-border accent (Execution sidebar, case rows):

- `border-l-[3px] border-transparent`
- Active: `border-l-primary bg-accent-soft`
- On transition: `anim-outline-pulse` 500ms

---

## Stacked progress bar

Used everywhere a P/F/B/U breakdown is shown.

```tsx
<div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden flex">
  <i className="h-full bg-pass" style={{ width: `${pct.pass}%` }} />
  <i className="h-full bg-fail" style={{ width: `${pct.fail}%` }} />
  <i className="h-full bg-blocked" style={{ width: `${pct.blocked}%` }} />
  {/* unexec fills the remainder visually (transparent track shows through) */}
</div>
```

Number readout next to it: `font-mono text-[11.5px] text-muted-foreground tabular-nums`,
format `{done}/{total}` with the `/` and total at 50% opacity if needed.

---

## Sliding tab bar (`TabBar` / `RepSegments`)

Two variants:

**Underline tabs** (Project Detail) — already implemented as `SlidingTabBar` in
`src/renderer/src/components/projects/ProjectDetail.tsx`. Reuse this. Specs:

- 38px tall, 14px horizontal, 13px text, weight 500 (600 when selected)
- Indicator: 2px tall bar at `bottom-[-1px]`, `bg-primary`, `rounded-[1px]`
- Transition: `left 200ms var(--ease-out-back), width 200ms var(--ease-out-back)`

**Segmented control / thumb tabs** (Reports) — 6px-padded pill container with a sliding
white/8% thumb beneath the active option:

- Container: `inline-flex bg-surface-1 border border-border rounded-md p-0.5 gap-px`
- Thumb: `absolute top-0.5 bottom-0.5 rounded-[5px] bg-white/[0.08]`
- Segments: `bg-transparent px-3.5 py-1.5 text-[12.5px] font-medium`
- Same `left/width` transition as above

---

## Section heads

The standard h3 + helper pattern (Test Case, Plan Detail, Reports):

```tsx
<div className="flex items-baseline gap-3 mb-3.5">
  <h3 className="text-sm font-semibold tracking-[-0.005em] text-foreground">Schedule</h3>
  <span className="text-xs text-[var(--fg-subtle)]">Working days exclude weekends.</span>
  {count != null && <span className="font-mono text-[11px] text-[var(--fg-faint)]">{count}</span>}
  <div className="ml-auto">{/* right-side actions */}</div>
</div>
```

`hr.tc-divider` between sections = `h-px bg-border my-7 border-0`.

---

## Inputs

Single source: `.tc-input`, `.tc-textarea`, `.tc-select` in `test-case.css` and `.frow .input` in `overlays.css`.

```
bg: var(--surface-1)
border: 1px solid var(--border)
radius: var(--radius-md)
text: 13.5px, var(--fg)
padding: 8px 10px (input) / 0 10px (height-fixed)
hover: border-color var(--border-strong)
focus: border-color var(--accent-ring), bg var(--surface-2)
placeholder: var(--fg-faint)
```

→ Match in code via shadcn `Input` + `Textarea` (already wired). If you need a `select`, use
the `Select` component, not a raw `<select>`, **unless** the design specifically uses the
native dropdown with a custom chevron (see Test Case → Subcategory, Reports → Cycle picker).

Search input with pulse line: see `.search-input` in `project.css`.

---

## Cards

Two patterns:

**Stat card** (Projects list, Plan rows, Cycle rows, Type rows):

- `bg-surface-1 border border-border rounded-md p-4`
- Hover: `border-border-strong bg-surface-2`

**Dashed empty/CTA card** (`.idx-empty`, `.coming`, `.add-task`, `.add-step`):

- `border border-dashed border-[var(--border-strong)] rounded-lg p-12 text-center`
- Hover (when interactive): `bg-accent-soft border-accent-ring`

---

## Dialogs

`.dialog` (AlertDialog — 440px) and `.fdialog` (form dialog — 520px / lg=640px).

- Surface: `bg-surface-2 border border-[var(--border-strong)] rounded-lg`
- Shadow: dialog shadow from `DESIGN-TOKENS.md` §6
- Overlay: `bg-[rgba(5,5,7,0.6)] backdrop-blur-[4px]`
- Animation: `anim-dialog-in` on dialog, `anim-dialog-overlay` on scrim
- Footer: `border-t border-border, p-4 px-5.5, gap-2, justify-end`

Use shadcn `AlertDialog` / `Dialog` primitives, then override styles to match.

---

## Toast (sonner)

Already wired via `sonner`. Match visual:

- bottom-right, 24px from edge
- `bg-surface-2 border border-[var(--border-strong)] rounded-md`
- `text-[12.5px]`, max 320px wide
- 12px 32px 0.45 alpha shadow
- `anim-toast-in` (200ms)

---

## Saved / saving indicator

Inline "Saved Xs ago" / "Saving…" caption used on Test Case + Execution:

- 11.5px, `text-[var(--fg-subtle)]`
- 6px dot, `bg-pass` with `0 0 8px var(--pass)` glow when idle
- When saving: dot → `bg-blocked`, same glow, `anim-saving-pulse` 700ms infinite

---

## Selection action bar (`.selbar`)

Floating toolbar bottom-right of `.tab-pane`, appears when N rows selected:

- `position: absolute, right: 6, bottom: 6`
- `bg-surface-2 border-border-strong rounded-lg`, selection bar shadow
- 6px padding, 14px left padding (so count text breathes)
- Icon buttons: 28×28 square, transparent → `bg-white/[0.06]` hover
- Danger button: `text-red-300`, hover `bg-fail-soft text-red-200`
- Vertical separator: 1px × 18px from `var(--border)`, margin 2px
- Entrance: `anim-selbar-in` 200ms

---

## Drag handle

Six-dot SVG (10×14, two columns × three rows of 1.2r circles). Always:

- `cursor: grab` (`grabbing` while active)
- `color: var(--fg-faint)` → `var(--fg-muted)` on hover
- `bg-white/[0.04]` hover background, `rounded-sm`

---

## Numeric input with unit

(Plan Detail tasks, anywhere with "days" unit)

```
.dur                    ↔ container, 26px tall, var(--surface-2) bg, border, rounded-sm
.dur input              ↔ flush-right, font-mono, tabular-nums, transparent bg
.dur .unit              ↔ 8px padding, 10.5px, var(--fg-subtle), border-left
```

---

## Don't reinvent

Things that already exist in `src/renderer/src/components/ui/`:

- Button, Card, Dialog, AlertDialog, Dropdown, Popover, Select, Tabs, Form, Input, Label, Separator, Command (cmdk)

Things that already exist as utilities in `main.css`:

- `.kbd`, `.mono`, `.eyebrow`, `.scrollbar-thin`
- All `anim-*` animation utilities

Things that already exist as components in `src/renderer/src/components/`:

- `KbdShortcutsOverlay`, `SettingsMenu`, `UpdateBanner`, `command-palette`, `theme-toggle`
- `SlidingTabBar` (inside `ProjectDetail.tsx`) — extract before reusing
