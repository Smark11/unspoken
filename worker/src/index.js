/**
 * Unspoken voice server: a tiny Cloudflare Worker that turns a word into studio-quality speech
 * with Azure AI Speech neural voices. The Azure key stays here; the app only ever sees audio.
 *
 *   GET /tts?text=pleocytosis&voice=en-GB-SoniaNeural&rate=slow&pitch=1&speed=1  -> audio/mpeg
 *   GET /health                                                                  -> { ok, engine }
 *
 * Clips are cached at the edge for a year, so each word is synthesized once.
 */

const VOICES = new Set([
  'en-US-AvaMultilingualNeural', 'en-US-AndrewMultilingualNeural', 'en-US-JennyNeural', 'en-US-GuyNeural',
  'en-GB-SoniaNeural', 'en-GB-RyanNeural', 'en-GB-LibbyNeural', 'en-GB-ThomasNeural',
  'en-IE-EmilyNeural', 'en-IE-ConnorNeural', 'en-AU-NatashaNeural', 'en-AU-WilliamNeural',
  'en-ZA-LeahNeural', 'en-ZA-LukeNeural', 'en-IN-NeerjaNeural', 'en-IN-PrabhatNeural',
  'en-NZ-MollyNeural', 'en-CA-ClaraNeural',
])
const TEXT_OK = /^[\p{L}\p{M}'’\-. ]{1,80}$/u

const cors = (env) => ({
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
})

const json = (body, status, env) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(env) } })

const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) })
    if (url.pathname === '/health') {
      return json({ ok: !!env.AZURE_SPEECH_KEY && !!env.AZURE_REGION, engine: 'azure', region: env.AZURE_REGION || null }, 200, env)
    }
    if (url.pathname !== '/tts' || request.method !== 'GET') return json({ error: 'not found' }, 404, env)
    if (!env.AZURE_SPEECH_KEY || !env.AZURE_REGION) return json({ error: 'server not configured' }, 503, env)

    const text = (url.searchParams.get('text') || '').trim()
    const voice = url.searchParams.get('voice') || 'en-US-AvaMultilingualNeural'
    const rate = url.searchParams.get('rate') === 'slow' ? 'slow' : 'normal'
    const pitch = Math.min(1.4, Math.max(0.6, Number(url.searchParams.get('pitch') || 1)))
    const speed = Math.min(1.3, Math.max(0.7, Number(url.searchParams.get('speed') || 1)))
    if (!TEXT_OK.test(text)) return json({ error: 'text must be 1 to 80 letters' }, 400, env)
    if (!VOICES.has(voice)) return json({ error: 'unknown voice' }, 400, env)

    // Normalise the key so the same clip is cached regardless of parameter order.
    const key = new URL(url.origin + '/tts')
    key.search = new URLSearchParams({ text: text.toLowerCase(), voice, rate, pitch: pitch.toFixed(2), speed: speed.toFixed(2) }).toString()
    const cache = caches.default
    const hit = await cache.match(key)
    if (hit) return withCors(hit, env)

    const basePct = rate === 'slow' ? -45 : -5
    const ratePct = Math.round(basePct + (speed - 1) * 60)
    const pitchPct = Math.round((pitch - 1) * 70)
    const sign = (n) => (n >= 0 ? `+${n}%` : `${n}%`)
    const lang = voice.slice(0, 5)
    const ssml =
      `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'>` +
      `<voice name='${voice}'><prosody rate='${sign(ratePct)}' pitch='${sign(pitchPct)}'>${escapeXml(text)}</prosody></voice></speak>`

    const azure = await fetch(`https://${env.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        'User-Agent': 'unspoken-voice-server',
      },
      body: ssml,
    })
    if (!azure.ok) return json({ error: 'speech service error', status: azure.status }, 502, env)

    const audio = await azure.arrayBuffer()
    const res = new Response(audio, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable', ...cors(env) },
    })
    ctx.waitUntil(cache.put(key, res.clone()))
    return res
  },
}

function withCors(res, env) {
  const h = new Headers(res.headers)
  for (const [k, v] of Object.entries(cors(env))) h.set(k, v)
  return new Response(res.body, { status: res.status, headers: h })
}
