/**
 * Unspoken voice server: a tiny Cloudflare Worker that turns a word into natural speech, keeping
 * every key here so the app only ever sees audio.
 *
 * Providers (pick with TTS_PROVIDER, or it is inferred from which secrets exist):
 *   azure   Azure AI Speech neural voices       needs AZURE_SPEECH_KEY + AZURE_REGION
 *   kokoro  Kokoro-82M via any OpenAI-compatible needs KOKORO_URL (+ KOKORO_KEY if the host wants one)
 *           /v1/audio/speech endpoint: Kokoro-FastAPI on a Hugging Face Space or Docker, DeepInfra, etc.
 *
 *   GET /tts?text=pleocytosis&preset=gb-f&rate=slow&pitch=1&speed=1   -> audio/mpeg
 *   GET /health                                                      -> { ok, engine, presets, pitch }
 *
 * Clips are cached at the edge for a year, so each word is synthesized once.
 */

const TEXT_OK = /^[\p{L}\p{M}'’\-. ]{1,80}$/u

// Accent preset -> provider voice. 'auto' is the default voice for each provider.
const AZURE = {
  auto: 'en-US-AvaMultilingualNeural', 'gb-f': 'en-GB-SoniaNeural', 'gb-m': 'en-GB-RyanNeural',
  'us-f': 'en-US-JennyNeural', 'us-m': 'en-US-AndrewMultilingualNeural', ie: 'en-IE-EmilyNeural',
  au: 'en-AU-NatashaNeural', za: 'en-ZA-LeahNeural', in: 'en-IN-NeerjaNeural',
}
const KOKORO = {
  auto: 'af_heart', 'gb-f': 'bf_emma', 'gb-m': 'bm_george', 'us-f': 'af_bella', 'us-m': 'am_michael',
}

const cors = (env) => ({
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
})
const json = (body, status, env) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(env) } })
const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))

function provider(env) {
  const p = (env.TTS_PROVIDER || '').toLowerCase()
  if (p === 'azure' || p === 'kokoro') return p
  if (env.AZURE_SPEECH_KEY && env.AZURE_REGION) return 'azure'
  if (env.KOKORO_URL) return 'kokoro'
  return null
}
const configured = (env, p) => (p === 'azure' ? !!(env.AZURE_SPEECH_KEY && env.AZURE_REGION) : p === 'kokoro' ? !!env.KOKORO_URL : false)

async function azureSpeak(env, text, voice, rate, pitch, speed) {
  const basePct = rate === 'slow' ? -45 : -5
  const sign = (n) => (n >= 0 ? `+${n}%` : `${n}%`)
  const ssml =
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${voice.slice(0, 5)}'>` +
    `<voice name='${voice}'><prosody rate='${sign(Math.round(basePct + (speed - 1) * 60))}' pitch='${sign(Math.round((pitch - 1) * 70))}'>` +
    `${escapeXml(text)}</prosody></voice></speak>`
  return fetch(`https://${env.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      'User-Agent': 'unspoken-voice-server',
    },
    body: ssml,
  })
}

async function kokoroSpeak(env, text, voice, rate, speed) {
  const headers = { 'Content-Type': 'application/json' }
  if (env.KOKORO_KEY) headers.Authorization = `Bearer ${env.KOKORO_KEY}`
  const base = env.KOKORO_URL.replace(/\/+$/, '')
  // Accept a bare host (Kokoro-FastAPI), a .../v1 or .../v1/openai base (DeepInfra), or the full path.
  const url = /\/audio\/speech$/.test(base) ? base : /\/v1(\/openai)?$/.test(base) ? `${base}/audio/speech` : `${base}/v1/audio/speech`
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: env.KOKORO_MODEL || 'kokoro',
      input: text,
      voice,
      response_format: 'mp3',
      speed: Math.round((rate === 'slow' ? 0.6 : 0.95) * speed * 100) / 100,
    }),
  })
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env) })
    const engine = provider(env)
    const voices = engine === 'kokoro' ? KOKORO : AZURE

    if (url.pathname === '/health') {
      return json({
        ok: !!engine && configured(env, engine),
        engine,
        presets: engine ? Object.keys(voices).filter((k) => k !== 'auto') : [],
        pitch: engine === 'azure',
      }, 200, env)
    }
    if (url.pathname !== '/tts' || request.method !== 'GET') return json({ error: 'not found' }, 404, env)
    if (!engine || !configured(env, engine)) return json({ error: 'server not configured' }, 503, env)

    const text = (url.searchParams.get('text') || '').trim()
    const preset = url.searchParams.get('preset') || 'auto'
    const rate = url.searchParams.get('rate') === 'slow' ? 'slow' : 'normal'
    const pitch = Math.min(1.4, Math.max(0.6, Number(url.searchParams.get('pitch') || 1)))
    const speed = Math.min(1.3, Math.max(0.7, Number(url.searchParams.get('speed') || 1)))
    if (!TEXT_OK.test(text)) return json({ error: 'text must be 1 to 80 letters' }, 400, env)
    const voice = voices[preset] || voices.auto

    // Normalise the key so the same clip is cached regardless of parameter order.
    const key = new URL(url.origin + '/tts')
    key.search = new URLSearchParams({ e: engine, text: text.toLowerCase(), voice, rate, pitch: pitch.toFixed(2), speed: speed.toFixed(2) }).toString()
    const cache = caches.default
    const hit = await cache.match(key)
    if (hit) return withCors(hit, env)

    const upstream = engine === 'azure'
      ? await azureSpeak(env, text, voice, rate, pitch, speed)
      : await kokoroSpeak(env, text, voice, rate, speed)
    if (!upstream.ok) return json({ error: 'speech service error', status: upstream.status }, 502, env)

    const audio = await upstream.arrayBuffer()
    const res = new Response(audio, {
      status: 200,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable', ...cors(env) },
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
