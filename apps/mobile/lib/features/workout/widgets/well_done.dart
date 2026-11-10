import 'package:flutter/material.dart';

import '../../../core/app_widgets.dart';
import '../../../core/screen_layout.dart';
import '../../../core/theme.dart';

/// End of the session: positive reinforcement and a short summary.
/// TODO(workout log): nothing is sent to the physio yet; the text already says
/// so because the app isn't in production.
class WellDoneView extends StatelessWidget {
  const WellDoneView({
    super.key,
    required this.exercises,
    required this.minutes,
    required this.onFinish,
  });

  final int exercises;
  final int minutes;
  final VoidCallback onFinish;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return ScreenLayout(
      centered: true,
      body: [
        const IconBadge(
          icon: Icons.check_rounded,
          background: AppColors.primary,
          color: Colors.white,
        ),
        const SizedBox(height: 24),
        Semantics(
          header: true,
          child: Text(
            '¡Muy bien!',
            textAlign: TextAlign.center,
            style: textTheme.headlineLarge?.copyWith(fontSize: 44),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Ha terminado el entreno de hoy.',
          textAlign: TextAlign.center,
          style: textTheme.bodyLarge?.copyWith(fontSize: 24),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: _Stat(
                value: exercises,
                unit: exercises == 1 ? 'ejercicio' : 'ejercicios',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _Stat(
                value: minutes,
                unit: minutes == 1 ? 'minuto' : 'minutos',
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text(
          'Su fisioterapeuta verá cómo le ha ido.',
          textAlign: TextAlign.center,
          style: textTheme.bodyLarge?.copyWith(color: AppColors.textMuted),
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

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.unit});

  final int value;
  final String unit;

  @override
  Widget build(BuildContext context) {
    return MergeSemantics(
      child: InfoCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$value',
              style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800),
            ),
            Text(unit, style: const TextStyle(fontSize: 20)),
          ],
        ),
      ),
    );
  }
}
