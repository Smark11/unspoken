import { describe, expect, it } from 'vitest'
import { parseHash } from './router'

describe('parseHash', () => {
  it('defaults to home', () => {
    expect(parseHash('')).toEqual({ name: 'home' })
    expect(parseHash('#/')).toEqual({ name: 'home' })
    expect(parseHash('#/nonsense')).toEqual({ name: 'home' })
  })
  it('parses routes', () => {
    expect(parseHash('#/new')).toEqual({ name: 'new' })
    expect(parseHash('#/review')).toEqual({ name: 'review' })
    expect(parseHash('#/about')).toEqual({ name: 'about' })
    expect(parseHash('#/practice/abc%20d')).toEqual({ name: 'practice', listId: 'abc d' })
  })
})
