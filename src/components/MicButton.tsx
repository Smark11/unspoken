import { MicIcon } from './Icons'

export type MicState = 'idle' | 'listening' | 'busy'

interface Props {
  state: MicState
  level: number | null   // null = no live meter available, animate instead
  onPress(): void
}

export function MicButton({ state, level, onPress }: Props) {
  const listening = state === 'listening'
  const bars = [0.45, 0.8, 1, 0.8, 0.45]
  return (
    <div className={`orb-wrap ${state}`}>
      <span className="ripple" /><span className="ripple" /><span className="ripple" />
      <button
        type="button"
        className={`orb ${state}${listening && level === null ? ' anim' : ''}`}
        style={{ ['--lvl' as string]: listening && level !== null ? level : 0 }}
        onClick={onPress}
        disabled={state === 'busy'}
        aria-label={listening ? 'Listening' : 'Say it'}
      >
        {listening ? (
          <span className="bars">
            {bars.map((w, i) => (
              <i key={i} style={level === null ? undefined : { height: `${8 + Math.round(28 * w * Math.min(1, level * 1.6))}px` }} />
            ))}
          </span>
        ) : (
          <MicIcon size={38} />
        )}
      </button>
    </div>
  )
}
