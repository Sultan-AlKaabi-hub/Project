# Rasid AI — 35 focused review passes

17 September 2026. This ledger records ten identity/animation passes followed by twenty-five usability and engineering passes. Each row has an implemented improvement and its verification. These are focused reviews, not a claim that every feature was exhaustively tested 35 times.

## First ten: identity and the moving workshop

| Pass | Finding → improvement | Verification |
|---|---|---|
| 01 | Generic dots → original circuit-compass A mark and Rasid AI wordmark. | Browser inspection in English and Arabic; vector favicon inspected in source. |
| 02 | News-only positioning → “Turn curiosity into capability” / “حوّل فضولك إلى قدرات” with bilingual learning copy. | Both intro language variants rendered. |
| 03 | Rider alone → visible wheeled cart with computer, keyboard, server rack and towing shaft. | Phone intro visual inspection; scene paint regression test. |
| 04 | Static props → rotating brass wheel spokes and subtle chassis bounce. | Animation source review plus moving/still scene tests. |
| 05 | Unclear AI theme → three server blades, vents, activity indicators, network diagram and signal mast. | Phone scene inspection; lights use gentle changes rather than strobing. |
| 06 | Flat foreground → stronger mist and a restrained warm/cool atmospheric overlay. | Phone and desktop scene composition review. |
| 07 | Only an OS motion setting → visible bilingual Pause motion / Play scene control. | Button toggled; rider coordinate remained 179 while paused; pressed state checked. |
| 08 | Unbounded animation work → roughly 30-fps paint budget, visibility suspension and listener cleanup. | Tests cover skipped frames, hidden tabs, resume, unmount and reduced motion. This is a scheduling bound, not a physical-device FPS benchmark. |
| 09 | Small headline/card → balanced type, stronger hierarchy, wider desktop card and a focused primary action. | Rendered intro reviewed at desktop and phone widths. |
| 10 | Cart below short-screen fold → viewport-height mobile scene with a more compact intro card. | 390×844 phone review; narrow layout checked at 320×568. |

## Twenty-five follow-up passes

| Pass | Finding → improvement | Verification |
|---|---|---|
| 11 | Repetitive navigation for keyboard users → bilingual Skip to content link. | Rendered link targets focusable main content. |
| 12 | Route changes lack context → main-content focus and aria-current on active navigation. | Browser active-element and navigation-state inspection. |
| 13 | Mobile drawer keyboard escape unclear → Escape closes drawer, returns focus; Tab cycles within its controls. | Escape returned focus to menu-btn and aria-expanded became false. Tab-boundary logic reviewed. |
| 14 | Off-screen navigation can receive focus → inert closed mobile sidebar with expanded/control labels. | Mobile inert attribute and open/closed states inspected; desktop remains available. |
| 15 | Compact controls difficult to tap → minimum 44px buttons across primary, tab and voice controls. | Styles inspected and representative mobile controls checked. |
| 16 | Small form text can trigger mobile zoom → consistent 16px editable field text. | Computed sign-in input sizes are 16px at 320px viewport. |
| 17 | Heavy soft shadows and weak visual hierarchy → warm-paper/deep-teal palette, restrained borders/shadows and stronger focus rings. | Dashboard and mobile lab visual inspection. No universal WCAG conformance claim. |
| 18 | Wide tables lack a keyboard path → labeled focusable scroll regions, overflow hints, column scopes and alternating rows. | Teacher/admin table regions inspected; tablet pages stay within viewport. |
| 19 | Course cards overflow small screens → width-aware grid minimums and responsive headings. | Before: body 318px in 305px content viewport. After: body 305px; no horizontal page overflow. |
| 20 | Waiting/error screens lack recovery → loading status, aria-busy, inline error and Try again action. | Route sweep completed; recovery branch and escaped error content reviewed in code. |
| 21 | Password entry lacks inspection/duplicate-submit feedback → Show/Hide button and busy submission lock. | Password input toggled text/password; busy state and finally cleanup reviewed. |
| 22 | Network events rerender forms → non-destructive offline/reconnected status without navigating away. | Event handlers reviewed: no go() call, form contents stay mounted. |
| 23 | Toasts are visual only → polite atomic status announcements. | Generated toast uses role=status and aria-live=polite. |
| 24 | Email keyboards/autofill inconsistent → email autocomplete, no capitalization/spellcheck, LTR email direction. | Rendered autocomplete=email verified; CSS direction reviewed. |
| 25 | Assistant identity can imply certainty → concise bilingual AI-guide label with a course-verification cue. | Faris panel rendered with guidance above its reply. |
| 26 | Blank opening and difficult first prompt → welcome fallback and editable BFS/DFS/booking prompts. | Prompt populated the composer and returned a grounded answer; comparison regression tests cover both languages. |
| 27 | Pending replies cannot be stopped → Cancel reply, request cancellation on close/sign-out, timeout and HTTP failure handling. | Abort/version guards and error branch reviewed; successful reply tested in browser. |
| 28 | Mixed Arabic/English text direction awkward → auto-direction replies and plaintext bidi isolation. | Arabic lab/intro and English Faris panel inspected; direction attributes checked. |
| 29 | Home-screen icon still shows old mascot → matching circuit-compass PNG icons and updated PWA identity; landscape orientation allowed. | Icon generation succeeds for 192/512/maskable sizes; manifest parses. |
| 30 | Font/hero connections start late → font-origin preconnect, priority landscape preload and asynchronous image decode. | Head resource hints and scene image attributes checked. No unmeasured loading-speed claim. |
| 31 | Missing offline JavaScript can receive HTML → HTML fallback only for navigations; failed assets return a network error. | Service-worker regression verifies scripts, navigation fallback and untouched personal API requests. |
| 32 | Practice gives no completion feedback → live answered-count and progress indicator. | Entering an Arabic answer changed 0/5 to 1/5. |
| 33 | Reordering gives no assistive feedback → current order announced after each move. | Moving A announced “A, D, E, C, B” in the Arabic interface. |
| 34 | One algorithm animation speed → Slow, Steady and Fast playback pace. | Arabic pace selector changed to Fast; next-step behavior remained correct. |
| 35 | Teachers/admins labeled Beginner in sidebar → actual role plus role-based workspace label. | Teacher and Administrator labels checked in browser; learner levels remain intact. |

## Broader verification

- Automated suite: 15 tests, including existing registration/permissions, booking lifecycle, owner recovery, curriculum, localization and sample-data behavior, plus animation/cache/chatbot regressions.
- API matrix: all three student levels see only their own learner record; the AI teacher sees nine assigned students; the mathematics teacher sees none and receives 403 for course/lab APIs.
- Browser: student course, lab, progress, calendar, learning hub, alerts, privacy and messages at 320px; teacher directory, charts, shifts, bookings and messages at 768px; English/Arabic intro and lab at phone width; administrator dashboard at desktop width.
- Final administrator sweep opened course, lab, progress, calendar, learning hub, privacy, administration, shifts, directory, messages and settings without a page-error state. Browser console inspection returned no errors during this review.
- Review found and fixed the small-screen course overflow, an empty first Faris greeting and an incomplete BFS-versus-DFS response.
- Physical iOS/Android devices, microphone capture and audible playback were not tested. Dark-mode overrides were code-reviewed; an OS dark-mode visual session was not run. Browser layout checks do not establish field Core Web Vitals.
- Hosting remains the existing free Render service. Its local-file database is ephemeral; durable production accounts/progress still require persistent storage. This update does not purchase or silently upgrade hosting.

## Official guidance consulted

- [Apple — Motion](https://developer.apple.com/design/human-interface-guidelines/motion): purposeful motion and reduced-motion behavior informed the scene controls.
- [Google/web.dev — High-performance CSS animations](https://web.dev/articles/animations-guide): transform/opacity motion and avoiding unnecessary rendering work informed animation cleanup and restrained effects.
- [NVIDIA — Assess, Parallelize, Optimize, Deploy](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/#assess-parallelize-optimize-deploy): adapted the assess/measure/optimize/recheck discipline. Rasid is not a CUDA application and does not claim NVIDIA acceleration.
- [OpenAI — Safety best practices](https://developers.openai.com/api/docs/guides/safety-best-practices): clear limitations and human verification informed the assistant guidance and regression checks.
- [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents): simplicity, transparency and careful interface design informed editable prompts and cancellable responses.
- [Meta — Building greater accessibility into Facebook.com](https://engineering.fb.com/2020/07/30/web/facebook-com-accessibility/): contextual keyboard behavior and semantic structure informed navigation and table improvements.

These sources inform engineering choices; no endorsement, certification or claim of implementing every vendor recommendation is implied.
