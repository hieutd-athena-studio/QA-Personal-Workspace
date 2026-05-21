# Design tokens — prototype → code translation table

**Read this before lifting any value from a `Brain/UI Design/` prototype into `src/renderer/`.**

The prototypes use raw CSS variables (`var(--accent)`, `var(--surface-2)`, `var(--fg-muted)`).
The app uses Tailwind v4 utilities backed by shadcn HSL tokens (`bg-primary`, `text-muted-foreground`).
Both sets are defined side-by-side in `src/renderer/src/assets/main.css`, but you must use the
right form in the right place.

Rule of thumb: in **TSX**, prefer Tailwind utilities; fall back to `var(--token)` only for the
non-HSL "design tokens" listed below (surface tones, accent helpers, status colors), which are
not exposed as shadcn semantic colors.

---

## 1. Colors

### Background / surfaces

| Prototype                | Tailwind / CSS in TSX                     | Notes                           |
| ------------------------ | ----------------------------------------- | ------------------------------- |
| `var(--bg)` / `#0b0b0e`  | `bg-background`                           | Root body                       |
| `var(--surface-1)`       | `bg-surface-1` or `bg-[var(--surface-1)]` | Sidebars, muted regions, inputs |
| `var(--surface-2)`       | `bg-card` or `bg-[var(--surface-2)]`      | Cards, popovers, dialogs        |
| `var(--surface-3)`       | `bg-[var(--surface-3)]`                   | Hover/raised states             |
| `var(--overlay)`         | `bg-[var(--overlay)]`                     | Modal scrim                     |
| `rgba(255,255,255,0.03)` | `bg-white/[0.03]`                         | Subtle row hover                |
| `rgba(255,255,255,0.05)` | `bg-white/[0.05]`                         | Stronger hover                  |

### Borders

| Prototype              | Tailwind / CSS                                            | Notes                    |
| ---------------------- | --------------------------------------------------------- | ------------------------ |
| `var(--border)`        | `border-border`                                           | Default 1px hairline     |
| `var(--border-strong)` | `border-border-strong` or `border-[var(--border-strong)]` | Dividers, input outlines |
| `var(--border-soft)`   | `border-[var(--border-soft)]`                             | Internal row separators  |

### Foreground / text

| Prototype          | Tailwind                                            | Notes                                        |
| ------------------ | --------------------------------------------------- | -------------------------------------------- |
| `var(--fg)`        | `text-foreground`                                   | Primary text                                 |
| `var(--fg-muted)`  | `text-muted-foreground` or `text-[var(--fg-muted)]` | Secondary text, body copy                    |
| `var(--fg-subtle)` | `text-[var(--fg-subtle)]`                           | Labels, metadata                             |
| `var(--fg-faint)`  | `text-[var(--fg-faint)]`                            | Separators (`·`), placeholders, dim chevrons |

### Accent (per-project color — bound at runtime to `--primary`)

| Prototype                   | Tailwind                                                    | Notes                        |
| --------------------------- | ----------------------------------------------------------- | ---------------------------- |
| `var(--accent)`             | `bg-primary` / `text-primary`                               | The project's color          |
| `var(--accent-hover)`       | `bg-[var(--accent-hover)]`                                  | Hover on primary buttons     |
| `var(--accent-fg)` / `#fff` | `text-primary-foreground`                                   | Text on primary surfaces     |
| `var(--accent-soft)`        | `bg-accent-soft` or `bg-[var(--accent-soft)]`               | Selected row tint, badge bg  |
| `var(--accent-tint)`        | `bg-accent-tint` or `bg-[var(--accent-tint)]`               | Lighter tint, chip bg        |
| `var(--accent-ring)`        | `ring-[var(--accent-ring)]` / `border-[var(--accent-ring)]` | Focus rings, active outlines |

> **Don't hardcode `#8b5cf6` or `bg-violet-500`.** Always go through the accent token so per-project theming works.

### Status — Pass / Fail / Blocked / Unexec (reserved)

| Prototype             | Tailwind                      | Notes                   |
| --------------------- | ----------------------------- | ----------------------- |
| `var(--pass)`         | `bg-pass` / `text-pass`       | `#10b981`               |
| `var(--pass-soft)`    | `bg-pass-soft`                | Backgrounds, tag pills  |
| `var(--pass-flash)`   | `bg-pass-flash`               | Status-change pulse     |
| `var(--fail)`         | `bg-fail` / `text-fail`       | `#ef4444`               |
| `var(--fail-soft)`    | `bg-fail-soft`                |                         |
| `var(--blocked)`      | `bg-blocked` / `text-blocked` | `#f59e0b`               |
| `var(--blocked-soft)` | `bg-blocked-soft`             |                         |
| `var(--unexec)`       | `bg-unexec`                   | Ring-only dot (no fill) |
| `var(--unexec-soft)`  | `bg-unexec-soft`              |                         |

Status colors are **only** for Pass / Fail / Blocked / Unexecuted. Don't repurpose them.

### Environment tints (for env pills)

| Prototype          | Tailwind       |
| ------------------ | -------------- |
| `var(--env-prod)`  | `bg-env-prod`  |
| `var(--env-stage)` | `bg-env-stage` |
| `var(--env-dev)`   | `bg-env-dev`   |
| `var(--env-local)` | `bg-env-local` |

---

## 2. Spacing & layout

The prototypes hand-pick pixel values (no 8pt grid). Carry them through verbatim:

| Context                           | Value                                                             |
| --------------------------------- | ----------------------------------------------------------------- |
| Page horizontal padding           | `px-8` (32px) — `Project Detail`, `Execution`                     |
| Page padding (wide screens)       | `px-9` (36px) — `Projects`, `Plan Detail`, `Test Case`, `Reports` |
| Page top padding                  | `pt-[22px]`                                                       |
| Page bottom padding               | `pb-12` (48px) or `pb-16` (64px) for scrollable form pages        |
| Content max-width (forms / lists) | `max-w-[920px]`                                                   |
| Content max-width (reports)       | `max-w-[1080px]`                                                  |
| Body line max-width               | `max-w-[64ch]` (prose) / `max-w-[72ch]` (description blocks)      |
| Section vertical rhythm           | `mb-7` (28px) between major sections                              |
| Section head → body               | `mb-3.5` (14px)                                                   |
| Form field stack                  | `gap-4` (16px)                                                    |

---

## 3. Radius

| Prototype                | Tailwind       |
| ------------------------ | -------------- |
| `var(--radius-sm)` (4px) | `rounded-sm`   |
| `var(--radius-md)` (6px) | `rounded-md`   |
| `var(--radius-lg)` (8px) | `rounded-lg`   |
| Pill                     | `rounded-full` |

---

## 4. Typography

**Family:** the system stack is already wired (`var(--font-sans)` for UI, `var(--font-mono)` for IDs/numbers). Use the `.mono` utility for monospaced runs.

### Heading scale

| Use                                     | Size / weight / tracking        | Tailwind                                                                              |
| --------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| Page title (Projects, Project Detail)   | 28 / 600 / -0.02em              | `text-[28px] font-semibold tracking-[-0.02em] leading-[1.15]`                         |
| Page title (Plan, Test Case, Execution) | 22–26 / 600 / -0.015 to -0.02em | `text-[22px] font-semibold tracking-[-0.015em]` / `text-[26px] ...tracking-[-0.02em]` |
| Section title (`h3`)                    | 14 / 600 / -0.005em             | `text-sm font-semibold tracking-[-0.005em]`                                           |
| Eyebrow / label                         | 11 / 600 / 0.08em uppercase     | `text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]`       |
| Body                                    | 13.5 / 1.55                     | `text-[13.5px] leading-[1.55]`                                                        |
| Small / meta                            | 11.5–12.5                       | `text-[12px]` / `text-[11.5px]`                                                       |

### Mono

- 11–11.5 / weight 500 for IDs (`AUR-114`).
- 10.5 for `.kbd`, badges, status counters.
- Always with `font-variant-numeric: tabular-nums` for numbers. Use `tabular-nums` utility.

---

## 5. Motion

| Prototype                    | Code                                             |
| ---------------------------- | ------------------------------------------------ |
| `var(--motion-fast)` (120ms) | `duration-fast` or `duration-[120ms]`            |
| `var(--motion-base)` (200ms) | `duration-base` or `duration-[200ms]`            |
| `var(--motion-slow)` (320ms) | `duration-slow` or `duration-[320ms]`            |
| `var(--ease-out)`            | `var(--ease-out-back)` (named in `@theme` block) |

Use the pre-built animation utilities in `main.css` where possible:
`anim-pane-fade`, `anim-row-enter`, `anim-dialog-in`, `anim-toast-in`, `anim-pop-in`,
`anim-saved-fade`, `anim-dot-pulse`, `anim-outline-pulse`, `anim-saving-pulse`, `anim-spin`.

---

## 6. Shadows

Re-use these literal box-shadow strings — they're chosen to read well on a near-black bg:

| Use                                    | Value                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| Dialog                                 | `0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.55)`                 |
| Popover                                | `0 0 0 1px rgba(255,255,255,0.04), 0 14px 36px rgba(0,0,0,0.45)`                 |
| Selection action bar                   | `0 0 0 1px rgba(255,255,255,0.04), 0 14px 40px rgba(0,0,0,0.45)`                 |
| Toast                                  | `0 12px 32px rgba(0,0,0,0.45)`                                                   |
| Swatch inset highlight                 | `inset 0 0 0 0.5px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.25)` |
| Brand mark inset                       | `inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.4)`                 |
| Glow on status dot (`saved` indicator) | `0 0 8px var(--pass)` (or `--blocked` while saving)                              |

---

## 7. Cross-referenced files

| Token source            | File                                                                              |
| ----------------------- | --------------------------------------------------------------------------------- |
| Prototype tokens        | `Brain/UI Design/Stylesheets/tokens.css` (or `tokens.css` at design-project root) |
| Tailwind `@theme` block | `src/renderer/src/assets/main.css`                                                |
| Dark-mode raw vars      | `.dark { ... }` in `main.css`                                                     |

Keep both files in sync. When you add a token in `tokens.css`, mirror it in `main.css` under
`@theme` so Tailwind can address it, and add a row to this table.
