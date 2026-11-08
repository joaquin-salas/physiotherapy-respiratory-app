import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/theme.dart';
import 'core/token_storage.dart';
import 'features/home/home_screen.dart';
import 'features/pairing/welcome_screen.dart';

void main() {
  runApp(const RespiraApp());
}

class RespiraApp extends StatelessWidget {
  const RespiraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Respira',
      theme: appTheme,
      // Spanish for Flutter's own texts too (screen reader labels, dialogs...)
      locale: const Locale('es'),
      supportedLocales: const [Locale('es')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: const StartScreen(),
    );
  }
}

/// Decides the first screen: home if this device is already connected, welcome otherwise
class StartScreen extends StatefulWidget {
  const StartScreen({super.key});

  @override
  State<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends State<StartScreen> {
  // Read once (not on every rebuild)
  final _token = TokenStorage().read();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String?>(
      future: _token,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        return snapshot.data == null
            ? const WelcomeScreen()
            : const HomeScreen();
      },
    );
  }
}
