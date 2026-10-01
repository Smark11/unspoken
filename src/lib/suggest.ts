/** Word suggestions while typing, from the free Datamuse API (no key, large vocabulary that
 *  includes medical terms and names). Fails quietly offline: the typed word still works. */

const cache = new Map<string, string[]>()

export async function suggest(prefix: string, signal?: AbortSignal): Promise<string[]> {
  const p = prefix.trim().toLowerCase()
  if (p.length < 2) return []
  const hit = cache.get(p)
  if (hit) return hit
  try {
    const r = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(p)}&max=7`, { signal })
    if (!r.ok) return []
    const data = (await r.json()) as { word: string }[]
    const words = data.map((d) => d.word).filter((w) => w.toLowerCase() !== p)
    cache.set(p, words)
    return words
  } catch {
    return []
  }
}

/** Carry the typist's capitalisation onto a lower-case suggestion ("Nguy" + "nguyen" = "Nguyen"). */
export function matchCase(typed: string, word: string): string {
  const t = typed.trim()
  if (!t) return word
  if (t === t.toUpperCase() && t.length > 1) return word.toUpperCase()
  if (t[0] === t[0].toUpperCase() && t[0] !== t[0].toLowerCase()) {
    return word.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }
  return word
}
