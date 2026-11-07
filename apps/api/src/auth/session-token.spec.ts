import { hashPassword, verifyPassword } from './password.js';
import { generateToken, hashToken } from './session-token.js';

describe('session tokens', () => {
  it('generates long, unique tokens', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).toHaveLength(43);
    expect(a).not.toBe(b);
  });

  it('hashes the same token to the same value, and never returns the token itself', () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toContain(token);
  });
});

describe('passwords', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, 'correct horse')).toBe(true);
    expect(await verifyPassword(hash, 'wrong horse')).toBe(false);
  });
});
