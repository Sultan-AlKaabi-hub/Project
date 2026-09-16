# Campus dashboard and test accounts

The home screen opens role-specific cards. Click the Rasid logo to replay the intro without signing out. The scene combines generated pixel artwork with animated mist, birds, grass and a horse crossing the foreground; reduced-motion preferences are respected.

## People and subjects

The existing `sultan.3ami@gmail.com` account is preserved as an administrator with its credentials unchanged. This does not create a missing account. For a new database, use the operator bootstrap procedure in OPERATIONS.md after registering the owner.

Administrators open **User directory** to search and filter users, inspect progress, change roles, assign teachers and change teacher subjects. Students remain in AI. AI teachers see only their assigned AI students. Other subject teachers cannot access AI news, courses, grades or AI student records, including through the API or Faris.

The dashboard includes level and attendance doughnuts, fourteen-day attendance bars, module completion, enrollment counts and a late/absent attention table. Charts include text legends and data tables. Filters distinguish real accounts from fictional test accounts.

## Fictional test data

Production starts with 18 fictional Emirati-named students and six teachers across AI, mathematics, science, Arabic and English. There are two AI teachers; students are split between them. Example progress, classes, shifts, attendance and leave are explicitly marked as test data. Seeding is additive and runs once per persistent database. Existing users and learning data are retained.

Set `RASID_SEED_DEMO=0` to disable automatic seeding before initial startup. Local development can enable it with `RASID_SEED_DEMO=1`. Administrators can also use **Create sample accounts** in the directory.

As an administrator, click **Generate test sign-ins** in the directory to issue random passwords for the AI teacher, beginner/intermediate/expert students, and mathematics teacher. Copy them from the one-time dialog. Repeating the action replaces those five passwords and ends their sessions. There are no public default passwords; other sample accounts cannot sign in until an administrator explicitly provisions access. Local preview passwords do not apply to Render.

## Scheduling and coverage

Administrators edit teacher shifts in **Teachers & shifts**. Teachers organize classes and student attendance in **Classes & calendar** / **Learning hub**. Calendar dates and coverage use UAE time. Coverage checks the minimum concurrent number of rostered teachers throughout the 08:00–16:00 Monday–Friday window, subtracting approved leave. Each subject has a configurable minimum of at least one teacher. Weekends are not flagged.

Insufficient cover produces an in-app administrator alert, including when a partial-day leave creates a gap. The alert is deduplicated while the shortage remains unchanged. Sample rosters are explicitly identified in coverage alerts. These are in-app messages, not external email or SMS.

## Messages

Use **Messages & alerts** to send an individual or role/group announcement with normal, important or urgent priority. Staff can inspect read receipts for messages they sent. Students see their own inbox and can contact their assigned teacher or an administrator. Existing appointment approval, privacy and learning features remain available.

## Deployment

Deploy `main` from `Sultan-AlKaabi-hub/Project`. Run `npm ci`, `npm test`, then `npm start`; `/healthz` is the health-check endpoint. Preserve the database using the storage and backup procedure in OPERATIONS.md. A free Render filesystem cannot retain accounts, passwords or progress across redeploys. The sample-data marker is stored in that same database and will also reset if storage is lost.

## Owner recovery after fresh deployment

The live service is https://rasid-904v.onrender.com. The previous rasid-txh4 service was deleted.

A signed-in sultan.3ami@gmail.com account can use Settings → Restore administrator access with its private 256-bit recovery code. Only the SHA-256 digest is committed in server/owner-recovery.json; never commit or publish the private code. This recovery expires after seven days and can be used once per stored database. Failed attempts are limited to five per fifteen minutes; successful recovery ends other sessions for that account and preserves the existing password. Set OWNER_RECOVERY_DISABLED=1 to disable it early. To issue a replacement, generate a new random code and replace the id, digest and expiry; deliver the code privately to the owner. The operator bootstrap command remains available on hosts with shell access.

On a free Render instance the database is ephemeral. If the database is lost, register/sign in again before using recovery; the used-code marker is also lost, so the private code remains sensitive until its expiry. A persistent disk/database is required for lasting accounts and progress. Recovery does not solve data persistence.
