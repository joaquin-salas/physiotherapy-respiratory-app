import { generatePairingCode, normalizePairingCode } from './pairing-code.js';

describe('pairing codes', () => {
  it('generates 10 unambiguous characters, different every time', () => {
    const codes = new Set(Array.from({ length: 50 }, generatePairingCode));
    expect(codes.size).toBe(50);
    for (const code of codes) {
      expect(code).toMatch(/^[A-HJKMNP-Z2-9]{10}$/);
    }
  });

  it('accepts the code as printed or typed', () => {
    expect(normalizePairingCode('K7QM4-XPT9W')).toBe('K7QM4XPT9W');
    expect(normalizePairingCode(' k7qm4 xpt9w ')).toBe('K7QM4XPT9W');
  });

  it('rejects anything that cannot be a code', () => {
    expect(normalizePairingCode('')).toBeNull();
    expect(normalizePairingCode('K7QM4XPT9')).toBeNull(); // too short
    expect(normalizePairingCode('K7QM4XPT9WW')).toBeNull(); // too long
    expect(normalizePairingCode('O7QM4XPT9W')).toBeNull(); // O is not used
    expect(normalizePairingCode('respira://pair?code=K7QM4XPT9W')).toBeNull();
  });
});
