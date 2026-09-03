#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

// The mark ("The Seal") is authored once as public/favicon.svg and only rasterized here,
// never redrawn. This script produces the three launcher icons the install engines check
// for — 192 and 512 in `any`, plus a 512 `maskable`. The 16/32/180 sizes and og-image
// already ship as committed brand assets and are left alone.
//
// Run manually (`npm run generate:favicons`) when the mark changes, then commit the PNGs.
// Deliberately NOT wired into `npm run build`: sharp is a heavy native dependency, and
// pinning it into every CI build to regenerate bytes that never change is the wrong trade —
// bridge-ui made the same call.
const publicDir = path.join(__dirname, '..', 'public')
const ICON = path.join(publicDir, 'favicon.svg')

// The shell ground. A maskable icon is cropped by the OS to whatever shape the platform
// prefers, so the corners must be filled or a crop shows a seam. #07080f is --shell-bg.
const GROUND = '#07080f'

// Rasterize large, then downscale. Rendering a 64-unit grid straight to 512px samples the
// source at 8x and the mark's curves go soft — so oversample and let sharp downscale.
const DENSITY = 900

const rasters = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
]

const generate = async () => {
  if (!fs.existsSync(ICON)) {
    console.error(`generate-favicons: missing ${ICON}`)
    process.exit(1)
  }

  for (const { name, size } of rasters) {
    await sharp(ICON, { density: DENSITY }).resize(size, size).png().toFile(path.join(publicDir, name))
    console.log(`✓ Generated public/${name} (${size}px)`)
  }

  // The maskable icon gets its own padding rather than reusing the standard one: the
  // guaranteed-safe zone is the middle 80%, and the shell ground fills the rest so no crop
  // shows an edge.
  const inner = Math.round(512 * 0.8)
  const pad = Math.round((512 - inner) / 2)
  await sharp(ICON, { density: DENSITY })
    .resize(inner, inner)
    .extend({ background: GROUND, bottom: pad, left: pad, right: pad, top: pad })
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'))
  console.log(`✓ Generated public/icon-maskable-512.png (512px, ${inner}px safe zone)`)
}

generate().catch((error) => {
  console.error('generate-favicons:', error.message)
  process.exit(1)
})
