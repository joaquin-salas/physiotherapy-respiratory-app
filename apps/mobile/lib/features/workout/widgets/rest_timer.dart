import 'package:flutter/material.dart';

import '../../../core/app_widgets.dart';
import '../../../core/screen_layout.dart';
import '../../../core/theme.dart';
import '../workout_steps.dart';
import 'countdown.dart';

/// Extra time each "30 segundos más" adds
const _extraSeconds = 30;

/// A rest with a countdown on a calm background. Moves on by itself, earlier
/// with "Seguir ya", or later with "30 segundos más" (WCAG 2.2.1: the patient
/// can always get more time).
class RestTimerView extends StatefulWidget {
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
  State<RestTimerView> createState() => _RestTimerViewState();
}

class _RestTimerViewState extends State<RestTimerView> {
  late int _seconds = widget.step.seconds;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final next = widget.step.next;
    final nextLine = next.line;
    final nextAmount = nextLine.durationSec != null
        ? '${nextLine.durationSec} segundos'
        : '${nextLine.reps} repeticiones';

    return ScreenLayout(
      onExit: widget.onExit,
      progress: StepProgress(
        'Ejercicio ${next.exerciseNumber} de ${next.exerciseCount}',
        current: 0,
        total: 0, // no segments on the rest screen
      ),
      background: AppColors.accent,
      centered: true,
      body: [
        Semantics(
          header: true,
          child: Text(
            'Descanse',
            textAlign: TextAlign.center,
            style: textTheme.headlineLarge?.copyWith(fontSize: 40),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Respire tranquilo.',
          textAlign: TextAlign.center,
          style: textTheme.bodyLarge,
        ),
        const SizedBox(height: 20),
        Countdown(
          seconds: _seconds,
          running: true,
          style: CountdownStyle.digits,
          onFinished: widget.onDone,
        ),
        const SizedBox(height: 20),
        Center(
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, 56),
              padding: const EdgeInsets.symmetric(horizontal: 22),
              shape: const StadiumBorder(),
              textStyle: const TextStyle(
                fontFamily: 'Figtree',
                fontSize: 22,
                fontWeight: FontWeight.w700,
              ),
            ),
            icon: const Icon(Icons.add_rounded, size: 26),
            label: const Text('30 segundos más'),
            onPressed: () => setState(() => _seconds += _extraSeconds),
          ),
        ),
        const SizedBox(height: 28),
        InfoCard(
          bordered: false,
          child: MergeSemantics(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Después',
                  style: textTheme.bodyMedium?.copyWith(
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  nextLine.exercise.name,
                  style: textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  'Serie ${next.set} de ${nextLine.sets} · $nextAmount',
                  style: textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ),
      ],
      buttons: [
        FilledButton(onPressed: widget.onDone, child: const Text('Seguir ya')),
      ],
    );
  }
}
