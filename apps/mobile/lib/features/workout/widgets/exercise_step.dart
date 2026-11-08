import 'package:flutter/material.dart';

import '../../../core/screen_layout.dart';
import '../workout_steps.dart';
import 'countdown.dart';

/// One set of an exercise: video, explanation, and either the number of
/// repetitions ("Hecho" when finished) or a timer ("Empezar", ends by itself).
class ExerciseStepView extends StatefulWidget {
  const ExerciseStepView({
    super.key,
    required this.step,
    required this.onDone,
    required this.onCouldNot,
    required this.onExit,
  });

  final SetStep step;
  final VoidCallback onDone;

  /// "No he podido"
  final VoidCallback onCouldNot;
  final VoidCallback onExit;

  @override
  State<ExerciseStepView> createState() => _ExerciseStepViewState();
}

class _ExerciseStepViewState extends State<ExerciseStepView> {
  /// Timed exercises start when the patient is ready
  bool _timerStarted = false;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final step = widget.step;
    final line = step.line;
    final exercise = line.exercise;
    final durationSec = line.durationSec;

    return ScreenLayout(
      onExit: widget.onExit,
      title: exercise.name,
      // What to do now goes first, so it's visible without scrolling even on
      // small phones; the video and explanation follow
      body: [
        Text(
          'Ejercicio ${step.exerciseNumber} de ${step.exerciseCount}  ·  '
          'Serie ${step.set} de ${line.sets}',
          style: textTheme.bodyLarge,
        ),
        const SizedBox(height: 16),
        if (durationSec != null)
          Countdown(
            seconds: durationSec,
            running: _timerStarted,
            onFinished: widget.onDone,
          )
        else
          Text(
            '${line.reps} repeticiones',
            textAlign: TextAlign.center,
            style: textTheme.displaySmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        const SizedBox(height: 24),
        const _VideoPlaceholder(),
        const SizedBox(height: 16),
        Text(exercise.description, style: textTheme.bodyLarge),
        if (line.notes != null) ...[
          const SizedBox(height: 12),
          Text(
            'Su fisio le indica: ${line.notes}',
            style: textTheme.bodyLarge?.copyWith(fontStyle: FontStyle.italic),
          ),
        ],
      ],
      buttons: [
        if (durationSec == null)
          FilledButton.icon(
            icon: const Icon(Icons.check, size: 32),
            label: const Text('Hecho'),
            onPressed: widget.onDone,
          )
        else if (!_timerStarted)
          FilledButton.icon(
            icon: const Icon(Icons.play_arrow, size: 32),
            label: const Text('Empezar'),
            onPressed: () => setState(() => _timerStarted = true),
          ),
        OutlinedButton(
          onPressed: widget.onCouldNot,
          child: const Text('No he podido'),
        ),
      ],
    );
  }
}

/// Where the exercise video will play (videos aren't uploaded yet)
class _VideoPlaceholder extends StatelessWidget {
  const _VideoPlaceholder();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colors.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(Icons.play_circle_outline, size: 80, color: colors.outline),
      ),
    );
  }
}
