import 'package:flutter/material.dart';

import '../../core/screen_layout.dart';
import '../today/today_screen.dart';

/// Shown once, right after pairing succeeds
class ConnectedScreen extends StatelessWidget {
  const ConnectedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenLayout(
      title: '¡Listo!',
      body: [
        Icon(
          Icons.check_circle,
          size: 120,
          color: Theme.of(context).colorScheme.primary,
        ),
        const SizedBox(height: 24),
        Text(
          'La app ya está conectada. Ya no necesita la hoja de conexión.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
      ],
      buttons: [
        FilledButton(
          child: const Text('Empezar'),
          onPressed: () => Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const TodayScreen()),
            (_) => false,
          ),
        ),
      ],
    );
  }
}

/// Goes to [ConnectedScreen], removing the pairing screens from the back stack
void goToConnected(BuildContext context) {
  Navigator.of(context).pushAndRemoveUntil(
    MaterialPageRoute(builder: (_) => const ConnectedScreen()),
    (_) => false,
  );
}
