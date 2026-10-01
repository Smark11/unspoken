import { useCallback, useEffect, useRef, useState } from 'react'
import { Segments } from '../components/Segments'
import { MicButton, type MicState } from '../components/MicButton'
import { Feedback } from '../components/Feedback'
import { judge, type Judgement } from '../lib/scoring'
import { onMiss, onPass } from '../lib/scheduler'
import { update, type WordResult } from '../lib/storage'
import { wordKey } from '../lib/words'
import { listener, speaker, type ListenError } from '../speech'
import { startMicLevel } from '../speech/micLevel'

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
  const [results, setResults] = useState<WordResult[]>(() => words.map(() => 'new'))
  const [queue, setQueue] = useState<number[]>(() => words.map((_, i) => i))
  const [current, setCurrent] = useState<number>(0)
  const [mic, setMic] = useState<MicState>('idle')
  const [level, setLevel] = useState<number | null>(null)
  const [judgement, setJudgement] = useState<Judgement | null>(null)
  const [hint, setHint] = useState<string>('')
  const [finished, setFinished] = useState(false)
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

  const advance = useCallback((from: number[]) => {
    setJudgement(null)
    setHint('')
    const [next, ...rest] = from
    if (next === undefined) {
      setFinished(true)
      return
    }
    setQueue(rest)
    setCurrent(next)
  }, [])

  const say = async () => {
    if (mic !== 'idle') return
    speaker.stop()
    setJudgement(null)
    setHint('')
    setMic('listening')
    const stopMeter = await startMicLevel(setLevel)
    setLevel(stopMeter ? 0 : null)
    const result = await listener.listen({ lang: 'en-US', timeoutMs: LISTEN_MS })
    stopMeter?.()
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
      const r = results.map((x, i) => (i === current ? 'got' : x))
      setResults(r)
      persistResult(current, 'got')
      update((s) => { s.progress[key] = { ...onPass(s.progress[key], now), text: word } })
      advanceTimer.current = window.setTimeout(() => { setMic('idle'); advance(queue) }, ADVANCE_MS)
    } else {
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
    const r = results.map((x, i) => (i === current ? 'skipped' : x))
    setResults(r)
    persistResult(current, 'skipped')
    advance(queue)
  }

  const practiseSkipped = () => {
    const again = results.map((r, i) => (r === 'skipped' ? i : -1)).filter((i) => i >= 0)
    setResults(results.map((r) => (r === 'skipped' ? 'new' : r)))
    setFinished(false)
    advance(again)
  }

  const removeList = () => {
    if (!listId) return
    update((s) => { s.lists = s.lists.filter((l) => l.id !== listId) })
    onExit()
  }

  if (finished) {
    const got = results.filter((r) => r === 'got').length
    const skipped = results.filter((r) => r !== 'got').length
    return (
      <div className="screen finish">
        <div className="score">{got}/{words.length}</div>
        <p className="score-sub">
          {mode === 'review'
            ? got === words.length ? 'still mastered. They’ll come back a little later each time.' : 'kept. The others will come round again tomorrow.'
            : got === words.length ? 'mastered. This list is in your library whenever you want it.'
            : `mastered, ${skipped} skipped for now. This list is in your library.`}
        </p>
        <div>
          {words.map((w, i) => (
            <div key={w} className="result-row">
              <span>{w}</span>
              <span className={`tag ${results[i] === 'got' ? 'got' : 'skipped'}`}>{results[i] === 'got' ? 'Got it' : 'Skipped'}</span>
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

  const gotCount = results.filter((r) => r === 'got').length
  return (
    <div className="screen practice">
      <Segments results={results} current={current} />
      <div className="progress-line">
        <span>{mode === 'review' ? 'Quick review' : `${gotCount} of ${words.length} mastered`}</span>
        <button type="button" onClick={() => { speaker.stop(); listener.abort(); onExit() }}>Stop</button>
      </div>

      <div className="stage">
        <h2 className={`word${judgement?.verdict === 'got' ? ' settled' : ''}`} lang="en">{word}</h2>
        <div className="listen-row">
          <button type="button" className="btn" onClick={() => speaker.speak(word, 'normal')} disabled={mic === 'listening'}>▶ Hear it</button>
          <button type="button" className="btn" onClick={() => speaker.speak(word, 'slow')} disabled={mic === 'listening'}>◔ Slowly</button>
        </div>
        {judgement && <Feedback j={judgement} />}
      </div>

      <div className="mic-area">
        <MicButton state={mic} level={level} onPress={say} />
        <div className="mic-hint" aria-live="polite">{hint || (mic === 'listening' ? 'Listening…' : judgement?.verdict === 'almost' ? 'Tap to try again' : '')}</div>
        <button type="button" className="skip" onClick={skip} disabled={mic !== 'idle'}>Skip for now</button>
      </div>
    </div>
  )
}
