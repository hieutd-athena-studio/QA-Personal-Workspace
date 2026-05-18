# Brain

Claude's memory for this repo. Read this first when you don't know where else to start.

## Layout

```
Brain/
├── README.md              this file
├── Architecture.md        vault map + when-to-write-what
├── qa-workspace-v2/       per-project home base
│   ├── CONTEXT.md         purpose, stack, hard constraints, Do/Don't
│   ├── decisions.md       flat bulleted ADR log
│   ├── journals/          one file per session (YYYY-MM-DD.md)
│   └── lessons/           bugs that took > 30 min, error string at top
└── prompts/               reusable prompt templates / personas
```

## How to use

- **Session start**: read `CLAUDE.md` (root) → `Brain/qa-workspace-v2/CONTEXT.md` → newest journal.
- **Stuck on bug**: grep `lessons/` for error string before debugging from scratch.
- **Made decision**: append bullet to `decisions.md`. Don't create new file unless > 200 words.
- **Session end**: append journal with shipped/decided/next/traps.

Do NOT keep file-maps, architecture diagrams, or sync docs here. Stale > absent.
