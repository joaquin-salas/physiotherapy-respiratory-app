import 'package:flutter/material.dart';

import '../../../core/screen_layout.dart';
import '../workout_steps.dart';
import 'countdown.dart';

/// A rest with a countdown; moves on by itself, or earlier with "Seguir ya"
class RestTimerView extends StatelessWidget {
  const RestTimerView({
    super.key,
    required this.step,
    required this.onDone,
    required this.onExit,
  });

  final RestStep step;
  final VoidCallback onDone;
  final VoidCallback onExit;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final next = step.next;
    return ScreenLayout(
      onExit: onExit,
      title: 'Descanse',
      body: [
        Countdown(seconds: step.seconds, running: true, onFinished: onDone),
        const SizedBox(height: 32),
        Text('Después:', style: textTheme.bodyMedium),
        Text(
          '${next.line.exercise.name} · Serie ${next.set} de ${next.line.sets}',
          style: textTheme.bodyLarge,
        ),
      ],
      buttons: [
        OutlinedButton(onPressed: onDone, child: const Text('Seguir ya')),
      ],
    );
  }
}
