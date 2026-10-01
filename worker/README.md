# Unspoken voice server

A Cloudflare Worker that gives the app studio-quality voices (Azure AI Speech neural voices)
without exposing a key in the browser. Clips are cached at Cloudflare's edge, so each word is
synthesized once; the Azure free tier (500,000 characters a month) covers thousands of users.

## One-time setup, about ten minutes

1. **Azure key.** At https://portal.azure.com create a resource of type *Speech* (search "Speech"
   in Create a resource). Pick the Free (F0) tier and a region such as `eastus`. Open the resource,
   then *Keys and Endpoint*, and copy Key 1 and the region name.
2. **Cloudflare account.** Free at https://dash.cloudflare.com.
3. **Deploy the worker** from this folder:

   ```
   cd worker
   npm install
   npx wrangler login
   npx wrangler secret put AZURE_SPEECH_KEY     # paste Key 1 when asked
   npx wrangler deploy
   ```

   If your region is not `eastus`, edit `AZURE_REGION` in `wrangler.toml` first. The deploy prints
   a URL like `https://unspoken-voice.<you>.workers.dev`.
4. **Connect the app.** Open Unspoken, Settings, Studio voices, paste that URL and tap Test. Every
   accent now uses a neural voice, and "Automatic" becomes Ava, Microsoft's most natural
   English voice. To bake the URL into the build instead, run
   `VITE_TTS_URL=https://unspoken-voice.<you>.workers.dev npm run deploy`.

## Endpoints

- `GET /tts?text=word&voice=en-GB-SoniaNeural&rate=slow&pitch=1&speed=1` returns `audio/mpeg`.
- `GET /health` returns `{ ok, engine, region }`.

Text is limited to 80 letters and voices to a fixed list, so the worker cannot be used as a
general text-to-speech proxy. Set `ALLOWED_ORIGIN` in `wrangler.toml` to lock it to the site.
