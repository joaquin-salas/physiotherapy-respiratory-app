import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/screen_layout.dart';
import '../../core/token_storage.dart';
import '../pairing/welcome_screen.dart';

/// Home screen (placeholder): today's exercises will go here.
/// For now it checks with the API that the app is still connected.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _status = 'Comprobando la conexión…';

  @override
  void initState() {
    super.initState();
    _checkConnection();
  }

  Future<void> _checkConnection() async {
    try {
      await ApiClient().get('/auth/me');
      if (mounted) setState(() => _status = 'La app está conectada.');
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.status == 401) {
        // Disconnected by the physio, follow-up ended, or session expired
        await TokenStorage().delete();
        if (!mounted) return;
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (_) => const WelcomeScreen(
              notice:
                  'Esta app se ha desconectado. Necesitará una hoja de '
                  'conexión nueva: pídala a su fisioterapeuta.',
            ),
          ),
          (_) => false,
        );
      } else {
        setState(() {
          _status = e.isNetworkError
              ? 'Sin conexión a internet.'
              : 'No se pudo comprobar la conexión.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return ScreenLayout(
      title: 'Hoy',
      body: [
        Text(_status, style: textTheme.bodyLarge),
        const SizedBox(height: 16),
        Text(
          'Pronto verá aquí sus ejercicios del día.',
          style: textTheme.bodyLarge,
        ),
      ],
    );
  }
}
