# Learning experience update

The AI discovery lab adds animated breadth-first and depth-first search, a live classification threshold experiment, and five server-graded practice questions: ordering, short answers and calculations. A written reflection is saved for self-review; it is not automatically graded. Practice does not replace the existing course exams or award certificates.

English and Arabic sample classes, locations, groups, announcements and appointment topics follow the selected language. User-written messages are preserved as written. Sample appointments and announcements are fictional, clearly labeled, internal records. Each appointment still requires its host's approval. Existing data is retained by additive, idempotent seeding.

Faris offers optional dictation, read-aloud, voice selection, speed and automatic reading of replies. Speech recognition depends on browser support; speech synthesis depends on installed voices for the selected language. If an Arabic or English voice is unavailable, the panel explains this and keeps text interaction available. Dictation is reviewed before sending. Rasid does not store microphone recordings; the browser's speech provider may process audio, as explained by the consent notice.

The subtle pointer spotlight adapts the React Bits SpotlightCard approach for this application's existing JavaScript frontend. Source: https://github.com/DavidHDev/react-bits/tree/main/src/content/Components/SpotlightCard. The upstream license is retained in REACT-BITS-LICENSE.md. Motion respects reduced-motion preferences and is cleaned up between views.

Administrators can generate five local-to-that-deployment test sign-ins: an AI teacher, beginner/intermediate/expert students, and a mathematics teacher. Only assigned AI learners are visible to the AI teacher; the mathematics teacher cannot access AI course data or the lab. Passwords are generated on demand, never committed, and shown once. Generating them again invalidates the previous test passwords and sessions.

Validation: 11 automated tests cover permissions, booking lifecycle, translation and seeding, grading, traversal, metrics, owner recovery and existing course behavior. Browser review covered desktop and mobile, English and Arabic, student learning, teacher directory and appointment approval, and administrator sections. Actual microphone capture and audible playback require a supported device and were not hardware-tested.


## Compact navigation and conversation

CardNav adapts the user-supplied React Bits CardNav source into the existing native JavaScript router, with locally bundled GSAP. Source: https://reactbits.dev/components/card-nav. The upstream MIT + Commons Clause notice remains in REACT-BITS-LICENSE.md. This is an application integration, not a standalone component distribution. Three colored groups retain existing role-filtered routes, unread counts, keyboard buttons, Escape and outside-click closing, inert collapsed links, responsive scrolling and reduced-motion support.

Faris keeps language, read/stop, microphone and send controls visible. Voice choice, speed and automatic reading live in the gear panel. Question text determines English/Arabic reply language without changing account language or server-side permissions; the chat language toggle sets microphone recognition language. Dictation is not simultaneous bilingual recognition. Installed device voices and browser recognition support are still required; audio hardware was not tested.

The shorter translucent sign-in card keeps privacy/install links visible and places passkey/recovery help in a disclosure. Desktop (1440×900) and narrow mobile (387×632) layouts were inspected in Arabic and English; the intro leaves the foreground cart unobstructed. Long mobile registration forms remain scrollable. All 15 regression tests passed, including cross-language chat checks. No browser console errors were observed.
