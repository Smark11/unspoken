export const MAX_WORDS = 10

/** Split typed or pasted text into distinct words. Commas, semicolons, newlines and tabs separate;
 *  a run of two or more spaces also separates, so "New York" stays together but "cat  dog" splits. */
export function parseWords(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of text.split(/[\n\r,;\t]+|\s{2,}/)) {
    const w = raw.trim().replace(/^["'“”‘’(\[]+|["'“”‘’)\].!?]+$/g, '')
    if (!w) continue
    const key = w.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(w)
  }
  return out
}

/** Stable key for a word across lists, used for long-term progress. */
export const wordKey = (w: string) => w.trim().toLowerCase()
