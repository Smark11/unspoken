import type { Rate, Speaker } from './types'

const PREFERRED = ['Samantha', 'Google US English', 'Microsoft Aria', 'Ava', 'Allison', 'Karen']
// macOS ships joke voices that are useless for learning pronunciation.
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Organ|Pipe Organ|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Kathy|Fred|Grandma|Grandpa|Rocko|Shelley|Eddy|Flo|Reed|Sandy|Superstar)\b/

export function createBrowserSpeaker(): Speaker {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  let voice: SpeechSynthesisVoice | null = null
  const subs = new Set<(speaking: boolean, rate: Rate | null) => void>()
  const emit = (speaking: boolean, rate: Rate | null) => subs.forEach((cb) => cb(speaking, rate))

  let chosen: string | null = null
  let pitch = 1
  let rateMul = 1
  const voiceSubs = new Set<() => void>()

  const english = () => (synth ? synth.getVoices().filter((v) => /^en[-_]/i.test(v.lang) && !NOVELTY.test(v.name)) : [])
  const pick = () => {
    if (!synth) return
    const all = english()
    const wanted = chosen ? all.find((v) => v.voiceURI === chosen) ?? all.find((v) => v.name === chosen) : undefined
    const us = all.filter((v) => /^en[-_]US/i.test(v.lang))
    // Prefer a downloaded Enhanced/Premium voice, then the known good names, then anything local.
    const better = (v: SpeechSynthesisVoice) => /enhanced|premium/i.test(`${v.name} ${v.voiceURI}`)
    voice =
      wanted ??
      us.find((v) => better(v) && PREFERRED.some((p) => v.name.includes(p))) ??
      us.find(better) ??
      us.find((v) => PREFERRED.some((p) => v.name.includes(p))) ??
      us.find((v) => v.localService) ??
      us[0] ??
      all[0] ??
      null
  }
  if (synth) {
    pick()
    synth.addEventListener?.('voiceschanged', () => { pick(); voiceSubs.forEach((cb) => cb()) })
  }

  return {
    available: !!synth,
    engine: 'device',
    speak(text: string, rate: Rate) {
      if (!synth) return
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = (rate === 'slow' ? 0.55 : 0.95) * rateMul
      u.pitch = pitch
      if (voice) u.voice = voice
      u.onstart = () => emit(true, rate)
      u.onend = () => emit(false, null)
      u.onerror = () => emit(false, null)
      synth.speak(u)
    },
    stop() {
      synth?.cancel()
      emit(false, null)
    },
    onSpeaking(cb) {
      subs.add(cb)
      return () => { subs.delete(cb) }
    },
    voices() {
      return english().map((v) => ({ name: v.name, lang: v.lang, local: v.localService, uri: v.voiceURI }))
    },
    setVoice(name) {
      chosen = name
      pick()
    },
    setStyle(p, r) {
      pitch = p
      rateMul = r
    },
    onVoices(cb) {
      voiceSubs.add(cb)
      return () => { voiceSubs.delete(cb) }
    },
    setPreset() { /* presets are resolved to device voices by the caller */ },
    warm() { /* device voices need no warm-up */ },
  }
}
