/// Pairing codes come from the printed connection sheet, either inside its QR
/// (`respira://pair?code=K7QM4XPT9W`) or typed by the patient ("k7qm4-xpt9w").
/// Same rules as the API (apps/api/src/auth/pairing-code.ts): 10 characters,
/// no lookalikes (0/O, 1/I/L).
final _codePattern = RegExp(r'^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{10}$');

/// Returns the canonical code, or null if [input] isn't one of our codes.
String? parsePairingCode(String input) {
  var text = input.trim();

  // The QR holds a link: take the code out of it. Any other QR is not ours.
  if (text.contains('://')) {
    final uri = Uri.tryParse(text);
    if (uri == null || uri.scheme != 'respira' || uri.host != 'pair') {
      return null;
    }
    text = uri.queryParameters['code'] ?? '';
  }

  final code = text.toUpperCase().replaceAll(RegExp(r'[\s-]'), '');
  return _codePattern.hasMatch(code) ? code : null;
}
