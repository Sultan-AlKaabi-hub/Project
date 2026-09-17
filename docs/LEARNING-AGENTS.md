# Rasid Phase 1 — learning agents

## Current architecture and changes
Rasid remains an Express/Node application with a vanilla JavaScript SPA, bilingual curriculum, cookie authentication, server-side roles and subject permissions. Existing operations, bookings, exams, news, voice controls and animated navigation are preserved.

The new `server/agents/` registry routes tutor, practice, project, progress, approved-news research and existing platform-help requests. Obvious English/Arabic intents use deterministic rules. Manual selection is supported. Optional hosted classification is disabled by default. Future agents can extend the registry without replacing the website.

## Implementation sequence delivered
1. Inspected authentication, role boundaries, course progress, news pipeline and component conventions.
2. Added permission-filtered course retrieval and a provider boundary.
3. Added educational profiles, per-concept evidence, practice attempts and project milestones.
4. Added authenticated streaming endpoints and strict structured-question validation.
5. Connected lesson actions, compact assistant cards and the learning studio.
6. Added opt-in free device inference and local-only NewsAPI.
7. Tested authorization, bilingual routing, grading, memory, regression behavior and browser interactions.

## Files and boundaries
- `server/agents/knowledge.js`: bilingual TF-IDF/SVD latent semantic vectors and cosine retrieval. This is local LSA, not a neural embedding API. Lesson metadata includes course/module/lesson, title, difficulty, topic and content type; existing curriculum is the source of truth.
- `router.js`, `service.js`: intent routing, contextual tutor/project prompts, sources, server-owned result cards, existing permission-scoped operations and news lookup.
- `memory.js`, `practice.js`, `projects.js`: controlled memory, adaptive curated practice, evidence-based mastery and eight project templates with five milestones each.
- `provider.js`: generate/stream/embed/tool boundary; hosted generation requires explicit opt-in.
- `public/js/learning-ai.js`, `local-tutor.js`, `scripts/local-tutor-worker.js`: assistant integration, studio, safe rendering and optional WebGPU worker.
- `server/pipeline/newsapi.js`: server-only cached NewsAPI source alongside existing feeds.

## Data migration
An additive `db.aiLearning` version 1 namespace is initialized without modifying existing user passwords, roles, exams or course data. Collections are profiles, mastery, attempts, projects, conversations, activity and telemetry, keyed by authenticated user. Courses/modules/lessons reuse the curriculum. Projects and attempts have generated identifiers; records have relevant created/updated/graded timestamps. JSON maps provide direct user lookup; this is not a SQL migration.

The existing free Render filesystem is ephemeral. Accounts and learning records can reset after deployments/restarts. Durable multi-instance production use still requires a persistent database/storage service and a migration; this release does not silently purchase one.

## API
All `/api/agents` endpoints require authentication and AI-subject access:
- GET profile, export; POST profile, profile/reset, activity
- POST chat (SSE route/delta/result/error events)
- POST practice/:id/answer
- POST projects and projects/:id/milestones/:mid
- GET metrics (admin only)

Requests derive identity, skill level, completed lessons, quiz history, weak concepts and owned projects on the server. Lesson selections must match an accessible lesson. Model output cannot execute tools, code, database queries or change grades. News uses approved existing sources. Research results are publisher excerpts with dates and links, not guaranteed exhaustive current research.

## Free operation
No API key or paid plan is required for course retrieval, routing, curated adaptive quizzes, progress and projects. In the studio, learners can explicitly download Qwen3-0.6B via WebLLM. The model runs in a worker on their device. It needs WebGPU/shader-f16, approximately 1.4 GB GPU memory and a model download of hundreds of MB. It is off by default and per-tab; stop/cancel terminates the worker. Model assets can remain in browser storage. Unsupported devices retain course guidance.

A small device model is not equivalent to a frontier hosted model. Arabic and reasoning quality varies. Citations and course material remain available for verification. Generated device answers are not stored as raw server conversation history; optional server history retains its course-guided exchanges only. Do not enter secrets into chat. Local model context never goes to an inference provider.

`RASID_AGENT_PROVIDER=local` is the default. Optional future hosted usage requires BOTH `RASID_AGENT_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`, with an appropriate `RASID_AGENT_MODEL`; that can incur charges and is not enabled by this release.

NewsAPI uses `NEWSAPI_KEY` in ignored local `.env`; the supplied Developer key was successfully tested locally. `NEWSAPI_PRODUCTION_ALLOWED=false` keeps it disabled on Render. Existing RSS feeds remain the live news source. Never commit the key or embed it in a browser URL. NewsAPI's production allowance requires an appropriate plan, not simply changing this flag.

## Security and limits
- Authenticated subject-scoped APIs, per-user mutation limits, one server chat request per user, abort handling and safe error responses.
- Model instructions separate untrusted content. Models have no unrestricted tools or database access; strict schemas and DOM text rendering limit output impact.
- Chat history off by default; up to six exchanges, 24-hour retrieval expiry and periodic cleanup. Users can inspect/export/reset educational data separately from course exams.
- Telemetry stores agent/model, latency, usage, retrieval scores, tool names and error categories, not prompts or personal identifiers. Browser inference timing/tokens are not uploaded.
- Practice is not a formal exam. Advanced short answers use approximate keyword matching, which can miss valid paraphrases. Project milestone completion is self-reported; code is never executed here.
- Phase 1 is implemented; standalone code-review, simulation, path-planning and agent-builder products are future work, not placeholder buttons.

## Validation
23 automated tests pass, including 8 agent-specific tests and existing operations/auth/course regressions. Static worker build succeeds; npm audit reports zero vulnerabilities. Browser checks covered studio rendering, lesson practice and feedback, project creation, free-model download and actual generated English and Arabic lesson explanations. Arabic fallback was also checked; device quality remains variable.

Official references: https://webllm.mlc.ai/docs/ and https://newsapi.org/pricing
