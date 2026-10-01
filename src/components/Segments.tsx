import type { WordResult } from '../lib/storage'

export function Segments({ results, current }: { results: WordResult[]; current: number }) {
  return (
    <div className="segments" aria-hidden="true">
      {results.map((r, i) => (
        <i key={i} className={i === current ? 'now' : r === 'got' ? 'got' : r === 'skipped' ? 'skipped' : ''} />
      ))}
    </div>
  )
}
