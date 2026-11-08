import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Keeps the session token the API gave this device when it was paired.
/// Stored encrypted by the system: Android Keystore / iOS Keychain.
class TokenStorage {
  static const _key = 'session_token';
  static const _storage = FlutterSecureStorage();

  Future<String?> read() => _storage.read(key: _key);

  Future<void> save(String token) => _storage.write(key: _key, value: token);

  Future<void> delete() => _storage.delete(key: _key);
}
