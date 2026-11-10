import 'package:flutter/material.dart';

import '../../../core/screen_layout.dart';
import '../../../core/theme.dart';
import '../workout_steps.dart';

/// Words next to some numbers of the 0–10 scale
const _labels = {
  0: 'Nada',
  2: 'Poco',
  5: 'Bastante',
  7: 'Mucho',
  10: 'Muchísimo',
};

/// Number boxes get darker as the number grows (a change in lightness, not
/// only in hue, so it reads without colour vision); white text from 6 up
const _fills = [
  Color(0xFFEAF2F0),
  Color(0xFFDCEAE7),
  Color(0xFFC9DFDB),
  Color(0xFFB3D1CC),
  Color(0xFF9BC1BB),
  Color(0xFF7FAEA8),
  Color(0xFF437E79),
  Color(0xFF2F6A66),
  Color(0xFF265F62),
  AppColors.primary,
  AppColors.primaryDark,
];

/// The 0–10 scale at the end of the session: one tall row per number, each
/// with its number and, for some, a word.
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
    final (number, title) = switch (question) {
      EffortQuestion.effort => (1, '¿Cómo de cansado/a se ha quedado?'),
      EffortQuestion.breathlessness => (2, '¿Cuánto le ha faltado el aire?'),
    };

    return ScreenLayout(
      progress: StepProgress(
        'Para terminar · $number de 2',
        current: number,
        total: 2,
      ),
      body: [
        Semantics(
          header: true,
          child: Text(title, style: textTheme.headlineMedium),
        ),
        const SizedBox(height: 8),
        Text('Toque un número.', style: textTheme.bodyLarge),
        const SizedBox(height: 16),
        for (var value = 0; value <= 10; value++) ...[
          if (value > 0) const SizedBox(height: 6),
          _ScaleRow(value: value, onTap: () => onAnswer(value)),
        ],
      ],
    );
  }
}

class _ScaleRow extends StatelessWidget {
  const _ScaleRow({required this.value, required this.onTap});

  final int value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final label = _labels[value];
    return Semantics(
      button: true,
      label: label == null ? '$value' : '$value, ${label.toLowerCase()}',
      child: ExcludeSemantics(
        child: Material(
          color: AppColors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: const BorderSide(color: AppColors.border, width: 2),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 56),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(6, 6, 12, 6),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 42,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: _fills[value],
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$value',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: value >= 6 ? Colors.white : AppColors.text,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    if (label != null)
                      Expanded(
                        child: Text(
                          label,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
