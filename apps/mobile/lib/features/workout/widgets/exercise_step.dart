import 'package:flutter/material.dart';

import '../../../core/app_widgets.dart';
import '../../../core/screen_layout.dart';
import '../../../core/theme.dart';
import '../workout_steps.dart';
import 'countdown.dart';

/// Width from which the exercise uses two columns (a tablet in landscape)
const _twoColumnWidth = 840.0;

/// One set of an exercise: what to do now (repetitions, or a timer that can be
/// paused), then the video and the explanation. "Hecho" / "No he podido".
/// On a tablet in landscape: video and explanation on the left, the rest on the right.
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
  bool _started = false;
  bool _paused = false;

  @override
  Widget build(BuildContext context) {
    final step = widget.step;
    final line = step.line;
    final exercise = line.exercise;
    final textTheme = Theme.of(context).textTheme;
    final size = MediaQuery.sizeOf(context);
    final twoColumns =
        size.width >= _twoColumnWidth && size.width > size.height;

    final progress = StepProgress(
      'Ejercicio ${step.exerciseNumber} de ${step.exerciseCount}',
      current: step.exerciseNumber,
      total: step.exerciseCount,
    );
    final title = Semantics(
      header: true,
      child: Text(
        exercise.name,
        style: textTheme.headlineMedium?.copyWith(
          fontSize: twoColumns ? 38 : 32,
        ),
      ),
    );
    final setText = 'Serie ${step.set} de ${line.sets}';
    final amount = line.durationSec != null
        ? Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                setText,
                style: textTheme.bodyLarge?.copyWith(
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 16),
              Countdown(
                seconds: line.durationSec!,
                running: _started && !_paused,
                onFinished: widget.onDone,
              ),
            ],
          )
        : _RepsCard(reps: line.reps ?? 0, setText: setText);
    final description = Text(exercise.description, style: textTheme.bodyLarge);
    final notes = line.notes == null
        ? null
        : InfoCard(
            background: AppColors.accent,
            bordered: false,
            child: Text(
              'Su fisio le indica: ${line.notes}',
              style: textTheme.bodyLarge,
            ),
          );
    final buttons = [
      if (line.durationSec == null)
        FilledButton.icon(
          icon: const Icon(Icons.check_rounded, size: 32),
          label: const Text('Hecho'),
          onPressed: widget.onDone,
        )
      else if (!_started)
        FilledButton.icon(
          icon: const Icon(Icons.play_arrow_rounded, size: 36),
          label: const Text('Empezar'),
          onPressed: () => setState(() => _started = true),
        )
      else
        FilledButton.icon(
          icon: Icon(
            _paused ? Icons.play_arrow_rounded : Icons.pause_rounded,
            size: 34,
          ),
          label: Text(_paused ? 'Continuar' : 'Pausar'),
          onPressed: () => setState(() => _paused = !_paused),
        ),
      OutlinedButton(
        onPressed: widget.onCouldNot,
        child: const Text('No he podido'),
      ),
    ];

    if (twoColumns) {
      return ScreenLayout(
        onExit: widget.onExit,
        progress: progress,
        maxWidth: 1200,
        body: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 4,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const _VideoPlaceholder(),
                    const SizedBox(height: 20),
                    description,
                  ],
                ),
              ),
              const SizedBox(width: 40),
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    title,
                    const SizedBox(height: 20),
                    amount,
                    if (notes != null) ...[const SizedBox(height: 16), notes],
                    const SizedBox(height: 28),
                    for (final (i, button) in buttons.indexed) ...[
                      if (i > 0) const SizedBox(height: 14),
                      button,
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      );
    }

    // Phone: what to do now first, so it's visible without scrolling even on
    // small phones; the video and the explanation follow
    return ScreenLayout(
      onExit: widget.onExit,
      progress: progress,
      body: [
        title,
        const SizedBox(height: 18),
        amount,
        if (notes != null) ...[const SizedBox(height: 16), notes],
        const SizedBox(height: 20),
        const _VideoPlaceholder(),
        const SizedBox(height: 16),
        description,
      ],
      buttons: buttons,
    );
  }
}

/// "10 repeticiones" big, with the set on the right
class _RepsCard extends StatelessWidget {
  const _RepsCard({required this.reps, required this.setText});

  final int reps;
  final String setText;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return MergeSemantics(
      child: InfoCard(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$reps',
                    style: textTheme.displayLarge?.copyWith(
                      fontSize: 56,
                      height: 1,
                    ),
                  ),
                  Text(
                    'repeticiones',
                    style: textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              setText,
              textAlign: TextAlign.end,
              style: textTheme.bodyLarge?.copyWith(color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}

/// Where the exercise video will play (videos aren't uploaded yet)
class _VideoPlaceholder extends StatelessWidget {
  const _VideoPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Vídeo del ejercicio. Disponible próximamente.',
      child: ExcludeSemantics(
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: AppColors.videoBox,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Stack(
              children: [
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: const BoxDecoration(
                      color: AppColors.surface,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.play_arrow_rounded,
                      size: 48,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                Positioned(
                  left: 16,
                  bottom: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'Vídeo próximamente',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppColors.text,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
