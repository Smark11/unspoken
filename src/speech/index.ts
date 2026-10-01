import { createBrowserListener } from './browserListener'
import { createBrowserSpeaker } from './browserSpeaker'

export const speaker = createBrowserSpeaker()
export const listener = createBrowserListener()
export * from './types'
