# Decisions — QA Workspace v2

Flat bulleted ADR log. One bullet per decision. If > 200 words, promote to its own file under this directory.

Format: `YYYY-MM-DD — decision — reason — alternatives rejected`

---

- **2026-05-18 — Reboot v1 as v2 from scratch** — v1 has dispersed CSS, no tests, JSON-in-TEXT task storage, undiagnosed Dashboard crash. Rewrite cleaner with modern stack. Alt rejected: incremental refactor — too many cross-cutting changes (CSS system, state mgmt, DB layer) to do in-place.
- **2026-05-18 — Stay on Electron, not Tauri** — Solo dev, familiarity wins. Bundle size (~120 MB) acceptable for an internal QA tool. Alt rejected: Tauri 2 — Rust learning curve + rebuilding tooling not worth 10× binary reduction.
- **2026-05-18 — React 19 + TS strict** — Same DX, React Compiler reduces memo boilerplate, `useOptimistic`/`use()` fit SQLite-backed local apps. Alt rejected: Solid, Svelte 5 — smaller ecosystem for desktop.
- **2026-05-18 — Tailwind v4 + shadcn/ui + Radix** — Tokens in one `globals.css`, owned components (no library lock-in), a11y for free via Radix. Alt rejected: Panda CSS (steeper curve), vanilla-extract (smaller community).
- **2026-05-18 — TanStack Query for DB-backed state** — Cache + invalidation + optimistic updates pattern works identically to network apps with zero added latency. Alt rejected: hand-rolled cache (v1 did this — fragile).
- **2026-05-18 — Zustand for UI state, Context for theme + active project** — Lighter than Redux, no boilerplate. Keep Context where global identity matters. Alt rejected: Redux Toolkit (overkill), Jotai (atom proliferation).
- **2026-05-18 — React Hook Form + Zod** — Schema-derived types via `z.infer`. Catches missing fields at compile time. Alt rejected: manual `useState` (v1 pain), Formik (less ergonomic with TS).
- **2026-05-18 — TanStack Router** — Type-safe routes, search-param parsing built-in. Hash history works in Electron. Alt rejected: React Router v7 (less type-safe), custom hash router (v1 pain).
- **2026-05-18 — better-sqlite3 + Drizzle ORM** — Schema → types automatically. Migrations as TS, not concatenated SQL. Synchronous fits Electron main process. Alt rejected: Kysely (no schema-as-source-of-truth), raw better-sqlite3 (v1 proved type-mapping per table is painful).
- **2026-05-18 — No "future sync" hooks in code** — Adds boilerplate that will never run. Per-project JSON export/import + full-DB backup/restore is the sync replacement. Alt rejected: PowerSync/Turso/Supabase — violates "fully local" scope.
- **2026-05-18 — Backup/restore is day-1 feature** — Only safety net users have on a local-only tool. Alt rejected: defer to phase 2 — botched migration with no backup destroys user data.
- **2026-05-18 — Conventional Commits** — Auto-generated changelogs. Atomic-thinking discipline. Alt rejected: free-form commit messages.
- **2026-05-18 — Trunk-based git (main + short feature branches)** — Solo dev = no need for `develop`, `release/*`. Branches only for WIP safety, not collaboration. Alt rejected: Gitflow — ceremony cost outweighs benefit at team size 1.
- **2026-05-18 — Release builds via GitHub Actions only** — Cross-platform (Mac + Win VMs in parallel) + reproducible + signing secrets stay in GitHub. Alt rejected: local builds — Mac DMG can't be built on Windows.
- **2026-05-18 — Defer Windows code-signing** — $80–300/yr. Ship unsigned + document SmartScreen click-through. Revisit if support load justifies. Alt rejected: pay from day 1 — premature.
- **2026-05-18 — Apple Developer ID from day 1 (alpha-ready)** — $99/yr saves hours of "can't open this app" support. Alt rejected: defer — macOS Gatekeeper UX too bad without signing.
- **2026-05-18 — Agent fleet model selection** — db-migration on `opus` (safety-critical, low freq), main-coder + ui-designer on `sonnet` (frequent, cost matters). Alt rejected: all-Opus (5× cost), all-Sonnet (data-loss risk too high on migration agent).
- **2026-05-18 — Brain vault lean rewrite** — Drop Rules/, ADR/, Workflows/, Templates/, Library/, Context/file-map.md. Replace with Brain/<Project>/{CONTEXT.md, decisions.md, journals/, lessons/}. Alt rejected: keep v1 vault — 15k+ tokens at session start unsustainable.
