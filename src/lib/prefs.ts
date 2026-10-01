export type Theme = 'system' | 'light' | 'dark'

const THEME_KEY = 'unspoken.theme'
const VOICE_KEY = 'unspoken.voicePreset'
const STYLE_KEY = 'unspoken.voiceStyle'

export function getTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch { return 'system' }
}

export function setTheme(t: Theme) {
  try { localStorage.setItem(THEME_KEY, t) } catch { /* ignore */ }
  applyTheme(t)
}

export function applyTheme(t: Theme = getTheme()) {
  const root = document.documentElement
  if (t === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', t)
}

export function getVoice(): string | null {
  try { return localStorage.getItem(VOICE_KEY) } catch { return null }
}

export function setVoicePref(presetId: string | null) {
  try {
    if (presetId) localStorage.setItem(VOICE_KEY, presetId)
    else localStorage.removeItem(VOICE_KEY)
  } catch { /* ignore */ }
}

export function getStyle(): string {
  try { return localStorage.getItem(STYLE_KEY) ?? 'natural' } catch { return 'natural' }
}

export function setStylePref(id: string) {
  try { localStorage.setItem(STYLE_KEY, id) } catch { /* ignore */ }
}

export const SAMPLE_WORDS = [
  'colonel', 'quinoa', 'Worcestershire', 'anemone', 'rural',
  'gnocchi', 'pleocytosis', 'Siobhan', 'açaí', 'phenomenon',
]
