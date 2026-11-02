import Reveal from './Reveal'

/** Eyebrow + oversized condensed title with a neon accent word, used to open sections. */
export default function SectionHead({ eyebrow, title, accent, children, action, align = 'left' }) {
  const centred = align === 'center'
  return (
    <Reveal className={`mb-10 flex flex-col gap-6 ${centred ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'}`}>
      <div className={centred ? 'flex flex-col items-center' : ''}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-4 text-[clamp(2.4rem,5.6vw,4.6rem)] font-black uppercase leading-[0.9]">
          {title} {accent && <span className="text-neon">{accent}</span>}
        </h2>
        {children && <p className={`mt-4 max-w-xl text-mist-400 ${centred ? 'mx-auto' : ''}`}>{children}</p>}
      </div>
      {action}
    </Reveal>
  )
}
