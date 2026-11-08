import 'package:flutter/material.dart';

import '../../../core/screen_layout.dart';
import '../workout_steps.dart';

/// A 0–10 scale (Borg style) from green to red. Tapping a number answers.
class EffortScaleView extends StatelessWidget {
  const EffortScaleView({
    super.key,
    required this.question,
    required this.onAnswer,
  });

  final EffortQuestion question;
  final ValueChanged<int> onAnswer;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final title = switch (question) {
      EffortQuestion.effort => '¿Cómo de cansado/a se ha quedado?',
      EffortQuestion.breathlessness => '¿Cuánto le ha faltado el aire?',
    };

    return ScreenLayout(
      title: title,
      body: [
        Text('Toque un número.', style: textTheme.bodyLarge),
        const SizedBox(height: 8),
        Text('0 = nada   ·   10 = muchísimo', style: textTheme.bodyMedium),
        const SizedBox(height: 24),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          alignment: WrapAlignment.center,
          children: [
            for (var value = 0; value <= 10; value++)
              SizedBox.square(
                dimension: 80,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.square(80),
                    padding: EdgeInsets.zero,
                    backgroundColor: _colorFor(value),
                    foregroundColor: Colors.white,
                    textStyle: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  onPressed: () => onAnswer(value),
                  child: Text('$value'),
                ),
              ),
          ],
        ),
      ],
    );
  }

  /// Dark green (0) → dark red (10): white text stays readable on all of them
  static Color _colorFor(int value) =>
      Color.lerp(Colors.green.shade800, Colors.red.shade800, value / 10)!;
}
