// Run on the server against the same persistent data directory, after registration.
import { load, saveNow } from "../server/db.js";
import { migrateRoles } from "../server/portal.js";
const email = (process.argv[2] || process.env.ADMIN_EMAIL || "")
  .trim()
  .toLowerCase();
const db = load();
migrateRoles(db);
if (!email || !db.users[email]) {
  console.error(
    "Register the intended account first, then run: npm run admin -- owner@example.com",
  );
  process.exit(1);
}
db.users[email].role = "admin";
saveNow();
console.log(
  `Administrator assigned: ${email}. Restart the running service to reload this change.`,
);
