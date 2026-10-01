import { createBrowserListener } from './browserListener'
import { createBrowserSpeaker } from './browserSpeaker'
import { createCloudSpeaker } from './cloudSpeaker'

import { getStyle, getVoice } from '../lib/prefs'
import { PRESETS, STYLES, resolvePreset } from './voices'

export const speaker = createCloudSpeaker(createBrowserSpeaker())
export const listener = createBrowserListener()
export * from './types'

/** Apply the saved accent and style to the speaker. Safe to call any time. */
export function applyVoicePrefs() {
  const presetId = getVoice()
  if (presetId?.startsWith('voice:')) {
    // A specific device voice, chosen by name from the list in Settings.
    speaker.setVoice(presetId.slice(6))
    speaker.setPreset(null)
  } else {
    const preset = PRESETS.find((p) => p.id === presetId)
    const voice = preset ? resolvePreset(preset, speaker.voices()) : undefined
    speaker.setVoice(voice?.uri ?? voice?.name ?? null)
    speaker.setPreset(presetId && presetId !== 'auto' ? presetId : null)
  }
  const style = STYLES.find((s) => s.id === getStyle()) ?? STYLES[0]
  speaker.setStyle(style.pitch, style.rate)
}
applyVoicePrefs()
speaker.onVoices(applyVoicePrefs)
