// electron-builder afterPack hook.
//
// When we don't have an Apple Developer ID cert (no CSC_LINK env var), electron-builder
// leaves the prebuilt `Electron Framework.framework` with Apple's original code signature
// while the outer .app wrapper ends up unsigned / ad-hoc signed. macOS 14+ refuses to
// load such a bundle:
//
//   Library not loaded: @rpath/Electron Framework.framework/Electron Framework
//   Reason: mapping process and mapped file (non-platform) have different Team IDs
//
// The fix is to re-sign the entire bundle (including every nested Mach-O) with the
// ad-hoc identity `-` so all Team IDs become empty/consistent. `codesign --deep --force
// --sign -` walks the bundle recursively and replaces every signature in place.
//
// When CSC_LINK *is* set (paid Developer ID flow), we skip this hook entirely so we
// don't clobber the real signature.

const { execSync } = require('child_process')
const path = require('path')

/** @type {import('electron-builder').AfterPackContext} */
module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return

  if (process.env.CSC_LINK && process.env.CSC_LINK.length > 0) {
    console.log('[afterPack] CSC_LINK detected — leaving electron-builder signing flow alone.')
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(context.appOutDir, `${appName}.app`)

  console.log(`[afterPack] Ad-hoc re-signing entire bundle: ${appPath}`)
  try {
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' })
    console.log('[afterPack] Ad-hoc signing complete.')
  } catch (err) {
    console.error('[afterPack] Ad-hoc signing failed:', err)
    throw err
  }
}
