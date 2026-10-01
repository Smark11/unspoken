# Unspoken voice server

A Cloudflare Worker that gives the app natural voices without exposing a key in the browser. It can
speak through **Kokoro** (an open 82M-parameter model with very natural English voices) or **Azure
AI Speech** neural voices. Clips are cached at Cloudflare's edge, so each word is synthesized once.

## Option A: Kokoro, free, on a Hugging Face Space

1. Create a free account at https://huggingface.co and open https://huggingface.co/new-space.
   Name it `kokoro`, choose **Docker** as the SDK, **Blank** template, free CPU hardware, Public.
2. In the new Space, add a file named `Dockerfile` containing exactly:

   ```
   FROM ghcr.io/remsky/kokoro-fastapi-cpu:latest
   ENV PORT=7860
   EXPOSE 7860
   ```

   Commit it. The Space builds in a few minutes and shows "Running".
3. Your endpoint is `https://<your-username>-kokoro.hf.space`. Check it in a browser at
   `https://<your-username>-kokoro.hf.space/v1/audio/voices`; you should see a list of voices.
4. Deploy the worker (below) with `KOKORO_URL` set to that address in `wrangler.toml`.

Free Spaces go to sleep after about 48 hours idle and take 30 to 60 seconds to wake, so the first
word of a session may wait once. Upgrading the Space to persistent hardware removes that.

## Option B: Kokoro on DeepInfra, no sleeping, about $0.80 per million characters

1. Sign up at https://deepinfra.com and create an API key.
2. In `wrangler.toml` set `KOKORO_URL = "https://api.deepinfra.com/v1/openai"` and
   `KOKORO_MODEL = "hexgrad/Kokoro-82M"`, then `npx wrangler secret put KOKORO_KEY`.

## Option C: Kokoro on your Mac, for testing

```
docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest
```

Then in the app, Settings, Studio voices, paste `http://localhost:8880` **only when testing on
this Mac**: the worker isn't involved, the app talks to the container directly.

## Option D: Azure neural voices

Create a *Speech* resource at https://portal.azure.com (Free F0 tier), copy Key 1 and the region,
set `AZURE_REGION` in `wrangler.toml`, then `npx wrangler secret put AZURE_SPEECH_KEY`. Azure
offers more accents (Irish, Australian, South African, Indian English) and pitch control.

## Deploy the worker

```
cd worker
npm install
npx wrangler login
npx wrangler deploy
```

The deploy prints a URL like `https://unspoken-voice.<you>.workers.dev`. In Unspoken, open
Settings, Studio voices, paste that URL and tap Test. The accent list adapts to what the provider
offers: Kokoro has American and British voices, Azure adds the rest.

To bake the URL into the build instead: `VITE_TTS_URL=https://unspoken-voice.<you>.workers.dev npm run deploy`.

## Endpoints

- `GET /tts?text=word&preset=gb-f&rate=slow&pitch=1&speed=1` returns audio.
  Presets: `auto`, `gb-f`, `gb-m`, `us-f`, `us-m`, and with Azure also `ie`, `au`, `za`, `in`.
- `GET /health` returns `{ ok, engine, presets, pitch }`.

Text is limited to 80 letters and voices to a fixed list, so the server can't be used as a general
text-to-speech proxy. Set `ALLOWED_ORIGIN` to lock it to the site.
