import PageHeader from '../components/PageHeader'
import { useTitle } from '../lib/useTitle'
import { DISCORD_URL } from '../data/site'

const SECTIONS = [
  {
    id: 'general',
    title: 'General',
    body: [
      'These terms apply to every purchase made in the store of The Heights LA ("we", "the server"). By making a purchase you agree to these terms and to the server rules as published on our Discord.',
      'The Heights LA is a FiveM server and is in no way affiliated with Rockstar Games, Take-Two Interactive or Cfx.re.',
    ],
  },
  {
    id: 'payments',
    title: 'Payments through Tebex',
    body: [
      'All payments are processed by Tebex Limited, which acts as the merchant of record. Your payment details are never received or stored by The Heights LA. The Tebex terms of service also apply to the payment itself.',
    ],
  },
  {
    id: 'digital-goods',
    title: 'Digital goods and donations',
    body: [
      'All packages are digital, virtual goods usable only inside the server. They have no value outside the server and cannot be exchanged for real money.',
      'Purchases count as a voluntary contribution towards the upkeep and development of the server. We reserve the right to adjust packages, vehicles or perks when the balance or stability of the server requires it.',
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    body: [
      'Delivery happens automatically to the FiveM (Cfx.re) account you signed in with at checkout, usually within minutes of payment and on reconnecting to the server. Check you are signed in with the right account before checking out.',
    ],
  },
  {
    id: 'cancellation',
    title: 'Right to cancel',
    body: [
      'Because these are digital goods delivered immediately after payment, you expressly agree to immediate delivery at checkout. The statutory 14-day cooling-off period therefore ends once delivery has begun.',
    ],
  },
  {
    id: 'refunds',
    title: 'Refunds, chargebacks and bans',
    body: [
      'Purchases are non-refundable, unless a package demonstrably was not delivered and we are unable to resolve it within a reasonable time.',
      'Opening a chargeback or a dispute through your bank or PayPal results in a permanent ban from the server and the Discord.',
      'A ban for breaking the server rules forfeits all purchased packages, with no right to a refund.',
    ],
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    body: [
      'Subscriptions (such as VIP) renew automatically each period until cancelled. You can cancel at any time through the link in your Tebex confirmation email. Your perks remain active until the end of the current paid period.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    body: [
      'For delivery we process your FiveM username and the associated account ID. Tebex processes your payment and contact details under its own privacy policy. This website stores your cart only locally in your browser.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    body: ['Questions about a purchase or about these terms? Open a ticket on our Discord.'],
  },
]

export default function Legal() {
  useTitle('Terms of purchase')
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of" accent="purchase." description="What you can expect from a purchase, and what we expect from you." crumbs={[{ label: 'Terms' }]} />
      <div className="container-x grid items-start gap-10 lg:grid-cols-[16rem_1fr] lg:gap-16">
        <nav aria-label="Contents" className="hidden lg:sticky lg:top-28 lg:block">
          <p className="font-label text-[0.62rem] font-bold uppercase tracking-[0.2em] text-mist-500">Contents</p>
          <ol className="mt-4 space-y-2.5 border-l border-white/[0.08]">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-4 text-sm text-mist-400 transition-colors hover:border-pink-500 hover:text-chalk">
                  <span className="mr-2 font-label text-[0.68rem] text-pink-500">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl space-y-12">
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="flex items-baseline gap-4 text-2xl font-black uppercase">
                <span className="font-label text-sm text-pink-500">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>
              <div className="mt-4 space-y-4 pl-0 text-[0.95rem] leading-relaxed text-mist-300 sm:pl-10">
                {s.body.map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
                {s.id === 'contact' && (
                  <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" className="btn-discord mt-2">
                    Go to Discord
                  </a>
                )}
              </div>
            </section>
          ))}
          <p className="border-t border-white/[0.07] pt-6 font-label text-xs text-mist-500">Last updated: November 2026</p>
        </div>
      </div>
    </>
  )
}
