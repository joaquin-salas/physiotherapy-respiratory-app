import { hash, verify } from '@node-rs/argon2';

// argon2id with the library defaults (19 MiB memory, 2 iterations), which match
// OWASP's recommendation. Slow on purpose, so stolen hashes are expensive to guess.

export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}
