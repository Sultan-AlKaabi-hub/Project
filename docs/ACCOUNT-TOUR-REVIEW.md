# Account, guided-tour and presentation-readiness review

Reviewed 17 September 2026.

## Changes

- New registration requires a password: 8–128 characters, uppercase, lowercase, number and special character. Control characters and common password patterns are rejected on server and client.
- Six-digit PIN enrollment is optional and stored as a separate salted scrypt hash. It can be removed in Settings. Password-based reauthentication controls security changes; login MFA remains in the login pipeline for PINs too.
- Existing accounts retain their current login and receive a password-setup prompt. Their owner chooses the new password. Updated credentials revoke other sessions; password recovery clears the optional PIN.
- Authenticated credential changes have per-account failed-attempt throttling in addition to API limits. Authenticator-enabled users supply a fresh code for credential changes.
- Bilingual Settings now offers an automatic role-aware tour with 15-second steps, pause/resume, back/next/finish, Escape and close.
- Settings displays a server-generated public installation QR, destination link and accurate Android/iPhone instructions. Unavailable QR requests have an offline fallback message.
- The chatbot's site-guide knowledge and generated PDF explain the updated policy, tour and installation path.
- README rewritten around current features, agent strengths/limits, deployment, storage, privacy, tests and a screenshot gallery. No credentials in public documentation.

## Verification

- 84 tests passed: new password boundary/policy tests, client/server parity, mandatory signup password, PIN add/remove and login, password-only security reauthentication, session revocation and installation QR, plus existing authorization, persistence, MFA, agent, booking, scanner and algorithm regressions.
- Static build generated browser bundles and the five-page site-guide PDF. Production dependency audit: zero reported vulnerabilities.
- Primary desktop navigation opened Home, AI learning studio, Course, Site guide/PDF, Live news, Learning hub, Course progress, Calendar/bookings, Messages/alerts, Administration, Teachers/shifts, User directory and Privacy without page-load errors. No captured console errors during that pass.
- Administrator tour completed all nine steps; automatic advancement, pause, next and finish verified on phone-width layout. Arabic Settings rendered translated password guidance, tour and installation instructions.
- Workshop entry points and code-review feedback inspected. A sample HTML-injection pattern produced Problem/Why/Fix/Example/Concept feedback. Actual XOR training changed loss from 0.7044 to 0.5667 after 100 epochs.
- Public screenshots capture real local-preview pages and fictional dashboard records, not live personal records. Full-page stitching artifacts were avoided by using viewport captures.

## Practical limits

This is a scoped regression and presentation-readiness check, not a security certification or proof that every possible interaction works. Real phone biometric enrollment, microphone input, physical barcode scanning and external OTP delivery require the intended devices/services. CAPTCHA and delivery-provider availability are shown in Settings. Free local AI is bounded and is not equivalent to a frontier hosted model. Legacy users must choose their own password through the upgrade form.

GitHub and Render release verification is reported separately after deployment; local tests alone do not establish live deployment status.
