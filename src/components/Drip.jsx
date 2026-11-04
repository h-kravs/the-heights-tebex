/**
 * Paint dripping off an edge, as an SVG. Fills with `currentColor`, so the
 * parent sets the paint through a text color class. Sits flush against the
 * top edge of its container; `flip` hangs it from the bottom edge of the
 * section above instead (the drips still point down).
 */
export default function Drip({ className = '', flip = false, height = 46 }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 block w-full ${flip ? 'top-0' : 'bottom-0 translate-y-[99%]'} ${className}`}
      style={{ height }}
    >
      <path
        fill="currentColor"
        d="M0 0h1440v6c-18 0-24 2-30 14s-10 22-16 22-10-12-16-24-8-12-18-12-22 0-38 0-20 0-24 8-6 30-12 30-8-16-14-26-10-12-30-12-80 0-110 0-24 0-30 18-4 36-12 36-10-30-18-42-10-12-24-12-64 0-96 0-28 0-34 10-6 24-14 24-8-18-14-28-12-6-30-6-66 0-98 0-26 0-32 14-10 40-18 40-10-36-18-48-10-6-22-6-58 0-86 0-26 0-32 10-10 32-16 32-8-20-16-34-10-8-24-8-50 0-74 0-22 0-30 12-8 44-16 44-10-32-16-44-10-12-30-12-66 0-92 0-28 0-34 8-6 22-12 22-8-14-14-24-12-6-28-6-62 0-90 0-24 0-30 16-6 38-12 38-10-26-18-40-10-14-26-14-40 0-60 0-20 0-26 8-6 20-12 20-8-12-16-22S36 6 0 6V0z"
      />
    </svg>
  )
}
