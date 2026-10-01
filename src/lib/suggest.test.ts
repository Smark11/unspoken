import { describe, expect, it } from 'vitest'
import { matchCase } from './suggest'

describe('matchCase', () => {
  it('keeps lower case for lower-case typing', () => {
    expect(matchCase('pleo', 'pleocytosis')).toBe('pleocytosis')
  })
  it('capitalises when the typist did', () => {
    expect(matchCase('Nguy', 'nguyen')).toBe('Nguyen')
    expect(matchCase('Worc', 'worcestershire sauce')).toBe('Worcestershire Sauce')
  })
  it('shouts back when shouted at', () => {
    expect(matchCase('ECG', 'ecg')).toBe('ECG')
  })
})
