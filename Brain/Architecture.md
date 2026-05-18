# Vault Architecture

Map of where information lives. Keep this under 60 lines.

## Files and what they hold

| File | Holds | Max size |
|---|---|---|
| `CLAUDE.md` (root) | Stack, commands, hard rules, agent fleet | 100 lines |
| `NEW-PROJECT-HANDOFF.md` (root) | Greenfield plan + tech decisions for v2 | as-is |
| `Brain/README.md` | Entry point | 30 lines |
| `Brain/Architecture.md` | This file | 60 lines |
| `Brain/qa-workspace-v2/CONTEXT.md` | Project home base — constraints, entry points, Do/Don't | 200 lines |
| `Brain/qa-workspace-v2/decisions.md` | Flat ADR log, one bullet per decision | grows |
| `Brain/qa-workspace-v2/journals/<date>.md` | Per-session log | 8 lines template |
| `Brain/qa-workspace-v2/lessons/<slug>.md` | Hard bugs > 30 min | grep-friendly |
| `Brain/prompts/<name>.md` | Reusable prompt templates | as-needed |

## Where new info goes

- **Hard constraint discovered** → `CONTEXT.md` under Do/Don't.
- **Architectural decision made** → one bullet in `decisions.md`.
- **Session work done** → new journal in `journals/`.
- **Bug took > 30 min** → lesson in `lessons/`, error string at top.
- **Anything else** → probably doesn't belong in Brain. Codebase or commit message instead.

## What NEVER goes in Brain

- File maps (use glob/grep on demand)
- Architecture diagrams (rot fast)
- Sync docs ("update X when Y moves" — heavy maintenance)
- Workflow steps (live in `CLAUDE.md`)
- Code patterns (the codebase is the pattern)

Total tokens at session start: target < 5k.
