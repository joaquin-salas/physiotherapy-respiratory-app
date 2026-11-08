import 'package:flutter/material.dart';

import '../../../core/screen_layout.dart';

/// A risky answer in the safety check: no training today.
/// (Alerting the physio comes with saving workouts to the API.)
class StopTodayView extends StatelessWidget {
  const StopTodayView({super.key, required this.onFinish});

  final VoidCallback onFinish;

  @override
  Widget build(BuildContext context) {
    return ScreenLayout(
      title: 'Hoy mejor no entrene',
      body: [
        Icon(Icons.bed, size: 120, color: Colors.orange.shade900),
        const SizedBox(height: 24),
        Text(
          'Descanse hoy. Si no se encuentra mejor, llame a su equipo de '
          'fisioterapia.',
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
