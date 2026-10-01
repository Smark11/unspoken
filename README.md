# Unspoken

*Words you know. Learn to say them.*

Type up to ten words you avoid saying out loud. Unspoken says each one (normal or slow), listens
while you say it, tells you **Got it!** or **Almost — try again** with one concrete tip, and moves
on when it lands. Mastered words come back for a quick review a little later each time.

A mobile-first web app. Installable to the home screen. No account, no server: everything runs in
the browser and stays on your phone.

## Run it locally

```
npm install
npm run dev
```

Open the URL Vite prints (use the network one on your phone, same Wi-Fi). Chrome on desktop or
Android, or Safari on iPhone.

## Test and build

```
npm test
npm run build      # typechecks, then builds to dist/
npm run preview    # serve the built app
```

## Deploy to GitHub Pages

Live at https://smark11.github.io/unspoken/

Two ways to publish:

- `npm run deploy` builds locally and pushes the result to the `gh-pages` branch, then asks GitHub
  for a Pages build. This needs no Actions minutes. Pages must be set to deploy from the
  `gh-pages` branch (Settings → Pages → Source → Deploy from a branch).
- The workflow in `.github/workflows/deploy.yml` does the same on every push to `main` through
  GitHub Actions, for when Actions is available on the account. Set Pages source to GitHub Actions
  to use it.

## Voices

Two engines, chosen in Settings:

- **Device voices** (default): whatever the phone's browser provides. Zero setup.
- **Studio voices**: a Cloudflare Worker in `worker/` that proxies Kokoro (hosted on a Hugging Face
  Space, DeepInfra, or Docker) or Azure neural voices. Instant, natural, needs a ten-minute setup.

Running Kokoro inside the browser was tried and removed: it worked, but took 2 to 15 seconds per
word on a Mac and would be slower on a phone.

## How speech works today

- Hearing the word: the browser's built-in text-to-speech.
- Checking you: the browser's built-in speech recognition. "Got it!" means the recogniser heard the
  word you were aiming for. That is a good proxy, not a true pronunciation score.
- Both sit behind small interfaces in `src/speech/`, so a real pronunciation-assessment service can
  be swapped in later. `PLAN.md` describes that path; `DESIGN.md` records the visual decisions.

## Design review

`preview.html` (dev server only) shows the app inside a phone frame with simulated safe areas:
open http://localhost:5173/preview.html. `DESIGN.md` records the visual system and the five design
passes.

## Layout

```
src/lib/        words (parsing), scoring (pass/retry + guidance), session, scheduler (spaced review), storage, prefs, sounds, time, router
src/speech/     Speaker and Listener interfaces with browser implementations, live mic level
src/screens/    Home, NewList, Practice (also the finish view), Review, Settings
src/components/ Segments, MicButton, Feedback, Burst, Sheet, InstallBanner, Icons
poc/            the original single-file proof of concept
```
