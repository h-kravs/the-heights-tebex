import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from './Icon'

/** Shared header for inner pages: breadcrumb, eyebrow, big title, magenta backdrop. */
export default function PageHeader({ eyebrow, title, accent, description, crumbs = [], children }) {
  return (
    <section className="relative overflow-hidden pb-12 pt-32 sm:pt-40">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-halftone absolute inset-0" />
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_20_160/0.22),transparent)]" />
        <img
          src="/brand/logo.webp"
          alt=""
          className="absolute -right-16 top-10 hidden w-[26rem] rotate-[-8deg] opacity-[0.07] blur-[1px] lg:block"
        />
      </div>

      <div className="container-x relative">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 font-label text-[0.66rem] uppercase tracking-[0.18em] text-mist-500">
            <Link to="/" className="transition-colors hover:text-pink-300">
              Home
            </Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1.5">
                <Icon name="chevronRight" size={12} />
                {c.to ? (
                  <Link to={c.to} className="transition-colors hover:text-pink-300">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-mist-200">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="eyebrow">
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-4xl text-[clamp(2.8rem,7.5vw,6.4rem)] font-black uppercase leading-[0.9]"
        >
          {title} {accent && <span className="text-neon">{accent}</span>}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-2xl text-base leading-relaxed text-mist-300 sm:text-lg"
          >
            {description}
          </motion.p>
        )}
        {children}
      </div>
    </section>
  )
}
