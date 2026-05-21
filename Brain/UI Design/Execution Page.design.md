# Execution Page — Design Spec

|                    |                                                                 |
| ------------------ | --------------------------------------------------------------- |
| **Prototype HTML** | `Brain/UI Design/Pages/Execution Page.html`                     |
| **Prototype JSX**  | `Brain/UI Design/Components/execution.jsx`                      |
| **Prototype CSS**  | embedded as `EXEC_STYLES` in `execution.jsx` (no separate file) |
| **Implementation** | `src/renderer/src/components/execution/ExecutionPage.tsx`       |
| **Tokens map**     | `Brain/UI Design/DESIGN-TOKENS.md`                              |
| **Patterns**       | `Brain/UI Design/DESIGN-PATTERNS.md`                            |

---

## Page intent

**The hero screen.** Two-pane layout: a sticky case-list sidebar + the active case content
with a fixed status bar at the bottom. Keyboard-driven (P/F/B/U + arrows + N for next-failed).
Status changes feel instant — optimistic UI with dot pulse + next-row outline pulse.

This page sets the polish bar for the rest of the app.

---

## Layout

```
.exec-root                   flex-1 min-h-0 grid grid-cols-[320px_1fr]
                             (288px sidebar < 1180px, 256px < 980px)
├── aside.exec-sidebar       border-r border-border bg-white/[0.015]
│   ├── .sb-head             cycle name + progress + legend, border-b
│   ├── .sb-filter           All / Open / Issues chips, border-b
│   ├── .sb-list             flex-1 overflow-y-auto, the assignment rows
│   └── .sb-foot             Next failed + Jump (⌘K) buttons, border-t
└── section.exec-main        flex flex-col, no internal scroll on root
    ├── .case-head           topline + h1 + subline, border-b
    ├── .case-body           flex-1 overflow-y-auto, the case content
    └── .status-bar          nav arrows + P/F/B/U keys, border-t
```

The sidebar list is the only scroller in the sidebar; the case body is the only scroller in the main pane. The status bar is fixed to the bottom of the right pane.

---

## Sidebar

### Head (`.sb-head`) — `p-4 px-4.5 border-b border-border`

- **Cycle name:** 13 / 600 / -0.005em / `text-foreground`, truncate
- **Meta line:** `flex items-center gap-1.5 text-[11.5px] text-[var(--fg-subtle)] mb-3.5`
  Format: `{display_id mono text-muted} · {build mono text-muted truncate}`
- **Progress** (`.progress`): `flex items-center gap-2.5`
  - 6px stacked P/F/B bar (see DESIGN-PATTERNS.md → "Stacked progress bar")
  - Number readout: `done` in `text-foreground tabular-nums` then `/{total}` at 50% opacity
- **Legend** (`.sb-legend`): `grid grid-cols-4 gap-2 mt-3`. Each cell:
  - 7px dot (filled or ring-only for unexec)
  - Label 10.5px / `text-[var(--fg-subtle)]`
  - Count mono / tabular-nums / `text-foreground` at the end

### Filter chips (`.sb-filter`) — `flex gap-1 p-2.5 px-3 border-b border-border`

3 equal-width chips, each:

```
flex-1 h-6 flex items-center justify-center gap-1.5
text-[11.5px] text-muted-foreground
rounded-md border border-transparent transition
hover: bg-white/[0.04] text-foreground
active: bg-white/[0.06] text-foreground border-border-strong
```

Count suffix: mono / 10.5px / opacity 0.6.

Filters: `all` → all items, `unexec` → only `status === 'unexec'`, `failing` → `fail | blocked`.

### Assignment row (`.sb-row`)

```
relative grid grid-cols-[auto_auto_1fr_auto] gap-2.5 items-center
p-2 px-4.5 pl-4.25
border-l-[3px] border-transparent
cursor-pointer transition
```

States:

- Hover: `bg-white/[0.03]`
- Active: `bg-accent-soft border-l-primary`
  - Active row's ID becomes `text-[var(--fg-muted)]`, name becomes `text-foreground font-medium`
- Flashing (just-applied target): `anim-outline-pulse` 500ms

Cells:

- **Status dot** (`.dot`): 8px, status-colored or ring-only for unexec.
  When applying a status: add `.pulse` → `anim-dot-pulse` 280ms.
  Set `--flash` CSS var to matching `*-flash` token for the dot pulse.
- **ID** (`.row-id`): font-mono 11 / `text-[var(--fg-subtle)]`
- **Name** (`.row-name`): 12.5 / `text-[var(--fg-muted)]` truncate
- **Version** (`.row-ver`): font-mono 10 / `text-[var(--fg-faint)]`

Auto-scroll: when `activeId` changes, smooth-scroll the active row into view (only if it's
outside the parent's visible band by 20px). Implementation: see prototype's
`useEffect` on `activeId`.

### Foot (`.sb-foot`) — `flex gap-1.5 p-2.5 px-3 border-t border-border`

Two equal buttons:

```
flex-1 h-7 inline-flex items-center justify-center gap-1.5
bg-white/[0.03] border border-border rounded-md
text-[11.5px] text-muted-foreground
hover: bg-white/[0.06] text-foreground
```

Each with leading 13px icon and trailing `.kbd` chip (`N` and `⌘K`).

---

## Main pane

### Case head (`.case-head`) — `flex-shrink-0 p-4.5 px-8 pb-3.5 border-b border-border`

Stack with `gap-2.5`:

1. **Topline** (`flex items-center gap-2.5 text-[12px] text-[var(--fg-subtle)]`):
   `{Category} › {Subcategory}` with `›` in `var(--fg-faint)`
2. **h1**: 22 / 600 / -0.015em / leading 1.25 / `text-foreground`, text-wrap pretty
3. **Subline** (`flex items-center gap-2.5 mt-0.5`):
   - ID pill (see DESIGN-PATTERNS.md)
   - Version pill (`.pill.mono`)
   - Meta strip (`flex items-center gap-2 text-[11.5px] text-[var(--fg-subtle)]`):
     `· Last run {when}` OR `· Unexecuted`
     If `notes saved`: append `.saved` indicator with `anim-saved-fade`
   - Right side: `.ghost-btn.square` for "..." menu

### Case body (`.case-body`) — `flex-1 min-h-0 overflow-y-auto p-5.5 px-8 pb-6`

The body fades up on case change (`.case-fade` = 200ms slideUp + fade). Use `key={activeId}`
on the wrapper to force the animation.

#### Section structure (`.section`)

`mb-7.5`. Section title is small + uppercase (different from Plan / Test Case sections):

```
text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--fg-subtle)]
flex items-center gap-2 mb-3
```

Count suffix: `font-mono text-[10.5px] text-[var(--fg-faint)]`.

#### Description block (`.prose`)

- 14 / 1.6 / `text-muted-foreground` / `max-w-[64ch]` / text-wrap pretty
- `<strong>` → `text-foreground font-semibold`
- Inline `<code>`: font-mono 12.5, `bg-white/[0.05] border border-border rounded-sm px-1`

A `richText()` helper parses `code` markers from plain strings (see prototype).

#### Steps (`.steps`)

Borderless rounded-lg container with internal 1px gridlines (bg-border + 1px gap trick):

```
flex flex-col gap-px bg-border rounded-lg overflow-hidden max-w-[920px]
```

Each `.step` row:

```
grid grid-cols-[36px_1fr_1fr] gap-0 bg-background py-3.5
odd:bg-white/[0.012]
```

- **`.num`** column: just centers a 22px-circle:
  ```
  size-5.5 rounded-full grid place-items-center
  bg-white/[0.04] border border-[var(--border-strong)] text-muted-foreground
  font-mono text-[11px] font-medium
  ```
  (Unlike Test Case step numbers, these are subtle gray — they're labels, not status.)
- **`.col`** (Action / Expected): `px-4.5`, with `border-l border-border` on the second one.
  - `.col-label`: 10.5 / 600 / 0.08em uppercase / `text-[var(--fg-faint)]` / `mb-1.5`
  - `.col-body`: 13.5 / 1.55 / `text-foreground`

#### Expected result (`.expected-card`)

Single highlight card after the steps:

```
bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.16)] rounded-lg
p-3.5 px-4.5 max-w-[920px]
flex items-start gap-3
```

- 18px round marker in `bg-accent-soft text-[var(--accent-hover)]` with a check icon
- Body: 13.5 / 1.55 / `text-foreground`

#### Notes (`.notes-area`)

```
w-full max-w-[920px] min-h-[96px] resize-vertical
bg-surface-1 border border-border rounded-lg p-3 px-3.5
text-[13.5px] leading-[1.55] text-foreground
hover: border-border-strong
focus: border-accent-ring bg-surface-2
placeholder: text-[var(--fg-faint)]
```

Auto-save: 600ms after last keystroke, set `savedAt = Date.now()`. The `.saved` chip in
the subline then fades for 2.4s.

---

## Status bar (`.status-bar`)

```
flex-shrink-0 flex items-center gap-3
p-3.5 px-8 border-t border-border bg-white/[0.012]
```

### Nav group (left, `mr-auto`)

- `.nav-arrow` × 2: 32×32 with chevrons (see DESIGN-PATTERNS.md → ghost icon). Disabled state opacity 0.4.
- `.nav-pos`: `font-mono text-[12px] text-[var(--fg-subtle)] px-1`. Format: `{n} / {total}`.

### Status keys (right side, status-keys group)

Four buttons (`.skey`), 36px tall, with status dot + label + `.key-chip` (matches `.kbd`):

```
inline-flex items-center gap-2.5 h-9 px-3 pl-3.5 rounded-md
bg-surface-2 border border-[var(--border-strong)]
text-[13px] font-medium text-foreground
hover: bg-surface-3
active: translate-y-[0.5px]
```

Per-status:

- `.pass .dot` → `bg-pass`
- `.fail .dot` → `bg-fail`
- `.blocked .dot` → `bg-blocked`
- `.unexec .dot` → transparent + 1.5px inset shadow `var(--unexec)`

`.skey.is-current` (matching the active case's status):

- `border-accent-ring`
- For pass/fail/blocked: matching tinted bg + matching color border (`pass-soft` + 40% pass, etc.)
- For unexec: no tint (it's the reset state)

Key chips:

```
font-mono text-[10px] leading-none
bg-white/[0.05] border border-[var(--border-strong)] border-b-[rgba(255,255,255,0.18)]
rounded-[3px] px-1.5 py-0.75
```

The key chip dims to 50% opacity while the button is hovered.

---

## Keyboard contract

```
P    apply Pass
F    apply Fail
B    apply Blocked
U    apply Unexecuted (reset)
←/↑  previous case (within current filter)
→/↓  next case (within current filter)
N    jump to next failed case (across full list, wraps)
⌘K   open command palette
?    open shortcuts overlay
```

Don't fire shortcuts when focus is in an input/textarea. The prototype's `onKey` handler is the source of truth.

---

## Status-apply choreography

When a status key fires:

1. Update the active item's `status` and `executed_at: 'just now'`.
2. Set `pulsingDot = active.id` for 320ms (`anim-dot-pulse` on the sidebar dot).
3. After a 140ms gap, move active to the next item in the **filtered** list (fall back to previous if at end).
4. The new active row gets `flashRow = next.id` for 500ms (`anim-outline-pulse` on its row).

The 140ms delay lets the user see their action land before the focus shifts.

---

## Anti-patterns

- ❌ Don't make the status bar scroll with the case body. It's fixed; the case body has its own scroll.
- ❌ Don't change pane widths on case selection. The 320px sidebar is constant.
- ❌ Don't use shadcn's default focus ring (blue 2px). Status buttons use `border-accent-ring` instead; they're styled to feel like primary inputs.
- ❌ Don't hide the keyboard chips on the status buttons. They teach the shortcuts — that's how P/F/B/U usage becomes muscle memory.
- ❌ Don't lose the `key={active.id}` on `.case-body`. Re-mounting drives the `caseFade` animation.
- ❌ Don't switch the sidebar to virtual scrolling unless a cycle exceeds ~500 cases. Native scroll preserves the smooth-scrollIntoView behavior.
- ❌ Don't add a "Save notes" button. Notes auto-save on debounce.
- ❌ Don't repurpose `pass`/`fail`/`blocked` colors for anything outside execution status (e.g. "validation error" → use a neutral muted text, not red).
