import { Link } from 'react-router-dom'
import Icon from './Icon'
import Drip from './Drip'
import { useCatalog } from '../stores/catalogStore'
import { categoryPath } from '../lib/tebex'
import { isVipCategory } from '../lib/categoryMeta'
import { CONNECT_URL, DISCORD_URL } from '../data/site'

export default function Footer() {
  const { rootCategories } = useCatalog()
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-32 overflow-hidden bg-ink-950">
      {/* Paint running off the page above */}
      <Drip className="text-void" flip />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(50%_60%_at_50%_0%,rgb(255_20_160/0.14),transparent)]" />
      <div className="bg-halftone pointer-events-none absolute inset-0 opacity-50" />

      <div className="container-x relative grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <img src="/brand/logo-sm.webp" alt="The Heights LA" width="58" height="64" className="h-16 w-auto drop-shadow-[0_0_18px_rgba(255,20,160,0.45)]" loading="lazy" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist-400">
            US-based FiveM roleplay, set in the heights above LA. Every purchase keeps the servers, scripts and events running.
          </p>
          <div className="mt-6 flex gap-2">
            <a href={CONNECT_URL} className="btn-chrome px-5 py-3">
              <Icon name="play" size={13} />
              Play now
            </a>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Discord"
              className="flex h-[2.9rem] w-[2.9rem] items-center justify-center rounded-full border border-white/10 text-mist-200 transition-colors hover:border-[#5865F2] hover:bg-[#5865F2]/15 hover:text-white"
            >
              <Icon name="discord" size={18} />
            </a>
          </div>
        </div>

        <FooterCol title="Store">
          <FooterLink to="/store">All packages</FooterLink>
          <FooterLink to="/vip">VIP memberships</FooterLink>
          {rootCategories.filter((c) => !isVipCategory(c)).slice(0, 5).map((c) => (
            <FooterLink key={c.id} to={categoryPath(c)}>
              {c.name}
            </FooterLink>
          ))}
        </FooterCol>

        <FooterCol title="Help">
          <FooterLink to="/support">Support & FAQ</FooterLink>
          <FooterLink to="/terms">Terms of purchase</FooterLink>
          <FooterLink href={DISCORD_URL}>Open a ticket</FooterLink>
        </FooterCol>

        <FooterCol title="Payments">
          <p className="text-sm leading-relaxed text-mist-400">
            Payments are processed securely by Tebex, our official payment partner.
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {['Visa', 'Mastercard', 'PayPal', 'Apple Pay', 'Google Pay'].map((m) => (
              <span key={m} className=" border border-white/10 px-2 py-1 font-label text-[0.6rem] uppercase tracking-wider text-mist-300">
                {m}
              </span>
            ))}
          </div>
        </FooterCol>
      </div>

      {/* Oversized wordmark bleeding off the bottom edge */}
      <div className="container-x relative select-none" aria-hidden="true">
        <p className="text-outline -mb-[0.2em] whitespace-nowrap text-center font-display text-[clamp(3.6rem,15vw,15rem)] font-black uppercase leading-none tracking-[-0.02em]">
          The Heights LA
        </p>
      </div>

      <div className="relative border-t border-white/[0.06]">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-mist-500 lg:flex-row lg:items-center lg:justify-between">
          <p>© {year} The Heights LA. All rights reserved.</p>
          <p>Not affiliated with Rockstar Games, Take-Two Interactive or Cfx.re.</p>
          <p>
            Built by{' '}
            <a
              href="https://theorb.tech"
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold text-mist-300 transition-colors hover:text-pink-300"
            >
              The Orb
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }) {
  return (
    <div>
      <p className="font-label text-[0.66rem] font-bold uppercase tracking-[0.22em] text-chalk">{title}</p>
      <div className="mt-5 flex flex-col gap-3">{children}</div>
    </div>
  )
}

function FooterLink({ to, href, children }) {
  const cls = 'text-sm text-mist-400 transition-colors hover:text-pink-300'
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={cls}>
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={cls}>
      {children}
    </Link>
  )
}
