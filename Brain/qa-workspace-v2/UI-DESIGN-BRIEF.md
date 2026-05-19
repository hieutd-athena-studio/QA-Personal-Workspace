# UI Design Brief — QA Workspace v2

Handoff document for Claude Design (or any UI/UX agent) to redesign QA Workspace v2 with a **minimalism + considered motion** direction. Cross-links: [[CONTEXT]], [[decisions]].

---

## 1. Product context

- **What:** Local-only desktop tool for QA test case management.
- **Audience:** Single QA engineer per install. Power user. Lives in the app 4–8 hours/day.
- **Platforms:** macOS + Windows (Electron). Window sizes 1280×800 minimum, scales up.
- **Mood:** Calm, fast, professional. The user is _working_ — the app must not entertain, distract, or get in the way.
- **Tech surface available:** Tailwind v4 + shadcn/ui + Radix Primitives. Motion via Framer Motion or pure CSS. Already-installed icons: `lucide-react`. Theme tokens in `src/renderer/src/assets/main.css`.

---

## 2. Design direction — Minimalism with purposeful motion

### 2.1 Visual principles

1. **Information first, chrome last.** Test case lists, status, IDs — these are the product. Borders, dividers, surface elevations exist only to organize content.
2. **Restraint over decoration.** No gradients, no shadows deeper than `shadow-sm`, no illustrations, no rounded-3xl, no glassmorphism. One accent color per project (set by user).
3. **Generous whitespace, tight typographic rhythm.** Default body 14px, line-height 1.5. Section spacing 24/32/48px scale. Never crowd content edges.
4. **Monochrome base + one accent.** Foreground/background/muted carry 90% of the UI. Accent = project color OR primary blue. Status colors (emerald/red/amber) reserved exclusively for Pass/Fail/Blocked semantics — never decorative.
5. **Typography as hierarchy.** Weight + size, not color, do most of the work. Mono font (`ui-monospace`) for IDs, version pills, kbd keys. Sans for everything else.
6. **Borders thin, radius small.** `border` = 1px hairline. Radius scale: `sm 4px → md 6px → lg 8px`. Never `rounded-full` on containers (only on pills/avatars).
7. **Dark mode parity.** Every component must read equally well in light + dark. Test contrast at WCAG AA minimum.

### 2.2 Motion principles

Motion exists to **explain state changes**, never to entertain. Three rules:

| Rule                                                           | Rationale                                                                                     |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Fast (120–240ms), eased (`cubic-bezier(0.16, 1, 0.3, 1)`).** | Snappy ease-out feels responsive; long animations feel sluggish in pro tools.                 |
| **Animate position + opacity. Avoid scale/skew/rotate.**       | Translate + fade reads as "the thing arrived"; transforms read as "the thing is showing off." |
| **Respect `prefers-reduced-motion`.**                          | Disable all non-essential animations under that media query.                                  |

**Concrete motion catalogue:**

- **Route transitions** — fade-in (opacity 0→1, 160ms) + 4px upward slide. Outgoing page just opacity 1→0.
- **Dialog/sheet open** — Radix default (scale-in is acceptable here because user triggered it). Tune duration to 180ms.
- **Toast** — slide up from bottom-right, stagger if multiple.
- **List items appearing** — stagger fade-in 30ms apart for the first 8 items, then instant. Use Framer Motion `layout` for reorder.
- **Tab switching** — content cross-fades 120ms; tab indicator slides under the active label using `layoutId`.
- **Status changes (Pass/Fail/Blocked)** — the status dot in the execution sidebar pulses once (200ms scale 1→1.15→1) when the user marks a case. The list row briefly highlights with the status color at 8% opacity, fades over 400ms.
- **Progress bar** — width transition 240ms when assignments update.
- **Hover** — background opacity transition 100ms. No color shift, no scale.
- **Focus rings** — instant, no animation. Accessibility > polish.
- **Skeletons** — current `animate-pulse` stays. Don't replace with shimmer.

### 2.3 What we deliberately reject

- Hero illustrations on empty states (icon + text is enough).
- Confetti / celebrations on completion.
- Parallax, scroll-jacking, marquee.
- Animated SVG icons (lucide statics only).
- Page slide-from-right transitions (feels like a mobile app, not a desktop tool).
- Tooltip animations beyond 100ms fade.

---

## 3. Screen inventory

Every screen below lives in the renderer. Routes use TanStack Router. Source paths included for reference.

### 3.1 Root shell (always visible)

**File:** [`src/renderer/src/routes/__root.tsx`](src/renderer/src/routes/__root.tsx)

**Structure:**

- **Sticky header (`<header>`):** logo "Q" badge + "QA Workspace" wordmark (left) · search-palette trigger button with `⌘K` hint · `SettingsMenu` dropdown · `ThemeToggle` (right). Backdrop blur, 1px bottom border.
- **`UpdateBanner`** — appears between header and content when an update is downloading / available / downloaded.
- **`<Outlet />`** — current route renders here.
- **`Toaster`** (sonner, bottom-right).
- **`CommandPalette`** (hidden, opens via `⌘K` / `Ctrl K`).

**Design notes:**

- Header height should compress to ~48px (current ~56). Wordmark uses 13px semibold tracking-tight.
- The "Search" button currently appears desktop-only — give it a thinner border, ghost styling, monospace `⌘K` chip inside.
- Theme toggle + settings as 32px square ghost icon buttons.

---

### 3.2 Projects index (home)

**Route:** `/` · **File:** [`src/renderer/src/routes/index.tsx`](src/renderer/src/routes/index.tsx) → [`ProjectsPage`](src/renderer/src/components/projects/ProjectsPage.tsx)

**Purpose:** Land here on launch. Pick a project or create one.

**Structure:**

- Page header: `Projects` H1 + subtitle with `⌘K` hint · primary "New project" button (right).
- Error banner (destructive surface) if list fetch fails.
- 3 pulsing skeleton rows while loading.
- Empty state (no projects): centered icon + "No projects yet" + CTA. Dashed border container.
- Project list (`ProjectsList`): vertical cards, each row = 12px color swatch + display_prefix (mono, muted) + name + description + delete icon + chevron.

**Animation hooks:**

- Stagger reveal cards (60ms apart, first 8).
- Hover: card bg shifts from transparent → `accent/40` over 100ms.
- Delete: row collapses height + fades over 200ms.

---

### 3.3 New project dialog

**Component:** [`NewProjectDialog`](src/renderer/src/components/projects/NewProjectDialog.tsx) (Radix Dialog, triggered from header palette or Projects page or `⌘K`)

**Fields:** `display_prefix` (auto-uppercased), `name`, `description` (optional), `color` (HTML color input + hex text).

**Design notes:**

- Pair color picker swatch (40px square) with read-only hex string in mono font; remove the editable text — picker IS the source of truth.
- Suggest a small palette of 8 preset color chips above the native picker.
- Submit button: full width on mobile, right-aligned on desktop.

---

### 3.4 Project layout shell

**Route:** `/projects/$projectId/*` · **File:** [`projects.$projectId.tsx`](src/renderer/src/routes/projects.$projectId.tsx)

Sets the active project in Zustand on mount. No visual chrome — just `<Outlet />`.

---

### 3.5 Project detail (tabbed home of a project)

**Route:** `/projects/$projectId/` · **Component:** [`ProjectDetail`](src/renderer/src/components/projects/ProjectDetail.tsx)

**Structure:**

- Back link "← All projects".
- Project header: 48px color square swatch · `display_prefix` (mono, muted) + project name (3xl bold) · description below · Backup + Restore buttons (top-right).
- **Tabs** (Radix): `Dashboard | Test Cases | Plans & Cycles | Test Types | Reports`.
- Tab content area below — each pane is its own component.

**Design notes:**

- Replace the color block with a softer rounded rectangle + faint inner border.
- Tab bar should be borderless with a 2px sliding underline using Framer Motion `layoutId`.
- Backup/Restore: deemphasize — move to a "•••" dropdown menu so the primary header isn't cluttered.

---

### 3.6 Dashboard pane

**Component:** [`DashboardPane`](src/renderer/src/components/projects/DashboardPane.tsx)

**Structure:**

- 4-up stat row: Test cases / Test plans / Cycles / Test types (number + label).
- "Upcoming deadlines" card: list of next 5 plans by end_date, with day-count badge (tone-shifted by urgency).
- "Task budget" card: total planned working days.

**Design notes:**

- Stats: number 28px semibold, label 11px uppercase tracked. Drop the surrounding card border — use whitespace to group.
- Deadline urgency: today/1 day = red, ≤7 = amber, else muted. Add a thin urgency strip on the left edge of each row.
- Animate stat numbers when they change (count up over 600ms).

---

### 3.7 Cases pane

**Component:** [`CasesPane`](src/renderer/src/components/cases/CasesPane.tsx)

**Structure:**

- Toolbar: search input (icon-left) · selected-count delete button (when selection > 0) · "Category" / "Import" / "Export" outline buttons · "New case" primary button.
- When `query` is set: result count + flat list inside a card.
- When `query` is empty: grouped by category → subcategory cards. Each subcategory shows its case rows.
- Empty state: dashed card with icon + CTA.
- Each row: checkbox · display_id (mono) · name · version pill.

**Design notes:**

- Toolbar buttons → uniform 32px height, consistent icon sizing 14px.
- Category cards: collapse the section header into a simple H3 with a subtle bottom border, not a heavy card. Reduce visual nesting (currently cards-inside-cards).
- Selection state: when checkbox checked, row gets a 2px left border in accent color; floating action bar slides up from bottom-right of the viewport with selection count + bulk actions.
- Rows: 36px height instead of 44. Tighter rhythm reads as "data grid", which is what this is.
- Search: add 150ms debounce indicator (subtle progress line under the input while results resolve).

---

### 3.8 New / edit test case

**Routes:** `/projects/$projectId/cases/new`, `/projects/$projectId/cases/$caseId`
**Files:** [`projects.$projectId.cases.new.tsx`](src/renderer/src/routes/projects.$projectId.cases.new.tsx), [`projects.$projectId.cases.$caseId.tsx`](src/renderer/src/routes/projects.$projectId.cases.$caseId.tsx)
**Form:** [`TestCaseForm`](src/renderer/src/components/cases/TestCaseForm.tsx)

**Structure (edit view):**

- Back link.
- Header: `display_id` mono pill · case name H1 · version pill + category breadcrumb pills · Delete button (right).
- Separator.
- Form, two cards: "Basic info" (name, subcategory select, version, description, expected result) · "Test steps" (dynamic field array with step number circle, action textarea, expected textarea, remove button).
- Form footer: Cancel + Save.

**Design notes:**

- Drop the card containers entirely on this form. Use H3 section headers + subtle horizontal rules. Forms feel calmer without nested boxes.
- Step rows: align as a horizontal grid (`32px | 1fr | 1fr | 32px`) with the number circle as a 24px chip. Animate new step rows in (fade + 8px slide-down, 200ms).
- Auto-save indicator (small "Saved 2s ago" caption) — implement debounced save on edit screens; remove the explicit Cancel/Save footer for edit mode. Create mode keeps the footer.
- Reorder steps via drag handle (currently no reorder UI).
- Delete confirmation: replace `window.confirm` with a Radix AlertDialog matching app style.

---

### 3.9 Plans pane

**Component:** [`PlansPane`](src/renderer/src/components/plans/PlansPane.tsx)

Card list of test plans. Each card: display_id, name, date range, working_days, cycle count, delete icon.

**Design notes:**

- Same as Cases — flatten cards into rows. Plans card detail belongs on the plan page, not the index.
- Inline mini-progress bar on each plan showing aggregate cycle progress (sum of all cycles' pass/fail/blocked).

---

### 3.10 New / edit test plan

**Routes:** `/projects/$projectId/plans/new`, `/projects/$projectId/plans/$planId`
**Files:** [`projects.$projectId.plans.new.tsx`](src/renderer/src/routes/projects.$projectId.plans.new.tsx), [`projects.$projectId.plans.$planId.tsx`](src/renderer/src/routes/projects.$projectId.plans.$planId.tsx)
**Form:** [`TestPlanForm`](src/renderer/src/components/plans/TestPlanForm.tsx)

**Structure:**

- Name, description.
- Start date / End date / Working days (computed) — 3-column grid.
- Tasks list (0.25-day granularity): name + duration_days fields.
- Total vs budget caption (turns destructive when over budget).
- Plan detail page (`$planId`) additionally renders `<TestCyclesPanel>` below the form.

**Design notes:**

- Visualize the budget: progress bar showing `taskTotal / effectiveBudget` with overflow color shift.
- Date inputs: use a single date-range picker component (one popover, two months visible) instead of two separate `<input type="date">`.

---

### 3.11 Test cycles panel (inside plan detail)

**Component:** [`TestCyclesPanel`](src/renderer/src/components/cycles/TestCyclesPanel.tsx)

List of cycles for a plan. Each cycle card: display_id, name, environment pill, "Manage cases" button, "Execute" primary button, delete icon.

**Dialogs:** `NewCycleDialog`, `ManageAssignmentsDialog` (cycle ↔ test case mapping).

**Design notes:**

- Inline "Execute" button is the primary call to action — give it visual weight via a small play glyph.
- Environment pill: subtle tinted background per environment (Production = red-50, Staging = amber-50, Dev = blue-50, Local = muted).
- Mini-progress strip inside each card showing P/F/B/U mix as a stacked bar (same as execution sidebar).

---

### 3.12 Execution page (the focus surface)

**Route:** `/cycles/$cycleId/execute` · **Component:** [`ExecutionPage`](src/renderer/src/components/execution/ExecutionPage.tsx)

**Structure:**

- Two-pane layout: left **sidebar** (320px) lists all assignments + cycle progress strip; right **main** shows the active case (description, steps, expected result, notes textarea, status buttons).
- Keyboard: `P/F/B/U` set status, `←/→` navigate.
- Status dots in sidebar use semantic colors (Pass=emerald, Fail=red, Blocked=amber, Unexecuted=muted).

**Design notes:**

- This is the most-used screen. It deserves a dedicated visual treatment — slightly muted background on the sidebar (`bg-muted/30`) to anchor the dual-pane layout.
- Active row in sidebar: 3px left border in primary, bg `accent`. Smooth-scroll on activation already done.
- Status buttons (bottom of main pane): make them feel like keyboard keys. Render the kbd chip _inside_ the button on the right; on hover the chip dims slightly.
- After applying a status, briefly flash the next row in the sidebar (0.5s outline pulse) so the user's eye lands.
- Add a "Jump to next failed" command in `⌘K` palette and a hotkey (e.g. `N`).
- Progress bar (top of sidebar) — animate width changes 240ms.
- Empty state ("no assignments") needs a clearer CTA — link directly to "Manage cases" dialog rather than just instructions.

---

### 3.13 Test types pane

**Component:** [`TypesPane`](src/renderer/src/components/types/TypesPane.tsx)

Test types (orthogonal grouping to categories — e.g. Smoke / Regression / API). Each row shows name, description, `assigned / total` count, "Manage cases" button.

**Dialogs:** `NewTestTypeDialog`, `ManageTypeCasesDialog`.

**Design notes:**

- Count ratio could show as a tiny donut or progress bar in addition to the numeric value.
- "Manage cases" dialog likely needs the same checkbox-list pattern as `ManageAssignmentsDialog` — keep them visually identical to reduce learning load.

---

### 3.14 Reports pane

**Component:** [`ReportsPane`](src/renderer/src/components/reports/ReportsPane.tsx)

Two tabs:

- **Single cycle:** pick cycle from `<Select>`, see 5-stat row (Total/Pass/Fail/Blocked/Unexec), export CSV.
- **Compare cycles** ([`MultiCycleReport`](src/renderer/src/components/reports/MultiCycleReport.tsx)): cycle multi-select (Command palette style) + filterable comparison table + summary table + export.

**Design notes:**

- Single cycle stats: identical visual treatment to Dashboard stats. Build a shared `<StatGrid>` component.
- Comparison table: status cells already use semantic-tinted backgrounds; consider replacing the text label with a single colored dot to declutter dense grids. Show label on hover.
- Add small bar chart for each cycle in the summary table (P/F/B/U as a stacked bar).

---

### 3.15 Settings menu (header dropdown)

**Component:** [`SettingsMenu`](src/renderer/src/components/SettingsMenu.tsx)

Radix DropdownMenu: "Check for updates automatically" checkbox + "Check for updates now" item (spinner when checking).

**Design notes:**

- This is sparse — leave it sparse. Eventually grow into: theme settings, keyboard shortcut reference, "About" with version + license + log file path.
- Add a "Show keyboard shortcuts" item that opens an overlay listing every shortcut in the app.

---

### 3.16 Theme toggle

**Component:** [`ThemeToggle`](src/renderer/src/components/theme-toggle.tsx)

Single Sun/Moon ghost icon button.

**Design notes:**

- Animate the icon swap: rotate-in / rotate-out 200ms.
- Consider three-state cycle: Light → Dark → System.

---

### 3.17 Command palette

**Component:** [`CommandPalette`](src/renderer/src/components/command-palette.tsx)

`⌘K`-triggered Radix CommandDialog. Groups: "Actions" (New project, Toggle theme, Go to Projects) · "Projects" (list of projects, with color swatch + prefix + name).

**Design notes:**

- This should be the **primary** navigation. Expand groups to cover: search test cases by display_id, jump to cycle, jump to plan, recent items, settings shortcuts.
- Show keyboard shortcut hints right-aligned in each row.
- Faster open animation (120ms scale + fade, not Radix default 200ms).

---

### 3.18 Update banner

**Component:** [`UpdateBanner`](src/renderer/src/components/UpdateBanner.tsx)

States: available → downloading (with percent) → downloaded (with "Install and restart"). Dismissible.

**Design notes:**

- Currently styled with primary-tinted background. Keep that, but reduce vertical padding (32px → 24px) so it doesn't crowd the header.
- Progress: render a thin 2px progress line at the bottom edge of the banner during download, in addition to the percent text.

---

## 4. Component primitives already available

The following [shadcn/ui](src/renderer/src/components/ui/) primitives are wired up and themed — Claude Design should compose from these, not invent new ones:

`button`, `card`, `input`, `label`, `form`, `dialog`, `sheet`, `dropdown-menu`, `select`, `command`, `tabs`, `tooltip`, `separator`.

Icons: `lucide-react` only.

Toasts: `sonner` (already provided).

---

## 5. Tokens & theme

CSS variables live in [`src/renderer/src/assets/main.css`](src/renderer/src/assets/main.css). Current palette is the shadcn default; the user can override `--ring` / accent via per-project color in the future.

**Suggested tightening:**

- Reduce `--radius` from `0.5rem` (8px) to `0.375rem` (6px) for a slightly sharper feel.
- Add a `--surface-1` / `--surface-2` token system so we don't depend on `bg-muted/30` magic numbers.
- Add a `--motion-duration-fast` (120ms) / `--motion-duration-base` (200ms) / `--motion-duration-slow` (320ms) and a `--motion-ease-out: cubic-bezier(0.16, 1, 0.3, 1)` token.

---

## 6. Accessibility checklist (non-negotiable)

- Every interactive element keyboard-reachable with visible focus ring.
- `aria-label` on icon-only buttons (already done for delete buttons — extend pattern).
- Color is never the only signal: status uses dot + label, not just color.
- `prefers-reduced-motion` disables all non-essential motion.
- Live regions: toaster + UpdateBanner already use `aria-live`.

---

## 7. Suggested redesign order

1. **Tokens + motion system** — extend `main.css` with motion + surface tokens.
2. **Shell** — refine header, command palette, banner.
3. **Project detail tabs** — sliding-underline indicator.
4. **Cases pane** — flatten card nesting, add selection action bar.
5. **Execution page** — high-touch polish (status flash, kbd-in-button, jump-to-next-failed).
6. **Forms** — strip card chrome on edit screens, add auto-save indicator.
7. **Reports** — dot-only comparison cells, mini bar charts.
8. **Dashboard** — animated stat counters.
9. **Settings + theme toggle** — animated icon swap, three-state theme, shortcuts overlay.

---

## 8. Out of scope (do not touch)

- IPC, DB schema, repos, hooks — design lives in renderer only.
- New features. This pass is a visual overhaul, not a functional one.
- Backend / build / packaging.
