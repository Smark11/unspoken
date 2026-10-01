# Unspoken — design plan

**Subject.** Practising words you already know but hesitate to say out loud: medical terms,
surnames, loanwords, the word in the meeting you keep avoiding. **Audience.** Adults, on a phone,
usually alone, a little self-conscious. **Primary job.** Get the person to say the word, and tell
them honestly whether it landed.

**The one memorable thing.** The word itself. It is set very large in Fraunces, a soft serif that
reads like a dictionary headword, on a cool, quiet ground. Everything else on the screen is small,
native-feeling sans, and stays out of the way. The second character is the microphone: while it
listens it becomes a live voice meter, so you can see yourself being heard.

## Tokens

Color (light): ground `#EDEFF2` fog · surface `#FFFFFF` · ink `#171A21` · muted `#5E6470` ·
action `#2447F0` cobalt · got `#157A4A` · almost `#B8620B` · listening `#C8322B`.
Color (dark): ground `#0F1115` · surface `#171A21` · ink `#F2F3F5` · muted `#9AA1AD` ·
action `#7C92FF` · got `#48C98A` · almost `#F2AC45` · listening `#FF6A5C`.

Type: Fraunces (variable, optical size) for the practised word and screen titles only.
System sans (SF / Roboto / Segoe) for every control and line of body text so the app feels native
on the phone it is opened on. Word: `clamp(44px, 15vw, 76px)`, weight 500, tight tracking, optical
size 72. Title 30/36 Fraunces 500. Body 17/25. Small 14/20.

## Layout

One column, max 480px, left-aligned on list screens; the practised word is centred.

```
┌──────────────────────────┐
│ ▮▮▮▮▯▯▯▯▯▯     4 of 10   │  ten thin segments: the list really is a sequence
│                          │
│                          │
│       pleocytosis        │  Fraunces, huge, centred in the free space
│                          │
│   ▶ Hear it   ◔ Slowly   │  quiet pill buttons
│                          │
│ ┌──────────────────────┐ │
│ │ Almost — try again   │ │  tinted panel, appears only after an attempt
│ │ Say the whole word…  │ │
│ └──────────────────────┘ │
│                          │
│      ( ● Say it )        │  big round control in the thumb zone; becomes a meter
│        Skip for now      │
└──────────────────────────┘
```

## Principles

- Dictionary calm, not a game. No confetti, no streak nag, no mascots.
- Colour only answers an action: red while listening, green for got it, amber for almost.
- One motion: on a pass the word settles and its progress segment fills, then the next word
  arrives. Nothing animates on load.
- Copy says exactly what happens: "Start practising", "Skip for now", "Practise skipped words".
- Errors say what to do: "Allow the microphone for this page, then tap Say it again."

## Review against the generic defaults

- Cream ground + terracotta accent: avoided. Fog grey with cobalt; the only warmth is the amber
  "almost" state, which has a job.
- SaaS card kit: list rows use hairline dividers, not stacked cards. The feedback panel is the one
  tinted surface, because it is the one thing that changes.
- Tracked-out caps labels, middle-dot meta strings, arrows on buttons: none.
- Serif display is a default tell, but here it is the point: a headword in a dictionary. Kept,
  justified, and it is the only place the serif appears.
