# Unspoken — Build Plan

> **Unspoken** — *Words you know. Learn to say them.*

Source: `Pronounciation_Spec.png` (screenshot of a product conversation). Transcribed below so the
plan doesn't depend on the image.

---

## 1. The spec, transcribed

> …that is the app. And I think we should resist adding a bunch of features before this core loop
> works beautifully.
>
> **Unspoken** — Words you know. Learn to say them.
>
> The first product can be almost ridiculously simple:
>
> 1. **Create a list** — type or paste up to 10 words. Any words.
> 2. **Learn** — tap a word and hear a reliable pronunciation at normal or slow speed.
> 3. **Speak** — press the microphone and pronounce it yourself.
> 4. **Get feedback** — ✓ *Got it!* or *Almost — try again*, with useful guidance.
> 5. **Advance** — after approval, it automatically moves to the next word.
> 6. **Finish** — *10/10 mastered.* The list stays in your library for future review.
>
> I'd add **"Skip for now"** rather than "I know this one." That preserves the concept: the app
> isn't testing whether you know what *pleocytosis* means; it only cares whether you're comfortable
> saying it.
>
> And there's a nice behavioral hook: tomorrow, Unspoken could pull two or three previously mastered
> words into a quick review. If you still pronounce them correctly, they get spaced farther apart.
> Eventually they're simply **Mastered**.
>
> The subscription then buys something genuinely different from looking up a word online:
> **unlimited lists + listening + actual speech evaluation + personalized practice + retention.**
>
> I also think $2.99 may actually be *too low* if we're paying for high-quality pronunciation audio
> and speech assessment. We can figure out the economics after we know the technical cost per
> active user. But I'd keep the first build focused on proving one thing:
>
> **Can someone enter 10 arbitrary words and have Unspoken reliably teach them to say those 10 words?**
>
> If yes, we have the core product.

## 1b. Proof of concept (built first, zero setup)

`poc/index.html` is a single page that runs the whole six-step loop using the browser's built-in
text-to-speech and speech recognition. No accounts, no API keys, no build step.

- Run: `python3 -m http.server 8787 -d poc` then open <http://localhost:8787> in Chrome.
- Works on desktop Chrome and Android Chrome; Safari on iPhone usually works too.
- Pass/fail is "did the recognizer hear the right word" (fuzzy match), **not** real pronunciation
  scoring. It is a demo of the experience, and it is what Phase 0 replaces with Azure assessment.

## 2. What we are proving, and what we are not building yet

The first build answers exactly one question: *can a person enter 10 arbitrary words and be
reliably taught to say them?* Everything in this plan is ordered by how much it contributes to
answering that.

**In scope for v1 (the core loop):** list creation, listen (normal/slow), record, pass/retry
feedback with guidance, skip-for-now, auto-advance, 10/10 finish screen, library of lists.

**Deliberately deferred:** accounts, sync, payments, spaced review, streaks, social, multiple
languages, definitions, native app store builds. Each has a slot in a later phase; none is needed
to answer the question.

## 3. Key decisions

### 3.1 Platform: mobile-first web app (installable PWA), not a native app first

- Fastest path to the sister holding a working loop on her phone: open a URL, no TestFlight, no
  App Store review, iterate several times a day.
- Microphone capture and audio playback work in iOS Safari and Android Chrome.
- If App Store presence matters later, the same codebase wraps with Capacitor in Phase 4.
- Trade-off: native would give slightly better mic control and offline. Not needed to prove the loop.

### 3.2 Speech vendor: Azure AI Speech for both TTS and pronunciation assessment

One vendor covers both halves of the loop, which keeps the first build small:

- **Text-to-speech**: neural voices; "slow" is a plain SSML `<prosody rate="slow">` on the same
  voice, so the slow version sounds like the same speaker, not a different clip.
- **Pronunciation assessment**: scores the recording against the reference word, returning
  accuracy per word *and per phoneme*, plus error types (mispronunciation, omission, insertion).
  That phoneme detail is what makes "useful guidance" possible instead of just pass/fail.
- **Cost** (pay-as-you-go, US list prices as of late 2026, verify before launch): neural TTS about
  $15–16 per million characters; pronunciation assessment billed at the speech-to-text hourly
  rate (roughly $1 per audio hour). Free tier covers all development.

Back-of-envelope per heavy user: 10 words × 3 attempts × ~3 s = 90 s of assessed audio per day,
about $0.03/day or under $1/month at daily use. TTS is negligible because each word's audio is
generated once and cached. The $2.99 price point is not obviously too low on vendor cost; the
real cost driver will be hosting plus whatever we spend on better guidance. Phase 0 measures this.

**Alternatives considered:** Speechace, SpeechSuper and ELSA are pronunciation-specialist APIs
with arguably finer feedback. Keep them as a Phase 2 experiment behind the same interface if Azure's
feedback proves too coarse. ElevenLabs/OpenAI TTS sound more natural but add a second vendor and
have weaker rate control; Azure neural is good enough for single words.

### 3.3 Where the audio goes: browser Speech SDK with short-lived tokens

- The server holds the Azure key and issues a 10-minute token to the browser.
- The browser uses Microsoft's JavaScript Speech SDK to capture the mic and stream to Azure for
  assessment. This sidesteps the biggest cross-browser headache: Safari records `audio/mp4`,
  Chrome records `webm/opus`, and Azure's REST endpoint wants WAV. The SDK handles encoding.
- The server never touches raw audio in v1, which keeps latency down and the server trivial.
- We still *also* keep a copy of the raw recording client-side (and optionally upload it) so the
  sister can listen back to disputed verdicts during Phase 0/1 calibration.

### 3.4 Storage: local-first in v1, synced accounts in Phase 3

- v1 stores lists, attempts and progress in the browser (IndexedDB via Dexie). No sign-up friction
  for testers; the "library" works immediately.
- All reads/writes go through one small repository interface so Phase 3 swaps in Postgres + auth
  without touching the UI.
- Known cost of this choice: a tester who clears their browser loses their library. Acceptable
  while we are proving the loop.

### 3.5 Pass/retry threshold and guidance: rule-based first, LLM-polished later

- **Got it!** when word accuracy ≥ 80 (tunable constant) and no phoneme below 50 and no omitted
  syllable. Otherwise **Almost — try again**.
- Guidance is built from the lowest-scoring phonemes using a hand-written hint table for en-US
  (e.g. `TH` → "tongue lightly between your teeth", `R` → "don't let it turn into a W", stressed
  syllable mismatch → "stress the second syllable: ple-o-cy-TO-sis"). This is predictable and free.
- Phase 2 option: pass the phoneme report to Claude to phrase guidance more naturally. Only if
  testers find the table hints stiff.

## 4. Architecture

```
Browser (Next.js app, mobile-first)
 ├─ Screens: Home/Library · New List · Session (Learn → Speak → Feedback) · Finish
 ├─ Speech SDK (mic capture + pronunciation assessment, token auth)
 ├─ Audio cache: word → {normal, slow} URLs
 └─ IndexedDB (Dexie): lists, words, attempts, progress

Next.js server (route handlers)
 ├─ POST /api/speech/token     → short-lived Azure token (key never leaves server)
 ├─ GET  /api/tts?word=&rate=  → synthesizes via Azure, caches mp3 in blob storage, redirects
 └─ (Phase 3) auth, Postgres, Stripe webhooks

Azure AI Speech
 ├─ Neural TTS (SSML prosody rate for slow)
 └─ Pronunciation Assessment (word + phoneme accuracy, error types)
```

**Stack:** Next.js (App Router) · TypeScript · Tailwind · Dexie · `microsoft-cognitiveservices-speech-sdk`
· Vercel for hosting + Blob for cached audio · Vitest + Playwright. Node 24 and npm are already on
this machine.

**Data model (v1):**

| Entity | Fields |
|---|---|
| List | id, title, createdAt, wordIds[] (≤10) |
| Word | id, listId, text, normalizedText, status: `new` / `skipped` / `mastered` |
| Attempt | id, wordId, at, accuracy, phonemes[], verdict, guidance, audioBlob? |
| Progress (Phase 2) | wordId, interval, ease, nextReviewAt, masteredAt |

## 5. Phases

### Phase 0 — De-risk the loop (1–2 days)

A throwaway page, not the real UI. Goal: find out whether Azure's assessment is *trustworthy* on
arbitrary words before we build anything pretty.

- [ ] Azure Speech resource + key; token route; SDK wired in the browser.
- [ ] One page: text box → hear normal/slow → record → raw JSON score on screen.
- [ ] Test on iPhone Safari and Android Chrome, including iOS low-power mode and AirPods.
- [ ] Word battery: everyday (*rural, squirrel*), medical (*pleocytosis, sphygmomanometer*),
  names (*Worcestershire, Nguyen, Siobhan*), loanwords (*gnocchi, quinoa*), and deliberately wrong
  pronunciations to check it actually fails people.
- [ ] Record: does TTS say rare words correctly? Does assessment handle words outside its lexicon?
  How noisy are scores across repeated correct attempts? What threshold separates right from wrong?
- [ ] Measure real Azure cost for the session.

**Exit criterion:** we can state a threshold and a confidence that the verdict is right, or we know
we need a different vendor. If Azure fails here, swap vendor in Phase 0 rather than later.

### Phase 1 — Core loop MVP (about 2 weeks)

Build the six steps from the spec, nothing else.

- [ ] Project scaffold, lint/format, CI (typecheck + unit tests), deploy preview per commit.
- [ ] **Create a list:** textarea accepting typed or pasted words (split on newlines/commas/spaces,
  trim, dedupe, cap at 10 with a clear message, reject empty). Name is optional.
- [ ] **Learn:** word card with ▶ normal and 🐢 slow. Audio pre-fetched for the whole list on
  session start so taps are instant. Server-side cache so a word is synthesized once ever.
- [ ] **Speak:** hold-or-tap mic button, visible level meter, auto-stop on silence, max 5 s.
  Handle permission denied, no mic, and backgrounded tab gracefully.
- [ ] **Feedback:** *Got it!* / *Almost — try again* with 1–2 lines of guidance and a "hear it
  again" button. Show which part of the word was the problem (highlight syllable/phoneme).
- [ ] **Skip for now:** moves on, word stays unmastered, returns at the end of the session.
- [ ] **Advance:** on pass, short confirmation then next word automatically (small delay, no tap).
- [ ] **Finish:** *N/10 mastered* summary; skipped words listed with a "try these now" button.
- [ ] **Library:** lists with mastered count; reopen to practice again.
- [ ] Calibration tooling (dev-only): log every attempt with audio so the sister can review verdicts
  and we can tune the threshold from real data.
- [ ] Mobile polish: large touch targets, works one-handed, no layout shift, installable PWA.

**Exit criterion:** three people who are not us complete a 10-word list on their own phone and say
the verdicts felt fair. Track: first-attempt pass rate, attempts to master, time per word, 10/10
completion rate, and how often "Almost" was disputed.

### Phase 2 — Retention (about 1 week)

The "nice behavioral hook" from the spec.

- [ ] Progress record per word with a simple spaced schedule (Leitner-style: 1 → 3 → 7 → 14 →
  30 days). Pass pushes the interval out; fail resets it.
- [ ] Home screen offers "Quick review: 3 words" when any are due. Same Speak/Feedback loop.
- [ ] Word reaches **Mastered** after a set number of spaced passes; list shows the badge.
- [ ] Optional vendor experiment: route attempts to a second assessment API behind the same
  interface and compare verdicts offline.
- [ ] Optional: LLM-phrased guidance if hint-table guidance feels mechanical.

### Phase 3 — Accounts, sync, subscription (about 2 weeks)

Only once the loop is proven.

- [ ] Auth (passkey/magic link; Clerk or Auth.js) and Postgres (Neon/Supabase).
- [ ] Migrate the repository layer; one-time import of local IndexedDB data on first sign-in.
- [ ] Stripe subscription: free tier = one list of 10 words with listening and evaluation; paid =
  unlimited lists + review. Price set from the per-user cost measured in Phases 0–1.
- [ ] Usage metering per user (seconds assessed, characters synthesized) so we can watch margin.
- [ ] Privacy: state what happens to recordings; don't keep audio by default once verdicts are
  trusted.

### Phase 4 — Optional native wrapper

- [ ] Capacitor build for iOS/Android if app-store distribution or push notifications for review
  reminders become important. No UI rewrite.

## 6. Risks and how the plan handles them

| Risk | Mitigation |
|---|---|
| Assessment is unreliable on rare words (false "Almost" frustrates, false "Got it" lies) | Phase 0 word battery with known-good and known-bad audio; keep clips for human review; tunable threshold; vendor swap behind an interface |
| TTS mispronounces the reference word itself | Phase 0 checks; Phase 1 "report this pronunciation" link; later, allow IPA/SSML phoneme overrides per word |
| iOS Safari mic quirks (permission per session, audio session conflicts with playback) | Test on real devices in Phase 0; SDK handles capture; explicit user gesture before first record |
| Scope creep (the spec warns about this) | Each phase has an exit criterion; nothing from Phase 2+ ships before Phase 1's criterion is met |
| Per-user cost surprises | Measure in Phase 0; meter in Phase 3 before pricing |

## 7. Open questions for the product owner

1. English (US) only for v1? Should a British voice be an option?
2. Who is the first audience: medical/professional vocabulary (the *pleocytosis* example) or general?
   This affects the Phase 0 word battery and the hint table.
3. Is "Skip for now" permanent per list, or should skipped words come back in review?
4. Should testers see numeric scores, or only *Got it!* / *Almost*? (Recommendation: hide numbers.)
5. Is a web app she can open from a link acceptable for the first round of testing, or is an
   App Store presence required from day one?

## 8. Immediate next steps

1. Confirm the platform and vendor choices above (or adjust).
2. Create the Azure Speech resource and share the key via environment variable, not chat.
3. Start Phase 0 spike in this repo.
