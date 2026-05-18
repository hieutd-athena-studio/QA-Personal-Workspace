# QA Workspace v2 — Context

Home Base. Claude reads this every session after `CLAUDE.md`.

## Purpose

Local-only, offline-first, single-user desktop tool for QA test case management. Replaces v1 (QA-Workspace-Management-App). Ships to Mac + Windows users. No backend, no auth, no sync, no presence. Each user runs own copy with own SQLite file.

## Domain hierarchy

```
Project (e.g. ARR)
 ├── Category → Subcategory → Test Case (ARR-TC001)
 ├── Test Plan (ARR-PL001)
 │    └── Test Cycle (ARR-PL001-CY01, env: DEV CHEAT | PROD CHEAT | PROD NON-CHEAT)
 │         └── Assignment (Pass | Fail | Blocked | Unexecuted + notes)
 └── Test Type (regression suite groupings, cross-cuts Categories)
```

## Stack

- Electron + electron-vite + electron-builder
- React 19 + TypeScript strict
- Tailwind v4 + shadcn/ui + Radix Primitives
- TanStack Query v5 (DB cache), TanStack Router (routing), Zustand (UI state)
- React Hook Form + Zod (forms)
- better-sqlite3 + Drizzle ORM (DB)
- Vitest + React Testing Library + Playwright (tests)
- electron-updater (auto-update via GitHub Releases)

## Hard constraints

### Electron boundary
- Renderer never imports `node:fs`, `better-sqlite3`, `node:path`. Browser context only.
- Main process owns all DB + file I/O.
- IPC via typed `contextBridge` exposed as `window.api.<entity>.<method>`.
- `nodeIntegration: false`, `contextIsolation: true`. Always.

### Database
- SQLite file at `app.getPath('userData') + '/qa-workspace.db'`. Never hardcoded.
- All migrations: forward-only, idempotent, atomic (`BEGIN TRANSACTION` / `COMMIT`).
- Auto-snapshot DB to `userData/snapshots/qa-workspace.db.backup-<ISO8601>` before every migration. Keep last 3.
- Schema version in `meta` table. On startup, apply migrations where `version > current`.
- Backup/restore UI = day-1 feature. Not "v2 phase 2". Day. One.
- Per-project JSON bundle export/import = the "sync" replacement.

### Code style
- No `any`. No `// @ts-ignore`.
- No per-component `.css` files. Tailwind utilities + `globals.css` `@theme` tokens only.
- Components ≤ 150 lines. Split when bigger.
- No barrel exports (`index.ts` re-exporting 40 modules).
- Repo files split by entity (one file per table).
- No raw SQL strings in repos. Drizzle query builder. Raw SQL only inside migration files.

### Git
- Conventional Commits required.
- Trunk-based: `main` + short-lived `feat/*` or `fix/*` branches.
- Never build release binaries locally. GitHub Actions only.
- Never force-push `main`.
- Never commit `*.db`, `*.db-journal`, `*.db-wal`, `*.db-shm`, `node_modules/`, `.env*`, `release/`.

## Do

- Spawn the right agent before coding (see `CLAUDE.md` fleet table).
- Read this file when unsure of a constraint.
- Append to `decisions.md` when picking between options.
- Drop a journal entry at session end.

## Don't

- Don't add hypothetical-future abstractions (`IRepository<T>`, plugin systems).
- Don't add `try/catch` that just rethrows. TanStack Query surfaces errors.
- Don't write code comments that restate what the code does.
- Don't introduce new deps without checking `NEW-PROJECT-HANDOFF.md` §2.
- Don't expose `ipcRenderer` directly to renderer.
- Don't `DROP COLUMN` without a backfill migration.

## Entry points (once project is bootstrapped)

```
src/main/index.ts            BrowserWindow + IPC registration
src/main/db/client.ts        better-sqlite3 + drizzle instance
src/main/db/migrations/      forward-only migrations
src/preload/index.ts         typed contextBridge API
src/renderer/main.tsx        React root, TanStack Router + QueryClient
src/renderer/styles/globals.css   Tailwind v4 @theme tokens
src/shared/types/            types shared main ↔ renderer
```

## Commands (once bootstrapped)

```
pnpm dev              start electron-vite dev server
pnpm typecheck        tsc --noEmit
pnpm lint             eslint
pnpm test             vitest
pnpm test:e2e         playwright test
pnpm build            electron-builder (DO NOT use locally for releases — CI only)
```

## Open questions / decisions pending

- See `decisions.md` for what's been chosen.
- Apple Developer ID purchase: deferred until alpha-ready.
- Windows code-signing cert: deferred. Ship unsigned + document SmartScreen click-through.
