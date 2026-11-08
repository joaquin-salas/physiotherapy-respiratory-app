import 'package:flutter_test/flutter_test.dart';
import 'package:respira_app/features/pairing/pairing_code.dart';

void main() {
  test('reads the code inside the QR of the connection sheet', () {
    expect(parsePairingCode('respira://pair?code=K7QM4XPT9W'), 'K7QM4XPT9W');
  });

  test('accepts the code typed as printed, in any case', () {
    expect(parsePairingCode('K7QM4-XPT9W'), 'K7QM4XPT9W');
    expect(parsePairingCode(' k7qm4 xpt9w '), 'K7QM4XPT9W');
  });

  test('rejects other QR codes and malformed codes', () {
    expect(parsePairingCode('https://example.com/?code=K7QM4XPT9W'), isNull);
    expect(parsePairingCode('respira://other?code=K7QM4XPT9W'), isNull);
    expect(parsePairingCode('K7QM4XPT9'), isNull); // too short
    expect(parsePairingCode('O7QM4XPT9W'), isNull); // O is never used
    expect(parsePairingCode(''), isNull);
  });
}
