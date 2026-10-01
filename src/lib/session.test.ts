import { describe, expect, it } from 'vitest'
import { advance, countGot, createSession, markCurrent, retrySkipped } from './session'

describe('session', () => {
  it('starts on the first word with the rest queued', () => {
    const s = createSession(['a', 'b', 'c'])
    expect(s.current).toBe(0)
    expect(s.queue).toEqual([1, 2])
    expect(s.finished).toBe(false)
  })
  it('moves to a different word after a pass', () => {
    let s = createSession(['a', 'b', 'c'])
    s = advance(markCurrent(s, 'got'))
    expect(s.current).toBe(1)
    expect(s.results).toEqual(['got', 'new', 'new'])
  })
  it('finishes after the last word', () => {
    let s = createSession(['a', 'b'])
    s = advance(markCurrent(s, 'got'))
    s = advance(markCurrent(s, 'skipped'))
    expect(s.finished).toBe(true)
    expect(countGot(s)).toBe(1)
  })
  it('replays only the skipped words', () => {
    let s = createSession(['a', 'b', 'c'])
    s = advance(markCurrent(s, 'skipped'))
    s = advance(markCurrent(s, 'got'))
    s = advance(markCurrent(s, 'skipped'))
    expect(s.finished).toBe(true)
    s = retrySkipped(s)
    expect(s.finished).toBe(false)
    expect(s.current).toBe(0)
    expect(s.queue).toEqual([2])
    expect(s.results).toEqual(['new', 'got', 'new'])
  })
  it('an empty list is finished immediately', () => {
    expect(createSession([]).finished).toBe(true)
  })
})
