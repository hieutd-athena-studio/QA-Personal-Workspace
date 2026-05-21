# Projects — Design Spec

|                    |                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| **Prototype HTML** | `Brain/UI Design/Pages/Projects.html`                                                               |
| **Prototype JSX**  | `Brain/UI Design/Components/projects-index.jsx`                                                     |
| **Prototype CSS**  | `Brain/UI Design/Stylesheets/projects-index.css`                                                    |
| **Implementation** | `src/renderer/src/components/projects/ProjectsPage.tsx`, `ProjectsList.tsx`, `NewProjectDialog.tsx` |
| **Tokens map**     | `Brain/UI Design/DESIGN-TOKENS.md`                                                                  |
| **Patterns**       | `Brain/UI Design/DESIGN-PATTERNS.md`                                                                |

---

## Page intent

Landing page. Centered single-column list, max 920px. Every project is a clickable row;
hover reveals delete + chevron. Each row links to `Project Detail`.

---

## Layout

- Root: `flex-1 flex flex-col min-h-0 overflow-hidden relative`
- Scroller: full-width vertical scroll, `padding: 32px 36px 48px`
- Inner column: `max-w-[920px] mx-auto`
- Header → list, no internal separators

## Header

```
flex items-end gap-4 mb-7
```

- **Title:** "Projects" — 28 / 600 / -0.02em / leading 1.15
- **Subline:** 13 / `text-muted-foreground`, two phrases separated by faint `·` dot.
  Includes the `⌘K` `kbd` chip inline.
- **CTA:** `<Button>+ New project` (primary). Right-aligned via `text` div = `flex-1`.

## Project list

Outer container fakes 1px row dividers via `gap: 1px; background: var(--border)`:

```
flex flex-col gap-px bg-border border border-border rounded-lg overflow-hidden
```

### Project row (`.idx-row`)

Grid: `14px auto auto 1fr auto auto` cols, `gap-4`, `padding: 16px 20px`, `bg-surface-1`.

Cells, left → right:

1. **Color swatch** — 12×12, `rounded-[3px]`, `box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.2)`
2. **Prefix** — `font-mono text-[11.5px] tracking-[0.05em] text-[var(--fg-subtle)]`
3. **Name + description** stack:
   - Name: `text-[14.5px] font-semibold tracking-[-0.005em] text-foreground`
   - Description: `text-[12.5px] text-muted-foreground mt-0.5 max-w-[60ch] truncate`
4. _(1fr spacer)_
5. **Stats** — two pairs, `flex gap-3.5 text-[11.5px] text-[var(--fg-subtle)]`. Numbers are
   `<b>` in mono / tabular-nums / `text-foreground` weight 600, the unit label is the rest.
6. **Actions** — appears on hover (`opacity-0 → 1`):
   - Delete: `.ghost-btn.square` with `<IconX size={14} />`
   - Chevron: faint `<IconChevR size={16} />`, slides +2px on row hover

Row hover: `bg-surface-2`. Chevron color → muted, transform `translateX(2px)`.

**Entrance animation:** each row uses `anim-row-enter` with staggered `animationDelay` =
`Math.min(i, 7) * 30ms`. Cap at 7 so long lists don't get sluggish.

## Empty state

```
border border-dashed border-[var(--border-strong)] rounded-lg p-14 text-center
```

- 40×40 icon block: `rounded-[10px] bg-accent-soft text-[var(--accent-hover)]`, centered
- Headline: 15 / 600 — "No projects yet"
- Subtext: 13 / `text-muted-foreground` — "Create one to start tracking..."
- Primary CTA centered

---

## Interactions

- **Click row** → navigate to `/projects/$id`
- **Hover row** → show delete + chevron, raise bg to surface-2
- **Click delete** → `<AlertDialog>` (see `Test Case.design.md` for AlertDialog spec):
  - Title: `Delete {name}?`
  - Body: `<strong>{prefix} — {name}</strong> and all its test cases, plans, and cycles will be removed. This can't be undone.`
  - Confirm: "Delete project" (destructive variant)

---

## Anti-patterns

- ❌ Don't add filter/sort UI. The brief is a single-user local app — fewer than 50 projects expected.
- ❌ Don't switch to a card grid. The list layout was deliberate — scanning IDs is the primary action.
- ❌ Don't lose the 1px-gap divider technique. A `divide-y` won't render the same on hover (the divider would still show through the lifted bg).
- ❌ Don't hardcode `bg-violet-500` on the swatch. The project color is data; use `style={{ backgroundColor: p.color }}`.
- ❌ Don't use a chevron icon as the click target — the whole row is the target; the chevron is purely affordance.
