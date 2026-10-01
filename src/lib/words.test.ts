import { describe, expect, it } from 'vitest'
import { parseWords, wordKey } from './words'

describe('parseWords', () => {
  it('splits on newlines, commas and semicolons', () => {
    expect(parseWords('a\nb, c; d')).toEqual(['a', 'b', 'c', 'd'])
  })
  it('keeps single-spaced phrases together but splits on wide gaps', () => {
    expect(parseWords('New York  Los Angeles')).toEqual(['New York', 'Los Angeles'])
  })
  it('trims surrounding quotes and punctuation', () => {
    expect(parseWords('"quinoa", (gnocchi)!')).toEqual(['quinoa', 'gnocchi'])
  })
  it('dedupes case-insensitively and drops blanks', () => {
    expect(parseWords('Rural\nrural\n\n  ')).toEqual(['Rural'])
  })
  it('wordKey is case-insensitive', () => {
    expect(wordKey(' Quinoa ')).toBe('quinoa')
  })
})
