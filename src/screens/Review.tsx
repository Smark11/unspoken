import { useMemo } from 'react'
import { load } from '../lib/storage'
import { pickReview } from '../lib/scheduler'
import { navigate } from '../lib/router'
import { Practice } from './Practice'
import { BackIcon } from '../components/Icons'

export function Review() {
  const words = useMemo(() => {
    const s = load()
    return pickReview(s.progress, Date.now()).map((k) => s.progress[k].text)
  }, [])
  if (!words.length) {
    return (
      <div className="screen">
        <div className="topbar">
          <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate({ name: 'home' })}><BackIcon /></button>
        </div>
        <h1 className="title" style={{ marginTop: 18 }}>Nothing due today</h1>
        <p className="tagline">Mastered words come back for a quick check, a little later each time: after a day, then three, then a week.</p>
        <div style={{ marginTop: 24 }}>
          <button type="button" className="btn primary block" onClick={() => navigate({ name: 'home' })}>Back to your lists</button>
        </div>
      </div>
    )
  }
  return <Practice key="review" words={words} mode="review" onExit={() => navigate({ name: 'home' })} />
}
