// Shrinks the kie.ai PNGs in public/demo to 1200px WebP, then deletes the PNGs.
import sharp from 'sharp'
import { readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'public/demo'
for (const f of readdirSync(dir).filter((f) => f.endsWith('.png'))) {
  const out = join(dir, f.replace('.png', '.webp'))
  await sharp(join(dir, f)).resize({ width: 800 }).webp({ quality: 78 }).toFile(out)
  unlinkSync(join(dir, f))
  console.log(`${out}  ${(statSync(out).size / 1024).toFixed(0)} KB`)
}
