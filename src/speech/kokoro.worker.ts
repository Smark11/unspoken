/// <reference lib="webworker" />
/** Kokoro runs here, off the main thread, so synthesis never freezes the interface. */
import { KokoroTTS } from 'kokoro-js'

type Req = { id: number; kind: 'load' } | { id: number; kind: 'generate'; text: string; voice: string; speed: number }
type Tts = Awaited<ReturnType<typeof KokoroTTS.from_pretrained>>

let ttsPromise: Promise<Tts> | null = null

function load(): Promise<Tts> {
  if (!ttsPromise) {
    ttsPromise = KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
        if (p.status === 'progress') self.postMessage({ kind: 'progress', file: p.file, loaded: p.loaded, total: p.total })
      },
    }).catch((err) => { ttsPromise = null; throw err })
  }
  return ttsPromise
}

self.onmessage = async (e: MessageEvent<Req>) => {
  const msg = e.data
  try {
    if (msg.kind === 'load') {
      await load()
      self.postMessage({ id: msg.id, kind: 'ready' })
      return
    }
    const tts = await load()
    const audio = await tts.generate(msg.text, { voice: msg.voice as keyof Tts['voices'], speed: msg.speed })
    const wav = audio.toWav()
    self.postMessage({ id: msg.id, kind: 'audio', wav }, [wav])
  } catch (err) {
    self.postMessage({ id: msg.id, kind: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
