# Training presentations and conversational tutoring

The 2026-09-18 import contains 11 user-supplied PowerPoint decks, 193 physical slides and 192 slides with extractable text. Physical slide order is used for citations, because printed slide numbers occasionally differ. Slide 5 of the advanced-agents deck contains no extractable text and is explicitly marked; visual-only information is not invented.

## Sources and teaching aids

- `data/knowledge/presentation-slides.json`: original slide text, source filenames, source language and SHA-256 fingerprints. No local filesystem paths, speaker notes or original binary decks are published.
- `presentations.js`: bounded groups of slides for retrieval, preserving source and slide metadata.
- `presentation-teaching.js`: 11 original bilingual teaching aids with worked examples, level-specific explanations and questions. These illustrative examples are not campus records.
- `presentation-practice.js`: 11 separate practice questions, with server-side answer keys and explanations.

All content is available to authenticated AI learners through **AI Workshop → Knowledge library**. Search filters both notes and slide text. Assistant citations open the relevant presentation and physical slide. Source-language slide text is labelled; bilingual teaching aids are separate, not falsely labelled translations of the entire source.

Training decks are untrusted reference data. They cannot grant tool permission, change roles or access private records. Reviewed notes qualify overstatements in the slides: POST is not encryption; server-code secrecy depends on deployment; transfer learning has no guaranteed sample count; training can happen in multiple stages; parallelism does not promise fixed cost or latency savings. Historical service and product claims must not be treated as current guarantees.

## Chat and providers

The chat keeps up to 24 displayed turns in tab memory, clearing them when hidden for sign-out/intro or when the learner starts a new conversation. Up to three recent educational exchanges can accompany a request; server-side validation bounds them, treats them as untrusted conversation, and redacts credential patterns. Private-record/support answers are excluded from this context. Persistent chat memory remains opt-in.

The user's Anthropic adapter upgrades (cached prompts, real message turns, task effort, retries) and Arabic-aware retrieval/routing are preserved. Tutor, project and lab agents use the configured server provider; generation failure leaves clearly labelled course guidance. An enabled device model is only a fallback when no server-generated answer was returned.

Device cancellation interrupts inference without terminating the loaded worker. Recoverable generation errors keep it enabled; loading failures and device-memory/device-loss errors stop it and permit retry. Context sent to the small device model is bounded. Reloading a page still requires enabling its per-tab worker again; cached weights can be reused. Hardware compatibility is not guaranteed.

## Verification

Regression tests cover preserved routing and retrieval, bilingual examples, all deck/slide metadata, practice ownership and answer-key isolation, the lab-provider path, and device cancellation with a mock worker. Browser verification covers transcript rendering, follow-up questions, slide navigation and mobile layout. GPU inference needs a supported device and a completed model download; a mock test does not establish performance on every device.
