// Site-wide copy and links. Everything the client may need to change without
// touching a component lives here.

export const DISCORD_URL = import.meta.env.VITE_DISCORD_URL || 'https://discord.gg/theheightsla'
// Direct connect: FiveM opens this protocol link itself, no browser tab.
export const CONNECT_URL = import.meta.env.VITE_CONNECT_URL || 'fivem://connect/cfx.re/join/theheights'

export const NAV = [
  { label: 'Store', to: '/store' },
  { label: 'VIP', to: '/vip' },
  { label: 'Support', to: '/support' },
]

export const PILLARS = [
  {
    icon: 'bolt',
    title: 'Instant delivery',
    body: 'Your purchase is waiting the moment you reconnect to the city.',
  },
  {
    icon: 'shield',
    title: 'Secure checkout',
    body: 'Cards, PayPal and Apple Pay, fully handled by Tebex.',
  },
  {
    icon: 'heart',
    title: 'Keeps the lights on',
    body: 'Every pound goes into servers, new scripts and events.',
  },
  {
    icon: 'headset',
    title: 'Real support',
    body: 'Staff are on Discord every day to sort things out.',
  },
]

export const STEPS = [
  { n: '01', title: 'Pick your package', body: 'Browse VIP, bundles, vehicles and items and add them to your cart.' },
  { n: '02', title: 'Sign in with FiveM', body: 'So we know exactly which character to deliver to. Your cart stays put.' },
  { n: '03', title: 'Check out', body: 'Pay securely through Tebex with card, PayPal or Apple Pay.' },
  { n: '04', title: 'Pull up', body: 'Reconnect to The Heights and your purchase is already there.' },
]

export const FAQ = [
  {
    q: 'How long does delivery take?',
    a: 'Usually a couple of minutes. Reconnect to the server once payment is complete. Still nothing after 30 minutes? Open a ticket on Discord and we will sort it.',
  },
  {
    q: 'Why do I need to sign in with FiveM?',
    a: 'Tebex delivers your purchase to your Cfx.re account. Without it we would not know which player to deliver to. Your cart is saved while you sign in.',
  },
  {
    q: 'Which payment methods can I use?',
    a: 'Tebex supports Visa, Mastercard, PayPal, Apple Pay, Google Pay and paysafecard among others. The full list shows at checkout.',
  },
  {
    q: 'Can I cancel my VIP subscription?',
    a: 'Any time. Manage and cancel subscriptions through the link in your Tebex confirmation email. Your perks stay active until the end of the paid period.',
  },
  {
    q: 'Do I get a refund if I am banned?',
    a: 'No. Purchases are digital contributions to the server. If you are banned for breaking the rules you lose access to your purchases and no refund is possible.',
  },
  {
    q: 'I made a mistake with my order. What now?',
    a: 'Open a ticket on Discord with the transaction ID from your Tebex email. The team will look into it as fast as they can.',
  },
]

/** Marquee strip under the hero. */
export const TICKER = ['Instant delivery', 'Secure via Tebex', 'Apple Pay & PayPal', 'UK based community', 'Supports the server', 'Online 24/7']
