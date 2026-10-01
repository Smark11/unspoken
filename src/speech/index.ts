import { createBrowserListener } from './browserListener'
import { createBrowserSpeaker } from './browserSpeaker'
import { createCloudSpeaker } from './cloudSpeaker'
import { createKokoroSpeaker } from './kokoroSpeaker'

import { getStyle, getVoice } from '../lib/prefs'
import { PRESETS, STYLES, resolvePreset } from './voices'

export const speaker = createKokoroSpeaker(createCloudSpeaker(createBrowserSpeaker()))
export const listener = createBrowserListener()
export * from './types'

/** Apply the saved accent and style to the speaker. Safe to call any time. */
export function applyVoicePrefs() {
  const presetId = getVoice()
  const preset = PRESETS.find((p) => p.id === presetId)
  const voice = preset ? resolvePreset(preset, speaker.voices()) : undefined
  speaker.setVoice(voice?.name ?? null)
  speaker.setPreset(presetId && presetId !== 'auto' ? presetId : null)
  const style = STYLES.find((s) => s.id === getStyle()) ?? STYLES[0]
  speaker.setStyle(style.pitch, style.rate)
}
applyVoicePrefs()
speaker.onVoices(applyVoicePrefs)
