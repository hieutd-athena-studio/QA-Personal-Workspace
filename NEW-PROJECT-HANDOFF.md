# QA Workspace v2 — Handoff & Greenfield Plan

> Source-of-truth document for rebooting the QA-Workspace-Management-App as a fresh project.
> Date authored: 2026-05-18

---

## Part 1 — Core Functions Audit (what v1 does today)

### 1.1 Domain hierarchy
```
Project (e.g. "ARR")
 ├── Category                          (container only, 2-level depth max)
 │    └── Subcategory
 │         └── Test Case (ARR-TC001, has steps[], expected_result, version)
 ├── Test Plan (ARR-PL001, has task list w/ working-day budget)
 │    └── Test Cycle (ARR-PL001-CY01, has environment: DEV CHEAT / PROD CHEAT / PROD NON-CHEAT)
 │         └── Assignment (test-case execution row: Pass / Fail / Blocked / Unexecuted, with notes)
 └── Test Type (groups test cases for regression suites; cross-cuts Categories)
```

### 1.2 Feature inventory (by page / handler)

| Area | Capabilities |
|------|---|
| **Projects** | CRUD; project color; project-scoped display IDs (`ARR-TC001`) |
| **Categories / Subcategories** | CRUD, rename, delete-cascades-to-children |
| **Test Cases** | CRUD; steps editor (action + expected, per row); version field; description + overall expected_result; JSON import/export; full-text search across project |
| **Test Plans** | CRUD; start/end dates → working-day budget; embedded task list (JSON in summary col, 0.25-day granularity); budget overflow warning |
| **Test Cycles** | CRUD; environment tag; per-plan cycles; assignment management |
| **Assignments** | Assign test cases to cycle; batch unassign; status updates (P/F/B/Unexecuted + notes) |
| **Execution** | Two-pane: sticky case-list panel (grouped by Category → Subcategory, status dots, progress bar) + main pane (breadcrumb, exec card, Prev/Next, keyboard shortcuts P/F/B/←/→) |
| **Test Types** | Create/edit/delete; manage which cases belong; selected/total counts; export/import test-type definitions |
| **Reports** | Per-cycle data, multi-cycle compare, PDF/HTML export |
| **Dashboard** | Deadline health, task budget, project color — *currently broken at `DashboardPage.tsx:38`* |

### 1.3 Cross-cutting

- **Display IDs** computed at insert time inside the repository (never derived later).
- **Migrations**: 8 numbered files, replayed on app startup (`001-initial-schema` → `008-add-project-color`).
- **CSV import** for test cases (planned/legacy; current export is JSON).
- **Keyboard nav** only on Execution page.

### 1.4 Known weak points to fix in v2

1. **DashboardPage crash** — never diagnosed in v1.
2. **TestTypes count race** — first render shows `0/total` until subcategory clicked (preload races with first paint).
3. **No auto-scroll** of execution panel when keyboard nav changes active item.
4. **No undo** on destructive ops (delete project / cycle / cases).
5. **No backup / restore UI** — user has no way to snapshot or migrate their SQLite file from inside the app. (This is the gap for a local-only app — not "multi-user sync".)
6. **TestCaseForm scroll bug** — only fixed today (this branch).
7. **Tasks are JSON-in-TEXT** (ADR-005) — works, but blocks any future query/report on task-level data.
8. **No tests** — repo has zero test files.
9. **Dispersed CSS** — every component has its own `.css` file; tokens are global but visual consistency drifts over time.

> **Scope note for v2:** This is a **fully local, offline-first, single-user-per-install** desktop tool. No backend, no auth, no sync, no presence. Each user runs their own copy with their own SQLite file. Any "sharing" between users happens via explicit JSON/CSV export → file transfer → JSON/CSV import. This shapes every tech choice below.

---

## Part 2 — Recommended Stack for v2

### 2.1 Shell

**Keep Electron**, but step up to a modern preset.

| Choice | Why |
|---|---|
| **Tauri 2** (Rust shell) | 10× smaller binaries (~5 MB vs ~120 MB), tighter sandboxing, native menus. Trade-off: Rust learning curve for native code. |
| **Electron + electron-vite + electron-builder** | Stay if you don't want Rust. Bundle sizes are large but everything you know transfers. |
| **electron-forge** | Alternative bundler, easier code-signing on macOS. |

**Recommendation: Electron + electron-vite** unless you actively want to learn Rust. Tauri is leaner but you'd be rebuilding tooling. Familiarity wins for a solo dev.

### 2.2 UI framework

| Choice | Why |
|---|---|
| **React 19 + TypeScript (strict)** | Same DX you have, React Compiler (auto-memo) lands in 19, useOptimistic / use() are great for SQLite-backed local apps. |
| **Solid.js** | Faster, smaller, JSX-like. Worth it if perf is a goal. Smaller ecosystem. |
| **Svelte 5 (runes)** | Excellent DX, smallest bundles. Tiny ecosystem for desktop. |

**Recommendation: React 19 + TS strict.** Stay on what's familiar; new features (Compiler, Actions, `use()`) reduce boilerplate.

### 2.3 Styling — *most impactful change for v2*

Drop one-CSS-file-per-component (it didn't scale).

| Choice | Why |
|---|---|
| **Tailwind CSS v4** + **shadcn/ui** | Tokens via CSS vars, design system in one place, copy-paste components you own (no library lock-in). Modern, batteries-included. |
| **Panda CSS** (zero-runtime CSS-in-JS) | Type-safe tokens, atomic CSS at build time, recipes for variants. Steeper learning curve. |
| **vanilla-extract** | Type-safe CSS modules, zero runtime. Smaller community than Panda. |

**Recommendation: Tailwind v4 + shadcn/ui + Radix Primitives.**
- shadcn gives you accessible Dialog / Combobox / DataTable / Toast you own outright.
- Radix handles focus traps, ARIA, keyboard nav — fixes the a11y gaps in v1.
- Tailwind v4's CSS-first config means design tokens stay in one `globals.css` file.

### 2.4 State / data layer

There is no "server state" in a local SQLite app — every IPC call returns instantly from the same machine. But the *patterns* server-state libraries use (caching, invalidation, optimistic updates) still apply, because re-running an IPC query for every component re-render is wasteful.

| Concern | v1 | v2 recommendation |
|---|---|---|
| **DB-backed state** (cache + invalidation) | hand-rolled `useApi` + cache keys + manual invalidation | **TanStack Query v5** — treats `window.api.*` calls as the "query function". Caching + invalidation + optimistic updates work identically to a network app, with zero added latency. |
| **UI / ephemeral state** | React Context | **Zustand** (lighter than Redux, no boilerplate) for sidebar open/closed, active filters, etc. Keep Context for theme + active project. |
| **Forms** | manual `useState` everywhere | **React Hook Form** + **Zod** schema. Catches missing fields at compile time. |
| **Routing** | hash-based custom router | **TanStack Router** — type-safe routes, search-param parsing built-in. Works fine in Electron with hash history. |

### 2.5 Database — local SQLite, no server

This app is offline-first by design. The database is **one SQLite file on the user's disk**. No PowerSync, no Turso, no Supabase, no replicas. Don't even leave a hook for "future sync" — it adds boilerplate you won't use.

| Choice | Why |
|---|---|
| **better-sqlite3 + Drizzle ORM** | Type-safe schema, migrations as code, raw SQL escape hatch. Synchronous = perfect fit for Electron main process. |
| **better-sqlite3 + Kysely** | Type-safe query builder, no ORM overhead, less magic than Drizzle. |
| **better-sqlite3 only (hand-rolled repos like v1)** | Zero magic. Works. But you re-implement type-mapping per table. v1 already proved the pain. |

**Recommendation: better-sqlite3 + Drizzle.** Schema → types automatically. Migrations are TypeScript, not string-concatenated SQL.

#### 2.5.1 Database file location

The SQLite file lives in Electron's `app.getPath('userData')`:
- macOS: `~/Library/Application Support/QA Workspace/qa-workspace.db`
- Windows: `%APPDATA%/QA Workspace/qa-workspace.db`

Never hard-code a path. Never put the DB next to the executable — installers may sit in a read-only location.

#### 2.5.2 Migration safety (critical for a shipped local-only tool)

Since users update the app, the DB file already exists on disk when a new schema arrives. Migrations must be:

- **Forward-only** — never `DROP COLUMN` without writing a real backfill.
- **Idempotent** — re-running a migration on an already-migrated DB must be a no-op.
- **Atomic** — wrap each migration in `BEGIN TRANSACTION; ... COMMIT;`. If any step fails, the DB rolls back, the app surfaces an error, the user keeps their data.
- **Versioned in the file itself** — store the schema version in a `meta` table; on startup, run any migrations with a version > current.
- **Backed up before any v2 migration** — copy `qa-workspace.db` → `qa-workspace.db.backup-<timestamp>` BEFORE running migrations that change column types or drop columns. If migration fails, restore from the backup.

This matters because there's no central server to fix things. A botched migration on a user's machine destroys their data with no recovery path other than the backup file.

#### 2.5.3 Backup / restore — must-have feature for v2

Build into the app from day 1:

- **Export full database** — File menu → "Backup workspace…" → save the `.db` file (with VACUUM INTO for compactness) to a user-chosen folder.
- **Import full database** — File menu → "Restore from backup…" → choose a `.db` file, confirm, atomically swap in.
- **Auto-snapshot before migrations** — Done invisibly on app launch when a migration runs. Keep last 3 snapshots in `userData/snapshots/`.
- **Per-project export** — JSON bundle of one project (Project + Categories + Subcats + Cases + Plans + Cycles + Assignments). Users transport projects between machines or share with teammates this way. **This is your "sync".**
- **Per-project import** — Read the JSON bundle, write into the current DB. Handle ID collisions by remapping.

This replaces every reason someone would want "cloud sync" without adding any server infrastructure.

### 2.6 Testing (v1 has none)

| Layer | Tool |
|---|---|
| Unit / repo tests | **Vitest** |
| Component tests | **Vitest + React Testing Library** |
| End-to-end | **Playwright** (works against Electron) |
| Visual regression | **Playwright + percy** or **Chromatic** (free for OSS) |

Target: every repository method has at least one test. Components: smoke test main pages render.

### 2.7 UI/UX patterns worth adopting

- **Command palette** (`Cmd/Ctrl-K`) — like Linear / GitHub. Use [`cmdk`](https://cmdk.paco.me). One shortcut to jump to any project / case / cycle.
- **Optimistic updates** for status changes (Pass/Fail). TanStack Query + `useOptimistic` make this trivial.
- **Tanstack Table** for case lists — sorting, filtering, column visibility, virtualization for 10k+ rows.
- **Sonner** for toast notifications. Better than building your own.
- **Vaul** for bottom-sheet style mobile-ish modals on macOS.
- **Tiptap** for rich-text test-case descriptions if Markdown isn't enough.
- **Theming**: light + dark via Tailwind v4's `@theme` block. Pick one accent color per project (you already have `project.color`) and theme the UI per active project.
- **Empty states with illustrations** — every list screen needs one. v1 just shows blank.
- **Bulk operations** — multi-select rows + batch status update. v1 has `batchUnassign` only; expand to status changes.
- **Keyboard-first** — every action has a shortcut, surfaced via `?` cheat-sheet modal.
- **Undo via "Restore" toast** — destructive ops (delete cycle) push a snapshot to memory; toast offers Undo for 8s.

### 2.8 Reports / exports

- Replace ad-hoc PDF generation with **`@react-pdf/renderer`** — write PDFs in JSX. Easier to maintain than HTML→PDF pipelines.
- Add CSV / XLSX export via **`exceljs`** for execution data.

### 2.9 Distribution (small group, Mac + Windows)

- **electron-builder** with code-signing.
  - macOS: Apple Developer ID ($99/yr). Required for users to open without right-click-bypass.
  - Windows: Code-signing cert (Sectigo / DigiCert, ~$80–$300/yr) OR ship unsigned and document SmartScreen bypass.
- **Auto-update**: `electron-updater` against GitHub Releases. **This is the only network call the app makes** — to check for new app binaries, not to sync user data. Document this clearly to users; some QA-tool environments are network-restricted and `electron-updater` should be toggleable in settings.
- **Distribution channel**: GitHub Releases for the alpha. Move to a tiny landing page (Vercel) once outside your inner circle. Both are public — no user data ever leaves their machine.

---

## Part 3 — Brain (Obsidian) Workflow — Audit & Rebuild

### 3.1 What's working today

- **Vault-inside-repo** at `Brain/` — Claude sees docs alongside code. ✔ Keep.
- **Per-project context map** as Home Base — Claude reads it first. ✔ Keep.
- **Journal-per-session** — durable memory across context resets. ✔ Keep.
- **Rules folder** separates the "what" from the "how". ✔ Keep, but slim it.

### 3.2 What's bloated

| Issue | Evidence |
|---|---|
| Too many rule files | 8 rules totalling thousands of lines. Most overlap with code that already demonstrates the pattern. |
| ADR over-use | Only 2 ADRs in practice; the rest were promoted into rules. Architecture says "rules vs ADRs" but the line is fuzzy. |
| Workflows duplicate `CLAUDE.md` | session-start, session-end, new-feature all repeat info. |
| Architecture.md is a 232-line essay | Claude has to load it to understand the vault. Too long for a "map." |
| Structural Sync Rule is heavy | Every file move triggers updates in 3+ docs. |

### 3.3 Proposed v2 vault — leaner, layered

```
Brain/
├── README.md                ← 30 lines max: "this is Claude's memory. Start here."
├── Architecture.md          ← 60 lines: ONLY the vault map + when-to-write-what
│
├── <Project>/
│   ├── CONTEXT.md           ← Home Base (purpose, stack, hard constraints, Do/Don't only)
│   ├── decisions.md         ← FLAT FILE of bulleted ADRs. One bullet per decision. No more separate ADR files unless one decision needs > 200 words.
│   ├── journals/
│   │   └── YYYY-MM-DD.md    ← one file per session, slim template
│   └── lessons/
│       └── <slug>.md        ← only bugs that took > 30 min; grep-friendly error string at top
│
└── prompts/                 ← personas + reusable prompt templates
```

**Cuts:**
- `Rules/*.md` → fold into `CONTEXT.md`. If a rule is > 200 lines, it's a tutorial, not a rule.
- `ADR/` → replaced by `decisions.md` (one bulleted file).
- `Workflows/` → fold into `CLAUDE.md` (these are workflows for Claude, not for you).
- `Templates/` → fold into `CLAUDE.md` as inline templates Claude can copy.
- `Library/Patterns`, `Library/Boilerplates` → drop. The codebase is the boilerplate.
- `LLM-Config/` → keep `prompts/` but flatten.
- `Context/file-map.md` → drop entirely. Use **glob + grep on demand**; a stale file-map is worse than no map.

### 3.4 New session protocol

```
Session start:
  Claude reads: CLAUDE.md → Brain/<Project>/CONTEXT.md → last 1 journal.
  Total tokens: ~3k (vs 15k+ today).

Mid-session:
  When stuck, grep `lessons/` for error string.
  When unsure of a constraint, re-read CONTEXT.md (it's small).

Session end:
  Append a journal: 8-line template (shipped / decided / next / traps).
  If new decision: append one bullet to decisions.md (don't make a file).
  If bug > 30 min: write a lesson.
  Do NOT update file-maps, architecture diagrams, or sync docs.
```

### 3.5 Slim journal template

```markdown
---
date: YYYY-MM-DD
---
## Shipped
- file/path.tsx — what changed (1 line)

## Decided
- short bullet — reason (1 line)

## Next
- concrete TODO

## Traps
- "if you touch X, watch out for Y"
```

That's the whole template. Anything longer wastes tokens at session start.

### 3.6 Two new helpers

1. **`CLAUDE.md` ≤ 80 lines.** Just: stack, commands, hard constraints, "read `Brain/<Project>/CONTEXT.md` first."
2. **`Brain/<Project>/CONTEXT.md` ≤ 200 lines.** All hard constraints + Do/Don't + entry points + commands. No prose.

Result: a fresh Claude session has the entire mental model in < 5k tokens.

---

## Part 4 — Reducing Token Cost of File Reads

You're right that every Read = full re-read = tokens. Five concrete techniques:

### 4.1 Use `offset` + `limit` on Read
```
Read(path, offset=100, limit=80)   # reads lines 100–180 only
```
Always do this when you know roughly where the target is (from a previous Grep / Glob hit).

### 4.2 Grep first, Read second
```
Grep(pattern, output_mode="content", -n=true, -C=5)
```
Returns matching lines + 5 lines of context, no need to Read the whole file. For "where is function X defined", this is almost always enough.

### 4.3 Glob to enumerate, then targeted Read
Use Glob to list files; Read only the ones you suspect. Glob is cheap (just paths).

### 4.4 Edit > Write
Edit sends a diff (old_string → new_string). Write resends the whole file. Always prefer Edit for changes to existing files.

### 4.5 Keep files short

- Components ≤ 150 lines. Extract hooks / subcomponents when they grow.
- CSS files ≤ 200 lines. Tailwind v2 eliminates most of these.
- Mega "barrel" exports (`index.ts` re-exporting 40 modules) force Claude to read 40 files to understand one. Avoid them.
- Split repository files by entity (one file per table). v1 already does this — keep it.
- Co-locate types with their domain (don't have a 600-line `types.ts`).

### 4.6 Specialized agents

For "where is X used / defined / referenced" tasks, dispatch to a search-only sub-agent:
```
Agent(subagent_type="caveman:cavecrew-investigator",
      prompt="list every file that references useProjects()")
```
The sub-agent does the grepping in its own context window. Your main context only receives the summary.

### 4.7 Net effect

In v1, a typical session start consumes 15–25k tokens just on context loading. With these changes, target 3–5k.

---

## Part 5 — Git Workflow for a Solo Developer (macOS + Windows users)

You are the only contributor. Users run on both macOS and Windows. The git workflow has two jobs:

1. Give YOU a safety net (undo, branches, history) while you build.
2. Drive a CI pipeline that produces signed installers for BOTH platforms when you cut a release.

That means: skip team ceremony (mandatory PR reviews, multi-approver gates), but KEEP the parts that protect you from yourself and produce real binaries.

### 5.1 One-time setup (per machine)

```bash
# Identity (use your real name + email; matches your GitHub account)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Cross-platform line-ending sanity:
# Windows:
git config --global core.autocrlf true
# macOS / Linux:
git config --global core.autocrlf input

# Sensible defaults
git config --global init.defaultBranch main
git config --global pull.rebase true       # rebase on pull → linear history
git config --global push.autoSetupRemote true  # `git push` works without -u

# Cache GitHub credentials so you don't retype them
# macOS:
git config --global credential.helper osxkeychain
# Windows:
git config --global credential.helper manager
```

Install GitHub CLI on both OSes (`gh` covers PRs, releases, secrets, runs):
- macOS: `brew install gh`
- Windows: `winget install GitHub.cli`
- Authenticate once per machine: `gh auth login`

If you develop on both a Mac and a Windows machine, sync via a private GitHub repo. Don't share via Dropbox / OneDrive — git inside cloud-synced folders corrupts.

### 5.2 Repo structure — keep it boring

Solo dev = no `develop` branch, no `release/*` branches, no `feature/`-prefix policing. Two long-lived states:

```
main                     ← always builds, always releasable. THE branch.
<feature-or-fix>/<slug>  ← short-lived; merge back to main same day or next day
```

That's it. Branches are for **work-in-progress safety**, not collaboration.

When to branch vs. commit straight to main:

| Situation | Action |
|---|---|
| Tiny fix / typo / doc edit | Commit directly to `main`. |
| Anything that takes > 1 commit OR might fail | Branch. Merge when working. |
| Experimenting / "what if I tried X" | Branch. Throw away if it doesn't pan out. |
| About to cut a release | Be on `main`, clean working tree, then tag. |

### 5.3 Daily workflow — solo edition

```bash
# 1. Sync main before starting (in case you committed from the other machine)
git checkout main
git pull

# 2. For non-trivial work, branch:
git checkout -b feat/bulk-status-update

# 3. Work. Commit often, in small focused chunks.
git add src/renderer/pages/ExecutionPage.tsx
git commit -m "feat(execution): allow bulk status update from sidebar"

# 4. If a feature spans days, rebase onto main occasionally:
git fetch origin
git rebase origin/main

# 5. Push so the other machine / CI can see it
git push

# 6a. When done, merge yourself:
git checkout main
git merge --no-ff feat/bulk-status-update    # --no-ff keeps the branch visible in history
git push
git branch -d feat/bulk-status-update
git push origin --delete feat/bulk-status-update

# 6b. OR open a PR even though you're alone — useful if you want:
#     - CI to run before merging (lint/test/build green)
#     - A diff view to self-review
#     - A history of why a change landed
gh pr create --fill
# Once CI is green, merge from the GitHub UI (Squash & Merge).
```

**Solo PR question:** Open a PR (option 6b) when CI exists OR the change is risky. Otherwise merge locally (6a). Both are fine.

### 5.4 Commit message convention — Conventional Commits

Every commit message:
```
<type>(<scope>): <summary>

<optional body>

<optional footer (BREAKING CHANGE:, refs #123)>
```

Types you'll use:
- `feat` — new feature
- `fix` — bug fix
- `refactor` — restructure, no behavior change
- `style` — formatting only
- `docs` — docs only
- `chore` — tooling, deps, config
- `test` — adding / fixing tests
- `perf` — performance

Examples:
```
feat(reports): add CSV export for multi-cycle data
fix(execution): scroll active case into view on keyboard nav
chore(deps): bump electron to 33.0.1
```

Why: makes changelogs trivial to auto-generate and forces you to think in atomic changes.

### 5.5 Release workflow — solo dev, dual-OS users

You ship `.dmg` (Mac) and `.exe` (Win). One huge constraint: **you cannot build a macOS `.dmg` on a Windows machine, and code-signing Windows binaries on Mac is awkward.** GitHub Actions solves this — it runs a macOS VM AND a Windows VM in parallel from a single tag-push.

**Solo rule of thumb: never build release binaries on your laptop. Always let CI do it.** Reasons:
- Reproducibility: the binary you ship was built from the tagged commit, in a clean VM, every time.
- Cross-platform: you don't need both machines on at release time.
- Signing secrets: stored once in GitHub Secrets, not on your disk.

#### 5.5.1 Versioning — SemVer
- `MAJOR` — breaks compatibility (e.g. DB schema change without migration).
- `MINOR` — new user-facing feature, backward-compatible.
- `PATCH` — bug fix or internal change only.

Reflected in `package.json` → `"version": "1.2.3"`.

#### 5.5.2 Release in 3 commands (after CI is set up)

```bash
# 1. Confirm main is clean and green
git checkout main
git pull
git status                  # must be clean

# 2. Bump version → creates package.json bump + tag in one shot
npm version minor -m "chore(release): %s"

# 3. Push the commit AND the tag → CI takes over from here
git push origin main --follow-tags
```

That's the whole release. CI will:
- Spin up macOS + Windows runners in parallel.
- Build, sign, notarize.
- Publish a draft GitHub Release with both installers attached.
- You go to the release in GitHub, write release notes, click "Publish".
- Users running v1.1.x get auto-updated by `electron-updater`.

#### 5.5.3 GitHub Actions release workflow

`.github/workflows/release.yml` — fires when you push a `v*` tag:

```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npx electron-builder --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # macOS signing:
          CSC_LINK: ${{ secrets.MAC_CERTS }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTS_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

### 5.6 Optional self-protection on `main`

You don't need PR reviews (no reviewer exists). You DO want to stop yourself force-pushing or pushing a broken main. In GitHub → Settings → Branches → Add ruleset for `main`:

- ✅ Restrict deletions
- ✅ Block force pushes
- ✅ Require status checks to pass (point at the `ci` job once you have it)
- ❌ Require pull request (skip — solo dev)
- ❌ Require approvals (skip)

Result: you can still `git push` to main directly for tiny fixes, but you can't force-push or push if CI is failing.

If you want **even more discipline**, flip "Require pull request" on and require it from yourself. Some solo devs do this; most find it annoying.

### 5.7 Hotfix workflow

Production bug, needs a fast patch. Same as a normal release, just with `patch`:

```bash
git checkout main
git pull
git checkout -b fix/cycle-delete-crash

# Fix + commit
git add .
git commit -m "fix(cycles): prevent crash when deleting an active cycle"

# Merge yourself
git checkout main
git merge --no-ff fix/cycle-delete-crash
git push

# Cut a patch release
npm version patch -m "chore(release): %s"
git push origin main --follow-tags
# CI builds v1.2.1 for both platforms, attaches to a draft release.
```

If the bug is critical and you've shipped, post on whatever channel your users watch ("v1.2.1 released, auto-update should kick in within an hour").

### 5.8 Common things that bite new git users

| Trap | Fix |
|---|---|
| `git push --force` on `main` | Don't. Use `--force-with-lease` on your own branches only. Never on `main`. |
| Committing `node_modules/` | Make sure `.gitignore` excludes it. |
| Committing the SQLite `.db` file | Add `*.db`, `*.db-journal`, `*.db-wal`, `*.db-shm` to `.gitignore`. |
| Mac vs Windows line endings (`CRLF` vs `LF`) | The `core.autocrlf` setting above fixes this. Add `.gitattributes` with `* text=auto` to enforce it repo-wide. |
| Long-lived feature branches | Merge into `main` weekly at worst. Long branches = painful rebases. |
| Forgot to rebase before opening PR | Run `git fetch && git rebase origin/main` before pushing. |
| Lost work | `git reflog` shows everything for 90 days. Recoverable. |

### 5.9 Required `.gitignore` and `.gitattributes`

**`.gitignore`**:
```
# Dependencies
node_modules/

# Build output
dist/
out/
build/
.vite/

# Local SQLite
*.db
*.db-journal
*.db-wal
*.db-shm

# OS files
.DS_Store
Thumbs.db
desktop.ini

# Editors
.vscode/
.idea/
*.swp

# Env
.env
.env.local

# Logs
*.log
npm-debug.log*

# Electron-builder output
release/
```

**`.gitattributes`** (cross-platform line endings):
```
* text=auto eol=lf

*.bat text eol=crlf
*.cmd text eol=crlf
*.ps1 text eol=crlf

*.png binary
*.jpg binary
*.ico binary
*.icns binary
*.dmg binary
*.exe binary
```

### 5.10 Pre-commit hooks — strongly recommended for solo work

When you're alone, there's no second pair of eyes to catch sloppy commits. Automate the eyes.

Install **husky** + **lint-staged**:
```bash
npm install -D husky lint-staged
npx husky init
```

In `package.json`:
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,md,json}": ["prettier --write"]
}
```

Now every commit auto-formats and lints touched files. Zero discipline required.

Also wire `npm run typecheck` (i.e. `tsc --noEmit`) into the pre-push hook so you can't push a build that won't compile:

```bash
echo "npm run typecheck" > .husky/pre-push
chmod +x .husky/pre-push
```

### 5.11 Cross-platform CI workflow (for `main` pushes, before release)

You want a lightweight CI that runs on every push to `main` AND every PR — separately from release builds. Catches "doesn't compile on Windows" or "lint fails" before you tag.

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  lint-typecheck-test:
    strategy:
      fail-fast: false
      matrix:
        os: [macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

This runs on both runners in parallel. ~2 min per push, free under the 2000 min/month allowance for private repos (public repos: unlimited).

### 5.12 Solo-dev release checklist

Print and pin this:

```
[ ] Working tree clean? (`git status`)
[ ] On main, pulled latest? (`git checkout main && git pull`)
[ ] CI green on last commit? (check GitHub Actions tab)
[ ] Test the dev build one last time? (`npm run dev`, click around)
[ ] Bump version? (`npm version patch|minor|major`)
[ ] Push with tag? (`git push origin main --follow-tags`)
[ ] Wait for CI release job to finish (~10–15 min)
[ ] Edit the GitHub release draft, write notes, click "Publish"
[ ] Verify auto-update kicks in (run an older version locally, wait, confirm update)
```

---

## Part 6 — Suggested First Sprint for v2

If you want a concrete plan to start tomorrow:

### Week 1 — Skeleton
1. `pnpm create electron-vite@latest qa-workspace-v2 -- --template react-ts`
2. Add Tailwind v4, shadcn/ui CLI, TanStack Query, TanStack Router.
3. Add Drizzle + better-sqlite3. Define schema for **Projects** only.
4. Build **Projects** CRUD end-to-end (IPC → repo → query → UI) as the reference pattern.
5. Set up private GitHub repo. Wire `.gitignore` / `.gitattributes`, husky pre-commit + pre-push, the CI workflow from §5.11, and the release workflow skeleton from §5.5.3. Tag `v0.0.1` as a dry run to verify CI produces both installers.

### Week 2 — Core domain
6. Add Categories, Subcategories, Test Cases (with steps editor).
7. JSON import/export for Test Cases.
8. Command palette (`cmdk`) — jump to any project / case.
9. Dark mode + per-project accent color.

### Week 3 — Planning & execution
10. Test Plans (with task-list budget — but now in a proper `task` table, not JSON).
11. Test Cycles.
12. Two-pane Execution page (port the v1 design — it works).
13. Optimistic status updates.

### Week 4 — Polish & release
14. Reports (PDF + CSV).
15. **Backup / restore + per-project JSON bundle** (§2.5.3) — non-negotiable for a local-only tool.
16. Vitest for repos; Playwright for one happy-path E2E.
17. Code signing + GitHub Actions release workflow.
18. Tag `v0.1.0`, ship to your inner circle.

---

## Part 7 — Quick decisions checklist

Tick before you start the v2 repo:

- [ ] Electron or Tauri? (Recommendation: **Electron**)
- [ ] React, Solid, or Svelte? (Recommendation: **React 19**)
- [ ] Tailwind v4 + shadcn? (Recommendation: **Yes**)
- [ ] Drizzle vs Kysely vs raw SQL? (Recommendation: **Drizzle**)
- [ ] Local-only — no server / cloud / sync — confirmed? (Recommendation: **Yes**; replace "sync" with per-project JSON export/import + full-DB backup/restore)
- [ ] Build backup/restore + JSON bundle export from day 1? (Recommendation: **Yes** — only safety net for users on a local-only tool)
- [ ] Auto-backup the DB before every migration? (Recommendation: **Yes** — single biggest data-loss risk for a local app)
- [ ] Trunk-based git (just `main` + short feature branches)? (Recommendation: **Yes** for solo dev)
- [ ] Conventional Commits? (Recommendation: **Yes** — auto-generated changelogs make releases trivial)
- [ ] Skip mandatory PR reviews (since you're solo)? (Recommendation: **Yes**, but keep CI gating on `main`)
- [ ] Build releases on GitHub Actions only, never locally? (Recommendation: **Yes** — only way to cross-build Mac + Win reliably)
- [ ] Code sign on macOS? (Recommendation: **Yes from day 1** — $99/yr saves hours of "can't open this app" support)
- [ ] Code sign on Windows? (Recommendation: **Defer** — start unsigned, document the SmartScreen click-through, add signing later if support load justifies $80–300/yr)
- [ ] Auto-update via electron-updater? (Recommendation: **Yes** — set up before first external alpha so you can ship fixes painlessly)
- [ ] Lean Brain vault (Part 3)? (Recommendation: **Yes** — slash file count by 70%)
- [ ] Husky + lint-staged + pre-push typecheck? (Recommendation: **Yes** — solo work needs automated guardrails)

---

End of handoff document. Reference this any time during the v2 build.
