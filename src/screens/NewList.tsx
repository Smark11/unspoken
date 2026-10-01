import { useEffect, useRef, useState } from 'react'
import { MAX_WORDS, parseWords } from '../lib/words'
import { newId, titleFor, update } from '../lib/storage'
import { navigate } from '../lib/router'
import { matchCase, suggest } from '../lib/suggest'
import { BackIcon, CloseIcon, PlusIcon } from '../components/Icons'

export function NewList() {
  const [words, setWords] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const full = words.length >= MAX_WORDS
  const has = (w: string) => words.some((x) => x.toLowerCase() === w.toLowerCase())

  // Suggestions follow the draft with a short debounce; stale responses are cancelled.
  useEffect(() => {
    abortRef.current?.abort()
    const p = draft.trim()
    if (p.length < 2) { setSuggestions([]); return }
    const ctl = new AbortController()
    abortRef.current = ctl
    const t = window.setTimeout(() => {
      suggest(p, ctl.signal).then((s) => { if (!ctl.signal.aborted) setSuggestions(s.map((w) => matchCase(p, w))) })
    }, 140)
    return () => { window.clearTimeout(t); ctl.abort() }
  }, [draft])

  const add = (raw: string) => {
    const w = raw.trim().replace(/[.,;!?]+$/, '')
    if (!w || full || has(w)) { setDraft(''); return }
    setWords((ws) => [...ws, w])
    setDraft('')
    setSuggestions([])
    inputRef.current?.focus()
  }
  const remove = (w: string) => setWords((ws) => ws.filter((x) => x !== w))

  const addPasted = () => {
    const incoming = parseWords(pasteText).filter((w) => !has(w))
    setWords((ws) => [...ws, ...incoming].slice(0, MAX_WORDS))
    setPasteText('')
    setPasteMode(false)
  }

  const start = () => {
    if (!words.length) return
    const id = newId()
    update((s) => {
      s.lists.push({
        id,
        title: titleFor(words),
        words,
        createdAt: Date.now(),
        results: Object.fromEntries(words.map((w) => [w, 'new' as const])),
      })
    })
    navigate({ name: 'practice', listId: id })
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate({ name: 'home' })}><BackIcon /></button>
      </div>
      <h1 className="title" style={{ marginTop: 18 }}>New list</h1>
      <p className="tagline">Start typing and pick the word when it appears. Long ones take three or four letters.</p>

      {words.length > 0 && (
        <div className="preview">
          {words.map((w) => (
            <button type="button" key={w} className="tag" aria-label={`Remove ${w}`} onClick={() => remove(w)}>
              {w}<CloseIcon size={14} />
            </button>
          ))}
        </div>
      )}

      <div className="counter" style={{ marginTop: words.length ? 10 : 18 }}>
        <span>{words.length} of {MAX_WORDS}</span>
        {full && <span className="over">That’s ten. Start when you’re ready.</span>}
      </div>

      {!pasteMode && (
        <form
          className="add-row"
          onSubmit={(e) => { e.preventDefault(); add(draft) }}
        >
          <input
            ref={inputRef}
            className="add-input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={full ? 'List is full' : 'Type a word'}
            disabled={full}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            autoFocus
            aria-label="Word"
            aria-autocomplete="list"
          />
          <button type="submit" className="btn primary add-btn" disabled={!draft.trim() || full} aria-label="Add word"><PlusIcon /></button>
        </form>
      )}

      {!pasteMode && suggestions.length > 0 && (
        <ul className="suggestions" role="listbox" aria-label="Suggestions">
          {suggestions.map((s) => {
            const p = draft.trim()
            const i = s.toLowerCase().indexOf(p.toLowerCase())
            return (
              <li key={s} role="option" aria-selected={false}>
                <button type="button" onClick={() => add(s)} disabled={has(s)}>
                  <span className="w">{i >= 0 ? (<>{s.slice(0, i)}<b>{s.slice(i, i + p.length)}</b>{s.slice(i + p.length)}</>) : s}</span>
                  {has(s) ? <span className="small muted">added</span> : <PlusIcon size={16} className="plus" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {pasteMode ? (
        <div className="paste">
          <div className="card" style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'One per line, or separated by commas'}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
          </div>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button type="button" className="btn" onClick={() => setPasteMode(false)}>Cancel</button>
            <button type="button" className="btn primary" disabled={!parseWords(pasteText).length} onClick={addPasted}>Add these</button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn quiet" style={{ minHeight: 36, padding: 0 }} onClick={() => setPasteMode(true)}>Paste a list instead</button>
        </div>
      )}

      <div className="sticky-bottom">
        <button type="button" className="btn primary block" disabled={!words.length} onClick={start}>
          {words.length ? `Start practising ${words.length === 1 ? '1 word' : `${words.length} words`}` : 'Start practising'}
        </button>
      </div>
    </div>
  )
}
