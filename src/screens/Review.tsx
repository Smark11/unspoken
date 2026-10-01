import { useMemo } from 'react'
import { load } from '../lib/storage'
import { pickReview } from '../lib/scheduler'
import { navigate } from '../lib/router'
import { Practice } from './Practice'

export function Review() {
  const words = useMemo(() => {
    const s = load()
    return pickReview(s.progress, Date.now()).map((k) => s.progress[k].text)
  }, [])
  if (!words.length) {
    return (
      <div className="screen">
        <h1 className="title">Nothing due</h1>
        <p className="tagline">Mastered words come back for a quick check, a little later each time.</p>
        <div style={{ marginTop: 24 }}>
          <button type="button" className="btn block" onClick={() => navigate({ name: 'home' })}>Back</button>
        </div>
      </div>
    )
  }
  return <Practice key="review" words={words} mode="review" onExit={() => navigate({ name: 'home' })} />
}
