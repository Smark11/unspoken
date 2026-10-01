import { useState } from 'react'
import { MAX_WORDS, parseWords } from '../lib/words'
import { newId, titleFor, update } from '../lib/storage'
import { navigate } from '../lib/router'

export function NewList() {
  const [text, setText] = useState('')
  const words = parseWords(text)
  const over = words.length > MAX_WORDS

  const start = () => {
    const chosen = words.slice(0, MAX_WORDS)
    if (!chosen.length) return
    const id = newId()
    update((s) => {
      s.lists.push({
        id,
        title: titleFor(chosen),
        words: chosen,
        createdAt: Date.now(),
        results: Object.fromEntries(chosen.map((w) => [w, 'new' as const])),
      })
    })
    navigate({ name: 'practice', listId: id })
  }

  return (
    <div className="screen">
      <div>
        <button type="button" className="btn quiet" style={{ marginLeft: -20 }} onClick={() => navigate({ name: 'home' })}>
          ‹ Back
        </button>
      </div>
      <h1 className="title" style={{ marginTop: 8 }}>New list</h1>
      <p className="tagline">Type or paste up to ten words. One per line, or separated by commas.</p>
      <textarea
        className="textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'pleocytosis\nWorcestershire\nquinoa'}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
      />
      <div className="counter">
        <span>{words.length} of {MAX_WORDS}</span>
        {over && <span className="over">Only the first {MAX_WORDS} will be used</span>}
      </div>
      <div className="sticky-bottom">
        <button type="button" className="btn primary block" disabled={!words.length} onClick={start}>
          Start practising
        </button>
      </div>
    </div>
  )
}
