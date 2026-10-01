import type { Rate, Speaker } from './types'
import { getTtsUrl } from '../lib/prefs'

/** Azure neural voice for each accent preset; 'auto' is the default. */
export const CLOUD_VOICES: Record<string, { voice: string; note: string }> = {
  auto: { voice: 'en-US-AvaMultilingualNeural', note: 'Ava, Microsoft’s most natural English voice' },
  'gb-f': { voice: 'en-GB-SoniaNeural', note: 'Sonia, an English woman, warm and precise' },
  'gb-m': { voice: 'en-GB-RyanNeural', note: 'Ryan, an English man, measured' },
  'us-f': { voice: 'en-US-JennyNeural', note: 'Jenny, warm and neutral' },
  'us-m': { voice: 'en-US-AndrewMultilingualNeural', note: 'Andrew, a newsreader register' },
  ie: { voice: 'en-IE-EmilyNeural', note: 'Emily, a soft Dublin lilt' },
  au: { voice: 'en-AU-NatashaNeural', note: 'Natasha, easy-going' },
  za: { voice: 'en-ZA-LeahNeural', note: 'Leah, rounded vowels' },
  in: { voice: 'en-IN-NeerjaNeural', note: 'Neerja, precise consonants' },
}

/** A silent clip used to unlock audio playback on iOS during the first tap. */
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

/** Plays studio clips from the voice server when one is configured; otherwise, or on any error,
 *  hands the word to the device speaker so practice never stalls. */
export function createCloudSpeaker(device: Speaker): Speaker {
  let preset: string | null = null
  let pitch = 1
  let speed = 1
  let current: Rate | null = null
  const clips = new Map<string, Promise<string>>()
  const subs = new Set<(speaking: boolean, rate: Rate | null) => void>()
  const emit = (on: boolean, rate: Rate | null) => subs.forEach((cb) => cb(on, rate))
  device.onSpeaking((on, rate) => emit(on, rate))

  const audio = typeof Audio !== 'undefined' ? new Audio() : null
  let unlocked = false
  if (audio) {
    audio.preload = 'auto'
    audio.onplaying = () => emit(true, current)
    audio.onended = () => { current = null; emit(false, null) }
    audio.onpause = () => { if (audio.ended || audio.currentTime === 0) return; current = null; emit(false, null) }
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
  }

  const clipUrl = (text: string, rate: Rate) => {
    const base = getTtsUrl()
    if (!base) return null
    const { voice } = CLOUD_VOICES[preset ?? 'auto'] ?? CLOUD_VOICES.auto
    const q = new URLSearchParams({ text, voice, rate, pitch: pitch.toFixed(2), speed: speed.toFixed(2) })
    return `${base.replace(/\/+$/, '')}/tts?${q}`
  }

  const fetchClip = (text: string, rate: Rate): Promise<string> | null => {
    const url = clipUrl(text, rate)
    if (!url) return null
    let p = clips.get(url)
    if (!p) {
      p = fetch(url).then(async (r) => {
        if (!r.ok) throw new Error(`voice server ${r.status}`)
        return URL.createObjectURL(await r.blob())
      })
      p.catch(() => clips.delete(url))
      clips.set(url, p)
    }
    return p
  }

  return {
    get available() { return device.available || !!getTtsUrl() },
    get engine() { return getTtsUrl() ? 'cloud' as const : 'device' as const },
    speak(text, rate) {
      const p = audio && fetchClip(text, rate)
      if (!p) { device.speak(text, rate); return }
      device.stop()
      audio!.pause()
      current = rate
      p.then((src) => {
        if (current !== rate) return
        audio!.src = src
        return audio!.play()
      }).catch(() => {
        current = null
        device.speak(text, rate)
      })
    },
    stop() {
      current = null
      if (audio) { audio.pause(); try { audio.currentTime = 0 } catch { /* no source yet */ } }
      device.stop()
      emit(false, null)
    },
    onSpeaking(cb) {
      subs.add(cb)
      return () => { subs.delete(cb) }
    },
    voices: () => device.voices(),
    setVoice: (name) => device.setVoice(name),
    setPreset(id) { preset = id },
    setStyle(p, r) { pitch = p; speed = r; device.setStyle(p, r) },
    onVoices: (cb) => device.onVoices(cb),
    warm(texts) {
      if (!audio || !getTtsUrl()) return
      for (const t of texts) { fetchClip(t, 'normal'); fetchClip(t, 'slow') }
    },
  }
}
