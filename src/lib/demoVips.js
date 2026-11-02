// ════════════════════════════════════════════════════════════════════
//  Placeholder VIP tiers
//
//  Shown ONLY while the Tebex store returns no VIP packages, so the page
//  has something real to look at before the tiers are configured. The
//  moment the store returns a single VIP package these disappear, see
//  pickVipPackages() in lib/vipTable.js.
//
//  They are flagged `preview: true`, which disables the buy button:
//  these ids do not exist in Tebex and adding them to a basket would
//  fail. Delete this file once the real tiers are live.
// ════════════════════════════════════════════════════════════════════

const tier = (name, price, bullets) => ({
  id: `preview-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  slug: null,
  preview: true,
  type: 'subscription',
  expiry_period: { unit: 'month', count: 1 },
  total_price: price,
  base_price: price,
  currency: 'GBP',
  image: null,
  disable_quantity: true,
  description: `<ul>${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`,
})

export const DEMO_VIPS = [
  tier('Heights Silver', 9.99, [
    'Priority queue',
    '2 character slots',
    '3 garage slots',
    '+15% job payout',
    'Exclusive Discord role',
    'Access to VIP clothing',
  ]),
  tier('Heights Gold', 19.99, [
    'Everything in Heights Silver',
    '4 character slots',
    '6 garage slots',
    '+35% job payout',
    '£10,000 cash per month',
    'VIP emotes',
    'Private workshop access',
  ]),
  tier('Heights Diamond', 39.99, [
    'Everything in Heights Gold',
    '8 character slots',
    'Unlimited garage slots',
    '+60% job payout',
    '£30,000 cash per month',
    '2 limited vehicles per month',
    'Priority support 24/7',
    'Early access to new content',
  ]),
]
