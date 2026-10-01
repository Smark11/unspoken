import type { Rate, Speaker } from './types'
import { getVoice } from '../lib/prefs'

const PREFERRED = ['Samantha', 'Google US English', 'Microsoft Aria', 'Ava', 'Allison', 'Karen']

export function createBrowserSpeaker(): Speaker {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  let voice: SpeechSynthesisVoice | null = null
  const subs = new Set<(speaking: boolean, rate: Rate | null) => void>()
  const emit = (speaking: boolean, rate: Rate | null) => subs.forEach((cb) => cb(speaking, rate))

  let chosen: string | null = getVoice()

  const english = () => (synth ? synth.getVoices().filter((v) => /^en[-_]/i.test(v.lang)) : [])
  const pick = () => {
    if (!synth) return
    const all = english()
    const wanted = chosen ? all.find((v) => v.name === chosen) : undefined
    const us = all.filter((v) => /^en[-_]US/i.test(v.lang))
    voice =
      wanted ??
      us.find((v) => PREFERRED.some((p) => v.name.includes(p))) ??
      us.find((v) => v.localService) ??
      us[0] ??
      all[0] ??
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
    voices() {
      const all = english()
      const score = (v: SpeechSynthesisVoice) =>
        (PREFERRED.some((p) => v.name.includes(p)) ? 0 : 1) + (/^en[-_]US/i.test(v.lang) ? 0 : 2) + (v.localService ? 0 : 1)
      return [...all].sort((a, b) => score(a) - score(b)).map((v) => ({ name: v.name, lang: v.lang }))
    },
    setVoice(name) {
      chosen = name
      pick()
    },
  }
}
