import { load, titleFor, type WordList } from '../lib/storage'
import { pickReview } from '../lib/scheduler'
import { navigate } from '../lib/router'
import { listener, speaker } from '../speech'

export function Home() {
  const store = load()
  const due = pickReview(store.progress, Date.now())
  const lists = [...store.lists].sort(
    (a, b) => (b.lastPracticedAt ?? b.createdAt) - (a.lastPracticedAt ?? a.createdAt),
  )

  return (
    <div className="screen">
      <div className="home-head">
        <div>
          <h1 className="title">Unspoken</h1>
          <p className="tagline">Words you know. Learn to say them.</p>
        </div>
      </div>

      {(!listener.available || !speaker.available) && (
        <div className="notice">
          {!listener.available
            ? 'This browser can’t listen to you. Open Unspoken in Chrome, or in Safari on an iPhone.'
            : 'This browser can’t say words aloud. Try Chrome or Safari.'}
        </div>
      )}

      {due.length > 0 && (
        <button type="button" className="review-card" onClick={() => navigate({ name: 'review' })}>
          <span>
            <strong>Quick review</strong>
            <span className="muted small">
              {due.length === 1 ? '1 word you mastered is due' : `${due.length} words you mastered are due`}
            </span>
          </span>
          <span className="count">{due.length}</span>
        </button>
      )}

      <div style={{ marginTop: 24 }}>
        <button type="button" className="btn primary block" onClick={() => navigate({ name: 'new' })}>
          New list
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="empty">
          <div>Start with the words you avoid saying out loud.</div>
          <div className="ex">pleocytosis<br />Worcestershire<br />gnocchi</div>
          <div className="small">Up to ten at a time. You’ll hear each one, say it, and move on when it lands.</div>
        </div>
      ) : (
        <>
          <div className="section-label">Your lists</div>
          {lists.map((l) => (
            <ListRow key={l.id} list={l} />
          ))}
        </>
      )}
    </div>
  )
}

function ListRow({ list }: { list: WordList }) {
  const got = list.words.filter((w) => list.results[w] === 'got').length
  const all = got === list.words.length
  return (
    <button type="button" className="list-row" onClick={() => navigate({ name: 'practice', listId: list.id })}>
      <span style={{ minWidth: 0 }}>
        <span className="name" style={{ display: 'block' }}>{list.title || titleFor(list.words)}</span>
        <span className="sub">{list.words.length === 1 ? '1 word' : `${list.words.length} words`}{all ? ' · mastered' : ''}</span>
      </span>
      <span className={`count${all ? ' done' : ''}`}>{got}/{list.words.length}</span>
    </button>
  )
}
