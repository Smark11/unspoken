/** A brief burst of dots, used once when a word lands. Re-render with a new `seed` to fire again. */
export function Burst({ seed }: { seed: number }) {
  if (!seed) return null
  const dots = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + (seed % 7) * 0.13
    const dist = 90 + ((i * 37 + seed) % 60)
    return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, delay: (i % 4) * 30, size: 6 + (i % 3) * 3 }
  })
  return (
    <span className="burst" key={seed} aria-hidden="true">
      {dots.map((d, i) => (
        <i key={i} style={{ ['--dx' as string]: `${d.dx}px`, ['--dy' as string]: `${d.dy}px`, animationDelay: `${d.delay}ms`, width: d.size, height: d.size }} />
      ))}
    </span>
  )
}
