import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../components/Icon'
import { useCart } from '../stores/cartStore'
import { useTitle } from '../lib/useTitle'
import { CONNECT_URL, DISCORD_URL } from '../data/site'

const NEXT = [
  ['refresh', 'Reconnect', 'Your purchase is delivered as soon as you are back in the city.'],
  ['mail', 'Check your email', 'Tebex sends the receipt and your transaction ID.'],
  ['headset', 'Something wrong?', 'Open a ticket on Discord with your transaction ID.'],
]

export default function ThankYou() {
  useTitle('Thank you')
  const { username } = useCart()

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-36 text-center">
      <div className="bg-halftone pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_20_160/0.3),transparent)]" />

      <div className="relative">
        {[0, 1].map((i) => (
          <span key={i} className="absolute inset-0 rounded-full border border-pink-500/60" style={{ animation: `thl-pulse-ring 2.4s ${i * 1.2}s cubic-bezier(0.16,1,0.3,1) infinite` }} />
        ))}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 15, delay: 0.1 }}
          className="relative flex h-24 w-24 items-center justify-center rounded-full bg-pink-500 text-white shadow-[0_0_80px_-6px_rgb(255_20_160)]"
        >
          <Icon name="check" size={44} strokeWidth={2.4} />
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-10 text-[clamp(2.8rem,8vw,6rem)] font-black uppercase leading-[0.9]"
      >
        Cheers{username ? `, ${username}` : ''}!
        <span className="text-neon block">Your order is in.</span>
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }} className="relative mt-6 max-w-lg text-mist-300">
        Your support keeps The Heights running and growing. Your purchase is waiting the moment you reconnect.
      </motion.p>

      <div className="relative mt-12 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {NEXT.map(([icon, title, text], i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className=" border border-white/[0.07] bg-ink-900/70 p-6 text-left backdrop-blur"
          >
            <Icon name={icon} size={22} className="text-pink-400" />
            <p className="mt-4 font-display text-lg font-bold uppercase text-chalk">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-mist-400">{text}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative mt-10 flex flex-wrap justify-center gap-3">
        <a href={CONNECT_URL} className="btn-chrome px-8 py-4">
          <Icon name="play" size={14} />
          Play now
        </a>
        <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" className="btn-ghost px-8 py-4">
          <Icon name="discord" size={17} />
          Discord
        </a>
        <Link to="/store" className="btn-ghost px-8 py-4">
          Keep shopping
        </Link>
      </div>
    </section>
  )
}
