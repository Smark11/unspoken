import type { Listener, ListenResult } from './types'

// The Web Speech recognition API is not in TypeScript's DOM library; this is the slice we use.
interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type RecognitionCtor = new () => Recognition

function ctor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function createBrowserListener(): Listener {
  let current: Recognition | null = null

  return {
    get available() { return !!ctor() },
    listen({ lang, timeoutMs }): Promise<ListenResult> {
      const Ctor = ctor()
      if (!Ctor) return Promise.resolve({ ok: false, error: 'unsupported' })
      return new Promise((resolve) => {
        const rec = new Ctor()
        current = rec
        rec.lang = lang
        rec.interimResults = false
        rec.maxAlternatives = 5
        rec.continuous = false
        let settled = false
        const done = (r: ListenResult) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          current = null
          resolve(r)
        }
        const timer = setTimeout(() => {
          try { rec.stop() } catch { /* already stopped */ }
        }, timeoutMs)

        rec.onresult = (e) => {
          const first = e.results[0]
          const alternatives = Array.from({ length: first.length }, (_, i) => first[i].transcript)
          done({ ok: true, alternatives })
        }
        rec.onerror = (e) => {
          const map: Record<string, ListenResult> = {
            'not-allowed': { ok: false, error: 'not-allowed' },
            'service-not-allowed': { ok: false, error: 'not-allowed' },
            'no-speech': { ok: false, error: 'no-speech' },
            network: { ok: false, error: 'network' },
            aborted: { ok: false, error: 'no-speech' },
          }
          done(map[e.error] ?? { ok: false, error: 'other', detail: e.error })
        }
        rec.onend = () => done({ ok: false, error: 'no-speech' })
        try {
          rec.start()
        } catch (err) {
          done({ ok: false, error: 'other', detail: String(err) })
        }
      })
    },
    abort() {
      try { current?.abort() } catch { /* nothing to abort */ }
      current = null
    },
  }
}
