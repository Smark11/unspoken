import type { WordProgress } from './scheduler'

export type WordResult = 'new' | 'got' | 'skipped'

export interface WordList {
  id: string
  title: string
  words: string[]
  createdAt: number
  lastPracticedAt?: number
  results: Record<string, WordResult>
}

export interface Store {
  version: 1
  lists: WordList[]
  /** keyed by wordKey; the original spelling is kept so review can display it */
  progress: Record<string, WordProgress & { text: string }>
}

const KEY = 'unspoken.v1'
const empty = (): Store => ({ version: 1, lists: [], progress: {} })

export function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Store
    if (parsed.version !== 1) return empty()
    return { ...empty(), ...parsed }
  } catch {
    return empty()
  }
}

export function save(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* private mode or quota: the session still works, it just won't persist */
  }
}

export function update(fn: (s: Store) => void): Store {
  const s = load()
  fn(s)
  save(s)
  return s
}

export const newId = () =>
  (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`)

export function titleFor(words: string[]) {
  const shown = words.slice(0, 3).join(', ')
  return words.length > 3 ? `${shown}…` : shown
}
