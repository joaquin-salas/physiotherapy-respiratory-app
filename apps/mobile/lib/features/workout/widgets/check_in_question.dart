import 'package:flutter/material.dart';

import '../../../core/screen_layout.dart';
import '../workout_steps.dart';

/// One question of the safety check, answered with "Sí" or "No"
class CheckInQuestionView extends StatelessWidget {
  const CheckInQuestionView({
    super.key,
    required this.step,
    required this.onAnswer,
    required this.onExit,
  });

  final CheckInStep step;

  /// true = "Sí"
  final ValueChanged<bool> onAnswer;
  final VoidCallback onExit;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return ScreenLayout(
      onExit: onExit,
      title: 'Antes de empezar',
      body: [
        Text(
          'Pregunta ${step.number} de ${step.total}',
          style: textTheme.bodyMedium,
        ),
        const SizedBox(height: 24),
        Text(step.question.text, style: textTheme.headlineMedium),
      ],
      buttons: [
        OutlinedButton(
          onPressed: () => onAnswer(true),
          child: const Text('Sí'),
        ),
        OutlinedButton(
          onPressed: () => onAnswer(false),
          child: const Text('No'),
        ),
      ],
    );
  }
}
