# Overlays — Design Spec

|                    |                                                               |
| ------------------ | ------------------------------------------------------------- |
| **Prototype HTML** | `Brain/UI Design/Pages/Overlays.html` (showcase page)         |
| **Prototype JSX**  | `Brain/UI Design/Components/overlays.jsx`, `overlays-app.jsx` |
| **Prototype CSS**  | `Brain/UI Design/Stylesheets/overlays.css`                    |
| **Implementation** | Various — see "Component map" below                           |
| **Tokens map**     | `Brain/UI Design/DESIGN-TOKENS.md`                            |
| **Patterns**       | `Brain/UI Design/DESIGN-PATTERNS.md`                          |

---

## What this is

A **catalogue page**, not a feature page. Shows every shared overlay/dialog/popover so the
visual contract is in one place. Each card on the showcase opens its overlay.

If you're building a new dialog, popover, picker, or banner: **start here** to find the
matching shape, not from scratch.

---

## Component map

| Component                         | Prototype CSS class                            | Code home                                                                                           |
| --------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| AlertDialog (destructive confirm) | `.dialog`                                      | `src/renderer/src/components/ui/alert-dialog.tsx`                                                   |
| Form dialog                       | `.fdialog` / `.fdialog.lg`                     | `src/renderer/src/components/ui/dialog.tsx`                                                         |
| Popover (menus, dropdowns)        | `.popover`                                     | `src/renderer/src/components/ui/popover.tsx`, `dropdown-menu.tsx`                                   |
| Date range picker                 | `.cal`, `.cal-grid`, `.cal-day`, `.cal-preset` | (build in `plans/` when needed)                                                                     |
| Update banner                     | `.update-banner`                               | `src/renderer/src/components/UpdateBanner.tsx`                                                      |
| Keyboard shortcuts overlay        | `.kbd-overlay`                                 | `src/renderer/src/components/KbdShortcutsOverlay.tsx`                                               |
| Theme toggle (segmented)          | `.theme-segment`                               | `src/renderer/src/components/theme-toggle.tsx`                                                      |
| Theme toggle (icon)               | `.theme-icon`                                  | `src/renderer/src/components/theme-toggle.tsx`                                                      |
| Color picker block                | `.color-block`, `.preset-row`                  | `src/renderer/src/components/projects/NewProjectDialog.tsx`                                         |
| Checklist (assignment)            | `.cklist`, `.ckitem`                           | `src/renderer/src/components/cycles/ManageAssignmentsDialog.tsx`, `types/ManageTypeCasesDialog.tsx` |
| Toast                             | `.toast`                                       | via `sonner`                                                                                        |
| Selection action bar              | `.selbar`                                      | inside cases pane                                                                                   |
| Command palette                   | `.palette`                                     | `src/renderer/src/components/command-palette.tsx`                                                   |

---

## Form dialog (`.fdialog`)

The standard dialog for any form heavier than a yes/no confirm.

```
width: 520px (lg: 640px); max-width: calc(100% - 48px)
max-height: calc(100% - 64px)
bg-surface-2 border border-[var(--border-strong)] rounded-lg
box-shadow:
  0 0 0 1px rgba(255,255,255,0.04),
  0 24px 60px rgba(0,0,0,0.55)
display: flex flex-col
anim-dialog-in
```

### Head (`.fdialog-head`)

```
p-4.5 px-5.5 pt-4.5 pb-1  flex-shrink-0
  h3   text-[16px] font-semibold tracking-[-0.005em] text-foreground mb-1
  p    text-[12.5px] text-muted-foreground (subtitle)
```

### Body (`.fdialog-body`)

```
p-4 px-5.5  flex-1 min-h-0 overflow-y-auto
```

### Foot (`.fdialog-foot`)

```
p-3.5 px-5.5 pb-4.5  flex items-center gap-2 justify-end
border-t border-border  flex-shrink-0
```

Optional `.left` element: pushed to the left via `mr-auto`, 11.5 / `text-[var(--fg-subtle)]` (used for keyboard hints like "↵ to create").

### Form rows (`.frow`)

```
flex flex-col gap-1.5 mb-3.5  (mb-0 on last)
  label  11 / 600 / 0.06em uppercase / text-[var(--fg-subtle)]
  hint   11 / text-[var(--fg-faint)]
  input/textarea/select  see DESIGN-PATTERNS.md → Inputs
.row-2   flex-direction: row; children flex-1
```

---

## AlertDialog (`.dialog`)

Smaller, focused on destructive yes/no. Already covered in `Test Case.design.md` — repeat
of the key spec:

```
width: 440px  max-w-[calc(100%-48px)]
bg-surface-2 border-[var(--border-strong)] rounded-lg
anim-dialog-in

body: p-5.5 pb-1.5 flex gap-3.5 items-start
  icon  size-9 rounded-full bg-fail-soft text-fail
  text  h3 (15/600) + p (13/muted, line-height 1.55)
foot: p-4 px-5.5 pb-4.5 flex gap-2 justify-end
```

Confirm action = destructive variant; cancel = subtle/secondary.

---

## Popover (`.popover`) and dropdown menu

```
absolute top-[calc(100%+6px)] z-50 min-w-[220px]
bg-surface-2 border-[var(--border-strong)] rounded-md
shadow-[0_0_0_1px_rgba(255,255,255,0.04),_0_14px_36px_rgba(0,0,0,0.45)]
p-1  anim-pop-in
.left { right: 0; transform-origin: top right }
.right { left: 0; transform-origin: top left }
```

### Menu item (`.menu-item`)

```
flex items-center gap-2.5 p-1.75 px-2.5 rounded-[5px]
text-[13px] text-foreground
hover/active: bg-white/[0.06]
.right  ml-auto font-mono text-[10.5px] text-[var(--fg-subtle)]   ← for kbd hints
.check  size-3.5 rounded-[3px] border-[1.2px] border-[var(--border-strong)]
.check.on  bg-primary border-primary text-white
.danger  text-red-300; hover bg-fail-soft
```

### Menu label (`.menu-label`)

Section header inside a popover:

```
p-1.5 px-2.5 pt-1.5 pb-0.5
text-[10px] font-semibold tracking-[0.08em] uppercase
text-[var(--fg-subtle)]
```

### Menu separator (`.menu-sep`)

`h-px bg-border my-1`.

---

## Date range picker (`.cal`)

Two months side by side:

```
grid grid-cols-2 gap-5 p-3 px-3.5 pb-3.5 user-select-none
```

Per month (`.cal-month`):

- Head: `flex items-center justify-between mb-2 text-[12.5px] font-semibold text-foreground`
  - Nav arrows on right: 22×22 ghost buttons
- Day-of-week labels (`.cal-dow`): 10 / 600 / 0.06em / center / `text-[var(--fg-subtle)]`
- Day grid (`.cal-grid`): `grid grid-cols-7 gap-0.5`
- Day cell (`.cal-day`): 26px tall, 12 / `text-[var(--fg-muted)]` / centered / tabular-nums
  - `.dim` (other month) → `text-[var(--fg-faint)]`
  - Hover: `bg-white/[0.06] text-foreground`
  - `.today` → `inset 0 0 0 1px var(--accent-ring)`
  - `.in-range` → `bg-accent-tint text-foreground rounded-none`
  - `.range-start` / `.range-end` → `bg-primary text-white rounded-[5px]`
    - With `.has-end` or `.has-start` modifier, corner-round to chain into in-range

Presets bar (`.cal-preset`) at the bottom, separated by 1px border:

```
flex gap-1.5 flex-wrap p-2 px-3.5 pt-2 pb-3 border-t border-border
```

Each preset: 24px tall pill, `bg-white/[0.03]`, border, 11.5px, hover `bg-white/[0.06]`.

### Date trigger (`.date-trigger`)

```
inline-flex items-center gap-2 h-[34px] px-3
bg-surface-1 border border-border rounded-md
text-[13px] text-foreground tabular-nums
hover: border-border-strong
.arrow  text-[var(--fg-faint)]
```

---

## Update banner (`.update-banner`)

```
relative flex items-center gap-3 p-2.5 px-4
bg-accent-tint border-b border-[rgba(139,92,246,0.18)]
text-[12.5px] text-foreground
```

- 22×22 icon block (`bg-accent-soft text-[var(--accent-hover)]` round)
- Message (`flex-1`): bold lead in 600 + rest at normal weight
- Actions (`.actions`): right side, gap-1.5
- Progress line (`.progress-line`): absolute bottom 0, `h-0.5 bg-primary`, animates `width` to indicate download progress (linear, `var(--motion-slow)`)

---

## Keyboard shortcuts overlay (`.kbd-overlay`)

```
width: 680px  max-w-[calc(100%-48px)]  max-h-[calc(100%-64px)]
bg-surface-2 border-[var(--border-strong)] rounded-lg
shadow-[0_24px_60px_rgba(0,0,0,0.55)]
flex flex-col anim-dialog-in
```

- Header (`flex items-center p-4 px-5.5 pt-4 pb-3 border-b border-border`): h3 14/600 + close button right
- Grid (`grid grid-cols-2 gap-y-7 gap-x-8 p-5 px-5.5 overflow-y-auto`)
- Per group: h4 (11 / 600 / 0.06em uppercase / `text-[var(--fg-subtle)]` / mb-2.5) + rows
- Per row (`.row`): `flex items-center py-1.5 text-[12.5px]`
  - `.lbl` → `flex-1 text-muted-foreground`
  - `.keys` → `flex gap-1` with `.kbd` chips inside

---

## Theme toggle

Two presentations, pick by context:

### Segmented (`.theme-segment`)

3-state segmented control (Light / Dark / System):

```
inline-flex bg-surface-1 border border-border rounded-full p-0.5 gap-px relative
```

- `.seg` cells: 32×26 grid place-items-center, transparent bg, `text-[var(--fg-subtle)]`
  - Hover: `text-[var(--fg-muted)]`
  - Active: `text-foreground`
- `.thumb` (under active): `absolute top-0.5 left-0.5 size-[32px_26px] rounded-full bg-white/[0.08]`
  - `.dark` → `transform: translateX(32px)`
  - `.system` → `transform: translateX(64px)`
  - Transition `transform 200ms var(--ease-out-back)`

### Icon-only (`.theme-icon`)

```
size-8 rounded-md grid place-items-center
bg-transparent text-muted-foreground
hover: bg-white/[0.05] text-foreground
relative overflow-hidden
```

Sun/moon svg cross-fade via `[data-mode="light|dark"]` attribute swapping rotation +
opacity + scale. See `overlays.css` for the exact selectors.

---

## Color picker block (`.color-block`)

Used in NewProjectDialog for picking the project's accent color.

```
flex items-center gap-3
.swatch-big  size-11 rounded-md border-[var(--border-strong)]
             box-shadow: inset 0 1px 0 rgba(255,255,255,0.25)
             contains an invisible <input type="color">
.meta        flex-col gap-1 text-[12px] text-muted-foreground
  .mono      text-foreground font-mono text-[12.5px]   (the hex code)
```

Preset grid (`.preset-row`) below:

```
grid grid-cols-8 gap-1.5 mt-2.5
.preset   h-7 rounded-md cursor-pointer border-transparent
          hover: translate-y-[-1px]
.preset.active::after  content:''; absolute -inset-[3px] rounded-[8px] border-2 border-foreground
```

---

## Checklist (`.cklist`)

For multi-select assignments (cycles ↔ cases, types ↔ cases).

```
.cklist  border border-border rounded-md bg-surface-1 overflow-hidden
.ckhead  flex items-center gap-2 p-2 px-2.5 border-b border-border bg-white/[0.02]
  .summary  ml-auto text-[11.5px] text-muted-foreground font-mono
.ckbody  max-h-[320px] overflow-y-auto
.ckitem  grid grid-cols-[18px_auto_1fr_auto] gap-2.5 items-center p-2 px-3
         + between rows: border-t border-[var(--border-soft)]
  hover: bg-white/[0.03]
  .checked: bg-accent-tint
  .cb  same as case-row checkbox
  .id  font-mono 11.5 / subtle
  .nm  12.5 / foreground / truncate
  .sub font-mono 10.5 / faint
```

---

## Spinner (`.spinner`)

```
size-[13px] rounded-full
border-[1.5px] border-[var(--border-strong)]
border-t-primary
anim-spin
```

Use inline within buttons / banners for in-flight loading states.

---

## Anti-patterns

- ❌ Don't introduce a new shadow stack. Shadow values for dialog/popover/toast are listed in `DESIGN-TOKENS.md` — copy them verbatim, don't approximate.
- ❌ Don't use Radix's default `data-state` animations as-is. Override with `anim-dialog-in` / `anim-pop-in` so motion matches the rest of the app.
- ❌ Don't recreate the segmented thumb logic per segmented control. Pull the rect-measuring effect once (see `SlidingTabBar`) and reuse.
- ❌ Don't put body padding inside `.fdialog-body` AND on its children. The 16px/22px belongs to the body container; rows manage their own gap.
- ❌ Don't hardcode `420px` or `360px` widths for dialogs. Stick to 440 (alert) / 520 (form) / 640 (form-lg).
- ❌ Don't omit the inset top highlight on color swatches and the brand mark. It's what makes them not feel like flat solid rectangles.
