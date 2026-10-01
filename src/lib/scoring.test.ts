import { describe, expect, it } from 'vitest'
import { guidance, judge, levenshtein, similarity } from './scoring'

describe('similarity', () => {
  it('levenshtein basics', () => {
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('kitten', 'sitting')).toBe(3)
  })
  it('identical words score 1', () => {
    expect(similarity('quinoa', 'quinoa')).toBe(1)
  })
})

describe('judge', () => {
  it('passes an exact match and a close recogniser spelling', () => {
    expect(judge('pleocytosis', ['pleocytosis']).verdict).toBe('got')
    expect(judge('pleocytosis', ['plea o cytosis']).verdict).toBe('got')
  })
  it('passes when the word appears inside a phrase', () => {
    expect(judge('quinoa', ['the word is quinoa']).verdict).toBe('got')
  })
  it('uses the best alternative', () => {
    expect(judge('rural', ['rule', 'rural', 'roll']).verdict).toBe('got')
  })
  it('fails a clearly different word and says what was heard', () => {
    const j = judge('rural', ['rule'])
    expect(j.verdict).toBe('almost')
    expect(j.heard).toBe('rule')
    expect(j.guidance.length).toBeGreaterThan(10)
  })
  it('handles an empty result', () => {
    expect(judge('rural', []).verdict).toBe('almost')
  })
})

describe('guidance', () => {
  it('points at the beginning when the first sounds differ', () => {
    expect(guidance('quinoa', 'keen wah')).toMatch(/Start with “qu”/)
  })
  it('points at the ending when only the tail differs', () => {
    expect(guidance('anemone', 'an enemy')).toMatch(/ending/)
  })
  it('asks for the whole word when too little was heard', () => {
    expect(guidance('sphygmomanometer', 'sfig')).toMatch(/whole word/)
  })
})
