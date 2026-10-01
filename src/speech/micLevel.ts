/** Live input level for the voice meter. Returns a stop function, or null when the meter can't run.
 *  On iOS the recogniser owns the microphone, so a second capture would make listening fail there;
 *  the meter falls back to an animation instead. */
export function startMicLevel(onLevel: (level: number) => void): Promise<(() => void) | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return Promise.resolve(null)
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return Promise.resolve(null)
  return navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      src.connect(analyser)
      const buf = new Uint8Array(analyser.fftSize)
      let raf = 0
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4))
        raf = requestAnimationFrame(tick)
      }
      tick()
      return () => {
        cancelAnimationFrame(raf)
        stream.getTracks().forEach((t) => t.stop())
        void ctx.close()
      }
    })
    .catch(() => null)
}
