# راصد · Rasid

Arabic-first Progressive Web App that turns each day's AI news into short lessons at three levels
(Beginner, Intermediate, Expert), with a level-up quiz and **Faris (فارس)**, a pixel-wizard guide.
Nothing is written by hand: news, Arabic text, definitions and quiz questions are generated automatically.

## Run it

```bash
npm install
npm start
```

Open http://localhost:3000. New accounts are always students. On an existing database the legacy administrator is preserved once. On a fresh database, register the intended owner, stop the server, run `npm run admin -- owner@example.com`, then restart. See [deployment and operations](docs/OPERATIONS.md) before deploying to Render.

## Platform upgrade (0.2)

- Arabic/English sign-in in front of a coordinated pixel mountain valley, sun, and rider.
- Six-digit PIN or password, device-verified passkeys, and a bilingual privacy notice.
- Admin-managed roles and teacher assignments; role-filtered progress and scores in Faris.
- Month calendar, host-approved tuition/admin appointments, collision checks, calendar downloads, and in-app alerts.
- Optional voice dictation and read-aloud, plus QR installation instructions for iOS and Android.
- Data export, privacy requests, account deletion, private API cache protection, and regression tests (`npm test`).

The existing course, placement, quizzes, certificates, and live news remain. A signed Android APK must be supplied separately; home-screen installation is available without it.

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | **Recommended.** Claude (`claude-opus-5`) reads each full article and writes the Arabic article, the three lesson levels, and real exam questions about the content. Without it the app runs in **fallback mode**: it still reads the full article, but summaries are extractive, questions are fill-in-the-blank and statement-match built from the text, and Arabic comes from free translation services that are rate limited (lessons show English with a "translation pending" note until the daily catch-up pass fills them in). |
| `RASID_MODEL` | Override the Claude model id. |
| `ADMIN_EMAIL` | Legacy administrator migration / explicit bootstrap default. Public registrations always remain students. |
| `RASID_NO_UPDATE=1` | Skip the automatic update on start and the 06:00 daily job. |
| `RASID_DATA_DIR` | Runtime database / APK directory. Use a persistent mount in production. |
| `PUBLIC_ORIGIN` | Canonical HTTPS origin for passkeys, write protection, and installation QR. |
| `PRIVACY_OPERATOR`, `PRIVACY_CONTACT`, `HOSTING_REGION` | Accurate details displayed in the privacy notice. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASSWORD` | Email recovery delivery. Codes are never logged or returned by the API. |
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

## The learning path

The course lives in `data/curriculum/` (`beginner.js`, `intermediate.js`, `expert.js`), written in Arabic with an English twin, so lessons never depend on translation services. 20 modules, 60 lessons, 100 quiz questions.

| Level | Modules |
|---|---|
| Beginner | What is AI · Where AI is used (civilian and military) · Data and algorithms · Machine learning · Chatbots (ChatGPT, Claude, Gemini) · Safety and ethics |
| Intermediate | Neural networks · Computer vision · Large language models · Prompt engineering · Python for AI · Networks and APIs · BRD and SRS |
| Expert | Deep learning architectures (CNN, RNN, transformers) · AI agents · Robotics and autonomy · Math behind AI (discrete math, probability, linear algebra) · Algorithms, complexity and recursion · Military AI (US, Russia, China) · Evaluation, alignment and deployment |

1. **Placement.** Six questions drawn from all three levels, or "Start as Beginner". Levels below the placed level count as passed.
2. **Modules.** Each module has three lessons and a five-question quiz. Reading all three lessons unlocks the quiz; pass mark is 4 of 5.
3. **Fail.** The quiz locks until the module's lessons are reread. Unlimited attempts, new question draw each time.
4. **Level-up.** Passing every module in a level unlocks the next level. Expert completion ends the required quizzes.

The **Live News** screen is separate: real headlines from named sources with an in-app reader (Arabic by machine translation when the free services are available, English otherwise). Set `RASID_NEWS_LESSONS=1` to also generate news-based lessons daily (needs `ANTHROPIC_API_KEY` for good results).

## Install on a phone

- **Android:** Chrome shows an install prompt (Settings → Install). To ship an APK, build one with [PWABuilder](https://www.pwabuilder.com) from the deployed HTTPS URL and save it as `data/rasid.apk`; the app then serves it at `/apk`.
- **iPhone:** Safari → Share → Add to Home Screen.
- Passkeys (fingerprint / Face ID) require HTTPS in production; `localhost` works for development.

## Deploy the live app

GitHub Pages cannot host this app: it only serves static files, and Rasid has a Node server (accounts, database, live news reader, Faris). Deploy the server to a Node host instead. The fastest free option is Render:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Sultan-AlKaabi-hub/Project)

1. Click the button (or in Render: **New → Blueprint** and pick this repository). `render.yaml` already describes the service.
2. Add the environment variable `ANTHROPIC_API_KEY` (recommended) and, optionally, `ADMIN_EMAIL`.
3. Deploy. The app comes up at `https://rasid-904v.onrender.com` (Render adds a suffix if the name is taken). The GitHub Pages page at `sultan-alkaabi-hub.github.io/Project` redirects there.

Free-tier notes: the service sleeps after 15 minutes without traffic (first load takes about a minute), and there is no persistent disk, so `data/db.json` (accounts and progress) resets on each deploy. For real users pick a paid plan with a disk (see the comment in `render.yaml`), or any host with a volume: the `Dockerfile` works on Railway, Fly.io or a VPS with `docker run -p 3000:3000 -v rasid-data:/app/data rasid`.

Passkeys (fingerprint / Face ID) need HTTPS, which every host above provides.
