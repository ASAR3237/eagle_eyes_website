# Advanced RPAS Course — Practice Quizzes

Self-graded practice quizzes for students in the Eagle Eyes **Advanced RPAS
Operators Course**. Students scan a QR code on a course slide and take a
short, mobile-friendly quiz that grades itself instantly and explains every
answer. No backend, no accounts — it's all static and runs in the browser.

Served at: **https://www.eagleeyessearch.com/advanced-quiz/**

## URLs

| URL | Shows |
|-----|-------|
| `/advanced-quiz/` | Menu of all quizzes |
| `/advanced-quiz/?q=airlaw` | Runs the Air Law quiz |

Quiz tags: `airlaw`, `systems`, `humanfactors`, `weather`, `navigation`,
`flightops`, `theoryofflight`, `radio`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Entry point — loads the engine |
| `app.js` | Quiz engine (reads `?q=` from the URL; menu when absent) |
| `quizzes.js` | **The content** — all questions live here |
| `style.css` | Mobile-first styling |
| `config.js` | `COURSE_NAME` + `BASE_URL` (used only by the QR generator) |

## Editing / adding quizzes

Edit `quizzes.js`. Each quiz is keyed by its URL tag:

```js
"radio": {
  title: "Section 8: Radiotelephony",
  description: "Radio certificate, phraseology, frequencies and emergency calls.",
  questions: [
    { q: "What does 'WILCO' mean?",
      options: ["Will comply", "Wait", "Say again", "Negative"],
      answer: 0,                       // 0-based index of the correct option
      explanation: "WILCO = 'will comply'." }
  ]
}
```

A new quiz appears on the menu automatically. Content is aligned to the
8 Transport Canada exam sections taught in the course deck.

## QR codes

The QR-code generator (`generate_qr.py`) and printable sheet live in the
authoring workspace, not in this repo. They build codes pointing at
`BASE_URL` in `config.js`. Re-run after adding a quiz to make a new code.

> Jekyll serves this folder's static files as-is (no front matter), so it
> deploys with the rest of the site on merge to `master`.
