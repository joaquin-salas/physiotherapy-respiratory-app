import 'package:flutter/material.dart';

import '../today/program.dart';
import 'widgets/check_in_question.dart';
import 'widgets/choice_dialog.dart';
import 'widgets/effort_scale.dart';
import 'widgets/exercise_step.dart';
import 'widgets/rest_timer.dart';
import 'widgets/stop_today.dart';
import 'widgets/well_done.dart';
import 'workout_steps.dart';

/// Today's session: one screen that walks through the steps built from the
/// routine (safety check → exercises with rests → effort → "¡Muy bien!").
///
/// One screen instead of one route per step, so Android's back button can't
/// bounce the patient through the session: it asks "¿Quiere dejar el entreno?".
/// Nothing is saved yet: that comes with the workout log in the API.
class WorkoutScreen extends StatefulWidget {
  const WorkoutScreen({super.key, required this.routine});

  final Routine routine;

  @override
  State<WorkoutScreen> createState() => _WorkoutScreenState();
}

class _WorkoutScreenState extends State<WorkoutScreen> {
  late final List<WorkoutStep> _steps = buildWorkoutSteps(widget.routine);
  final _startedAt = DateTime.now();
  int _index = 0;

  /// A risky answer in the safety check
  bool _stopped = false;

  WorkoutStep get _step => _steps[_index];
  bool get _finished => _stopped || _step is DoneStep;

  void _next() => setState(() => _index++);

  void _answerCheckIn(bool yes) {
    if (yes) {
      setState(() => _stopped = true);
    } else {
      _next();
    }
  }

  Future<void> _couldNot() async {
    // null = back to the exercise (also when the dialog is dismissed).
    // The reason isn't saved yet (comes with the workout log).
    final reason = await showChoiceDialog<String?>(
      context,
      title: '¿Qué ha pasado?',
      choices: const [
        Choice('Cansancio', 'tired'),
        Choice('Dolor', 'pain'),
        Choice('Falta de aire', 'breathless'),
        Choice('No tenía tiempo', 'no_time'),
        Choice('Volver al ejercicio', null, primary: true),
      ],
    );
    if (reason == null || !mounted) return;
    setState(() => _index = nextExerciseIndex(_steps, _index));
  }

  Future<void> _confirmExit() async {
    final leave = await showChoiceDialog<bool>(
      context,
      title: '¿Quiere dejar el entreno?',
      // TODO(workout log): nothing is saved yet (the app isn't in production)
      message: 'Lo que ha hecho hasta ahora se guarda.',
      choices: const [
        Choice('Seguir entrenando', false, primary: true),
        Choice('Dejarlo por hoy', true),
      ],
    );
    if (leave == true && mounted) Navigator.of(context).pop();
  }

  void _finish() => Navigator.of(context).pop();

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _finished,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _confirmExit();
      },
      // A new key per step: timers and other step state start fresh
      child: KeyedSubtree(
        key: ValueKey(_stopped ? 'stopped' : _index),
        child: _buildStep(),
      ),
    );
  }

  Widget _buildStep() {
    if (_stopped) return StopTodayView(onFinish: _finish);

    return switch (_step) {
      CheckInStep step => CheckInQuestionView(
        step: step,
        onAnswer: _answerCheckIn,
        onExit: _confirmExit,
      ),
      SetStep step => ExerciseStepView(
        step: step,
        onDone: _next,
        onCouldNot: _couldNot,
        onExit: _confirmExit,
      ),
      RestStep step => RestTimerView(
        step: step,
        onDone: _next,
        onExit: _confirmExit,
      ),
      // The answer isn't saved yet (comes with the workout log)
      EffortStep step => EffortScaleView(
        question: step.question,
        onAnswer: (_) => _next(),
      ),
      DoneStep() => WellDoneView(
        exercises: widget.routine.exercises.length,
        // Real time spent, at least 1 minute
        minutes: (DateTime.now().difference(_startedAt).inSeconds / 60)
            .ceil()
            .clamp(1, 999),
        onFinish: _finish,
      ),
    };
  }
}
