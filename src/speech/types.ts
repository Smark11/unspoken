/** Speech is behind two small interfaces so the browser engines used today can be swapped for a
 *  pronunciation-assessment service (see PLAN.md) without touching the screens. */

export type Rate = 'normal' | 'slow'

export interface Speaker {
  readonly available: boolean
  speak(text: string, rate: Rate): void
  stop(): void
  /** Subscribe to speaking on/off; returns an unsubscribe function. */
  onSpeaking(cb: (speaking: boolean, rate: Rate | null) => void): () => void
  /** English voices the device offers, best first. */
  voices(): { name: string; lang: string }[]
  /** Choose a voice by name; null returns to the automatic choice. */
  setVoice(name: string | null): void
}

export type ListenError = 'unsupported' | 'not-allowed' | 'no-speech' | 'network' | 'other'

export type ListenResult =
  | { ok: true; alternatives: string[] }
  | { ok: false; error: ListenError; detail?: string }

export interface Listener {
  readonly available: boolean
  listen(opts: { lang: string; timeoutMs: number }): Promise<ListenResult>
  abort(): void
}
