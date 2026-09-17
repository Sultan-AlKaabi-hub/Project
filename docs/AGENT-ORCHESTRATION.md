# Rasid AI — agent upgrade and review record

Date: 17 September 2026. Target repository: Sultan-AlKaabi-hub/Project. Reference repositories were read-only; no changes, pushes or moves were made to Sultan-AlKaabi-hub/app.

## What to open

- AI Workshop → Developer debug view (administrator only). Run a question and expand its trace. Compare three learner levels uses isolated learner states and leaves actual accounts unchanged.
- AI Workshop → Knowledge library: five concept primers at your level and ten attributed source-study notes.
- AI Workshop → Books, robots & neural networks → Book vision → Scan with camera.
- `/offline.html`: public neural-network lesson, real XOR training, optional local notebook, English/Arabic. It works after its assets have been cached during an online visit.
- New account → optional Google Authenticator setup or Skip for now → optional device passkey setup.

## Implemented architecture

Authenticated learner → structured action / intent router → AgentContext → mastery and prerequisite inspection → bounded course retrieval → teaching strategy → role-specific response → structured cards / stream → trace.

Context includes current lesson, permitted passages, learner level, goals, educational evidence, active project, consent-controlled recent interactions, and a validated selected passage. Learner identity and mastery come from server state. Public knowledge and private records remain separate.

Retrieval uses local bilingual TF-IDF/SVD latent semantic vectors plus lexical, lesson, concept and level signals. It is an economical statistical retrieval model, not a frontier embedding service. Responses to five core concepts have substantive foundation/application/advanced variants. Other supported topics use retrieved excerpts and the optional model. Unsupported queries abstain. This is bounded orchestration, not an unrestricted autonomous tool-using LLM.

Mastery includes score, confidence, distinct questions, recency and recent trend. Repeating the same question does not manufacture confidence. Reading is not mastery. New curated diagnostics cover missing RAG evidence, ranking failure, pipeline ordering, embedding similarity, neural generalization and tool authorization.

## Agent status

| Mode | Working behavior | Limit |
|---|---|---|
| Tutor | Grounded retrieval, level/evidence adaptation, analogy/example/diagnostic strategies | Broad free-form generation needs optional device model or configured provider |
| Practice | Existing adaptive lesson questions plus curated concept diagnostics; feedback and evidence | Short-answer keyword rubrics are approximate; formal exams separate |
| Project Coach | Saved milestones, attempts, hints and optional generated review | Completion self-reported; no server execution |
| Code Review | Static risk patterns, affected line, Problem/Why/Fix/Example/Concept | Not a comprehensive compiler or security audit |
| Learning Path | Permitted lessons ranked by goals, weakness and study time | Rule-based recommendations |
| Socratic Tutor | Guided-question teaching mode | Mode within Tutor, not a separate process |
| Research | Approved current news sources and citations | No unrestricted browsing; free NewsAPI remains development-only |
| Progress Coach | Educational evidence and next steps; admin records remain authorized | Attendance trend is a cautious extrapolation, not a reliable forecast |
| Simulation | Bounded CTO role-play and evidence checklist | Local feedback uses explicit patterns; no invented quality grade |
| Agent Builder | Saved role and permitted course-search configuration | No arbitrary database, shell, browser or API access |

No paid service was activated. Optional Qwen3-0.6B runs on compatible devices and has material reasoning/Arabic quality limits. The deterministic fallback remains available without model downloads.

## Ten product review passes

| Pass | Finding | Improvement and verification |
|---|---|---|
| 1 Routing | Translated button text was interpreted as an open-ended prompt | Typed action intents; manual mode preserved; bilingual route tests |
| 2 Retrieval | Entire lessons obscured useful evidence | Small scored chunks, source metadata and usable source links; unsupported-query tests |
| 3 Personalization | Learner state did not sufficiently change teaching | Five concepts × three learner states; all three outputs differ; confidence/prerequisite tests |
| 4 Memory | Repetition could repeat the same explanation | Consent-controlled history changes strategy; explicit safe concept continuity without raw chat retention |
| 5 Practice | RAG primers did not have focused practical assessment | Six curated diagnostics, including ordered steps; server-side answer keys and misconception feedback |
| 6 Debugging | Metrics showed counts without the decision chain | Admin trace, sanitized opt-in content, tool outcomes, comparison UI, separate client-reported generation |
| 7 References | Reading repositories alone does not help learners | Ten original bilingual attributed notes, pinned source URLs, two PDF-derived notes, knowledge-library UI |
| 8 Navigation | Workshops were spread across multiple menu entries | One AI Workshop tab and home card; existing labs retained with cross-navigation; mobile overflow check |
| 9 Signup security | Authenticator setup was available only in Settings | Optional setup/skip after account creation; PIN reauthentication and live TOTP confirmation remain mandatory |
| 10 Offline and release | Cached shell still depended on account APIs | Public offline lesson and actual local training; server-stopped reload test; fixed connection wording and consent toggle |

## Verification

81 automated tests passed, including 31 new orchestration tests (with multiple learner-state scenarios per test). All 47 application/agent JavaScript modules passed syntax checks. Production dependency audit reported zero vulnerabilities. Static build completed and generated the five-page site-guide PDF; first and last pages visually checked.

Browser checks: actual administrator trace produced all requested fields; comparison UI showed 3/3 distinct RAG responses; unified navigation and workshop cards rendered; phone-width layout measured 375px with no horizontal overflow; offline page reloaded with local server stopped and trained from loss 0.7044 to 0.0158 at 500 epochs; Arabic switched successfully while disconnected from server.

Existing regression tests cover roles, cross-user isolation, persistent storage, owner account, passkey signatures, TOTP replay/enrollment, OTP purpose binding, CAPTCHA fail-closed behavior, bookings, attendance, scanner ISBN validation, robotics and neural-network training. A real phone biometric scan, SMS/email delivery, device-model download and microphone hardware were not repeated in this release. Those depend on hardware or configured services; tests are not a substitute for that verification.

## Data and deployment

No SQL migration is required: the private Supabase-backed application snapshot gains bounded `aiLearning.traces` and additional mastery fields. Traces expire from views at 24 hours, are periodically purged, and are removed with learning-profile/account deletion. Detailed text is retained only for an explicit administrator debug run. Normal chat content is omitted. No hidden chain-of-thought is collected.

Offline notebooks are device-local and do not synchronize or count as graded progress. Public app assets refresh on reconnect; personal API responses are never stored in the shared service-worker cache.

Deployment verification is recorded in the release summary after GitHub/Render complete.

## Reference review scope

I used ten focused review lenses for each of the ten requested repositories: roles, context, retrieval, memory, tools, evaluation, security, failure handling, interaction/output, and licensing/deployment. This was a review of relevant selected documentation/source excerpts, not ten complete reads of every file in these large repositories. Absence of a topic in a selected source is recorded as a limit rather than invented evidence. No downloaded code was executed.

### FoundationAgents/MetaGPT

Pinned commit: `11cdf466d042aece04fc6cfd13b28e1a70341b1f`. Repository license metadata: MIT.

[Reviewed source](https://github.com/FoundationAgents/MetaGPT/blob/11cdf466d042aece04fc6cfd13b28e1a70341b1f/docs/resources/workspace/search_algorithm_framework/resources/data_api_design.pdf)

Applied teaching note: **Search systems: recall, ranking and feedback**. Separate query understanding, candidate retrieval and ranking. A search result should retain its document identity and relevance score. Diagnose a missing document separately from a badly ranked document. In the workshop, inspect the retrieved chunk IDs and score components before changing the tutor prompt. PDF page 1.

### shubhamsaboo/awesome-llm-apps

Pinned commit: `f163bb5a92111cee4610ac98e5dce4c6a2a09c26`. Repository license metadata: Apache-2.0.

[Reviewed source](https://github.com/shubhamsaboo/awesome-llm-apps/blob/f163bb5a92111cee4610ac98e5dce4c6a2a09c26/rag_tutorials/rag_failure_diagnostics_clinic/README.md)

Applied teaching note: **Diagnosing RAG failures**. A wrong answer can come from missing chunks, stale indexes, route errors, weak grounding or mixed user state. Use a small failure taxonomy and inspect one stage at a time. Compare the same question across learner states and distinguish retrieval relevance from answer correctness.

### kyrolabs/awesome-agents

Pinned commit: `134954da7cfe4e35eafc063b118aa15e3b108824`. Repository license metadata: not specified.

[Reviewed source](https://github.com/kyrolabs/awesome-agents/blob/134954da7cfe4e35eafc063b118aa15e3b108824/README.md)

Applied teaching note: **Choosing an agent framework**. An agent catalogue is a discovery resource, not evidence that every listed tool is secure or suitable. Compare role orchestration, evaluation support, observability, local inference and maintenance. In Rasid, the learning modes share one context pipeline and one trace interface instead of unrelated chatbot implementations.

### firecrawl/firecrawl

Pinned commit: `f6774139f3d395905c4ad7982d06e984d88f6078`. Repository license metadata: AGPL-3.0.

[Reviewed source](https://github.com/firecrawl/firecrawl/blob/f6774139f3d395905c4ad7982d06e984d88f6078/apps/api/src/scraper/scrapeURL/README.md)

Applied teaching note: **Extraction is a pipeline with failure states**. Web extraction can try supported engines and finish with an explicit failure when none succeeds. Keep retrieval status separate from empty content. Preserve source URLs and freshness metadata; do not treat arbitrary page instructions as commands. Rasid uses curated references and existing approved news fetches, not unrestricted crawling.

### deepseek-ai/deepseek-harness

Pinned commit: `0d1f50007f9bca3f52b06e1c3074fa14d5fb0720`. Repository license metadata: MIT.

[Reviewed source](https://github.com/deepseek-ai/deepseek-harness/blob/0d1f50007f9bca3f52b06e1c3074fa14d5fb0720/.agents/notes/implemented/architecture/2026-07-20-canonical-tool-output-contract.md)

Applied teaching note: **Observable tool contracts**. A tool should produce a validated result with an explicit success or failure state. Render the interface from that result rather than parsing prose for identifiers. Keep context assembly distinct from execution. Rasid records tool names, status, retrieval IDs, teaching decisions and the final response for explicit administrator debug runs.

### langchain-ai/langchain

Pinned commit: `5c1f28271295bb13034f4cf8964f74c117357d40`. Repository license metadata: MIT.

[Reviewed source](https://github.com/langchain-ai/langchain/blob/5c1f28271295bb13034f4cf8964f74c117357d40/openwiki/tools.md)

Applied teaching note: **Schema-aware tools**. Tools need names, documented arguments, validation and controlled error handling. Inject authenticated identity on the server rather than letting a model choose an account. A provider abstraction lets the application change models while preserving its tool and permission contracts.

### browser-use/browser-use

Pinned commit: `d8110c5ff87ccba887aaa726cdb780f2f84bef8d`. Repository license metadata: MIT.

[Reviewed source](https://github.com/browser-use/browser-use/blob/d8110c5ff87ccba887aaa726cdb780f2f84bef8d/browser_use/agent/system_prompts/system_prompt.md)

Applied teaching note: **Observe, act, verify**. Interactive agents should inspect the current state, perform a bounded action, and verify the result before continuing. Detect unproductive loops and stop instead of repeating blindly. Rasid applies the same idea to repeated learning questions: change the teaching strategy and eventually ask a diagnostic question. It does not give learner agents browser control.

### infiniflow/ragflow

Pinned commit: `03ca271f73de507e1dff531ec72c8ad8f05d4a4c`. Repository license metadata: Apache-2.0.

[Reviewed source](https://github.com/infiniflow/ragflow/blob/03ca271f73de507e1dff531ec72c8ad8f05d4a4c/docs/basics/agent_context_engine.md)

Applied teaching note: **Context engineering for a learning agent**. Useful context combines relevant knowledge, controlled memory and only the tools needed for the task. Keep public course knowledge separate from private learner evidence. Retrieve compact passages with metadata instead of sending every document. Context quality and model capability are different constraints.

### dair-ai/Prompt-Engineering-Guide

Pinned commit: `57673726396dd94acb23bdb1e67f27c78ee85a8e`. Repository license metadata: MIT.

[Reviewed source](https://github.com/dair-ai/Prompt-Engineering-Guide/blob/57673726396dd94acb23bdb1e67f27c78ee85a8e/lecture/Prompt-Engineering-Lecture-Elvis.pdf)

Applied teaching note: **Instructions, context and examples**. A prompt can separate instructions, context, input and requested output (lecture page 8). Examples help specify the task (page 20), but do not prove correctness. Untrusted content can contain prompt injection (pages 42–43). Use evaluation cases and server-enforced boundaries rather than relying only on a stronger prompt.

### microsoft/ai-agents-for-beginners

Pinned commit: `25b7985f3b2dc37a84f4a7387ccd3c9f0e5b1595`. Repository license metadata: MIT.

[Reviewed source](https://github.com/microsoft/ai-agents-for-beginners/blob/25b7985f3b2dc37a84f4a7387ccd3c9f0e5b1595/12-context-engineering/README.md)

Applied teaching note: **Select, compress and isolate context**. Context engineering manages changing knowledge, preferences, tools and conversation history over time. Select what is relevant, compress it, and isolate conflicting or untrusted material. Watch for poisoned, distracting or contradictory context. In a learning platform, completed reading, practice evidence and conversation history have different meanings and retention needs.

### Read-only Spine comparison

Otto's source and knowledge-base PDF show a compact bilingual answer style, direct answers from real shelf data, actionable navigation and clear offline limitations. Rasid retains its own product facts and authorized records; Spine's account-free storage claims were not imported as Rasid facts. The downloaded student-management DOCX was not indexed because it is not authoritative Rasid course content. No relevant PowerPoint deck was found among the selected material. The DAIR lecture was read for prompt structure, examples and injection limits (pages 8, 20, 42–43); MetaGPT's search-design PDF contributed the query/recall/ranking separation (page 1). PDFs were summarized with citations, not bulk copied.
