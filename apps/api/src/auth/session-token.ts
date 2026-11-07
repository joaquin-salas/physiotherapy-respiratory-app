import { createHash, randomBytes } from 'node:crypto';

/** A new random session token (32 bytes = 43 characters). Only the client keeps it. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * What we store in the database instead of the token.
 * A fast hash is enough here: the token is random, so it can't be guessed
 * (unlike passwords, which need the slow argon2).
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
