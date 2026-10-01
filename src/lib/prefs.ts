export type Theme = 'system' | 'light' | 'dark'

const THEME_KEY = 'unspoken.theme'
const VOICE_KEY = 'unspoken.voicePreset'
const STYLE_KEY = 'unspoken.voiceStyle'
const TTS_KEY = 'unspoken.ttsUrl'

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

/** Voice server URL: set in Settings, or baked in at build time with VITE_TTS_URL. */
export function getTtsUrl(): string | null {
  try {
    const saved = localStorage.getItem(TTS_KEY)
    if (saved === '') return null                // explicitly turned off
    if (saved) return saved
  } catch { /* ignore */ }
  const built = (import.meta.env.VITE_TTS_URL as string | undefined)?.trim()
  return built || null
}

export function setTtsUrl(url: string | null) {
  try {
    if (url === null) localStorage.removeItem(TTS_KEY)
    else localStorage.setItem(TTS_KEY, url.trim())
  } catch { /* ignore */ }
}

