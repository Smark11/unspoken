# Unspoken — proof of concept

One HTML file, no build, no API keys. Uses the browser's built-in text-to-speech and speech
recognition to demo the full loop: create a list → hear it → say it → Got it! / Almost → advance → finish.

## Run it

```
cd ~/_src/pronounciation
python3 -m http.server 8787 -d poc
```

Open http://localhost:8787 in **Chrome** and allow the microphone when asked.

To show it on a phone on the same Wi-Fi, open `http://<this-mac's-IP>:8787` on the phone.
Chrome on Android works; Safari on iPhone usually works (it uses Siri's recognizer).

## What's real and what's faked

- Hearing the word at normal and slow speed: real (system voice).
- "Got it!" vs "Almost": decided by whether the speech recognizer heard the right word (fuzzy
  match). It is a stand-in for true pronunciation scoring, which the full build gets from Azure
  Speech pronunciation assessment (see ../PLAN.md).
- Library: saved in this browser only.
