import type { Rate, Speaker } from './types'
import { getTtsUrl } from '../lib/prefs'
import { getPlayer } from './player'

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

/** Plays studio clips from the voice server when one is configured; otherwise, or on any error,
 *  hands the word to the device speaker so practice never stalls. */
export function createCloudSpeaker(device: Speaker): Speaker {
  let preset: string | null = null
  let pitch = 1
  let speed = 1
  let seq = 0
  const clips = new Map<string, Promise<string>>()
  const subs = new Set<(speaking: boolean, rate: Rate | null) => void>()
  const emit = (on: boolean, rate: Rate | null) => subs.forEach((cb) => cb(on, rate))
  device.onSpeaking((on, rate) => emit(on, rate))
  const player = getPlayer()
  player?.onState((on, rate) => emit(on, rate))

  const clipUrl = (text: string, rate: Rate) => {
    const base = getTtsUrl()
    if (!base) return null
    const q = new URLSearchParams({ text, preset: preset ?? 'auto', rate, pitch: pitch.toFixed(2), speed: speed.toFixed(2) })
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
      const p = player && fetchClip(text, rate)
      if (!p) { device.speak(text, rate); return }
      device.stop()
      player.stop()
      const my = ++seq
      p.then((src) => {
        if (my !== seq) return
        return player.play(src, rate)
      }).catch(() => { if (my === seq) device.speak(text, rate) })
    },
    stop() {
      player?.stop()
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
      if (!player || !getTtsUrl()) return
      for (const t of texts) { fetchClip(t, 'normal'); fetchClip(t, 'slow') }
    },
  }
}
