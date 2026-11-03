// ════════════════════════════════════════════════════════════════════
//  Brand asset pipeline
//
//  Derives every shipped brand file from the client's logo in inspo/logo.png:
//  a trimmed logo in two weights (web + WebGL texture), square favicons and
//  the Open Graph cover. Re-run after the client supplies new art:
//
//      npm run brand
// ════════════════════════════════════════════════════════════════════

import sharp from 'sharp'
import { mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'inspo', 'logo.png')
const OUT = join(root, 'public')
mkdirSync(join(OUT, 'brand'), { recursive: true })

const VOID = { r: 6, g: 3, b: 10, alpha: 1 }

const trimmed = await sharp(SRC).trim().png().toBuffer()

await sharp(trimmed).resize({ width: 640 }).webp({ quality: 90, alphaQuality: 100 }).toFile(join(OUT, 'brand/logo.webp'))
// Closing call-to-action on the home page: shown at 176 to 224px wide, 2x screens.
await sharp(trimmed).resize({ width: 448 }).webp({ quality: 88, alphaQuality: 100 }).toFile(join(OUT, 'brand/logo-md.webp'))
// Navbar / footer / menu: shown at 44 to 64px tall, so 160px wide covers 2.5x screens.
await sharp(trimmed).resize({ width: 160 }).webp({ quality: 88, alphaQuality: 100 }).toFile(join(OUT, 'brand/logo-sm.webp'))
// WebGL texture in the hero. Power-of-two-ish width keeps mipmaps clean.
await sharp(trimmed).resize({ width: 1024 }).webp({ quality: 92, alphaQuality: 100 }).toFile(join(OUT, 'brand/logo-hd.webp'))

async function square(size, file, pad) {
  const inner = Math.round(size * (1 - pad * 2))
  const logo = await sharp(trimmed).resize({ width: inner, height: inner, fit: 'inside' }).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: VOID } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(join(OUT, file))
}

await square(32, 'favicon-32.png', 0.02)
await square(180, 'apple-touch-icon.png', 0.1)
await square(512, 'favicon-512.png', 0.1)

// Open Graph cover: the logo centred on the void with a magenta glow behind it.
const glow = Buffer.from(
  `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="55%" r="55%">
        <stop offset="0%" stop-color="#ff14a0" stop-opacity="0.55"/>
        <stop offset="45%" stop-color="#ff14a0" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#06030a" stop-opacity="0"/>
      </radialGradient>
      <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
        <circle cx="9" cy="9" r="1.4" fill="#ffffff" fill-opacity="0.05"/>
      </pattern>
    </defs>
    <rect width="1200" height="630" fill="#06030a"/>
    <rect width="1200" height="630" fill="url(#dots)"/>
    <rect width="1200" height="630" fill="url(#g)"/>
  </svg>`,
)
const ogLogo = await sharp(trimmed).resize({ height: 520, fit: 'inside' }).toBuffer()
await sharp(glow)
  .composite([{ input: ogLogo, gravity: 'center' }])
  .jpeg({ quality: 88 })
  .toFile(join(OUT, 'brand/og-cover.jpg'))

for (const f of ['brand/logo.webp', 'brand/logo-md.webp', 'brand/logo-sm.webp', 'brand/logo-hd.webp', 'favicon-32.png', 'apple-touch-icon.png', 'favicon-512.png', 'brand/og-cover.jpg']) {
  const { width, height } = await sharp(join(OUT, f)).metadata()
  console.log(`${f.padEnd(22)} ${width}×${height}  ${(statSync(join(OUT, f)).size / 1024).toFixed(1)} KB`)
}
