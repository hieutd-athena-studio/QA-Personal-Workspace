/**
 * Rebuild native modules for the requested runtime target.
 *
 * Why this script exists:
 *   `electron-builder install-app-deps` calls @electron/rebuild with
 *   buildFromSource=false, which lets it fall back to a prebuilt binary fetched
 *   from npm.  That prebuilt is compiled for Node 20 (ABI 115) but Electron 39
 *   requires ABI 140.  Passing buildFromSource=true ensures the .node file is
 *   always compiled locally against the correct Electron headers.
 *
 *   Because better-sqlite3 is not a N-API module, a single .node binary cannot
 *   serve both Node 20 (unit tests via vitest) and Electron 39 (E2E via
 *   Playwright).  This script is called with --target=electron before E2E and
 *   with --target=node before vitest so each test run uses the correct ABI.
 *
 *   Usage:
 *     node scripts/rebuild-native.mjs --target=electron
 *     node scripts/rebuild-native.mjs --target=node
 */

import { rebuild } from '../node_modules/.pnpm/@electron+rebuild@4.0.4/node_modules/@electron/rebuild/lib/main.js'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import { spawnSync } from 'child_process'
import { existsSync, unlinkSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const rootDir = resolve(__dirname, '..')

const args = process.argv.slice(2)
const targetArg = args.find((a) => a.startsWith('--target='))
const target = targetArg ? targetArg.replace('--target=', '') : 'electron'

if (target === 'electron') {
  const electronPkg = require('../node_modules/electron/package.json')
  const electronVersion = electronPkg.version

  console.log(
    `Rebuilding better-sqlite3 for Electron ${electronVersion} (ABI 140, build-from-source)…`
  )

  await rebuild({
    buildPath: rootDir,
    electronVersion,
    onlyModules: ['better-sqlite3'],
    buildFromSource: true,
    force: true
  })

  console.log('Electron rebuild complete.')
} else if (target === 'node') {
  // Rebuild for the current Node.js runtime using node-gyp.
  //
  // Constraints on Windows:
  //   - process.execPath may contain spaces (C:\Program Files\nodejs\node.exe)
  //     so must be passed as a separate argument, not interpolated in a shell string.
  //   - The linker (LNK1104) cannot overwrite an existing .node file produced by
  //     a previous Electron build; we must delete it first.
  //
  console.log(
    `Rebuilding better-sqlite3 for Node ${process.version} (ABI ${process.versions.modules})…`
  )

  const bs3Pkg = require('../node_modules/better-sqlite3/package.json')
  const bs3Dir = join(
    rootDir,
    'node_modules',
    '.pnpm',
    `better-sqlite3@${bs3Pkg.version}`,
    'node_modules',
    'better-sqlite3'
  )
  const releaseDir = join(bs3Dir, 'build', 'Release')
  const nodeFile = join(releaseDir, 'better_sqlite3.node')

  // Remove existing binary so the linker can write a new one (Windows LNK1104 guard).
  if (existsSync(nodeFile)) {
    unlinkSync(nodeFile)
  }

  const nodegyp = join(
    rootDir,
    'node_modules',
    '.pnpm',
    'node-gyp@12.3.0',
    'node_modules',
    'node-gyp',
    'bin',
    'node-gyp.js'
  )

  const result = spawnSync(process.execPath, [nodegyp, 'rebuild', '--release'], {
    stdio: 'inherit',
    cwd: bs3Dir
  })

  if (result.status !== 0) {
    console.error('Node rebuild failed with status', result.status)
    process.exit(result.status ?? 1)
  }

  console.log('Node rebuild complete.')
} else {
  console.error(`Unknown --target="${target}". Use "electron" or "node".`)
  process.exit(1)
}
