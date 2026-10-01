/** Speech is behind two small interfaces so the browser engines used today can be swapped for a
 *  pronunciation-assessment service (see PLAN.md) without touching the screens. */

export type Rate = 'normal' | 'slow'

export interface Speaker {
  readonly available: boolean
  /** 'cloud' when a voice server is configured, else the device's own voices. */
  readonly engine: 'device' | 'cloud'
  speak(text: string, rate: Rate): void
  stop(): void
  /** Subscribe to speaking on/off; returns an unsubscribe function. */
  onSpeaking(cb: (speaking: boolean, rate: Rate | null) => void): () => void
  /** English voices the device offers. */
  voices(): { name: string; lang: string; local: boolean }[]
  /** Choose a voice by name; null returns to the automatic choice. */
  setVoice(name: string | null): void
  /** Delivery style: pitch and a rate multiplier applied on top of normal/slow. */
  setStyle(pitch: number, rate: number): void
  /** Called whenever the device's voice list changes (they load late on some browsers). */
  onVoices(cb: () => void): () => void
  /** Accent preset id for engines that map presets themselves; null = automatic. */
  setPreset(id: string | null): void
  /** Fetch clips ahead of time so the first tap is instant. */
  warm(texts: string[]): void
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
