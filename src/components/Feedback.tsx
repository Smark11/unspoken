import type { Judgement } from '../lib/scoring'

export function Feedback({ j }: { j: Judgement }) {
  const got = j.verdict === 'got'
  return (
    <div className={`feedback ${j.verdict}`} role="status" aria-live="polite">
      <div className="head">{got ? '✓ Got it!' : 'Almost — try again'}</div>
      <div className="body">{j.guidance}</div>
      {j.heard && <div className="heard">We heard “{j.heard}”</div>}
    </div>
  )
}
