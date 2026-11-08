import 'package:flutter/material.dart';

import '../../core/screen_layout.dart';
import 'scan_screen.dart';
import 'type_code_screen.dart';

/// First screen when the app isn't connected yet: the patient finds the connection
/// sheet in the equipment bag and scans it (or types the code).
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key, this.notice});

  /// Optional message on top, e.g. when the physio disconnected the app
  final String? notice;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return ScreenLayout(
      title: 'Bienvenido/a',
      body: [
        if (notice != null) ...[
          Text(
            notice!,
            style: textTheme.bodyLarge?.copyWith(color: Colors.red.shade900),
          ),
          const SizedBox(height: 24),
        ],
        Text(
          'Para empezar, busque en la bolsa la hoja de conexión que le dio '
          'su fisioterapeuta.',
          style: textTheme.bodyLarge,
        ),
      ],
      buttons: [
        FilledButton.icon(
          icon: const Icon(Icons.qr_code_scanner, size: 32),
          label: const Text('Escanear código'),
          onPressed: () =>
              Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => const ScanScreen())),
        ),
        OutlinedButton.icon(
          icon: const Icon(Icons.keyboard, size: 32),
          label: const Text('Escribir el código'),
          onPressed: () => Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => const TypeCodeScreen())),
        ),
      ],
    );
  }
}
