import type Database from 'better-sqlite3'
import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  readdirSync,
  statSync,
  unlinkSync
} from 'fs'
import { join } from 'path'

const SNAPSHOT_RETAIN = 3
const SNAPSHOT_PREFIX = 'qa-workspace.db.backup-'
const SQLITE_MAGIC = Buffer.from('SQLite format 3\0')

function assertSafePath(path: string): void {
  if (path.includes('\0')) {
    throw new Error('Invalid path: contains null byte')
  }
}

function quoteForVacuum(path: string): string {
  return path.replace(/'/g, "''")
}

export function snapshotDatabase(db: Database.Database, userDataPath: string): string {
  const dir = join(userDataPath, 'snapshots')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const target = join(dir, `${SNAPSHOT_PREFIX}${stamp}.db`)
  assertSafePath(target)

  db.exec(`VACUUM INTO '${quoteForVacuum(target)}'`)

  rotateSnapshots(dir)
  return target
}

function rotateSnapshots(dir: string): void {
  const entries = readdirSync(dir)
    .filter((name) => name.startsWith(SNAPSHOT_PREFIX))
    .map((name) => ({ name, full: join(dir, name), mtime: statSync(join(dir, name)).mtimeMs }))
    .sort((a, b) => b.name.localeCompare(a.name))

  for (const stale of entries.slice(SNAPSHOT_RETAIN)) {
    unlinkSync(stale.full)
  }
}

export function exportDatabase(db: Database.Database, targetPath: string): void {
  assertSafePath(targetPath)
  db.exec(`VACUUM INTO '${quoteForVacuum(targetPath)}'`)
}

export function isSqliteFile(path: string): boolean {
  if (!existsSync(path)) return false
  const buf = Buffer.alloc(16)
  const fd = openSync(path, 'r')
  try {
    readSync(fd, buf, 0, 16, 0)
  } finally {
    closeSync(fd)
  }
  return buf.equals(SQLITE_MAGIC)
}

export function importDatabase(sourcePath: string, dbPath: string): void {
  if (!existsSync(sourcePath)) {
    throw new Error(`source database not found: ${sourcePath}`)
  }
  assertSafePath(sourcePath)
  assertSafePath(dbPath)
  if (!isSqliteFile(sourcePath)) {
    throw new Error('source file is not a valid SQLite database')
  }
  copyFileSync(sourcePath, dbPath)
}
