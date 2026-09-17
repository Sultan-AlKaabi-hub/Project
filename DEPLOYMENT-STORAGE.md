# Durable storage and device sign-in

Run one Rasid web instance. Without Supabase, JSON storage is local and ephemeral on Render's free filesystem. With Supabase configured, startup reads the durable snapshot and JSON mutation responses wait for a serialized revision-checked save. A conflicting writer or failed save returns 503 and fails health checks; correct the cause and restart, rather than overwriting newer data.

1. Create a dedicated free Supabase project. Keep RLS enabled and automatic table exposure disabled.
2. Run migrations/001-supabase-state.sql in its SQL editor.
3. In Render environment, configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (secret API key or legacy service_role key, never publishable/anon). Do not put this key in frontend code or GitHub.
4. Set PUBLIC_ORIGIN to the exact live HTTPS origin. Preserve the same domain for passkeys.
5. Configure the private RASID_OWNER_PIN_HASH separately for the permanent owner. No usable credential is included in this repository.
6. Deploy and verify /healthz, sign in, save a test workspace, restart/redeploy, and confirm that it remains. When the remote table is empty, the current local state is imported on startup. Existing remote state always wins. Back up existing data before switching environments; this does not migrate another running server's memory.

The compatible initial schema stores one application snapshot. It is appropriate for the existing single-process app, not horizontal scaling. Split into normalized tables and transactions before running multiple web instances or growing beyond a small campus.

Passkey enrollment is optional after signup and in Settings. The operating system selects Face ID, Touch ID, supported Android biometrics or screen lock. Raw face/fingerprint data is never collected. Physical device prompts need a real device verification; automated tests verify signed assertions, origin, replay protection and challenge isolation.

The vision workshop applies image filters locally and uses synthetic entry signals. Learner code runs in an opaque-origin iframe worker, with network blocked by CSP and a 1.2-second timeout. It is not a real identity verification system or a production door controller.

The PDF is generated at build time from data/knowledge/site-guide.js, also used by role-filtered chatbot navigation and the bilingual guide. Update that source when features change. Generated PDFs contain instructions, never user records.
