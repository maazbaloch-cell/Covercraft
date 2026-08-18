import jwt from "jsonwebtoken";

/**
 * Known weak/placeholder secrets that must never be used to sign real sessions.
 * The previously committed value ("MAAZ@1234maaz") is included so it can never silently work again.
 */
const WEAK_SECRETS = new Set([
  "MAAZ@1234maaz",
  "changeme",
  "secret",
  "your-jwt-secret",
  "generate-a-long-random-secret",
  "choose-any-random-string-here",
]);

const MIN_SECRET_LENGTH = 32;

/**
 * Returns the JWT signing secret, or throws a clear error if it is missing or too weak.
 * There is deliberately NO fallback secret — a misconfigured deployment must fail closed
 * rather than sign tokens with a guessable key.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Generate a random 32+ character secret and set it in the environment.");
  }
  if (secret.length < MIN_SECRET_LENGTH || WEAK_SECRETS.has(secret)) {
    throw new Error(
      `JWT_SECRET is too weak (needs ${MIN_SECRET_LENGTH}+ random characters). ` +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
    );
  }
  return secret;
}

/** True when a usable secret is configured — lets callers degrade gracefully with a 503 instead of a 500. */
export function isAuthConfigured(): boolean {
  try {
    getJwtSecret();
    return true;
  } catch {
    return false;
  }
}

export function signToken(payload: Record<string, unknown>, expiresIn: jwt.SignOptions["expiresIn"] = "7d"): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

/** Verifies the token signature + expiry. Returns null on any failure (missing secret, bad signature, expired). */
export function verifyToken<T>(token: string | undefined | null): T | null {
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret()) as T;
  } catch {
    return null;
  }
}
