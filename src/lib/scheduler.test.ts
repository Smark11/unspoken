import { describe, expect, it } from 'vitest'
import { INTERVAL_DAYS, isDue, isRetired, onMiss, onPass, pickReview } from './scheduler'

const DAY = 86_400_000
const t0 = 1_000_000_000_000

describe('scheduler', () => {
  it('first pass is due again tomorrow', () => {
    const p = onPass(undefined, t0)
    expect(p.box).toBe(1)
    expect(p.dueAt).toBe(t0 + DAY)
    expect(isDue(p, t0)).toBe(false)
    expect(isDue(p, t0 + DAY)).toBe(true)
  })
  it('spacing grows with each pass and retires at the end', () => {
    let p = onPass(undefined, t0)
    for (let i = 1; i < INTERVAL_DAYS.length; i++) p = onPass(p, t0)
    expect(isRetired(p)).toBe(true)
    expect(isDue(p, t0 + 365 * DAY)).toBe(false)
  })
  it('a miss sends the word back to the start', () => {
    const p = onMiss(onPass(onPass(undefined, t0), t0), t0)
    expect(p.box).toBe(0)
    expect(p.passes).toBe(2)
  })
  it('picks the most overdue words first, up to n', () => {
    const progress = {
      a: { ...onPass(undefined, t0), text: 'a' },
      b: { ...onPass(undefined, t0 - 5 * DAY), text: 'b' },
      c: { ...onPass(undefined, t0 - 2 * DAY), text: 'c' },
      fresh: { box: 0, dueAt: t0, passes: 0, lastAt: t0, text: 'fresh' },
    }
    expect(pickReview(progress, t0 + DAY, 2)).toEqual(['b', 'c'])
  })
})
