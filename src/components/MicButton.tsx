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
    <button
      type="button"
      className={`mic ${state}${listening && level === null ? ' anim' : ''}`}
      onClick={onPress}
      disabled={state === 'busy'}
      aria-label={listening ? 'Listening' : 'Say it'}
    >
      {listening ? (
        <span className="bars">
          {bars.map((w, i) => (
            <i key={i} style={level === null ? undefined : { height: `${8 + Math.round(28 * w * level)}px` }} />
          ))}
        </span>
      ) : state === 'busy' ? (
        'Checking…'
      ) : (
        'Say it'
      )}
    </button>
  )
}
