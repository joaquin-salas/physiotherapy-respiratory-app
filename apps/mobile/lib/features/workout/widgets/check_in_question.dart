import 'package:flutter/material.dart';

import '../../../core/screen_layout.dart';
import '../../../core/theme.dart';
import '../workout_steps.dart';

/// One question of the safety check, answered with "Sí" or "No". Both buttons
/// look the same, so neither answer is nudged.
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
    const answerStyle = TextStyle(
      fontFamily: 'Figtree',
      fontSize: 28,
      fontWeight: FontWeight.w700,
    );
    return ScreenLayout(
      onExit: onExit,
      progress: StepProgress(
        'Pregunta ${step.number} de ${step.total}',
        current: step.number,
        total: step.total,
      ),
      centered: true,
      body: [
        Text(
          'Antes de empezar',
          style: textTheme.bodyLarge?.copyWith(color: AppColors.textMuted),
        ),
        const SizedBox(height: 16),
        Semantics(
          header: true,
          child: Text(
            step.question.text,
            style: textTheme.headlineLarge?.copyWith(fontSize: 40),
          ),
        ),
      ],
      buttons: [
        OutlinedButton(
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(80),
            textStyle: answerStyle,
            side: const BorderSide(color: AppColors.primary, width: 3),
          ),
          onPressed: () => onAnswer(true),
          child: const Text('Sí'),
        ),
        OutlinedButton(
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(80),
            textStyle: answerStyle,
            side: const BorderSide(color: AppColors.primary, width: 3),
          ),
          onPressed: () => onAnswer(false),
          child: const Text('No'),
        ),
      ],
    );
  }
}
