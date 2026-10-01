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

Push to `main`. The workflow in `.github/workflows/deploy.yml` runs the tests, builds with the
right base path for the repository name, and publishes to Pages. In the repository settings, set
**Pages → Build and deployment → Source** to **GitHub Actions** once.

## How speech works today

- Hearing the word: the browser's built-in text-to-speech.
- Checking you: the browser's built-in speech recognition. "Got it!" means the recogniser heard the
  word you were aiming for. That is a good proxy, not a true pronunciation score.
- Both sit behind small interfaces in `src/speech/`, so a real pronunciation-assessment service can
  be swapped in later. `PLAN.md` describes that path; `DESIGN.md` records the visual decisions.

## Layout

```
src/lib/        words (parsing), scoring (pass/retry + guidance), scheduler (spaced review), storage, router
src/speech/     Speaker and Listener interfaces with browser implementations, live mic level
src/screens/    Home, NewList, Practice (also the finish view), Review
src/components/ Segments, MicButton, Feedback
poc/            the original single-file proof of concept
```
