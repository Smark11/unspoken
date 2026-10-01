export type Verdict = 'got' | 'almost'

export interface Judgement {
  verdict: Verdict
  heard: string
  score: number
  guidance: string
}

export const PASS_THRESHOLD = 0.8

/** Letters only, lower case: the recogniser's spelling of a word varies in case and punctuation. */
export const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[n]
}

export const similarity = (a: string, b: string) =>
  1 - levenshtein(a, b) / Math.max(a.length, b.length, 1)

/** Compare the target word with everything the recogniser thought it heard. */
export function judge(target: string, alternatives: string[], attempt = 1): Judgement {
  const t = normalize(target)
  let best = { heard: alternatives[0] ?? '', score: 0 }
  for (const alt of alternatives) {
    const h = normalize(alt)
    // Accept the target appearing as one word inside a longer phrase ("the word is quinoa").
    const contained = alt.toLowerCase().split(/\s+/).some((w) => normalize(w) === t)
    const s = contained ? 1 : similarity(t, h)
    if (s > best.score) best = { heard: alt, score: s }
  }
  if (best.score >= PASS_THRESHOLD) {
    return { verdict: 'got', heard: best.heard, score: best.score, guidance: attempt > 1 ? 'That’s the one.' : 'First try.' }
  }
  return { verdict: 'almost', heard: best.heard, score: best.score, guidance: guidance(target, best.heard) }
}

/** A single, concrete thing to change on the next attempt. */
export function guidance(target: string, heard: string): string {
  const t = normalize(target)
  const h = normalize(heard)
  if (!h) return 'Nothing came through. Tap Say it, wait for the meter, then say the word.'
  if (h.length < t.length * 0.6) return 'Say the whole word, every syllable, even the quiet ones.'
  if (t.slice(0, 2) !== h.slice(0, 2)) {
    return `Start with “${target.slice(0, 2)}”. Tap Slowly and copy just the first sound.`
  }
  if (t.slice(-3) !== h.slice(-3)) {
    return `Hold the ending, “${target.slice(-3)}”, a beat longer than feels natural.`
  }
  return 'Close. Tap Slowly, say it one syllable at a time, then put it back together.'
}
