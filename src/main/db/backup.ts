import type Database from 'better-sqlite3'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'

const SNAPSHOT_RETAIN = 3
const SNAPSHOT_PREFIX = 'qa-workspace.db.backup-'

export function snapshotDatabase(db: Database.Database, userDataPath: string): string {
  const dir = join(userDataPath, 'snapshots')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const target = join(dir, `${SNAPSHOT_PREFIX}${stamp}.db`)

  db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`)

  rotateSnapshots(dir)
  return target
}

function rotateSnapshots(dir: string): void {
  const entries = readdirSync(dir)
    .filter((name) => name.startsWith(SNAPSHOT_PREFIX))
    .map((name) => ({ name, full: join(dir, name), mtime: statSync(join(dir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)

  for (const stale of entries.slice(SNAPSHOT_RETAIN)) {
    unlinkSync(stale.full)
  }
}

export function exportDatabase(db: Database.Database, targetPath: string): void {
  db.exec(`VACUUM INTO '${targetPath.replace(/'/g, "''")}'`)
}

export function importDatabase(sourcePath: string, dbPath: string): void {
  if (!existsSync(sourcePath)) {
    throw new Error(`source database not found: ${sourcePath}`)
  }
  copyFileSync(sourcePath, dbPath)
}
