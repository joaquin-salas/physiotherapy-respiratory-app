import 'package:flutter/material.dart';

import '../../../core/screen_layout.dart';

/// End of the session: positive reinforcement
class WellDoneView extends StatelessWidget {
  const WellDoneView({super.key, required this.onFinish});

  final VoidCallback onFinish;

  @override
  Widget build(BuildContext context) {
    return ScreenLayout(
      title: '¡Muy bien!',
      body: [
        Icon(
          Icons.emoji_events,
          size: 120,
          color: Theme.of(context).colorScheme.primary,
        ),
        const SizedBox(height: 24),
        Text(
          'Ha completado su entreno de hoy. Cada día que entrena cuenta.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
      ],
      buttons: [
        FilledButton(
          onPressed: onFinish,
          child: const Text('Volver al inicio'),
        ),
      ],
    );
  }
}
