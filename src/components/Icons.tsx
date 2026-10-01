type P = { size?: number; className?: string }
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true })

export const PlayIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M7 5v14l11-7z" fill="currentColor" stroke="none" /></svg>
)
export const SlowIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
export const MicIcon = ({ size = 28, className }: P) => (
  <svg {...base(size)} className={className}><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
)
export const CloseIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><path d="M6 6l12 12M18 6L6 18" /></svg>
)
export const BackIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><path d="M15 5l-7 7 7 7" /></svg>
)
export const CheckIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
)
export const SkipIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M5 5l9 7-9 7zM18 5v14" /></svg>
)
export const SparkIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" stroke="none" /></svg>
)
export const PlusIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 5v14M5 12h14" /></svg>
)
export const GearIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
)
export const ChevronIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M9 5l7 7-7 7" /></svg>
)

/** Circular progress, 0..1 */
export function Ring({ value, size = 44, stroke = 4, className }: { value: number; size?: number; stroke?: number; className?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ring-track)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ring-fill)" strokeWidth={stroke} fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }} />
    </svg>
  )
}
