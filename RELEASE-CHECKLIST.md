# Release Checklist

Pin this. Walk top to bottom every release.

```
[ ] Working tree clean? (git status)
[ ] On main, pulled latest? (git checkout main && git pull)
[ ] CI green on last commit? (GitHub Actions tab)
[ ] Test dev build one last time? (pnpm dev, click around)
[ ] Bump version? (npm version patch|minor|major -m "chore(release): %s")
[ ] Push with tag? (git push origin main --follow-tags)
[ ] Wait for CI release job to finish (~10–15 min)
[ ] Edit GitHub release draft, write notes, click "Publish"
[ ] Verify auto-update kicks in (run older version locally, wait, confirm update)
```

## SemVer

- `MAJOR` — breaks compat (e.g. DB schema change without migration)
- `MINOR` — new user-facing feature, backward-compat
- `PATCH` — bug fix or internal change only

## Hotfix

```bash
git checkout main && git pull
git checkout -b fix/<slug>
# fix + commit
git checkout main
git merge --no-ff fix/<slug>
git push
npm version patch -m "chore(release): %s"
git push origin main --follow-tags
```

## Never

- Force-push `main`
- Build release binaries locally (CI only — cross-platform + signing secrets)
- Tag from a branch other than `main`
- Tag before CI is green on that commit
