import { describe, expect, it } from 'vitest'
import { relative } from './time'

const t0 = 1_700_000_000_000
describe('relative', () => {
  it('formats recent times', () => {
    expect(relative(t0 - 10_000, t0)).toBe('just now')
    expect(relative(t0 - 5 * 60_000, t0)).toBe('5 min ago')
    expect(relative(t0 - 3 * 3_600_000, t0)).toBe('3 hours ago')
    expect(relative(t0 - 26 * 3_600_000, t0)).toBe('yesterday')
    expect(relative(t0 - 3 * 86_400_000, t0)).toBe('3 days ago')
    expect(relative(t0 - 8 * 86_400_000, t0)).toBe('last week')
  })
})
