# Brain

Obsidian vault. Claude's memory for this repo. Read this first when you don't know where else to start.

## Layout

```
Brain/                          ← vault root (open this folder in Obsidian)
├── README.md                   this file
├── Architecture.md             vault map + when-to-write-what
├── qa-workspace-v2/            per-project home base
│   ├── CONTEXT.md              purpose, stack, hard constraints, Do/Don't
│   ├── decisions.md            flat bulleted ADR log
│   ├── journals/               one file per session (YYYY-MM-DD.md)
│   └── lessons/                bugs that took > 30 min, error string at top
└── prompts/                    reusable prompt templates / personas
```

## How to use

- **Session start**: read `../CLAUDE.md` (repo root) → [[CONTEXT]] → newest journal.
- **Stuck on bug**: grep `lessons/` for error string before debugging from scratch.
- **Made decision**: append bullet to [[decisions]]. Don't create new file unless > 200 words.
- **Session end**: append journal with shipped/decided/next/traps.

Do NOT keep file-maps, architecture diagrams, or sync docs here. Stale > absent.

## Obsidian-specific

- Wikilinks (`[[note-name]]`) resolve by filename across the vault — Claude does the same via Glob.
- Daily notes plugin: configure to drop new notes into `qa-workspace-v2/journals/` with `YYYY-MM-DD.md` format.
- Graph view: filter to `qa-workspace-v2/` to see decision ↔ context ↔ lesson ↔ journal cluster.
- See [[Architecture]] for what goes where.
