/** Spaced review. Each pass moves a word one box further out; a miss sends it back to the start. */
export const INTERVAL_DAYS = [1, 3, 7, 14, 30]
const DAY = 24 * 60 * 60 * 1000

export interface WordProgress {
  box: number          // 0 = never passed; INTERVAL_DAYS.length = retired as mastered
  dueAt: number        // ms since epoch
  passes: number
  lastAt: number
}

export const freshProgress = (now: number): WordProgress => ({ box: 0, dueAt: now, passes: 0, lastAt: now })

export function onPass(p: WordProgress | undefined, now: number): WordProgress {
  const prev = p ?? freshProgress(now)
  const box = Math.min(prev.box + 1, INTERVAL_DAYS.length)
  const days = INTERVAL_DAYS[Math.min(box, INTERVAL_DAYS.length) - 1]
  return { box, dueAt: now + days * DAY, passes: prev.passes + 1, lastAt: now }
}

export function onMiss(p: WordProgress | undefined, now: number): WordProgress {
  const prev = p ?? freshProgress(now)
  return { box: 0, dueAt: now + DAY, passes: prev.passes, lastAt: now }
}

export const isRetired = (p: WordProgress) => p.box >= INTERVAL_DAYS.length

export const isDue = (p: WordProgress, now: number) => p.box > 0 && !isRetired(p) && p.dueAt <= now

/** Pick a few due words, the longest-overdue first. */
export function pickReview(progress: Record<string, WordProgress>, now: number, n = 3): string[] {
  return Object.entries(progress)
    .filter(([, p]) => isDue(p, now))
    .sort((a, b) => a[1].dueAt - b[1].dueAt)
    .slice(0, n)
    .map(([key]) => key)
}
