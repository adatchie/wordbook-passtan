# Wordbook

Wordbook is a handwriting-first English vocabulary practice app for Japanese junior high school students.

Many students can recognize English words in a printed vocabulary book but struggle to produce the spelling from memory. This prototype turns vocabulary practice into a fast, repeated handwriting loop: see a word or hint, write it by hand, get OCR-based feedback, hear the pronunciation, and move immediately to the next word.

## Live Demo

- App: https://adatchie.github.io/wordbook/
- Repository: https://github.com/adatchie/wordbook

The demo is a browser prototype intended for Build Week judging and early UX validation. It works best on a tablet or touch device, but it can also be tested with a mouse.

## What It Does

- Presents English vocabulary with Japanese meanings for junior high school learners.
- Runs 100-word practice sessions by default.
- Supports three difficulty levels:
  - Level 1: copy the visible English word.
  - Level 2: fill in a partially masked word using the Japanese meaning as a clue.
  - Level 3: write the full word from the Japanese meaning and character count only.
- Uses a countdown timer to keep practice focused.
- Penalizes timeouts by reducing the net correct count and increasing the session target.
- Uses browser OCR with Transformers.js and TrOCR to check handwritten English.
- Reads the word aloud with browser text-to-speech after a correct answer.
- Saves score history per level in LocalStorage.
- Provides a manual pass button for OCR failures.
- Saves manual-pass audit records, including the prompt and handwriting image, so a parent can review them later.

## Why This Exists

The target learner is a Japanese junior high school student who does not absorb vocabulary well by only looking at a textbook or word list.

The product idea is intentionally strict: the student cannot drift through flashcards passively. They must repeatedly write the word, under time pressure, until they can produce the spelling. The parent audit flow exists because OCR is imperfect, especially in a browser prototype, but the manual escape hatch should still be accountable.

## How To Try It

Open the live demo:

```text
https://adatchie.github.io/wordbook/
```

Then:

1. Choose `Lv1`, `Lv2`, or `Lv3`.
2. Write the answer in the handwriting area.
3. Press the OCR check button.
4. If OCR reads the handwriting correctly and the answer matches, the app speaks the word and advances.
5. If OCR fails, use rewrite, mark it wrong, or use the manual pass flow.
6. Open the parent screen with the default PIN `0000` to review manual-pass audit records.

The first OCR attempt may take time because the browser downloads the TrOCR model.

## Local Setup

This project is a static web app. No build step is required.

```powershell
cd web-prototype
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

The GitHub Pages version is served from the `docs/` directory. The source prototype lives in `web-prototype/`.

## Testing

A small Node-based smoke test suite checks the core game logic:

```powershell
cd web-prototype
node test-node.js
```

Current smoke coverage includes session start, progression, manual pass auditing, timeout penalties, history saving, wrong-answer handling, and missed-word practice.

## Technical Notes

- Frontend: plain HTML, CSS, and JavaScript.
- OCR: Transformers.js with `Xenova/trocr-small-handwritten`.
- Speech: browser `speechSynthesis`.
- Storage: browser `LocalStorage`.
- Deployment: GitHub Pages from `main` branch, `/docs` folder.

The browser OCR is only a prototype layer. The longer-term iPad app plan is to use native iPad handwriting capture and Apple Vision OCR for better real-device recognition.

## License

This project is released under the MIT License for the OpenAI Build Week submission.

## Build Week Notes

This project was built and debugged with Codex using GPT-5.6 during OpenAI Build Week.

Codex and GPT-5.6 were used to:

- Turn the initial learning concept into a detailed implementation specification.
- Compare web and iPad-native implementation tradeoffs.
- Inspect and debug the browser prototype.
- Fix the OCR runtime error caused by passing a canvas object directly into the Transformers.js image-to-text pipeline.
- Verify the fix locally and deploy the working prototype to GitHub Pages.
- Prepare this submission-oriented README.

The core product decisions were made around a specific learning behavior: students who cannot retain vocabulary by passively reading should be pushed into repeated handwritten production, with OCR feedback, pronunciation, timed sessions, and parent-reviewable accountability.

## Limitations

- Browser OCR accuracy is experimental and may misread handwriting.
- The displayed OCR confidence is a prototype value, not a calibrated model probability.
- LocalStorage data can be erased by clearing browser site data.
- The current vocabulary data is sample junior-high-level English vocabulary and should be replaced or expanded before real classroom use.
- The current UI is Japanese-first because the intended learners and parents are in Japan.

## Roadmap

- Replace the browser prototype with an iPad-native app.
- Use PencilKit or native handwriting capture for smoother Apple Pencil input.
- Evaluate Apple Vision OCR on real handwritten samples from the target age group.
- Expand the vocabulary list with source, grade level, and frequency metadata.
- Add better parent and teacher reporting.
- Improve OCR fallback handling and review workflows.
