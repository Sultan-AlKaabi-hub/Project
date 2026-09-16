import crypto from "node:crypto";
import fs from "node:fs";

// This file contains only a SHA-256 digest. The random private code is delivered
// to the owner outside the repository and is never served or logged.
const recovery = JSON.parse(
  fs.readFileSync(new URL("./owner-recovery.json", import.meta.url), "utf8"),
);
export function ownerRecoveryAvailable(
  db,
  user,
  config = recovery,
  now = Date.now(),
) {
  return (
    process.env.OWNER_RECOVERY_DISABLED !== "1" &&
    user?.email === config.email &&
    user.role !== "admin" &&
    /^[a-f0-9]{64}$/.test(config.digest || "") &&
    now < Date.parse(config.expires) &&
    db.settings.ownerRecoveryUsed !== config.id
  );
}

export function installOwnerRecovery(
  app,
  { db, saveNow, requireUser, publicUser, config = recovery },
) {
  app.post("/api/auth/owner-recovery", requireUser, (req, res) => {
    if (!ownerRecoveryAvailable(db, req.user, config))
      return res.status(403).json({ error: "owner_recovery_unavailable" });
    const now = Date.now();
    let attempts = db.settings.ownerRecoveryAttempts;
    if (!attempts || attempts.until <= now)
      attempts = db.settings.ownerRecoveryAttempts = {
        count: 0,
        until: now + 15 * 60000,
      };
    if (attempts.count >= 5) {
      res.setHeader("Retry-After", Math.ceil((attempts.until - now) / 1000));
      return res.status(429).json({ error: "rate_limited" });
    }
    const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
    const supplied = crypto.createHash("sha256").update(code).digest();
    if (
      code.length > 128 ||
      !crypto.timingSafeEqual(supplied, Buffer.from(config.digest, "hex"))
    ) {
      attempts.count++;
      saveNow();
      return res.status(403).json({ error: "owner_recovery_invalid" });
    }
    req.user.role = "admin";
    delete req.user.teacherEmail;
    db.settings.ownerRecoveryUsed = config.id;
    delete db.settings.ownerRecoveryAttempts;
    // End any other sessions previously created with this account.
    for (const [id, session] of Object.entries(db.sessions))
      if (session.email === req.user.email && id !== req.cookies?.rasid)
        delete db.sessions[id];
    db.audit.push({
      at: now,
      actor: req.user.email,
      action: "owner_recovered",
      subject: req.user.email,
    });
    db.audit = db.audit.slice(-2000);
    saveNow();
    res.json({ user: publicUser(req.user) });
  });
}
