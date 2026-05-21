# Test Case — Design Spec

|                    |                                                      |
| ------------------ | ---------------------------------------------------- |
| **Prototype HTML** | `Brain/UI Design/Pages/Test Case.html`               |
| **Prototype JSX**  | `Brain/UI Design/Components/test-case-form.jsx`      |
| **Prototype CSS**  | `Brain/UI Design/Stylesheets/test-case.css`          |
| **Implementation** | `src/renderer/src/components/cases/TestCaseForm.tsx` |
| **Tokens map**     | `Brain/UI Design/DESIGN-TOKENS.md`                   |
| **Patterns**       | `Brain/UI Design/DESIGN-PATTERNS.md`                 |

---

## Page intent

Single-case editor. Everything is inline-editable; auto-save fires 700ms after the last edit.
"Saved Xs ago" caption fades up to keep the user oriented. Steps support drag reorder.

---

## Layout

```
.tc-page                    flex-1 flex flex-col min-h-0 overflow-hidden
└── .tc-scroll              flex-1 overflow-y-auto p-[22px_36px_64px] relative
    └── .inner              max-w-[920px] mx-auto
        ├── .tc-back        breadcrumb (project › Test cases)
        ├── .tc-head        ID pill + h1-input + meta-row + Delete action
        ├── tc-divider
        ├── Basic info section
        ├── tc-divider
        └── Test steps section
```

Toast stack lives at the bottom-right of `.tc-scroll` (`position: absolute`); AlertDialog
overlays the whole scroller.

---

## Header (`.tc-head`)

```
flex items-start gap-3.5 mb-1.5
```

- **ID pill** (`.id-pill`): see "ID pill" in DESIGN-PATTERNS.md. `margin-top: 8px` so it
  aligns with the h1's optical center.
- **Body** (`flex-1 min-w-0`):
  - **h1-input** — same inline-editable pattern as Plan Detail (26 / 600 / -0.02em)
  - **`.meta-row`** (`flex items-center gap-2 mt-3 flex-wrap`):
    - Version pill (`.pill.mono`)
    - Category-breadcrumb pill (`.cat-pill`): rounded-full, 22px, surface-2 bg, border. Inside: `Category › Subcategory` with the `›` in `var(--fg-faint)`.
    - Spacer
    - Saved indicator (see DESIGN-PATTERNS.md → "Saved / saving indicator")
- **Actions** (right, `flex-shrink-0`): Danger button — `<Button variant="destructive">Delete</Button>` with leading X icon.

---

## Basic info section

Section head: "Basic info" + "How the case appears in lists and reports."

### Field stack (`.tc-fields`)

```
grid grid-cols-1 gap-4
```

- **`.tc-row-2`** for paired fields: `grid grid-cols-[1fr_160px] gap-4` (Subcategory + Version)
- Each `.tc-field` is a `flex flex-col gap-1.5`:
  - `<label>`: 11 / 600 / 0.06em uppercase / `text-[var(--fg-subtle)]`
  - input/textarea/select (see DESIGN-PATTERNS.md → Inputs)
  - `.hint`: 11.5 / `text-[var(--fg-faint)]` below the field

### Subcategory select

Native `<select>` with custom chevron via background-image (already in `.tc-select` CSS).
Use `<optgroup>` per category. **Don't replace with shadcn `Select`** — the platform
optgroup grouping is hard to replicate, and the prototype intentionally uses native to
get OS-themed dropdowns.

### Version

`.tc-input.mono` — monospaced for the version string (e.g. `v1.2.0`).

### Description / Expected result

Textareas, 3 rows, resize-vertical, line-height 1.55. Hints below explain context
("Markdown isn't rendered here yet", "The single authoritative...").

---

## Test steps section

Section head: "Test steps" + step count (mono, `.count` style: 11 / mono / fg-faint) + helper.

### Steps container (`.tc-steps`)

```
flex flex-col gap-2.5
```

### Step row (`.step-row`)

```
grid grid-cols-[22px_28px_1fr_1fr_28px] gap-2.5 items-stretch
p-3 pl-2
bg-surface-1 border border-border rounded-lg
draggable=true
```

Drag states:

- `.dragging` → `opacity-40 bg-surface-2`
- `.drop-target` → `border-accent-ring shadow-[0_0_0_1px_var(--accent-ring)]`
- `.new` → `anim-step-enter` (slide-up 8px + fade, 200ms)
- `.removing` → exit animation (squeeze height to 0)

Cells:

1. **Drag handle** (`.step-handle`) — six-dot SVG (see DESIGN-PATTERNS.md). `align-self: flex-start mt-1`.
2. **Step number** (`.step-num`):
   ```
   size-6 rounded-full bg-accent-soft text-violet-300
   font-mono text-[11.5px] font-semibold
   border border-[rgba(139,92,246,0.18)]
   align-self: flex-start mt-[3px]
   ```
3. **Action column** (`.step-col`):
   - `.lbl`: 10 / 600 / 0.08em uppercase / `text-[var(--fg-faint)]` — reads "Action"
   - Transparent textarea (13 / 1.5 / `text-foreground`), no border, no padding, `min-h-[38px]`
4. **Expected column** — same `.step-col` shape, label = "Expected"
5. **Remove button** (`.step-remove`): 24px ghost-style, `text-[var(--fg-faint)]`, hover `text-red-300 bg-fail-soft`. Disabled when `total ≤ 1`.

Visual separator between columns: handled by the inner padding only — there's no vertical
border between Action and Expected on the step rows themselves.

### Add step button (`.add-step`)

Same dashed-CTA pattern as plan-detail's `.add-task` (see DESIGN-PATTERNS.md → "Cards").
Leading sparkle icon, label "Add step".

---

## Auto-save indicator (`.saved`)

```
inline-flex items-center gap-1.5 text-[11.5px] text-[var(--fg-subtle)]
```

- 6px dot — green glow when idle, blocked-amber glow with `anim-saving-pulse` while saving.
- Text swap: "Saving…" → "Saved just now" → "Saved 12s ago" → "Saved 3m ago"
- Saving timeout: 700ms after last keystroke (debounce). Increment "Xs ago" timer once per second.

When notes/edits hit save success, the entire indicator can do an `anim-saved-fade`
animation (2.4s, fade in/out) — already used in Execution.

---

## Delete confirmation

`AlertDialog` (440px, `.dialog`):

```tsx
<AlertDialog
  title="Delete this test case?"
  description={
    <>
      <strong>
        {tc.display_id} — {tc.name}
      </strong>{' '}
      will be removed from this project, including its steps and any cycle assignments. This can't
      be undone.
    </>
  }
  confirmLabel="Delete case"
/>
```

Body:

```
.dialog-body  p-5.5 pb-1.5 flex gap-3.5 items-start
  .icon       36×36 rounded-full grid place-items-center
              bg-fail-soft text-fail flex-shrink-0 mt-0.5
  .text       h3 (15/600) + p (13/muted)
.dialog-foot  p-4 px-5.5 flex gap-2 justify-end border-t border-border
```

Confirm button = `<Button variant="destructive">`; cancel = subtle.

---

## Toast stack

`.toast-stack` lives bottom-right of `.tc-scroll`, 24px from edges.

```
.toast
  flex items-center gap-2.5 p-2.5 px-3.5
  bg-surface-2 border border-[var(--border-strong)] rounded-md
  shadow-[0_12px_32px_rgba(0,0,0,0.45)]
  text-[12.5px] text-foreground
  max-w-[320px]
  anim-toast-in
```

Variants: `.success` → check icon `text-pass`; `.error` → x icon `text-fail`.

Already wired via `sonner` — match the visual but use sonner's API, don't roll a custom
toast component.

---

## Anti-patterns

- ❌ Don't show explicit "Save" button. Auto-save is the contract — manual save would suggest unsaved-state risk.
- ❌ Don't store step order in a separate column. The row order in the DOM is the order — drag-reorder swaps array indices.
- ❌ Don't truncate the step description textareas. They auto-grow vertically; vertical resize is fine.
- ❌ Don't replace native `<select>` with shadcn `Select`. The `<optgroup>` semantics matter (Category → Subcategory groupings).
- ❌ Don't lose the violet-tinted step numbers. The accent color anchors the user's eye to step boundaries.
- ❌ Don't enable Remove when only one step remains. The form requires at least one step; the button is disabled, not hidden.
