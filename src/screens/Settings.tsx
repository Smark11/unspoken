import { useMemo, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { PlayIcon } from '../components/Icons'
import { getTheme, getVoice, setTheme, setVoicePref, type Theme } from '../lib/prefs'
import { speaker } from '../speech'
import { playGotIt, setSoundsOn, soundsOn } from '../lib/sounds'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

export function Settings({ open, onClose }: { open: boolean; onClose(): void }) {
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const [voice, setVoice] = useState<string | null>(getVoice)
  const [sounds, setSounds] = useState<boolean>(soundsOn)
  const toggleSounds = () => { const on = !sounds; setSoundsOn(on); setSounds(on); if (on) playGotIt() }
  const voices = useMemo(() => speaker.voices(), [open])

  const chooseTheme = (t: Theme) => { setTheme(t); setThemeState(t) }
  const chooseVoice = (name: string | null) => {
    setVoicePref(name); speaker.setVoice(name); setVoice(name)
    speaker.speak('Worcestershire', 'normal')
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
        {voices.length === 0 ? (
          <div className="muted small">No English voices are available on this device.</div>
        ) : (
          <div className="voice-list">
            <button type="button" className={`voice${voice === null ? ' on' : ''}`} onClick={() => chooseVoice(null)}>
              <span><b>Automatic</b><span className="small muted">Best available voice</span></span>
            </button>
            {voices.slice(0, 6).map((v) => (
              <button key={v.name} type="button" className={`voice${voice === v.name ? ' on' : ''}`} onClick={() => chooseVoice(v.name)}>
                <span><b>{v.name.replace(/^Microsoft |^Google /, '')}</b><span className="small muted">{v.lang.replace('_', '-')}</span></span>
                <PlayIcon size={16} />
              </button>
            ))}
          </div>
        )}
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
