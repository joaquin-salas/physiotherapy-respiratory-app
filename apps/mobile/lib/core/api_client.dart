import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';
import 'token_storage.dart';

/// An error from the API. [status] is the HTTP status, or 0 when the API couldn't
/// be reached at all (no internet, server down).
class ApiException implements Exception {
  ApiException(this.status, this.message);

  final int status;
  final String message;

  bool get isNetworkError => status == 0;

  @override
  String toString() => 'ApiException($status): $message';
}

/// The only place in the app that talks HTTP (same rule as the web panel's api-client.ts).
/// Sends the saved session token as `Authorization: Bearer <token>`.
class ApiClient {
  ApiClient({http.Client? httpClient, TokenStorage? tokenStorage})
    : _http = httpClient ?? http.Client(),
      _tokens = tokenStorage ?? TokenStorage();

  final http.Client _http;
  final TokenStorage _tokens;

  Future<Map<String, dynamic>> get(String path) =>
      _send(() async => _http.get(_url(path), headers: await _headers()));

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) =>
      _send(
        () async => _http.post(
          _url(path),
          headers: await _headers(),
          body: jsonEncode(body),
        ),
      );

  Uri _url(String path) => Uri.parse('$apiBaseUrl$path');

  Future<Map<String, String>> _headers() async {
    final token = await _tokens.read();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> _send(
    Future<http.Response> Function() request,
  ) async {
    final http.Response response;
    try {
      response = await request().timeout(const Duration(seconds: 15));
    } catch (e) {
      // No connection, DNS failure, timeout...
      throw ApiException(0, e.toString());
    }

    final body = response.body.isEmpty ? null : jsonDecode(response.body);
    if (response.statusCode >= 400) {
      // NestJS errors look like { "message": "..." } or { "message": ["...", "..."] }
      final message = body is Map ? body['message'] : null;
      throw ApiException(
        response.statusCode,
        message is List ? message.join(', ') : '${message ?? 'Error'}',
      );
    }
    return body is Map<String, dynamic> ? body : {};
  }
}
