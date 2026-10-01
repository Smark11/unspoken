import { describe, expect, it } from 'vitest'
import { availablePresets, quality, resolvePreset, PRESETS } from './voices'

const mac = [
  { name: 'Samantha', lang: 'en-US', local: true },
  { name: 'Alex', lang: 'en-US', local: true },
  { name: 'Kate', lang: 'en-GB', local: true },
  { name: 'Daniel', lang: 'en-GB', local: true },
  { name: 'Moira', lang: 'en-IE', local: true },
  { name: 'Karen', lang: 'en-AU', local: true },
  { name: 'Fiona', lang: 'en-GB', local: true },
  { name: 'Google UK English Female', lang: 'en-GB', local: false },
]
const android = [
  { name: 'en-us-x-sfg-local', lang: 'en-US', local: true },
  { name: 'en-gb-x-gba-local', lang: 'en-GB', local: true },
]
const by = (id: string) => PRESETS.find((p) => p.id === id)!

describe('voice presets', () => {
  it('finds a British woman on a Mac', () => {
    expect(resolvePreset(by('gb-f'), mac)?.name).toBe('Kate')
    expect(resolvePreset(by('gb-m'), mac)?.name).toBe('Daniel')
    expect(resolvePreset(by('scot'), mac)?.name).toBe('Fiona')
  })
  it('falls back to an unnamed voice on Android and dedupes', () => {
    expect(resolvePreset(by('gb-f'), android)?.name).toBe('en-gb-x-gba-local')
    const ids = availablePresets(android).map((x) => x.preset.id)
    expect(ids).toEqual(['gb-f', 'us-f'])
  })
  it('hides presets the device cannot honour', () => {
    expect(resolvePreset(by('za'), mac)).toBeUndefined()
    // A named-but-wrong-gender pool must not fall back to an unnamed voice.
    const mixed = [{ name: 'Samantha', lang: 'en-US', local: true }, { name: 'Google US English', lang: 'en-US', local: false }]
    expect(resolvePreset(by('us-m'), mixed)).toBeUndefined()
    expect(availablePresets(mac).map((x) => x.preset.id)).not.toContain('za')
  })
})

describe('quality', () => {
  it('reads Enhanced and Premium from iOS voice ids', () => {
    expect(quality({ name: 'Samantha', lang: 'en-US', local: true, uri: 'com.apple.voice.enhanced.en-US.Samantha' })).toBe('Enhanced')
    expect(quality({ name: 'Ava', lang: 'en-US', local: true, uri: 'com.apple.voice.premium.en-US.Ava' })).toBe('Premium')
    expect(quality({ name: 'Samantha', lang: 'en-US', local: true, uri: 'com.apple.ttsbundle.Samantha-compact' })).toBe('')
  })
  it('prefers the enhanced copy of a voice for a preset', () => {
    const vs = [
      { name: 'Samantha', lang: 'en-US', local: true, uri: 'com.apple.ttsbundle.Samantha-compact' },
      { name: 'Samantha', lang: 'en-US', local: true, uri: 'com.apple.voice.enhanced.en-US.Samantha' },
    ]
    expect(resolvePreset(PRESETS.find((p) => p.id === 'us-f')!, vs)?.uri).toBe('com.apple.voice.enhanced.en-US.Samantha')
  })
})
