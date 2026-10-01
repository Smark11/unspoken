import { useCallback, useEffect, useRef, useState } from 'react'
import { Segments } from '../components/Segments'
import { MicButton, type MicState } from '../components/MicButton'
import { Feedback } from '../components/Feedback'
import { judge, type Judgement } from '../lib/scoring'
import { onMiss, onPass } from '../lib/scheduler'
import { update, type WordResult } from '../lib/storage'
import { advance as advanceSession, countGot, createSession, markCurrent, retrySkipped } from '../lib/session'
import { wordKey } from '../lib/words'
import { listener, speaker, type ListenError } from '../speech'
import { startMicLevel } from '../speech/micLevel'
import { CheckIcon, CloseIcon, PlayIcon, Ring, SkipIcon, SlowIcon } from '../components/Icons'

const buzz = (pattern: number | number[]) => { try { navigator.vibrate?.(pattern) } catch { /* unsupported */ } }

interface Props {
  words: string[]
  mode: 'practice' | 'review'
  listId?: string
  onExit(): void
}

const LISTEN_MS = 6000
const ADVANCE_MS = 1300

const errorHint: Record<ListenError, string> = {
  unsupported: 'This browser can’t listen. Open Unspoken in Chrome or Safari.',
  'not-allowed': 'Allow the microphone for this page, then tap Say it again.',
  'no-speech': 'Nothing came through. Tap Say it, then say the word clearly.',
  network: 'Listening needs an internet connection. Check it and try again.',
  other: 'Listening stopped unexpectedly. Tap Say it to try again.',
}

export function Practice({ words, mode, listId, onExit }: Props) {
  const [session, setSession] = useState(() => createSession(words))
  const { results, current, finished } = session
  const [mic, setMic] = useState<MicState>('idle')
  const [level, setLevel] = useState<number | null>(null)
  const [judgement, setJudgement] = useState<Judgement | null>(null)
  const [hint, setHint] = useState<string>('')
  const attempts = useRef<number[]>(words.map(() => 0))
  const missed = useRef<Set<number>>(new Set())
  const advanceTimer = useRef<number | undefined>(undefined)

  const word = words[current]

  // Learn: say the word as soon as it appears.
  useEffect(() => {
    if (finished) return
    const t = window.setTimeout(() => speaker.speak(word, 'normal'), 250)
    return () => window.clearTimeout(t)
  }, [word, finished])

  useEffect(() => () => { speaker.stop(); listener.abort(); window.clearTimeout(advanceTimer.current) }, [])

  const persistResult = useCallback((index: number, r: WordResult) => {
    if (mode !== 'practice' || !listId) return
    update((s) => {
      const l = s.lists.find((x) => x.id === listId)
      if (!l) return
      l.results[words[index]] = r
      l.lastPracticedAt = Date.now()
    })
  }, [mode, listId, words])

  const moveOn = useCallback((r: WordResult) => {
    setJudgement(null)
    setHint('')
    setSession((s) => advanceSession(markCurrent(s, r)))
  }, [])

  const say = async () => {
    if (mic !== 'idle') return
    speaker.stop()
    setJudgement(null)
    setHint('')
    setMic('listening')
    setLevel(null)
    // Listen right away; the level meter attaches alongside if the browser allows a second capture.
    const meter = startMicLevel(setLevel).then((stop) => { if (stop) setLevel(0); return stop })
    const result = await listener.listen({ lang: 'en-US', timeoutMs: LISTEN_MS })
    meter.then((stop) => stop?.())
    setLevel(null)
    if (!result.ok) {
      setMic('idle')
      setHint(errorHint[result.error])
      return
    }
    setMic('busy')
    attempts.current[current] += 1
    const j = judge(word, result.alternatives, attempts.current[current])
    setJudgement(j)
    const now = Date.now()
    const key = wordKey(word)
    if (j.verdict === 'got') {
      buzz([30, 40, 30])
      persistResult(current, 'got')
      update((s) => { s.progress[key] = { ...onPass(s.progress[key], now), text: word } })
      advanceTimer.current = window.setTimeout(() => { setMic('idle'); moveOn('got') }, ADVANCE_MS)
    } else {
      buzz(60)
      if (mode === 'review' && !missed.current.has(current)) {
        missed.current.add(current)
        update((s) => { s.progress[key] = { ...onMiss(s.progress[key], now), text: word } })
      }
      setMic('idle')
    }
  }

  const skip = () => {
    if (mic !== 'idle') return
    speaker.stop()
    persistResult(current, 'skipped')
    moveOn('skipped')
  }

  const practiseSkipped = () => {
    setJudgement(null)
    setHint('')
    setSession((s) => retrySkipped(s))
  }

  const removeList = () => {
    if (!listId) return
    update((s) => { s.lists = s.lists.filter((l) => l.id !== listId) })
    onExit()
  }

  if (finished) {
    const got = countGot(session)
    const skipped = words.length - got
    return (
      <div className="screen finish">
        <div className="score-wrap">
          <Ring value={got / words.length} size={168} stroke={10} className="ringsvg" />
          <div className="score">{got}<small>/{words.length}</small></div>
        </div>
        <p className="score-sub">
          {mode === 'review'
            ? got === words.length ? 'Still mastered. They’ll come back a little later each time.' : 'Kept. The others will come round again tomorrow.'
            : got === words.length ? 'All mastered. This list is in your library whenever you want it.'
            : `Mastered, ${skipped} skipped for now. This list is in your library.`}
        </p>
        <div>
          {words.map((w, i) => (
            <div key={w} className="result-row">
              <span className="w">{w}</span>
              <span className={`mark ${results[i] === 'got' ? 'got' : 'skipped'}`}>{results[i] === 'got' ? <CheckIcon size={18} /> : <SkipIcon size={16} />}</span>
            </div>
          ))}
        </div>
        <div className="sticky-bottom">
          <div className="stack">
            {skipped > 0 && mode === 'practice' && (
              <button type="button" className="btn primary" onClick={practiseSkipped}>Practise skipped words</button>
            )}
            <button type="button" className={`btn${skipped > 0 && mode === 'practice' ? '' : ' primary'}`} onClick={onExit}>Done</button>
          </div>
          {mode === 'practice' && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button type="button" className="btn quiet" onClick={removeList}>Remove this list</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const gotCount = countGot(session)
  const state = mic === 'listening' ? 'listening' : judgement?.verdict ?? 'idle'
  return (
    <div className="screen practice">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="Stop" onClick={() => { speaker.stop(); listener.abort(); onExit() }}><CloseIcon /></button>
        <Segments results={results} current={current} />
        <span className="count">{mode === 'review' ? 'Review' : `${gotCount}/${words.length}`}</span>
      </div>

      <div className="stage" data-state={state}>
        <div className="glow" />
        <h2 key={current} className="word" lang="en">{word}</h2>
        <div className="listen-row">
          <button type="button" className="chip" onClick={() => speaker.speak(word, 'normal')} disabled={mic === 'listening'}><PlayIcon />Hear it</button>
          <button type="button" className="chip" onClick={() => speaker.speak(word, 'slow')} disabled={mic === 'listening'}><SlowIcon />Slow</button>
        </div>
        <div className="feedback-slot">{judgement && <Feedback j={judgement} />}</div>
      </div>

      <div className="mic-area">
        <MicButton state={mic} level={level} onPress={say} />
        <div className="mic-label">{mic === 'listening' ? 'Listening…' : mic === 'busy' ? (judgement?.verdict === 'got' ? 'Next word…' : 'Checking…') : judgement?.verdict === 'almost' ? 'Say it again' : 'Say it'}</div>
        <div className="mic-hint" aria-live="polite">{hint}</div>
        <button type="button" className="skip" onClick={skip} disabled={mic !== 'idle'}><SkipIcon size={16} />Skip for now</button>
      </div>
    </div>
  )
}
