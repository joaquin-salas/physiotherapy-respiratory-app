import { isDateOnly } from './date-only.js';

describe('isDateOnly', () => {
  it('accepts real YYYY-MM-DD dates only', () => {
    expect(isDateOnly('1950-03-15')).toBe(true);
    expect(isDateOnly('2024-02-29')).toBe(true); // leap year
    expect(isDateOnly('2026-02-30')).toBe(false);
    expect(isDateOnly('19500-03-15')).toBe(false);
    expect(isDateOnly('1950-03-15T10:00:00Z')).toBe(false);
  });
});
