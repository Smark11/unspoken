export function relative(ms: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ms) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`
  const d = Math.round(h / 24)
  if (d < 7) return d === 1 ? 'yesterday' : `${d} days ago`
  const w = Math.round(d / 7)
  if (w < 5) return w === 1 ? 'last week' : `${w} weeks ago`
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
