/** Two tiny synthesized cues. No audio files, no network. */
const SOUND_KEY = 'unspoken.sounds'
export const soundsOn = () => { try { return localStorage.getItem(SOUND_KEY) !== 'off' } catch { return true } }
export const setSoundsOn = (on: boolean) => { try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off') } catch { /* ignore */ } }

let ctx: AudioContext | null = null
function tone(freq: number, at: number, dur: number, gain = 0.08) {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.value = freq
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(gain, at + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g).connect(ctx.destination)
  o.start(at)
  o.stop(at + dur + 0.05)
}
function ensure() {
  if (!soundsOn()) return false
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return true
  } catch { return false }
}
export function playGotIt() {
  if (!ensure() || !ctx) return
  const t = ctx.currentTime
  tone(659, t, 0.18)
  tone(988, t + 0.09, 0.26)
}
export function playAlmost() {
  if (!ensure() || !ctx) return
  const t = ctx.currentTime
  tone(440, t, 0.16, 0.06)
}
