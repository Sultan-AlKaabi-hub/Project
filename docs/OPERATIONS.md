# Rasid 0.2 deployment and operations

## Before deploying to the existing Render service

1. Confirm the service uses `Sultan-AlKaabi-hub/Project`. Never deploy this release to a personal/hobby repository.
2. Export a backup of the **current server's** `data/db.json` to private storage before any restart, plan change, or deployment. This file contains credential hashes and user information; never commit it or attach it to a public issue.
3. Confirm persistent storage. The repository's default `plan: free` is a demo configuration. Render's free filesystem loses runtime files on redeploy/restart, and free services do not support disks. See [Render free services](https://render.com/docs/free) and [persistent disks](https://render.com/docs/disks). A deployment requires an operator-approved persistent storage plan; this release does not purchase or provision one.
4. On a service with a persistent disk, mount it at `/var/data/rasid`, set `RASID_DATA_DIR=/var/data/rasid`, and restore the existing database there **before starting the new version**. Keep the original backup for rollback. Use one server instance; this JSON store does not support multiple writers or horizontal scaling.
5. Set `PUBLIC_ORIGIN=https://rasid-904v.onrender.com` (or the actual canonical HTTPS domain), `NODE_ENV=production`, and Node 24. Confirm the proxy forwards the correct public scheme. Changing the canonical domain may require users to enroll new passkeys.
6. Set `PRIVACY_OPERATOR`, `PRIVACY_CONTACT`, and `HOSTING_REGION` to accurate operator details. Review hosting/provider contracts, international transfers, retention and backup deletion, applicable school/children rules, and the institution's lawful basis. The included notice and controls support privacy operations; they are not a legal certification. Primary reference: [UAE Federal Decree-Law 45 of 2021](https://uaelegislation.gov.ae/en/legislations/1972).
7. For email recovery, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and, where required, `SMTP_USER` and `SMTP_PASSWORD`. Port 465 uses TLS; port 587 requires STARTTLS. Without SMTP, recovery clearly reports unavailable and directs users to passkeys or the administrator. No recovery codes are printed or returned by production APIs.
8. Keep the existing `ANTHROPIC_API_KEY` / `RASID_MODEL` configuration. Without a key, Faris still answers progress, booking, help, and course lookup questions locally. External AI answers need a valid provider key and available model.
9. Run `npm ci`, `npm test`, and `npm audit --omit=dev`. Deploy the reviewed commit only after the database is backed up and persistent storage is verified.
10. Sign in with the existing admin account. Check a student's existing progress, the live news feed, course lessons, a quiz, and passkey login on a real supported device. Verify that the privacy notice displays the configured details.

## Roles and enrollment

- Every registration is a **student**, regardless of supplied role fields. The privacy notice checkbox is required.
- On the first migration only, the pre-existing legacy administrator is preserved (matching `ADMIN_EMAIL`, or the original oldest account when no administrator email was configured). The migration does not reset PINs, passkeys, course progress, or certificates.
- On a fresh deployment, register the intended owner's account. Stop the server, run `npm run admin -- owner@example.com` against the same `RASID_DATA_DIR`, then restart it. This is an explicit operator-only bootstrap, not a public registration privilege.
- Admins use **People & progress** to change roles and assign students to teachers. Teachers can see only assigned students and themselves. Students can see only their own records. The last admin cannot be demoted or deleted.
- Demoting a teacher clears their student assignments. Demoting a staff member to student removes their future availability and cancels pending/approved hosted appointments.

## Bookings and alerts

1. Each teacher or admin publishes their own availability in **Calendar & bookings**, using UAE time (UTC+4), 15–120 minutes per appointment.
2. A user selects an available slot, enters a topic, and requests it. The status is **Awaiting approval**.
3. Only the named host approves or declines. An admin cannot approve on another teacher's behalf. Competing pending requests for an approved time are declined, and approved overlapping appointments are prevented.
4. The requester or host can cancel a future pending/approved booking. Availability with a pending/approved booking cannot be silently removed.
5. Users receive in-app alerts and can download an approved appointment as `.ics`. A downloaded calendar file is a snapshot: later cancellations are shown in Rasid and do not automatically remove an imported external calendar event.
6. Alerts are in-app only. This release does not configure SMS, push notifications, video calls, or email booking reminders.

## Privacy and voice

- **Privacy** provides a self-service JSON data export and requests for correction, restriction, withdrawal, deletion, or questions. Admins review these requests there and send a response. Mark a request resolved only after actually handling it; a response does not automatically restrict processing or delete data.
- **Settings** supports name correction and account deletion. Deletion removes the account and associated bookings, availability, sessions, challenges, messages sent by that account, reports, and privacy requests from the active database. The operator remains responsible for backup retention and deletion.
- API data and downloads are never cached by the service worker. Its new cache version removes old caches, including legacy cached account data.
- Passkeys require device user verification; the application stores public keys, not face/fingerprint images. Device testing is still required on iOS/Android hardware.
- Dictation requires browser support and microphone permission. The app discloses possible processing by the browser provider. Users review recognized text before sending it. Reading answers aloud is opt-in. No audio recordings are retained by Rasid.
- Private progress answers are generated from a server-filtered set of records and never sent to the external AI model. General course/article questions may use Anthropic. News reading context is held in memory for up to one hour and bounded to 500 readers; it is not a chat-history database.
- The sign-in QR links to the configured public origin. iOS installs through Safari → Share → Add to Home Screen. Android uses the browser's install option. The APK link is shown only if an operator has supplied a signed `rasid.apk` in the data directory. No APK or App Store package is included in this release.

## Verification and rollback

`npm test` covers role migration, authorization isolation, hostile chatbot requests, booking ownership/conflicts/transitions, calendar export, privacy access, deletion, same-origin protection, abuse limits, private-network URL blocking, placement, and quiz prerequisites/failure locks. Browser checks cover Arabic/English sign-in, install QR, admin pages, and responsive layout. Live SMTP/AI, live Render connectivity, microphone hardware, and biometric hardware need deployment/device verification.

If release verification fails, restore the previous code commit and the matching pre-deployment database backup during a maintenance window. Do not overwrite the live database while a process is running. Keep a private copy of post-deployment data so new progress can be reconciled before rollback.


## Learning Hub

The HR reference inspired learning operations rather than payroll or employment records. Existing news, courses, exams, appointments, alerts and privacy pages remain available.

- **Overview:** actual upcoming classes, attendance counts, pending absences and unread inbox messages. Empty states contain no fabricated students or attendance.
- **Timetable:** teachers schedule assigned students; admins schedule any students. UAE time is explicit. A class lasts 15 minutes to 8 hours. Overlaps with another class or an approved appointment are rejected; appointment approval also checks classes. Staff may cancel their own classes; admins may cancel any class.
- **Attendance:** students check in from 15 minutes before class until its end. Check-ins more than 15 minutes after the start are marked late. A student cannot overwrite a record. The host teacher or admin can correct records after the check-in window opens. Missing records are not automatically absence records. CSV exports respect the viewer's permissions and escape spreadsheet formulas.
- **Absence requests:** people submit their own dates and an optional note. Assigned teachers or admins approve or decline; nobody approves their own request. Approval is separate from recording attendance. Requesters may cancel their own pending/approved requests.
- **Inbox:** individual or multiple permitted recipients, normal/high/urgent priority, inbox/unread/important/sent filters, read status and in-app alerts. The feature does not send email or SMS. Students can contact their assigned teacher and admins, not other students. Teachers address their assigned students.
- **Groups:** admins create named groups from students already assigned to the selected teacher. Assignment changes remove invalid memberships. Groups organize the visible student roster; they do not grant extra access.
- **Resources:** users suggest HTTPS links; admins approve them before they appear to everyone. The server does not fetch user-submitted links. These links leave Rasid.
- **Directory:** name/email search and role/activity filters retain existing course progress and role assignment controls.
- Faris answers attendance, absence, timetable and inbox summary queries from server-filtered records. Account export includes the user's own hub records. Account deletion removes associated hub records from active storage.

## Render diagnosis, 16 September 2026

The dashboard and live site were reachable during verification. Logs showed successful `npm start`, port 10000 detection, and Live status. The service `rasid` was still building branch `main`, commit `b1616260350cdef1404b8862ae4ebb39a28a5d0d`; repeated manual deployments of that branch could not include PR #1. The free instance can sleep when idle, causing a slow first visit.

For the manual deployment requested by the owner:

1. Address the backup/persistent-storage steps above before redeploying an existing account database. The current Free instance has no durable disk.
2. Merge reviewed PR #1 into `main`, or set the service's build branch to `rasid-platform-upgrade`. Do not deploy an old `main` commit and expect the new features. Changing settings or merging can trigger auto-deploy; check the service's Auto-Deploy setting first if deployment must remain manual.
3. Use repository root, Node 24, build command `npm ci`, start command `npm start`, and health check `/healthz` **with this new release**. The old release uses `/api/status`; do not switch health checks before the new code is available.
4. Confirm `PUBLIC_ORIGIN=https://rasid-904v.onrender.com` and persistent `RASID_DATA_DIR` where provisioned, then choose Manual Deploy → Deploy latest commit. The blueprint includes the new build/health-check settings, but verify actual dashboard values after sync.
5. Wait for Live status, then open `/healthz` and the sign-in page. Hard refresh once if an older installed app shell remains. Check registration, roles, course progress, class scheduling and booking approvals with test accounts.

This release binds explicitly to `0.0.0.0`, serves a lightweight health endpoint, adds a visible bilingual initial loading/retry screen, bounds API waits, and refreshes the public shell cache. An application change cannot disable the hosting provider's free-instance sleep policy. No paid plan was purchased and no production deployment was triggered.
