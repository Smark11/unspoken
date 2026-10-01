import { useEffect, useMemo, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { PlayIcon } from '../components/Icons'
import { getStyle, getTheme, getVoice, setStylePref, setTheme, setVoicePref, type Theme } from '../lib/prefs'
import { applyVoicePrefs, speaker } from '../speech'
import { STYLES, availablePresets, type Style } from '../speech/voices'
import { playGotIt, setSoundsOn, soundsOn } from '../lib/sounds'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

export function Settings({ open, onClose }: { open: boolean; onClose(): void }) {
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const [voice, setVoice] = useState<string | null>(getVoice)
  const [style, setStyle] = useState<string>(getStyle)
  const [tick, setTick] = useState(0)
  useEffect(() => speaker.onVoices(() => setTick((t) => t + 1)), [])
  const presets = useMemo(() => availablePresets(speaker.voices()), [open, tick])
  const [sounds, setSounds] = useState<boolean>(soundsOn)
  const toggleSounds = () => { const on = !sounds; setSoundsOn(on); setSounds(on); if (on) playGotIt() }
  const chooseTheme = (t: Theme) => { setTheme(t); setThemeState(t) }
  const SAMPLE = 'Words you know. Learn to say them.'
  const chooseVoice = (id: string | null) => {
    setVoicePref(id); applyVoicePrefs(); setVoice(id)
    speaker.speak(SAMPLE, 'normal')
  }
  const chooseStyle = (id: Style) => {
    setStylePref(id); applyVoicePrefs(); setStyle(id)
    speaker.speak(SAMPLE, 'normal')
  }

  return (
    <Sheet title="Settings" open={open} onClose={onClose}>
      <div className="setting">
        <div className="setting-label">Appearance</div>
        <div className="segmented" role="radiogroup" aria-label="Appearance">
          {THEMES.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} className={theme === t.id ? 'on' : ''} onClick={() => chooseTheme(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="setting">
        <div className="setting-label">Voice</div>
        {presets.length === 0 ? (
          <div className="muted small">No English voices are available on this device yet. Try again in a moment.</div>
        ) : (
          <div className="voice-list">
            <button type="button" className={`voice${voice === null ? ' on' : ''}`} onClick={() => chooseVoice(null)}>
              <span><b>Automatic</b><span className="small muted">The best voice this device has</span></span>
            </button>
            {presets.map(({ preset, voice: v }) => (
              <button key={preset.id} type="button" className={`voice${voice === preset.id ? ' on' : ''}`} onClick={() => chooseVoice(preset.id)}>
                <span><b>{preset.label}</b><span className="small muted">{preset.note} · {v.name.replace(/^(Microsoft|Google) /, '').replace(/ \(.*\)$/, '')}</span></span>
                <PlayIcon size={16} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="setting">
        <div className="setting-label">Character</div>
        <div className="segmented" role="radiogroup" aria-label="Character">
          {STYLES.map((st) => (
            <button key={st.id} type="button" role="radio" aria-checked={style === st.id} className={style === st.id ? 'on' : ''} onClick={() => chooseStyle(st.id)}>{st.label}</button>
          ))}
        </div>
        <div className="small muted" style={{ marginTop: 8 }}>Tap any voice to hear it. The slow button keeps whichever you choose.</div>
      </div>

      <div className="setting">
        <button type="button" className="toggle-row" role="switch" aria-checked={sounds} onClick={toggleSounds}>
          <span><b>Sounds</b><span className="small muted">A short cue when a word lands</span></span>
          <span className={`toggle${sounds ? ' on' : ''}`} aria-hidden="true"><i /></span>
        </button>
      </div>

      <div className="setting">
        <div className="setting-label">About</div>
        <p className="small muted" style={{ margin: 0 }}>
          Unspoken runs entirely on your phone. Your lists and progress never leave this device. Hearing and listening use the voice built into your browser.
        </p>
      </div>
    </Sheet>
  )
}
