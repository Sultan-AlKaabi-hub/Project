# راصد · Rasid

Arabic-first Progressive Web App that turns each day's AI news into short lessons at three levels
(Beginner, Intermediate, Expert), with a level-up quiz and **Faris (فارس)**, a pixel-wizard guide.
Nothing is written by hand: news, Arabic text, definitions and quiz questions are generated automatically.

## Run it

```bash
npm install
npm start
```

Open http://localhost:3000. The first account created becomes the admin (or set `ADMIN_EMAIL`).

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | **Recommended.** Claude (`claude-opus-5`) reads each full article and writes the Arabic article, the three lesson levels, and real exam questions about the content. Without it the app runs in **fallback mode**: it still reads the full article, but summaries are extractive, questions are fill-in-the-blank and statement-match built from the text, and Arabic comes from free translation services that are rate limited (lessons show English with a "translation pending" note until the daily catch-up pass fills them in). |
| `RASID_MODEL` | Override the Claude model id. |
| `ADMIN_EMAIL` | Which account sees the "Update news now" button. |
| `RASID_NO_UPDATE=1` | Skip the automatic update on start and the 06:00 daily job. |
| `RASID_DEV_SHOW_CODES=1` | Return the PIN-reset code in the API response (development only; otherwise it is printed in the server log because no mail server is configured). |
| `PORT` | Default 3000. |

Manual content update from the terminal:

```bash
npm run update
```

## What is in the box

| Path | Purpose |
|---|---|
| `server/index.js` | Express API, static PWA, daily cron (06:00), admin update |
| `server/auth.js` | Email + 6-digit PIN (scrypt), sessions, Google Authenticator (TOTP), passkeys (fingerprint / Face ID via WebAuthn) |
| `server/pipeline/fetchNews.js` | Live headlines per category from Google News search feeds plus direct RSS (MIT Technology Review, The Verge, VentureBeat, Defense One, Breaking Defense, DefenseScoop, Moscow Times, SCMP, Euractiv, Al Jazeera, Arab News) |
| `server/pipeline/article.js` | Decodes Google News links, fetches the real article page, extracts the main text and lead image, free English→Arabic translation with caching and back-off |
| `server/pipeline/wikipedia.js` | One-line definitions, Arabic Wikipedia first, English fallback |
| `server/pipeline/generate.js` | Claude structured-output generation of the three levels + questions; automatic fallback |
| `server/pipeline/run.js` | Orchestrates an update and picks the 5 required lessons per level (one per category) |
| `server/faris.js` | Faris (the wizard) answers only from today's lessons (Claude when available, keyword match otherwise) |
| `data/db.json` | The JSON database (users, lessons, progress). Created on first run. |
| `data/seed.json` | Five example lessons shown until the first live update succeeds |
| `public/` | The PWA: `index.html`, `css/app.css`, `js/app.js`, `js/faris.js`, `js/i18n.js`, `sw.js`, `manifest.webmanifest`, icons |

## The learning loop

1. **Welcome and sign in.** Arabic by default, English switch. Email + 6-digit PIN. Optional two-step code and fingerprint/face.
2. **Placement.** Six questions (two per level) or "Start as Beginner". 0–2 correct → Beginner, 3–4 → Intermediate, 5–6 → Expert.
3. **Learn.** Five required lessons, one per category. "Got it" appears only at the end of a lesson.
4. **Level-up quiz.** Five questions, one per required lesson, pass at 4. No timer.
5. **Result.** Pass: next level saved. Fail: review shows the correct answers; "Try again" unlocks only after every linked lesson is reread.

## Install on a phone

- **Android:** Chrome shows an install prompt (Settings → Install). To ship an APK, build one with [PWABuilder](https://www.pwabuilder.com) from the deployed HTTPS URL and save it as `data/rasid.apk`; the app then serves it at `/apk`.
- **iPhone:** Safari → Share → Add to Home Screen.
- Passkeys (fingerprint / Face ID) require HTTPS in production; `localhost` works for development.

## Deploy

Any Node host works (Render, Railway, Fly, a VPS). Set the environment variables above, keep `data/` on persistent storage, and serve over HTTPS.
