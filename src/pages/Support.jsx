import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import Faq from '../components/Faq'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import { useTitle } from '../lib/useTitle'
import { DISCORD_URL, FAQ } from '../data/site'

const CHECKLIST = [
  'Reconnect to the server. Delivery happens when you log in.',
  'Check you bought with the same FiveM account you play on.',
  'Find your transaction ID in the Tebex confirmation email.',
  'Still nothing after 30 minutes? Open a ticket with that transaction ID.',
]

export default function Support() {
  useTitle('Support')
  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Need a"
        accent="hand?"
        description="Answers to the questions we get most. Still stuck? The team is happy to help on Discord."
        crumbs={[{ label: 'Support' }]}
      />

      <div className="container-x grid items-start gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        <Reveal>
          <Faq items={FAQ} />
        </Reveal>

        <div className="space-y-5 lg:sticky lg:top-28">
          <Reveal delay={0.05}>
            <div className="relative overflow-hidden  border border-[#5865F2]/30 bg-gradient-to-br from-[#5865F2]/15 via-ink-900 to-ink-900 p-8">
              <Icon name="discord" size={120} className="pointer-events-none absolute -right-6 -top-6 text-[#5865F2]/10" />
              <Icon name="discord" size={30} className="relative text-[#8b95ff]" />
              <h2 className="relative mt-5 text-2xl font-black uppercase">Open a ticket</h2>
              <p className="relative mt-2 text-sm leading-relaxed text-mist-300">
                The fastest route to a fix. Include your FiveM name and the transaction ID from the Tebex email.
              </p>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" className="btn-discord relative mt-6 w-full">
                <Icon name="discord" size={17} />
                Go to Discord
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className=" border border-white/[0.07] bg-ink-900/60 p-8">
              <Icon name="receipt" size={26} className="text-pink-400" />
              <h2 className="mt-5 text-2xl font-black uppercase">Purchase not delivered?</h2>
              <ol className="mt-5 space-y-4">
                {CHECKLIST.map((step, i) => (
                  <li key={step} className="flex gap-3.5 text-sm leading-relaxed text-mist-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-500/15 font-label text-[0.68rem] font-bold text-pink-400">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <Link to="/terms" className="mt-6 inline-flex items-center gap-2 text-sm text-mist-400 transition-colors hover:text-pink-300">
                Read the terms
                <Icon name="arrowRight" size={15} />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </>
  )
}
