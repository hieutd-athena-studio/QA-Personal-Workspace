# CLAUDE.md — QA Workspace v2

This file is auto-loaded at the start of every Claude Code session in this directory. Read it first.

## What this project is

QA Workspace v2 — a fully local, offline-first, single-user desktop tool for QA test case management. Mac + Windows. SQLite file lives in `app.getPath('userData')`. No server, no cloud, no sync. See `NEW-PROJECT-HANDOFF.md` for the full scope and architecture decisions.

## Tech stack (do not deviate without discussion)

- Electron + electron-vite + electron-builder
- React 19 + TypeScript strict
- Tailwind v4 + shadcn/ui + Radix Primitives
- TanStack Query v5 (DB cache), TanStack Router (routing), Zustand (UI state)
- React Hook Form + Zod (forms)
- better-sqlite3 + Drizzle ORM (DB)
- Vitest + React Testing Library + Playwright (tests)
- electron-updater against GitHub Releases (auto-update)

## Agent fleet — who does what

Spawn via the `Agent` tool. Each agent gets a fresh context window and returns only a summary.

| When you need... | Spawn | Source |
|---|---|---|
| Plan a feature before coding (multi-file, cross-cutting) | `everything-claude-code:planner` | Harness plugin |
| Implement TS/React/Electron/IPC/forms | `main-coder` | `.claude/agents/main-coder.md` |
| Design or build UI screens / components / theming | `ui-designer` | `.claude/agents/ui-designer.md` |
| Touch DB schema, migrations, backup/restore | `db-migration` | `.claude/agents/db-migration.md` |
| Write tests first (TDD for repos and components) | `everything-claude-code:tdd-guide` | Harness skill |
| Write or run Playwright E2E tests | `everything-claude-code:e2e-runner` | Harness plugin |
| Review code for TS strict + idiomatic patterns | `everything-claude-code:typescript-reviewer` | Harness plugin |
| Review code for security (IPC, file paths, user input) | `everything-claude-code:security-reviewer` | Harness plugin |
| Locate files / find symbols / grep references | `caveman:cavecrew-investigator` | Harness plugin |
| Small 1-2 file edit (typo, rename, mechanical) | `caveman:cavecrew-builder` | Harness plugin |
| Review a diff or PR | `caveman:cavecrew-reviewer` | Harness plugin |

## Standard workflow for a new feature

1. **Plan** → spawn `planner`. Output: file-level plan, IPC contract, schema delta if any.
2. **Schema** (if needed) → spawn `db-migration`. Output: Drizzle schema + migration + backup logic + repo functions.
3. **Tests first** → spawn `tdd-guide`. Output: failing repo tests + component test stubs.
4. **Design** → spawn `ui-designer`. Output: composed shadcn components with mock data.
5. **Implementation** → spawn `main-coder`. Output: IPC wiring, TanStack Query hooks, forms, full feature.
6. **Review** → spawn `typescript-reviewer` then `security-reviewer`. Output: severity-tagged findings.
7. **E2E** → spawn `e2e-runner`. Output: Playwright happy-path test passing.

For tiny edits (typo, comment removal): skip the fleet, use `caveman:cavecrew-builder` or just edit inline.

## Hard rules (every agent honors)

- **No renderer-side Node.** `node:fs`, `better-sqlite3`, `node:path` never appear in `src/renderer/`.
- **No raw SQL strings in repos.** Use Drizzle query builder. Raw SQL only inside migration files.
- **Auto-snapshot DB before every migration.** Hard requirement. Failure to snapshot = abort migration.
- **Forward-only migrations.** No `DROP COLUMN` without a backfill.
- **No new CSS files per component.** Tailwind utilities + `globals.css` tokens only.
- **No `any`, no `@ts-ignore`.** TS strict.
- **Conventional Commits.** `feat(scope):`, `fix(scope):`, `chore(deps):`, etc.
- **Never build release binaries locally.** Always GitHub Actions on tag push.
- **Commit the SQLite file? Never.** `.gitignore` excludes `*.db`, `*.db-journal`, `*.db-wal`, `*.db-shm`.

## Repo commands (once v2 is bootstrapped)

```
pnpm dev              start electron-vite dev server
pnpm typecheck        tsc --noEmit
pnpm lint             eslint
pnpm test             vitest
pnpm test:e2e         playwright test
pnpm build            electron-builder (use CI, not locally, for releases)
```

## Brain vault

Project memory lives in `Brain/`. Layered, lean.

- `Brain/README.md` — entry point
- `Brain/Architecture.md` — where info lives
- `Brain/qa-workspace-v2/CONTEXT.md` — hard constraints + Do/Don't (read every session)
- `Brain/qa-workspace-v2/decisions.md` — flat bulleted ADR log
- `Brain/qa-workspace-v2/journals/<YYYY-MM-DD>.md` — per-session log
- `Brain/qa-workspace-v2/lessons/<slug>.md` — bugs > 30 min, grep-friendly error string at top
- `Brain/prompts/` — reusable prompt templates

## Git workflow scaffolding

Already in repo, do not duplicate:

- `.gitignore` — Node, build output, SQLite, OS files, electron-builder output
- `.gitattributes` — LF default, CRLF for Windows scripts, binary markers
- `.github/workflows/ci.yml` — lint + typecheck + test on macOS + Windows runners, every push/PR
- `.github/workflows/release.yml` — fires on `v*` tag, builds + signs + publishes draft GitHub Release
- `.husky/pre-commit` — runs `lint-staged` (configure in `package.json` once bootstrapped)
- `.husky/pre-push` — runs `pnpm typecheck`
- `RELEASE-CHECKLIST.md` — release walkthrough

Husky hooks need activation after bootstrap: `pnpm install -D husky lint-staged && pnpm exec husky init` — re-run will preserve the existing hook files.

## Session start protocol

1. Read this file.
2. Read `Brain/qa-workspace-v2/CONTEXT.md` for hard constraints.
3. Read newest journal in `Brain/qa-workspace-v2/journals/` if continuing prior work.
4. Read `NEW-PROJECT-HANDOFF.md` only if architecture question is in play.
5. Pick the right agent from the fleet table above. Do not do cross-domain work inline.

## Session end protocol

1. Append journal in `Brain/qa-workspace-v2/journals/<today>.md` — shipped / decided / next / traps.
2. If decision made: append one bullet to `Brain/qa-workspace-v2/decisions.md`.
3. If bug took > 30 min: write a lesson in `Brain/qa-workspace-v2/lessons/`.
