import type { WordResult } from './storage'

/** One practice run through a list. Pure, so the flow can be tested without a browser. */
export interface Session {
  words: string[]
  results: WordResult[]
  queue: number[]      // indexes still to come after the current one
  current: number
  finished: boolean
}

export function createSession(words: string[]): Session {
  return {
    words,
    results: words.map(() => 'new'),
    queue: words.map((_, i) => i).slice(1),
    current: 0,
    finished: words.length === 0,
  }
}

export function markCurrent(s: Session, r: WordResult): Session {
  return { ...s, results: s.results.map((x, i) => (i === s.current ? r : x)) }
}

export function advance(s: Session): Session {
  const [next, ...rest] = s.queue
  if (next === undefined) return { ...s, finished: true }
  return { ...s, current: next, queue: rest }
}

export function retrySkipped(s: Session): Session {
  const again = s.results.map((r, i) => (r === 'skipped' ? i : -1)).filter((i) => i >= 0)
  if (!again.length) return s
  return {
    ...s,
    results: s.results.map((r) => (r === 'skipped' ? 'new' : r)),
    current: again[0],
    queue: again.slice(1),
    finished: false,
  }
}

export const countGot = (s: Session) => s.results.filter((r) => r === 'got').length
