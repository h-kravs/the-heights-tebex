// Visual identity per category, inferred from its Tebex name so a category the
// owner adds later still gets a fitting icon without a deploy.

const RULES = [
  [/coin|credit|currency|cash|money|token/i, 'coin'],
  [/vip|member|subscription|rank|prio|tier/i, 'crown'],
  [/bundle|pack|deal|starter/i, 'gift'],
  [/vehicle|car|bike|motor|garage|ride/i, 'car'],
  [/crime|street|gang|crew|org|illegal|hood/i, 'skull'],
  [/house|home|propert|estate|apartment|interior|mansion/i, 'home'],
  [/weapon|gun|ammo|arm/i, 'bolt'],
  [/cloth|outfit|drip|wear|skin|cosmetic/i, 'tag'],
  [/item|extra|character|name|plate|phone|slot/i, 'box'],
]

export function categoryIcon(name = '') {
  for (const [re, icon] of RULES) if (re.test(name)) return icon
  return 'sparkles'
}

export function isVipCategory(cat) {
  return /vip|member|subscription|rank|tier/i.test(cat?.name || '')
}
