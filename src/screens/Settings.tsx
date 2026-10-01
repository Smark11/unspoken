import { useEffect, useMemo, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { navigate } from '../lib/router'
import { PlayIcon } from '../components/Icons'
import { getStyle, getTheme, getTtsUrl, getVoice, setStylePref, setTheme, setTtsUrl, setVoicePref, type Theme } from '../lib/prefs'
import { CLOUD_VOICES } from '../speech/cloudSpeaker'
import { applyVoicePrefs, speaker } from '../speech'
import { PRESETS, STYLES, availablePresets, type Style } from '../speech/voices'
import { playGotIt, setSoundsOn, soundsOn } from '../lib/sounds'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

/** Major iOS version from the user agent, or 0 when not iOS. The settings path moved in iOS 26. */
function iosMajor(): number {
  const m = /OS (\d+)_/.exec(navigator.userAgent)
  return m ? Number(m[1]) : 0
}

export function Settings({ open, onClose }: { open: boolean; onClose(): void }) {
  const SAMPLE = 'Words you know. Learn to say them.'
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const [voice, setVoice] = useState<string | null>(getVoice)
  const [style, setStyle] = useState<string>(getStyle)
  const [tick, setTick] = useState(0)
  useEffect(() => speaker.onVoices(() => setTick((t) => t + 1)), [])
  const [ttsUrl, setTtsUrlState] = useState<string>(() => getTtsUrl() ?? '')
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'testing' | 'ok' | 'bad'>('idle')
  const engine = speaker.engine
  const cloud = engine === 'cloud'
  const presets = useMemo(() => {
    if (cloud) return PRESETS.filter((p) => CLOUD_VOICES[p.id]).map((preset) => ({ preset, note: CLOUD_VOICES[preset.id].note }))
    return availablePresets(speaker.voices()).map(({ preset, voice }) => ({ preset, note: `${preset.note} · ${voice.name.replace(/^(Microsoft|Google) /, '').replace(/ \(.*\)$/, '')}` }))
  }, [open, tick, cloud, ttsUrl])
  const saveTtsUrl = (value: string) => { setTtsUrlState(value); setTtsUrl(value.trim() === '' ? '' : value); setTtsStatus('idle') }
  const testTts = async () => {
    setTtsStatus('testing')
    try {
      const r = await fetch(`${ttsUrl.trim().replace(/\/+$/, '')}/health`)
      const j = (await r.json()) as { ok?: boolean }
      setTtsStatus(j.ok ? 'ok' : 'bad')
      if (j.ok) { applyVoicePrefs(); speaker.speak(SAMPLE, 'normal') }
    } catch { setTtsStatus('bad') }
  }
  const [sounds, setSounds] = useState<boolean>(soundsOn)
  const toggleSounds = () => { const on = !sounds; setSoundsOn(on); setSounds(on); if (on) playGotIt() }
  const chooseTheme = (t: Theme) => { setTheme(t); setThemeState(t) }
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
        <div className="setting-label">Voice <span className={`engine${engine !== 'device' ? ' cloud' : ''}`}>{cloud ? 'Studio voices' : 'Device voices'}</span></div>
        {presets.length === 0 ? (
          <div className="muted small">No English voices are available on this device yet. Try again in a moment.</div>
        ) : (
          <div className="voice-list">
            <button type="button" className={`voice${voice === null ? ' on' : ''}`} onClick={() => chooseVoice(null)}>
              <span><b>Automatic</b><span className="small muted">{cloud ? CLOUD_VOICES.auto.note : 'The best voice this device has'}</span></span>
              <PlayIcon size={16} />
            </button>
            {presets.map(({ preset, note }) => (
              <button key={preset.id} type="button" className={`voice${voice === preset.id ? ' on' : ''}`} onClick={() => chooseVoice(preset.id)}>
                <span><b>{preset.label}</b><span className="small muted">{note}</span></span>
                <PlayIcon size={16} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="setting">
        <div className="setting-label">Studio voices</div>
        <p className="small muted" style={{ margin: '0 0 8px' }}>
          {cloud
            ? 'Connected. Every accent uses a neural voice from the voice server below.'
            : 'Device voices vary a lot by phone. Connect a voice server for natural, consistent accents everywhere. Setup takes ten minutes; see the worker folder in the project.'}
        </p>
        <div className="url-row">
          <input className="url-input" type="url" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false}
            placeholder="https://unspoken-voice.you.workers.dev" value={ttsUrl} onChange={(e) => saveTtsUrl(e.target.value)} />
          <button type="button" className="btn" style={{ minHeight: 44, padding: '0 14px' }} disabled={!ttsUrl.trim() || ttsStatus === 'testing'} onClick={testTts}>
            {ttsStatus === 'testing' ? 'Testing…' : 'Test'}
          </button>
        </div>
        {ttsStatus === 'ok' && <div className="small" style={{ color: 'var(--got)', marginTop: 6 }}>Connected. Studio voices are on.</div>}
        {ttsStatus === 'bad' && <div className="small" style={{ color: 'var(--almost)', marginTop: 6 }}>Couldn’t reach that server. Check the address and that it has been deployed with a key.</div>}
        {/iPhone|iPad|iPod/.test(navigator.userAgent) && !cloud && (
          <div className="small muted ios-tip">
            <b>Better built-in voices on iPhone.</b> Open the Settings app, then {iosMajor() >= 26 ? 'Accessibility › Read & Speak › Voices › English' : 'Accessibility › Spoken Content › Voices › English'}, and download a voice marked Enhanced or Premium (Samantha, Ava or Evan Enhanced are good). Close Safari fully and reopen Unspoken; the new voice then appears under Automatic. Safari doesn’t offer every downloaded voice to websites, so if nothing changes, Studio voices above are the dependable route.
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
        <p className="small muted" style={{ margin: '0 0 10px' }}>
          Unspoken runs entirely on your phone. Your lists and progress never leave this device.
        </p>
        <button type="button" className="btn block" onClick={() => { onClose(); navigate({ name: 'about' }) }}>About Unspoken and the creator</button>
      </div>
    </Sheet>
  )
}
