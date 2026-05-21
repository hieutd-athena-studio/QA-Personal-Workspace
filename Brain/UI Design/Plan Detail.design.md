# Plan Detail — Design Spec

|                    |                                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prototype HTML** | `Brain/UI Design/Pages/Plan Detail.html`                                                                                                              |
| **Prototype JSX**  | `Brain/UI Design/Components/plan-detail.jsx`                                                                                                          |
| **Prototype CSS**  | `Brain/UI Design/Stylesheets/plan-detail.css` (+ shared `project.css`, `test-case.css`)                                                               |
| **Implementation** | `src/renderer/src/components/plans/TestPlanForm.tsx`, `cycles/TestCyclesPanel.tsx`, `cycles/NewCycleDialog.tsx`, `cycles/ManageAssignmentsDialog.tsx` |
| **Tokens map**     | `Brain/UI Design/DESIGN-TOKENS.md`                                                                                                                    |
| **Patterns**       | `Brain/UI Design/DESIGN-PATTERNS.md`                                                                                                                  |

---

## Page intent

Edit one test plan + browse its cycles in a single scrolling document. Inline-editable
plan name + description + schedule, with a tasks editor that tallies against a working-day
budget. Cycles list lives at the bottom.

---

## Layout

```
.plan-page                  flex-1 flex flex-col min-h-0 overflow-hidden
└── .plan-scroll            flex-1 overflow-y-auto p-[22px_36px_64px]
    └── .plan-inner         max-w-[920px] mx-auto
        ├── .tc-back        breadcrumb
        ├── .plan-head      ID pill + inline-editable h1
        ├── Description section
        ├── tc-divider
        ├── Schedule section (date range + budget card)
        ├── tc-divider
        ├── Tasks section (editable list)
        ├── tc-divider
        └── TestCyclesPanel
```

---

## Breadcrumb (`.tc-back`)

Shared across Plan Detail, Test Case, Reports.

```
inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-subtle)] mb-4
hover: text-foreground
```

Structure: `‹ {project.name} › {Here}`. The `›` separator is `text-[var(--fg-faint)]`,
"Here" is `text-[var(--fg-muted)]`.

## Plan header (`.plan-head`)

- **ID pill** (`.pid-pill`):
  ```
  inline-flex items-center gap-1.5 mb-2.5
  font-mono text-[11.5px] text-[var(--fg-subtle)]
  bg-white/[0.03] border border-border rounded-sm px-2 py-px
  ```
- **Inline-editable title** (`.h1-input`):
  ```
  w-full bg-transparent border-0 outline-none
  text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground
  px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded-md
  hover:bg-white/[0.03]
  focus:bg-surface-1 focus:shadow-[inset_0_0_0_1px_var(--accent-ring)]
  ```

Same pattern reused for `.tc-head .h1-input` on Test Case (only sizing changes — it's
already the same 26px). Use one `<InlineHeading>` component for both.

---

## Section structure (`.plan-section`)

Each section: `mb-7.5`. Section heads use the standard layout (`DESIGN-PATTERNS.md`):

```tsx
<div className="flex items-baseline gap-3 mb-3.5">
  <h3>Schedule</h3>
  <span className="helper">Working days exclude weekends.</span>
  <div className="ml-auto">{/* actions */}</div>
</div>
```

Section divider: `<hr className="tc-divider" />` = `h-px bg-border my-7 border-0`.

---

## Description section

Just a `<textarea>` with `.tc-textarea` styling, `rows={3}`, `max-width: 720px`.

---

## Schedule section

```
.dates-grid    grid grid-cols-[1fr_200px] gap-4.5 items-end
               (collapses to 1 col below 760px)
```

### Date trigger button (`.date-trigger`)

```
inline-flex items-center gap-2 h-[34px] px-3
bg-surface-1 border border-border rounded-md
text-[13px] text-foreground tabular-nums
hover: border-border-strong
```

Leading 13px clock icon, trailing chevron-down at 12px with `text-[var(--fg-faint)]`.
Label format: `Apr 12, 2026 → May 03, 2026` or `Pick a date range`.

### Date range popover (`.cal`)

See `overlays.css`. Two months side-by-side, 7-col day grid, with `.cal-preset`
quick-range buttons at the bottom (Last 7, Next 14, This sprint…). Range-selection
visuals (start, end, in-range) are tokenized via `--accent` and `--accent-tint`.

### Budget card (`.budget-card`)

```
bg-surface-1 border border-border rounded-md p-3 px-3.5
```

- Label (`.lbl`): 10.5 / 600 / 0.08em uppercase
- Total: 22 / 600 (or 18 when used as task-total inline)
- "/ N days" suffix in `text-[var(--fg-subtle)] text-[12px]`
- 4px progress bar at the bottom (8px margin-top)
- `.over` modifier flips the bar fill and total color to `var(--fail)`

---

## Tasks section

Right-side action: an inline-compact `.budget-card` showing Total vs Budget so the user sees
overflow immediately. Switch `.over` modifier when `total > workingDays`.

### Task row (`.task-row`)

```
grid grid-cols-[22px_1fr_110px_28px] gap-2.5 items-center
p-2 px-3 pl-1.5
bg-surface-1 border border-border rounded-md
gap-1.5 between rows
hover: border-border-strong
```

- **Drag handle** (`.handle`): six-dot SVG (see `DESIGN-PATTERNS.md` → Drag handle)
- **Name input** (`.tname`): transparent bg, 13px; focus surface-2 + accent ring
- **Duration** (`.dur`): 26px tall, mono input, "days" unit suffix — see DESIGN-PATTERNS.md
- **Remove** (`.trm`): 26px square ghost, `text-[var(--fg-faint)]`, hover `text-red-300 bg-fail-soft`

### Add task button (`.add-task`)

```
h-8 w-full justify-center
border-dashed border-[var(--border-strong)] rounded-md
text-[12.5px] text-muted-foreground
hover: bg-accent-soft border-accent-ring text-foreground
```

`step="0.25"` on the duration number input. UI enforces 0.25-day granularity but doesn't
silently round — let users see what they typed and reject below 0 in onChange.

---

## TestCyclesPanel

Section head: "Test cycles" + count + helper ("Each cycle is one execution of this plan
against a specific build.") + "+ New cycle" primary button.

### Cycle card (`.cycle-card`)

```
grid grid-cols-[auto_1fr_auto] gap-4.5 items-center
p-3.5 px-4
bg-surface-1 border border-border rounded-md
hover: border-border-strong bg-surface-2
mb-2.5 between cards
```

- **Cycle ID** (`.cycid`): same as plan ID pill (see above)
- **Name + meta + progress** stack:
  - Name (14 / 500) + env-pill inline (see `DESIGN-PATTERNS.md`)
  - Meta line: `build mono text-foreground` · `text-[var(--fg-faint)] ·` · `Tester {name}`
  - Progress bar (240px min) + `done/total` mono readout
- **Actions** (right): `Manage cases` subtle, `Execute` primary, `ghost-btn.square` delete

---

## NewCycleDialog

`.fdialog` (520px). See `Overlays.design.md` for `.fdialog` chrome.

Form rows (`.frow`):

1. Name (input)
2. Environment (select: Production / Staging / Dev / Local)
3. Build (input.mono)
4. (optional) Notes (textarea)

Footer: `Cancel` subtle (left of secondary)... actually right-side: `Cancel` then `Create cycle` primary.

---

## ManageAssignmentsDialog

`.fdialog.lg` (640px). Title shows cycle ID + name, subtitle clarifies pick mode.

Body: `.cklist` (checklist):

- Search/filter header (`.ckhead`): summary count (`{n} of {total} selected`) right-aligned in mono.
- Body: `.ckbody` 320px max-height scroller of `.ckitem` rows. Each row has a checkbox
  (same as Project Detail case row), ID pill (mono), name (truncate), and category sub-meta.
- Selected items get `bg-accent-tint`.

---

## Anti-patterns

- ❌ Don't surface task durations as sliders. Plain number inputs let users type fast.
- ❌ Don't validate-and-clamp the task total to the budget. The over-budget badge IS the validation. Users can deliberately go over.
- ❌ Don't replace the inline-editable h1 with a "edit" button + form. The whole point of this page is direct manipulation.
- ❌ Don't recreate the calendar from scratch. Use the existing `.cal` styling and structure; the range-selection rendering (start/end/in-range modifiers) is non-trivial.
- ❌ Don't hide cycle progress numbers. The `{done}/{total}` readout is what tells the user a cycle is mid-flight vs untouched.
