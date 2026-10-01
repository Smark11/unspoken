import type { Rate, Speaker } from './types'

const PREFERRED = ['Samantha', 'Google US English', 'Microsoft Aria', 'Ava', 'Allison', 'Karen']

export function createBrowserSpeaker(): Speaker {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  let voice: SpeechSynthesisVoice | null = null
  const subs = new Set<(speaking: boolean, rate: Rate | null) => void>()
  const emit = (speaking: boolean, rate: Rate | null) => subs.forEach((cb) => cb(speaking, rate))

  const pick = () => {
    if (!synth) return
    const voices = synth.getVoices()
    const us = voices.filter((v) => /^en[-_]US/i.test(v.lang))
    voice =
      us.find((v) => PREFERRED.some((p) => v.name.includes(p))) ??
      us.find((v) => v.localService) ??
      us[0] ??
      voices.find((v) => /^en/i.test(v.lang)) ??
      null
  }
  if (synth) {
    pick()
    synth.addEventListener?.('voiceschanged', pick)
  }

  return {
    available: !!synth,
    speak(text: string, rate: Rate) {
      if (!synth) return
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = rate === 'slow' ? 0.55 : 0.95
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
  }
}
