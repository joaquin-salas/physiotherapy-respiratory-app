import { randomInt } from 'node:crypto';

/**
 * Characters used in pairing codes. Lookalikes are left out (0/O, 1/I/L) because
 * patients may have to type the code from the printed sheet.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTH = 10;
const CODE_PATTERN = new RegExp(`^[${ALPHABET}]{${LENGTH}}$`);

/**
 * A new random pairing code, e.g. "K7QM4XPT9W".
 * 31^10 ≈ 8·10^14 combinations: a code lives 30 days, so it must be long enough
 * that guessing one (5 attempts per minute per IP) is hopeless.
 */
export function generatePairingCode(): string {
  let code = '';
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

/**
 * Turns what the app sends into the canonical code: uppercase, without the spaces
 * or dash the sheet shows ("k7qm4-xpt9w" → "K7QM4XPT9W"). Returns null if it can't be a code.
 */
export function normalizePairingCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, '');
  return CODE_PATTERN.test(code) ? code : null;
}
