import type { Judgement } from '../lib/scoring'
import { SparkIcon } from './Icons'

export function Feedback({ j }: { j: Judgement }) {
  const got = j.verdict === 'got'
  return (
    <div className={`feedback ${j.verdict}`} role="status" aria-live="polite">
      <div className="badge">
        {got ? (
          <svg className="check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        ) : (
          <SparkIcon size={18} />
        )}
      </div>
      <div>
        <div className="head">{got ? 'Got it!' : 'Almost — try again'}</div>
        <div className="body">{j.guidance}</div>
        {j.heard && <div className="heard">We heard “{j.heard}”</div>}
      </div>
    </div>
  )
}
