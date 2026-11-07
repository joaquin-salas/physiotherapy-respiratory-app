import {
  isValidNationalId,
  isValidSpanishPhone,
  normalizeNationalId,
  normalizePhone,
} from './patient-validation.js';

describe('phone numbers', () => {
  it.each(['600123456', '+34 600 12 34 56', '0034-912-345-678', '812345678'])(
    'accepts %s',
    (phone) => expect(isValidSpanishPhone(phone)).toBe(true),
  );

  it.each(['12345', '500123456', '6001234567', '+44 7700 900123', 'abc'])(
    'rejects %s',
    (phone) => expect(isValidSpanishPhone(phone)).toBe(false),
  );

  it('normalizes to 9 digits', () => {
    expect(normalizePhone('+34 600-12 34 56')).toBe('600123456');
  });
});

describe('DNI/NIE', () => {
  it.each(['12345678Z', '12345678-z', ' 00000000T ', 'X1234567L', 'Y1234567X'])(
    'accepts %s',
    (id) => expect(isValidNationalId(id)).toBe(true),
  );

  it.each(['12345678A', '1234567Z', 'X1234567A', 'W1234567L', '123456789'])(
    'rejects %s (wrong shape or control letter)',
    (id) => expect(isValidNationalId(id)).toBe(false),
  );

  it('normalizes to uppercase without separators', () => {
    expect(normalizeNationalId(' 12345678-z ')).toBe('12345678Z');
  });
});
