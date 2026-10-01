/** Accent presets. Each resolves to the best matching voice the device actually has, so the same
 *  choice works on an iPhone, an Android phone and a laptop even though their voice names differ. */

export interface VoiceInfo { name: string; lang: string; local: boolean }

export interface Preset {
  id: string
  label: string
  note: string
  lang: RegExp
  gender?: 'f' | 'm'
  names?: RegExp
}

const FEMALE = /\b(Samantha|Ava|Allison|Susan|Nicky|Zoe|Kate|Serena|Martha|Karen|Moira|Fiona|Tessa|Veena|Female|Aria|Jenny|Libby|Sonia|Natasha|Emma|Olivia|Amy|Joanna|Kendra|Kimberly|Salli|Nicole|Raveena|Hazel|Shelley|Flo|Sandy|Catherine|Stephanie|Hayley|Isha|Neerja)\b/i
const MALE = /\b(Alex|Tom|Aaron|Daniel|Oliver|Arthur|Rishi|Gordon|Lee|Male|Guy|Ryan|Thomas|Brian|Matthew|Joey|Justin|William|Russell|George|Christopher|Eric|Jamie|Prabhat|Reed|Eddy|Rocko|Luca|James|Harry|Nathan)\b/i

export const PRESETS: Preset[] = [
  { id: 'gb-f', label: 'British', note: 'An English woman, crisp and clear', lang: /^en[-_]GB/i, gender: 'f' },
  { id: 'gb-m', label: 'British, deep', note: 'An English man, measured', lang: /^en[-_]GB/i, gender: 'm' },
  { id: 'us-f', label: 'American', note: 'Warm and neutral', lang: /^en[-_]US/i, gender: 'f' },
  { id: 'us-m', label: 'American, deep', note: 'A newsreader register', lang: /^en[-_]US/i, gender: 'm' },
  { id: 'ie', label: 'Irish', note: 'A soft Dublin lilt', lang: /^en[-_]IE/i },
  { id: 'scot', label: 'Scottish', note: 'Rolled r’s and all', lang: /^en/i, names: /\bFiona\b/i },
  { id: 'au', label: 'Australian', note: 'Easy-going', lang: /^en[-_]AU/i },
  { id: 'za', label: 'South African', note: 'Rounded vowels', lang: /^en[-_]ZA/i },
  { id: 'in', label: 'Indian English', note: 'Precise consonants', lang: /^en[-_]IN/i },
]

export type Style = 'natural' | 'deep' | 'bright'
export const STYLES: { id: Style; label: string; pitch: number; rate: number }[] = [
  { id: 'natural', label: 'Natural', pitch: 1, rate: 1 },
  { id: 'deep', label: 'Deep', pitch: 0.72, rate: 0.92 },
  { id: 'bright', label: 'Bright', pitch: 1.3, rate: 1.04 },
]

const quality = (v: VoiceInfo) =>
  (/enhanced|premium|neural|natural/i.test(v.name) ? 0 : 1) + (v.local ? 0 : 1) + (/compact/i.test(v.name) ? 2 : 0)

/** The device voice a preset maps to, or undefined when the device has nothing suitable. */
export function resolvePreset(p: Preset, voices: VoiceInfo[]): VoiceInfo | undefined {
  const pool = voices.filter((v) => p.lang.test(v.lang) && (!p.names || p.names.test(v.name)))
  if (!pool.length) return undefined
  const known = (v: VoiceInfo) => FEMALE.test(v.name) || MALE.test(v.name)
  let picks = pool
  if (p.gender === 'f') picks = pool.filter((v) => FEMALE.test(v.name))
  if (p.gender === 'm') picks = pool.filter((v) => MALE.test(v.name))
  // Voice names we can't read (Android's are codes) count only when the device names none of them;
  // otherwise a "deep" preset could quietly land on a woman's voice, or the reverse.
  if (!picks.length && !pool.some(known)) picks = pool
  if (!picks.length) return undefined
  return [...picks].sort((a, b) => quality(a) - quality(b))[0]
}

/** Presets the device can honour, deduplicated so two labels never point at one voice. */
export function availablePresets(voices: VoiceInfo[]): { preset: Preset; voice: VoiceInfo }[] {
  const used = new Set<string>()
  const out: { preset: Preset; voice: VoiceInfo }[] = []
  for (const preset of PRESETS) {
    const voice = resolvePreset(preset, voices)
    if (!voice || used.has(voice.name)) continue
    used.add(voice.name)
    out.push({ preset, voice })
  }
  return out
}
