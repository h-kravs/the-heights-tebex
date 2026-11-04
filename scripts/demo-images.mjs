// Generates artwork for the DEMO catalog with kie.ai (one image per package).
// Demo only: real packages get their images from the Tebex panel.
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

const KIE = join(homedir(), '.claude', 'skills', 'kie-image', 'kie.mjs')
const STYLE = 'cinematic 3D render, night in Los Angeles hills, hot magenta neon rim light on black, wet asphalt reflections, subtle haze, high detail, no text, no watermark, dark moody product shot'

export const PROMPTS = {
  1001: 'a silver chrome VIP membership card with a graffiti drip edge, floating over a dark city skyline',
  1002: 'a gold VIP membership card with chrome dreadlock-style metal ornaments, floating, luxury',
  1003: 'a black diamond-studded VIP card with a pink neon crown above it, luxury, floating',
  1004: 'a starter kit laid out: a white BMW M3 Competition key fob, streetwear hoodie, stack of pound notes and a smartphone on a black table',
  1005: 'a small neon-lit storefront business at night in LA with a Mercedes Sprinter van parked outside',
  1006: 'a lamborghini urus performante parked in front of a modern hillside mansion overlooking LA at night, magenta neon',
  1007: 'an audi rs6 avant in nardo gray, three quarter view, parked on a hillside road above LA at night',
  1008: 'a matte black mercedes g63 amg with brabus kit, front three quarter, neon pink reflections',
  1009: 'a bmw m5 cs in frozen deep green, low angle, downtown LA street at night',
  1010: 'a porsche 911 turbo s in white with a subtle pink livery, side view, rooftop car park at night',
  1011: 'a lamborghini urus in black with pink interior glow, front view, city lights behind',
  1012: 'a kawasaki ninja h2r superbike, dramatic low angle, neon tunnel',
  1013: 'a crew headquarters: a dark warehouse interior with a long table, pink neon strip lights and black SUVs',
  1014: 'a hidden car workshop in an industrial lock-up, a car on a lift, tools, single pink work light',
  1015: 'a vintage laundromat storefront at night, washing machines glowing inside, neon sign',
  1016: 'two empty theatre-style seats under a spotlight with a glowing pink outline of a silhouette, character slot concept',
  1017: 'a metal dog tag name plate on a chain, engraving blank, macro, pink neon light',
  1018: 'a custom black US license plate with pink lettering mounted on a car bumper, macro',
  1019: 'a smartphone on a dark table showing a glowing pink dial screen, macro',
}

const only = process.argv.slice(2).map(Number)
const ids = only.length ? only : Object.keys(PROMPTS).map(Number)
for (const id of ids) {
  const prompt = `${PROMPTS[id]}, ${STYLE}`
  console.log(`\n→ ${id}`)
  execFileSync('node', [KIE, 'gen', prompt, '--ar', '4:3', '-o', 'public/demo', '--name', String(id)], { stdio: 'inherit' })
}
