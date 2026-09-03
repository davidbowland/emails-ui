#!/usr/bin/env node
'use strict'

/*
 * Generates out/sw.js from scripts/sw-src.js at postbuild, after next-sitemap.
 *
 * It builds an ALLOWLIST precache manifest by walking out/, injects it and a
 * content-derived cache version into a copy of sw-src.js, and asserts the result on
 * both ends: the completeness guard (AC-018) refuses to ship a manifest that cannot
 * boot the app shell offline, and the post-condition guard refuses to ship a copy where
 * String.replace silently no-oped on a renamed injection point.
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '..', 'out')
const SW_SRC = path.join(__dirname, 'sw-src.js')
const SW_DEST = path.join(OUT_DIR, 'sw.js')

// The single line build-sw rewrites. Its absence is how an incident kill switch (which
// has no precache) is recognized and copied straight through.
const INJECTION_POINT = 'var PRECACHE ='

// The route shells that MUST be precached or a first offline visit to that route has
// nothing to render. These are the URLs the browser asks for, trailingSlash and all.
const REQUIRED_SHELLS = [
  '/',
  '/inbox/',
  '/outbox/',
  '/compose/',
  '/settings/',
  '/privacy-policy/',
  '/400/',
  '/403/',
  '/404/',
  '/500/',
]

// The launcher icons. None lives under _next/, so none is content-hashed and none is
// swept up by the _next/static rule below; each must be named explicitly or an installed
// device with no connection shows a broken icon.
const ICONS = ['/icon-192.png', '/icon-512.png', '/icon-maskable-512.png']

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

// The URL the browser asks for, from the file on disk. out/index.html -> '/', and
// out/inbox/index.html -> '/inbox/'; any other .html keeps its exact path.
const htmlToUrl = (outDir, file) => {
  const rel = path.relative(outDir, file).split(path.sep).join('/')
  if (rel === 'index.html') return '/'
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length)
  return '/' + rel
}

const staticToUrl = (outDir, file) => '/' + path.relative(outDir, file).split(path.sep).join('/')

// index.html is reachable as both '/' and '/index.html', and Next exports the 404
// document twice (out/404.html AND out/404/index.html) with identical bytes. addAll
// fetches every entry, so a duplicate costs an install request and buys nothing. Keep one
// URL per distinct document -- whichever a browser can actually ask for: '/' for the root,
// then the trailing-slash directory form the worker reconstructs in indexFor, and only
// then a bare .html.
const shellRank = (url) => (url === '/' ? 0 : url.endsWith('/') ? 1 : 2)

const dedupeShells = (outDir, htmlFiles) => {
  const bestByContent = new Map()
  for (const file of htmlFiles) {
    const url = htmlToUrl(outDir, file)
    const content = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
    const kept = bestByContent.get(content)
    if (kept === undefined || shellRank(url) < shellRank(kept)) {
      bestByContent.set(content, url)
    }
  }
  return [...bestByContent.values()].sort()
}

const buildPrecache = (outDir) => {
  const files = walk(outDir)

  const shells = dedupeShells(
    outDir,
    files.filter((file) => file.endsWith('.html')),
  )

  // Every content-hashed static asset. .woff is deliberately excluded -- fonts ship as
  // both .woff and .woff2, and precaching both doubles the install payload for browsers
  // that predate .woff2 (which just fall back to a system font offline). .map files are
  // developer-only and never wanted on a device.
  const assets = files
    .filter((file) => /\/_next\/static\/.*\.(js|css|woff2)$/.test(staticToUrl(outDir, file)))
    .map((file) => staticToUrl(outDir, file))
    .sort()

  // '/' is always in shells, but list it first and let the Set below drop the duplicate,
  // so the precache order reads shell-then-icons-then-assets regardless.
  return [...new Set(['/', ...shells, ...ICONS, ...assets])]
}

// The AC-018 guard: refuse to ship a manifest that cannot boot the app shell offline.
const assertComplete = (precache, outDir) => {
  const present = new Set(precache)
  const missingShells = REQUIRED_SHELLS.filter((url) => !present.has(url))
  const missingIcons = ICONS.filter((url) => !fs.existsSync(path.join(outDir, ...url.slice(1).split('/'))))
  if (missingShells.length > 0 || missingIcons.length > 0) {
    const parts = []
    if (missingShells.length > 0) parts.push(`route shells: ${missingShells.join(', ')}`)
    if (missingIcons.length > 0) parts.push(`launcher icons on disk: ${missingIcons.join(', ')}`)
    throw new Error(`sw.js precache is incomplete — missing ${parts.join('; ')}`)
  }
}

const versionOf = (precache) =>
  crypto
    .createHash('sha1')
    .update([...precache].sort().join('\n'))
    .digest('hex')
    .slice(0, 12)

const inject = (source, version, precache) => {
  const versionLine = `var CACHE_VERSION = '${version}'`
  const precacheLine = `var PRECACHE = ${JSON.stringify(precache)}`
  const injected = source
    .replace(/^var CACHE_VERSION = .*$/m, versionLine)
    .replace(/^var PRECACHE = .*$/m, precacheLine)

  // String.replace returns its input unchanged on a missed pattern, so a rename in
  // sw-src.js (`var` -> `const`, say) would write the file, print success, and ship the
  // 'dev' placeholders -- replacing every user's cache with a two-entry one that cannot
  // boot, under a fixed name that never re-installs. Assert the output, not the intent.
  const applied = /^var CACHE_VERSION = '[0-9a-f]{12}'$/m.test(injected) && injected.includes(precacheLine)
  if (!applied) {
    throw new Error(
      `sw.js manifest substitution did not apply — sw-src.js must declare 'var CACHE_VERSION = ...' and ` +
        `'var PRECACHE = ...', each on its own line.`,
    )
  }
  return injected
}

// Exported for tests and driven by the CLI entry below. Returns a short result the caller
// can log; throws on any failure so the CLI can turn it into a non-zero exit.
const main = ({ outDir = OUT_DIR, swSrcPath = SW_SRC, swDestPath = SW_DEST } = {}) => {
  // FIRST, before ANY out/ access (ADR-4): an incident deploy swaps sw-killswitch.js over
  // sw-src.js, and that file has no injection point. The swap must NEVER be blocked by the
  // completeness assertion below, so recognize it and copy it straight through.
  const source = fs.readFileSync(swSrcPath, 'utf8')
  if (!source.includes(INJECTION_POINT)) {
    fs.writeFileSync(swDestPath, source)
    console.warn('build-sw: no injection point in sw-src.js — copied through, kill switch?')
    return { passthrough: true }
  }

  if (!fs.existsSync(outDir)) {
    throw new Error(`${outDir} does not exist — run the Next build first.`)
  }

  const precache = buildPrecache(outDir)
  assertComplete(precache, outDir)

  const version = versionOf(precache)
  fs.writeFileSync(swDestPath, inject(source, version, precache))

  return { count: precache.length, passthrough: false, version }
}

module.exports = { buildPrecache, indexForRequired: REQUIRED_SHELLS, inject, main, versionOf }

// CLI entry: run against the real paths and translate any throw into exit 1.
if (require.main === module) {
  try {
    const result = main()
    if (result.passthrough) {
      process.exit(0)
    }
    console.log(`build-sw: precache: ${result.count} entries, version ${result.version}`)
  } catch (error) {
    console.error(`build-sw: ${error.message}`)
    process.exit(1)
  }
}
