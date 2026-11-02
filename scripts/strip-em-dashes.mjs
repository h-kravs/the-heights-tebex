// ════════════════════════════════════════════════════════════════════
//  Strip em dashes
//
//      node scripts/strip-em-dashes.mjs          report only
//      node scripts/strip-em-dashes.mjs --write  rewrite the files
//
//  The em dash is banned in this project, in copy, comments and docs alike.
//  A short phrase before the dash reads better with a colon; anything longer
//  becomes a comma. Run it before committing if one ever sneaks back in.
//
//  The character is built at runtime (charCode 8212) so that it appears
//  nowhere in the repository, not even in this file.
// ════════════════════════════════════════════════════════════════════

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const ROOT = process.cwd()
const WRITE = process.argv.includes('--write')
const DASH = String.fromCharCode(8212)
const DASH_RE = new RegExp(`(.*?)\\s*${DASH}\\s*`, 'g')

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.netlify', 'inspo', '.gstack'])
const EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx', '.css', '.html', '.md', '.json', '.toml', '.example'])

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (EXTENSIONS.has(extname(entry)) || entry === '.env.example') out.push(full)
  }
  return out
}

/** Strip comment markers and list bullets so the "short phrase" test sees real words. */
function leadLength(before) {
  return before.replace(/^\s*(\/\/+|\/\*+|\*+|#+|-|\d+\.)\s*/, '').trim().length
}

let changedFiles = 0
let total = 0

for (const file of walk(ROOT)) {
  const original = readFileSync(file, 'utf8')
  if (!original.includes(DASH)) continue

  const updated = original
    .split('\n')
    .map((line) => {
      if (!line.includes(DASH)) return line
      // "word <dash> rest" becomes "word: rest" after a short phrase, else "word, rest"
      return line.replace(DASH_RE, (match, before, offset) => {
        const lead = offset === 0 ? leadLength(before) : before.trim().length
        return `${before.replace(/\s+$/, '')}${lead > 0 && lead <= 30 ? ': ' : ', '}`
      })
    })
    .join('\n')

  const count = original.split(DASH).length - 1
  total += count
  changedFiles++
  console.log(`${count.toString().padStart(3)}  ${file.replace(ROOT, '.')}`)
  if (WRITE) writeFileSync(file, updated)
}

console.log(`\n${total} em dash(es) in ${changedFiles} file(s)${WRITE ? ' rewritten' : ' (dry run, pass --write)'}`)
