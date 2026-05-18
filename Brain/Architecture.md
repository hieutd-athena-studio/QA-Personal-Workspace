# Vault Architecture

Map of where information lives. Keep this under 60 lines.

## Files and what they hold

| File                                    | Holds                                                   | Max size         |
| --------------------------------------- | ------------------------------------------------------- | ---------------- |
| `../CLAUDE.md` (repo root)              | Stack, commands, hard rules, agent fleet                | 100 lines        |
| `../NEW-PROJECT-HANDOFF.md` (repo root) | Greenfield plan + tech decisions for v2                 | as-is            |
| [[README]]                              | Vault entry point                                       | 30 lines         |
| [[Architecture]]                        | This file                                               | 60 lines         |
| [[CONTEXT]]                             | Project home base — constraints, entry points, Do/Don't | 200 lines        |
| [[decisions]]                           | Flat ADR log, one bullet per decision                   | grows            |
| `qa-workspace-v2/journals/<date>.md`    | Per-session log                                         | 8 lines template |
| `qa-workspace-v2/lessons/<slug>.md`     | Hard bugs > 30 min                                      | grep-friendly    |
| `prompts/<name>.md`                     | Reusable prompt templates                               | as-needed        |

## Where new info goes

- **Hard constraint discovered** → [[CONTEXT]] under Do/Don't.
- **Architectural decision made** → one bullet in [[decisions]].
- **Session work done** → new journal in `journals/`.
- **Bug took > 30 min** → lesson in `lessons/`, error string at top.
- **Anything else** → probably doesn't belong in Brain. Codebase or commit message instead.

## What NEVER goes in Brain

- File maps (use glob/grep on demand)
- Architecture diagrams (rot fast)
- Sync docs ("update X when Y moves" — heavy maintenance)
- Workflow steps (live in `../CLAUDE.md`)
- Code patterns (the codebase is the pattern)

## Graph view tips

- Filter on tag `#qa-workspace-v2` or path `qa-workspace-v2/` to see only this project's cluster.
- Decisions and lessons naturally orbit [[CONTEXT]] — that's the desired shape.
- If a node has no backlinks after a week, it's dead weight. Delete or merge.

Total tokens at session start: target < 5k.
