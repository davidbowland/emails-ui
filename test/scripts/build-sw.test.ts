import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const { main } = require('../../scripts/build-sw.js')

// A throwaway working directory per test group, torn down after. Nothing here touches the
// real out/ or scripts/, so the suite is safe to run alongside a build.
const makeWorkspace = () => mkdtempSync(join(tmpdir(), 'build-sw-'))

const writeFile = (path: string, contents: string) => {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, contents)
}

const REAL_SW_SRC = `var CACHE_VERSION = 'dev'
var PRECACHE = ['/']
var CACHE_NAME = 'emails-ui-' + CACHE_VERSION
`

const KILL_SWITCH_SRC = `self.addEventListener('install', function () { self.skipWaiting() })
// No var PRECACHE line — build-sw must copy this straight through.
`

// Every route shell and icon assertComplete demands, so main() reaches the happy path.
const seedOut = (outDir: string) => {
  const shellDirs = ['', 'inbox', 'outbox', 'compose', 'settings', 'privacy-policy', '400', '403', '404', '500']
  shellDirs.forEach((dir) => writeFile(join(outDir, dir, 'index.html'), `<html>${dir || 'home'}</html>`))
  ;['icon-192.png', 'icon-512.png', 'icon-maskable-512.png'].forEach((icon) => writeFile(join(outDir, icon), icon))
  writeFile(join(outDir, '_next', 'static', 'chunks', 'main-abc123.js'), 'chunk')
  writeFile(join(outDir, '_next', 'static', 'css', 'app-def456.css'), 'css')
}

describe('build-sw pass-through', () => {
  it('copies a source with no injection point straight through and reports pass-through', () => {
    const workspace = makeWorkspace()
    const swSrcPath = join(workspace, 'sw-src.js')
    const swDestPath = join(workspace, 'out', 'sw.js')
    mkdirSync(join(workspace, 'out'), { recursive: true })
    writeFile(swSrcPath, KILL_SWITCH_SRC)

    const result = main({ outDir: join(workspace, 'out'), swDestPath, swSrcPath })

    expect(result.passthrough).toBe(true)
    expect(readFileSync(swDestPath, 'utf8')).toBe(KILL_SWITCH_SRC)

    rmSync(workspace, { force: true, recursive: true })
  })

  it('does not read out/ before deciding to pass through', () => {
    const workspace = makeWorkspace()
    const swSrcPath = join(workspace, 'sw-src.js')
    const swDestPath = join(workspace, 'sw.js')
    writeFile(swSrcPath, KILL_SWITCH_SRC)

    // outDir intentionally does not exist: a kill-switch swap must not be blocked by the
    // completeness assertion that needs out/.
    const result = main({ outDir: join(workspace, 'does-not-exist'), swDestPath, swSrcPath })

    expect(result.passthrough).toBe(true)

    rmSync(workspace, { force: true, recursive: true })
  })
})

describe('build-sw injection', () => {
  it('injects a real version and the route shells, icons, and static assets', () => {
    const workspace = makeWorkspace()
    const outDir = join(workspace, 'out')
    const swSrcPath = join(workspace, 'sw-src.js')
    const swDestPath = join(outDir, 'sw.js')
    seedOut(outDir)
    writeFile(swSrcPath, REAL_SW_SRC)

    const result = main({ outDir, swDestPath, swSrcPath })

    expect(result.passthrough).toBe(false)
    expect(result.version).toMatch(/^[0-9a-f]{12}$/)
    expect(existsSync(swDestPath)).toBe(true)

    const written = readFileSync(swDestPath, 'utf8')
    expect(written).toMatch(/^var CACHE_VERSION = '[0-9a-f]{12}'$/m)
    ;['/', '/inbox/', '/privacy-policy/', '/500/', '/icon-192.png', '/_next/static/chunks/main-abc123.js'].forEach(
      (url) => expect(written).toContain(`"${url}"`),
    )
    expect(written).not.toContain("'dev'")

    rmSync(workspace, { force: true, recursive: true })
  })

  it('fails when a required route shell is missing', () => {
    const workspace = makeWorkspace()
    const outDir = join(workspace, 'out')
    const swSrcPath = join(workspace, 'sw-src.js')
    const swDestPath = join(outDir, 'sw.js')
    seedOut(outDir)
    rmSync(join(outDir, 'inbox'), { force: true, recursive: true })
    writeFile(swSrcPath, REAL_SW_SRC)

    expect(() => main({ outDir, swDestPath, swSrcPath })).toThrow(/inbox/)

    rmSync(workspace, { force: true, recursive: true })
  })
})
