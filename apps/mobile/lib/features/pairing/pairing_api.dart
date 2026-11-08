import 'dart:io';

import '../../core/api_client.dart';
import '../../core/token_storage.dart';

/// Exchanges the code from the connection sheet for a session token and saves it.
/// Throws [ApiException] if the API refuses (see [pairingErrorMessage]).
Future<void> pairDevice(String code) async {
  final response = await ApiClient().post('/auth/pair', {
    'code': code,
    // Shown to the physio in the panel ("Conectada en Android")
    'deviceName': Platform.isIOS ? 'iPhone/iPad' : 'Android',
  });
  await TokenStorage().save(response['token'] as String);
}

/// Plain-language message for a failed pairing
String pairingErrorMessage(Object error) {
  if (error is ApiException) {
    if (error.isNetworkError) {
      return 'No hay conexión a internet. Compruébela e inténtelo de nuevo.';
    }
    if (error.status == 429) {
      return 'Demasiados intentos. Espere un minuto y vuelva a probar.';
    }
    if (error.status == 400) {
      return 'Este código ya no sirve. Pida una hoja nueva a su fisioterapeuta.';
    }
  }
  return 'Algo ha fallado. Inténtelo de nuevo dentro de un rato.';
}
