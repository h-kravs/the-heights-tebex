import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import SectionHead from '../components/SectionHead'
import VipSwitcher from '../components/VipSwitcher'
import { useCatalog } from '../stores/catalogStore'
import { useTitle } from '../lib/useTitle'
import { pickVipPackages } from '../lib/vipTable'
import { DEMO_VIPS } from '../lib/demoVips'

const PERKS = [
  { icon: 'clock', title: 'Skip the queue', text: 'Get in even when the city is full. No waiting at the gate.' },
  { icon: 'coin', title: 'Earn more', text: 'A payout bonus on every legal job, every shift.' },
  { icon: 'car', title: 'Bigger garage', text: 'Extra slots so the collection actually fits.' },
  { icon: 'tag', title: 'Exclusive drip', text: 'Seasonal clothing and accessories nobody else gets.' },
  { icon: 'crown', title: 'Stand out', text: 'Highlighted role and custom colour on Discord.' },
  { icon: 'headset', title: 'Fast support', text: 'Priority tickets answered in minutes, not days.' },
]

export default function Vip() {
  useTitle('VIP memberships')
  const { categories, packages, isLoading } = useCatalog()
  const { tiers, isPreview } = pickVipPackages(categories, packages, DEMO_VIPS)

  return (
    <>
      <PageHeader
        eyebrow="Memberships"
        title="Live like"
        accent="a VIP."
        description="Permanent perks inside the city, priority queue and exclusive content. Activates automatically the moment you reconnect. Cancel any time."
        crumbs={[{ label: 'VIP' }]}
      />

      <section className="container-x relative pb-20">
        {isPreview && !isLoading && (
          <Reveal className="mb-6">
            <p className="flex max-w-2xl items-start gap-2.5 border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-[0.85rem] leading-snug text-amber-100/90">
              <Icon name="eye" size={17} className="mt-px text-amber-300" />
              <span>
                <strong className="font-semibold text-amber-200">Preview tiers.</strong> Placeholders showing how the page will look. They replace themselves the moment the Tebex store returns real VIP packages.
              </span>
            </p>
          </Reveal>
        )}
        {isLoading ? <div className="shimmer h-[32rem] border border-white/[0.06]" /> : <Reveal><VipSwitcher tiers={tiers} /></Reveal>}
      </section>

      <section className="container-x pb-24">
        <SectionHead eyebrow="What you get" title="Why go" accent="VIP?" />
        <div className="grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05} className="border-b border-r border-white/10">
              <div className="group flex h-full flex-col gap-5 p-7 transition-colors hover:bg-pink-500/[0.05]">
                <span className="flex h-11 w-11 items-center justify-center bg-pink-500 text-void [transform:skewX(-8deg)]">
                  <Icon name={p.icon} size={20} strokeWidth={2.2} className="[transform:skewX(8deg)]" />
                </span>
                <div>
                  <h3 className="text-2xl font-black uppercase">{p.title}</h3>
                  <p className="mt-1.5 text-[0.9rem] leading-relaxed text-mist-400">{p.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8">
          <p className="max-w-2xl text-sm leading-relaxed text-mist-500">VIP perks are about progression, convenience and looks. The roleplay balance stays the same for everyone.</p>
        </Reveal>
      </section>
    </>
  )
}
