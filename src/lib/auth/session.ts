// OWNER: Builder A. Server only. Signed-in state lives in one encrypted, httpOnly cookie.
// No database: the GitHub user token is sealed with AES-256-GCM using SESSION_SECRET,
// so the browser can't read it and any tampering makes the cookie invalid.
import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const SESSION_COOKIE = "gd_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // GitHub App user tokens last 8 hours

const SessionSchema = z.object({
  token: z.string().min(1),
  login: z.string(),
  avatarUrl: z.string(),
  expiresAt: z.number(), // epoch ms
});
export type Session = z.infer<typeof SessionSchema>;

function keyFrom(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function sealSession(session: Session, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(secret), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

/** Returns the session, or null if the cookie is missing, tampered with, from another secret, or expired. */
export function unsealSession(sealed: string | undefined, secret: string, now = Date.now()): Session | null {
  if (!sealed) return null;
  try {
    const raw = Buffer.from(sealed, "base64url");
    if (raw.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", keyFrom(secret), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const session = SessionSchema.parse(JSON.parse(json));
    return session.expiresAt > now ? session : null;
  } catch {
    return null;
  }
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
