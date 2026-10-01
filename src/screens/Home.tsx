import { load, titleFor, type WordList } from '../lib/storage'
import { isRetired, pickReview } from '../lib/scheduler'
import { navigate } from '../lib/router'
import { listener, speaker } from '../speech'
import { ChevronIcon, MicIcon, PlusIcon, Ring } from '../components/Icons'

export function Home() {
  const store = load()
  const now = Date.now()
  const due = pickReview(store.progress, now)
  const lists = [...store.lists].sort(
    (a, b) => (b.lastPracticedAt ?? b.createdAt) - (a.lastPracticedAt ?? a.createdAt),
  )
  const progress = Object.values(store.progress)
  const mastered = progress.filter((p) => p.box > 0).length
  const retired = progress.filter(isRetired).length

  return (
    <div className="screen">
      <div className="brand"><span className="brand-mark"><MicIcon size={16} /></span>Unspoken</div>
      <h1 className="hero-title">Words you know.<br /><em>Learn to say them.</em></h1>

      {(!listener.available || !speaker.available) && (
        <div className="notice">
          {!listener.available
            ? 'This browser can’t listen to you. Open Unspoken in Chrome, or in Safari on an iPhone.'
            : 'This browser can’t say words aloud. Try Chrome or Safari.'}
        </div>
      )}

      {due.length > 0 ? (
        <section className="hero-card">
          <div className="kicker">Quick review</div>
          <div className="big">{due.length === 1 ? 'One word is due' : `${due.length} words are due`}</div>
          <button type="button" className="btn" onClick={() => navigate({ name: 'review' })}>Review now</button>
        </section>
      ) : (
        <section className="hero-card">
          <div className="kicker">{lists.length ? 'Nothing to review yet' : 'Start here'}</div>
          <div className="big">{lists.length ? 'Add the words you keep avoiding' : 'Add the words you avoid saying out loud'}</div>
          <button type="button" className="btn" onClick={() => navigate({ name: 'new' })}><PlusIcon size={18} />New list</button>
        </section>
      )}

      <div className="stats">
        <div className="stat"><b>{mastered}</b><span>mastered</span></div>
        <div className="stat"><b>{retired}</b><span>locked in</span></div>
        <div className="stat"><b>{due.length}</b><span>due now</span></div>
      </div>

      {lists.length === 0 ? (
        <div className="empty">
          <div className="small">Try something like</div>
          <div className="ex">pleocytosis<br />Worcestershire<br />gnocchi</div>
          <div className="small">Up to ten at a time. You’ll hear each one, say it, and move on when it lands.</div>
        </div>
      ) : (
        <>
          <div className="section-head">
            <h2>Your lists</h2>
            {due.length > 0 && (
              <button type="button" className="btn quiet" style={{ minHeight: 32, padding: 0 }} onClick={() => navigate({ name: 'new' })}>
                <PlusIcon size={16} />New list
              </button>
            )}
          </div>
          {lists.map((l) => <ListCard key={l.id} list={l} />)}
        </>
      )}
    </div>
  )
}

function ListCard({ list }: { list: WordList }) {
  const got = list.words.filter((w) => list.results[w] === 'got').length
  const all = got === list.words.length
  return (
    <button type="button" className={`list-card${all ? ' done' : ''}`} onClick={() => navigate({ name: 'practice', listId: list.id })}>
      <span className="ring">
        <Ring value={got / list.words.length} size={46} stroke={4} />
        <span className="pct">{got}/{list.words.length}</span>
      </span>
      <span className="body">
        <span className="name">{list.title || titleFor(list.words)}</span>
        <span className="sub">{list.words.length === 1 ? '1 word' : `${list.words.length} words`}{all ? ' · all mastered' : got ? ` · ${got} mastered` : ' · not started'}</span>
      </span>
      <ChevronIcon className="chev" />
    </button>
  )
}
