// ════════════════════════════════════════════════════════════════════
//  DEMO catalog: only used while VITE_TEBEX_TOKEN is empty.
//  Shapes mirror the Headless API 1:1, so nothing changes when the real
//  token is set: none of this runs and the live catalog takes over.
// ════════════════════════════════════════════════════════════════════

export const DEMO_WEBSTORE = {
  id: 0,
  name: 'The Heights LA',
  description: 'Official store',
  webstore_url: 'https://theheightsla.tebex.io',
  currency: 'GBP',
  lang: 'en',
  platform_type: 'FiveM',
}

let seq = 1000
const pkg = (name, price, { base, tags = [], description = '', type = 'single', category } = {}) => {
  const id = ++seq
  return {
    id,
    name,
    slug: null,
    description: `${tags.length ? `<p>[${tags.join(', ')}]</p>` : ''}${description}`,
    // Demo artwork generated for the sample catalog (scripts/demo-images.mjs).
    image: `/demo/${id}.webp`,
    type,
    category: { id: category, name: '' },
    base_price: base ?? price,
    sales_tax: 0,
    total_price: price,
    discount: base ? Number((base - price).toFixed(2)) : 0,
    currency: 'GBP',
    disable_quantity: type === 'subscription',
    disable_gifting: false,
    expiration_date: null,
    created_at: new Date(Date.now() - id * 3600_000).toISOString(),
    updated_at: null,
    ...(type === 'subscription' ? { expiry_period: { unit: 'month', count: 1 } } : {}),
  }
}

const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`

export const DEMO_CATEGORIES = [
  {
    id: 1,
    name: 'VIP',
    slug: 'vip',
    description: 'Skip the queue, earn more on every job and unlock perks the rest of the city can only dream of.',
    order: 1,
    parent: null,
    display_type: 'grid',
    packages: [
      pkg('Heights Silver', 9.99, {
        type: 'subscription', category: 1,
        description: `<p>Your first step up.</p>${list(['Priority queue', '2 character slots', '3 garage slots', '+15% job payout', 'Silver Discord role'])}`,
      }),
      pkg('Heights Gold', 19.99, {
        type: 'subscription', category: 1, tags: ['Popular'],
        description: `<p>For the ones who actually live here.</p>${list(['Everything in Heights Silver', '4 character slots', '6 garage slots', '+35% job payout', 'Free name change every month', 'Access to the VIP lounge'])}`,
      }),
      pkg('Heights Diamond', 39.99, {
        type: 'subscription', category: 1, tags: ['Featured', 'Best value'],
        description: `<p>The top of the city. Everything unlocked.</p>${list(['Everything in Heights Gold', '8 character slots', 'Unlimited garage slots', '+60% job payout', 'One exclusive vehicle every month', 'Priority support 24/7'])}`,
      }),
    ],
  },
  {
    id: 2,
    name: 'Bundles',
    slug: 'bundles',
    description: 'Hand-picked packs with the best price per item. Built for a strong start.',
    order: 2,
    parent: null,
    display_type: 'grid',
    packages: [
      pkg('Starter Pack', 14.99, {
        base: 22.99, category: 2, tags: ['Featured', 'Popular'],
        description: `<p>Everything your first character needs on day one.</p>${list(['BMW M3 Competition', 'Exclusive streetwear set', '£25,000 starting cash', 'Phone with SIM card'])}`,
      }),
      pkg('Business Pack', 39.99, {
        base: 54.99, category: 2, tags: ['Bundle'],
        description: `<p>Open your own legal business and run the block.</p>${list(['Business property of your choice', 'Mercedes-Benz Sprinter', 'Branded work clothing', 'Custom phone number'])}`,
      }),
      pkg('Heights Ultimate', 79.99, {
        base: 119.99, category: 2, tags: ['Featured', 'Limited'],
        description: `<p>Our biggest drop. This month only.</p>${list(['Lamborghini Urus Performante', 'Hillside mansion', '3 months of Heights Gold', 'Custom plate', 'Exclusive Discord role'])}`,
      }),
    ],
  },
  {
    id: 3,
    name: 'Vehicles',
    slug: 'vehicles',
    description: 'Supercars, muscle and tuned builds, straight to your garage and registered in your name.',
    order: 3,
    parent: null,
    display_type: 'grid',
    packages: [
      pkg('Audi RS6 Avant', 27.99, {
        category: 3, tags: ['Featured', 'New'],
        description: `<p>The family car with 600 horsepower under the bonnet.</p>${list(['Straight to your garage', 'Registered in your name', 'Nardo grey or matte black', 'Stage 2 tune included'])}`,
      }),
      pkg('Mercedes-AMG G63', 32.99, {
        category: 3,
        description: `<p>Iconic, unbreakable and impossible to ignore.</p>${list(['Brabus body kit', '22 inch wheels', 'Tinted windows'])}`,
      }),
      pkg('BMW M5 CS', 24.99, {
        base: 29.99, category: 3,
        description: `<p>A saloon with the heart of a race car.</p>${list(['Carbon interior', 'Sport exhaust', 'Launch control'])}`,
      }),
      pkg('Porsche 911 Turbo S', 36.99, {
        category: 3, tags: ['Popular'],
        description: `<p>Precision on four wheels.</p>${list(['PDK gearbox', 'Ceramic brakes', 'Exclusive Heights livery'])}`,
      }),
      pkg('Lamborghini Urus', 42.99, {
        category: 3,
        description: `<p>The fastest SUV in the city.</p>${list(['Performante spec', 'Pink and black interior'])}`,
      }),
      pkg('Kawasaki Ninja H2R', 21.99, {
        category: 3, tags: ['New'],
        description: `<p>The fastest bike on the server.</p>${list(['Supercharged', 'Open exhaust'])}`,
      }),
    ],
  },
  {
    id: 4,
    name: 'Streets',
    slug: 'streets',
    description: 'Roleplay expansions for anyone who wants to run the underworld.',
    order: 4,
    parent: null,
    display_type: 'grid',
    packages: [
      pkg('Your own crew', 54.99, {
        category: 4, tags: ['Popular'],
        description: `<p>Found your own organisation, with its own HQ.</p>${list(['Private headquarters', 'Crew storage', 'Clothing in your colours', 'Up to 12 members'])}`,
      }),
      pkg('Hidden workshop', 27.99, {
        category: 4,
        description: `<p>A lock-up out of town where nobody asks questions.</p>${list(['Vehicle rebuild bay', 'Private storage'])}`,
      }),
      pkg('Laundromat front', 32.99, {
        base: 44.99, category: 4, tags: ['Limited'],
        description: `<p>A laundrette as a front. What happens in the back is on you.</p>`,
      }),
    ],
  },
  {
    id: 5,
    name: 'Items',
    slug: 'items',
    description: 'Useful extras for your character.',
    order: 5,
    parent: null,
    display_type: 'grid',
    packages: [
      pkg('Extra character slot', 7.99, { category: 5, description: '<p>One more life in The Heights. That second storyline you keep thinking about.</p>' }),
      pkg('Name change', 4.99, { category: 5, description: '<p>Rename your character without losing progress.</p>' }),
      pkg('Custom plate', 8.99, { category: 5, tags: ['Popular'], description: '<p>Up to 8 characters, on one vehicle of your choice.</p>' }),
      pkg('Custom phone number', 5.99, { category: 5, description: '<p>Easy to remember, hard to forget.</p>' }),
    ],
  },
]
