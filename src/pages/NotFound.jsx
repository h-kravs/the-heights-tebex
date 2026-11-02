import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useTitle } from '../lib/useTitle'

export default function NotFound() {
  useTitle('Page not found')
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pt-24 text-center">
      <div className="bg-halftone pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_20_160/0.25),transparent)]" />
      <p className="text-outline-pink relative select-none font-display text-[clamp(8rem,30vw,22rem)] font-black leading-none" aria-hidden="true">
        404
      </p>
      <h1 className="relative -mt-6 text-4xl font-black uppercase sm:text-5xl">
        This block <span className="text-neon">does not exist.</span>
      </h1>
      <p className="relative mt-4 max-w-md text-mist-400">The page you are looking for moved, or was never here.</p>
      <div className="relative mt-9 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          <Icon name="home" size={16} />
          Back home
        </Link>
        <Link to="/store" className="btn-ghost">
          Go to the store
        </Link>
      </div>
    </section>
  )
}
