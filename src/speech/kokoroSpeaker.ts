import type { Rate, Speaker } from './types'
import { getKokoro } from '../lib/prefs'
import { getPlayer } from './player'

/** Kokoro-82M running inside the browser (ONNX, WebAssembly). About 90 MB downloads once and is
 *  cached by the browser; every word after that is synthesized on the device, offline. */

export const KOKORO_VOICES: Record<string, { voice: string; note: string }> = {
  auto: { voice: 'af_heart', note: 'Heart, Kokoro’s best American voice' },
  'gb-f': { voice: 'bf_emma', note: 'Emma, an English woman' },
  'gb-m': { voice: 'bm_george', note: 'George, an English man' },
  'us-f': { voice: 'af_bella', note: 'Bella, warm American' },
  'us-m': { voice: 'am_michael', note: 'Michael, American, steady' },
}

export type KokoroState = { state: 'off' | 'loading' | 'ready' | 'error'; progress: number; message: string }
const listeners = new Set<(s: KokoroState) => void>()
let status: KokoroState = { state: 'off', progress: 0, message: '' }
const setStatus = (s: Partial<KokoroState>) => { status = { ...status, ...s }; listeners.forEach((cb) => cb(status)) }
export const kokoroStatus = () => status
export const onKokoroStatus = (cb: (s: KokoroState) => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

type Reply =
  | { kind: 'progress'; file?: string; loaded?: number; total?: number }
  | { id: number; kind: 'ready' }
  | { id: number; kind: 'audio'; wav: ArrayBuffer }
  | { id: number; kind: 'error'; message: string }

let worker: Worker | null = null
let loadPromise: Promise<void> | null = null
let nextId = 1
const pending = new Map<number, { resolve: (v: ArrayBuffer | void) => void; reject: (e: Error) => void }>()
const seen = new Map<string, { loaded: number; total: number }>()

function ensureWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./kokoro.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<Reply>) => {
    const m = e.data
    if (m.kind === 'progress') {
      if (m.file && m.total) {
        seen.set(m.file, { loaded: m.loaded ?? 0, total: m.total })
        let loaded = 0, total = 0
        for (const v of seen.values()) { loaded += v.loaded; total += v.total }
        setStatus({ progress: total ? loaded / total : 0, message: `Downloading the voice model… ${Math.round((loaded / total) * 100)}%` })
      }
      return
    }
    const p = pending.get(m.id)
    if (!p) return
    pending.delete(m.id)
    if (m.kind === 'error') p.reject(new Error(m.message))
    else if (m.kind === 'audio') p.resolve(m.wav)
    else p.resolve()
  }
  worker.onerror = (e) => {
    setStatus({ state: 'error', progress: 0, message: `Kokoro worker failed: ${e.message}` })
    for (const p of pending.values()) p.reject(new Error(e.message))
    pending.clear()
  }
  return worker
}

function call(msg: Record<string, unknown>, transfer?: Transferable[]): Promise<ArrayBuffer | void> {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ensureWorker().postMessage({ id, ...msg }, transfer ?? [])
  })
}

/** Start loading the model in the worker (idempotent). */
export function loadKokoro(): Promise<void> {
  if (loadPromise) return loadPromise
  setStatus({ state: 'loading', progress: 0, message: 'Downloading the voice model…' })
  loadPromise = call({ kind: 'load' })
    .then(() => { setStatus({ state: 'ready', progress: 1, message: 'Ready. Words are spoken on this device.' }) })
    .catch((err: Error) => {
      loadPromise = null
      setStatus({ state: 'error', progress: 0, message: `Couldn’t load Kokoro: ${err.message}` })
      throw err
    })
  return loadPromise
}

function generate(text: string, voice: string, speed: number): Promise<ArrayBuffer> {
  return call({ kind: 'generate', text, voice, speed }) as Promise<ArrayBuffer>
}

// Dev-only hook so synthesis time can be measured from the console without audio or timers.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __kokoro?: unknown }).__kokoro = { load: loadKokoro, generate, status: kokoroStatus }
}

export function createKokoroSpeaker(next: Speaker): Speaker {
  let preset: string | null = null
  let speed = 1
  let seq = 0
  const clips = new Map<string, Promise<string>>()
  const player = getPlayer()
  const subs = new Set<(speaking: boolean, rate: Rate | null) => void>()
  const emit = (on: boolean, rate: Rate | null) => subs.forEach((cb) => cb(on, rate))
  next.onSpeaking((on, rate) => emit(on, rate))
  player?.onState((on, rate) => emit(on, rate))

  const enabled = () => getKokoro() && status.state !== 'error'
  const active = () => enabled() && status.state === 'ready'

  const clip = (text: string, rate: Rate): Promise<string> => {
    const { voice } = KOKORO_VOICES[preset ?? 'auto'] ?? KOKORO_VOICES.auto
    const spd = Math.round((rate === 'slow' ? 0.6 : 1) * speed * 100) / 100
    const key = `${text}|${voice}|${spd}`
    let p = clips.get(key)
    if (!p) {
      p = loadKokoro()
        .then(() => generate(text, voice, spd))
        .then((wav) => URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })))
      p.catch(() => clips.delete(key))
      clips.set(key, p)
    }
    return p
  }

  if (typeof window !== 'undefined' && getKokoro()) void loadKokoro().catch(() => { /* status carries the error */ })

  return {
    get available() { return next.available || enabled() },
    get engine() { return enabled() ? 'kokoro' as const : next.engine },
    speak(text, rate) {
      if (!player || !active()) { next.speak(text, rate); return }
      next.stop()
      player.stop()
      const my = ++seq
      emit(true, rate)                       // show activity while the word is synthesized
      clip(text, rate).then((src) => {
        if (my !== seq) return               // a newer request superseded this one
        return player.play(src, rate)
      }).catch(() => { emit(false, null); if (my === seq) next.speak(text, rate) })
    },
    stop() { player?.stop(); next.stop(); emit(false, null) },
    onSpeaking(cb) { subs.add(cb); return () => { subs.delete(cb) } },
    voices: () => next.voices(),
    setVoice: (name) => next.setVoice(name),
    setPreset(id) { preset = id; next.setPreset(id) },
    setStyle(p, r) { speed = r; next.setStyle(p, r) },
    onVoices: (cb) => next.onVoices(cb),
    warm(texts) {
      if (!active()) { next.warm(texts); return }
      // Sequentially, so the first word is ready first and the main thread stays responsive.
      texts.reduce((chain, t) => chain.then(() => clip(t, 'normal')).then(() => undefined).catch(() => undefined), Promise.resolve())
    },
  }
}
