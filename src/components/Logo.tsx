/** The Unspoken mark: a sound wave in a soft square, the same bars the orb shows while listening. */
export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="mark">
      <defs>
        <linearGradient id="mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5B63FF" />
          <stop offset="1" stopColor="#3DA9FC" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="19" fill="url(#mark-g)" />
      <g fill="#fff">
        <rect x="11" y="26" width="6" height="12" rx="3" />
        <rect x="21" y="19" width="6" height="26" rx="3" />
        <rect x="31" y="12" width="6" height="40" rx="3" />
        <rect x="41" y="19" width="6" height="26" rx="3" />
        <rect x="51" y="26" width="6" height="12" rx="3" />
      </g>
    </svg>
  )
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="logo" style={{ ['--logo' as string]: `${size}px` }}>
      <Mark size={size} />
      <span className="wordmark">Unspoken</span>
    </span>
  )
}
