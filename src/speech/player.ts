import type { Rate } from './types'

/** One shared audio element for clip playback. Unlocked on the first tap so iOS lets later
 *  programmatic plays through. */
function silentWav(): string {
  const samples = 800
  const buf = new ArrayBuffer(44 + samples * 2)
  const v = new DataView(buf)
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + samples * 2, true); str(8, 'WAVE'); str(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  str(36, 'data'); v.setUint32(40, samples * 2, true)
  let bin = ''
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b)
  return `data:audio/wav;base64,${btoa(bin)}`
}

export interface Player {
  play(src: string, rate: Rate): Promise<void>
  stop(): void
  onState(cb: (speaking: boolean, rate: Rate | null) => void): () => void
}

let shared: Player | null = null

export function getPlayer(): Player | null {
  if (typeof Audio === 'undefined') return null
  if (shared) return shared
  const audio = new Audio()
  audio.preload = 'auto'
  let current: Rate | null = null
  let unlocked = false
  const subs = new Set<(speaking: boolean, rate: Rate | null) => void>()
  const emit = (on: boolean, rate: Rate | null) => subs.forEach((cb) => cb(on, rate))
  audio.onplaying = () => emit(true, current)
  audio.onended = () => { current = null; emit(false, null) }
  audio.onerror = () => { current = null; emit(false, null) }
  const unlock = () => {
    if (unlocked) return
    unlocked = true
    try {
      audio.src = silentWav()
      void audio.play().then(() => audio.pause()).catch(() => { unlocked = false })
    } catch { unlocked = false }
  }
  document.addEventListener('pointerdown', unlock, { capture: true, passive: true })
  document.addEventListener('keydown', unlock, { capture: true })

  shared = {
    async play(src, rate) {
      audio.pause()
      current = rate
      audio.src = src
      await audio.play()
    },
    stop() {
      current = null
      audio.pause()
      try { audio.currentTime = 0 } catch { /* no source yet */ }
      emit(false, null)
    },
    onState(cb) {
      subs.add(cb)
      return () => { subs.delete(cb) }
    },
  }
  return shared
}
