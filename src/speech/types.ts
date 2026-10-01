/** Speech is behind two small interfaces so the browser engines used today can be swapped for a
 *  pronunciation-assessment service (see PLAN.md) without touching the screens. */

export type Rate = 'normal' | 'slow'

export interface Speaker {
  readonly available: boolean
  speak(text: string, rate: Rate): void
  stop(): void
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
