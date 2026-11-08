import '../today/program.dart';
import 'check_in_questions.dart';

/// One screen of the workout. The whole session is a list of these, built from
/// the routine before starting. Plain Dart (no Flutter) so it can be tested quickly.
sealed class WorkoutStep {
  const WorkoutStep();
}

/// A question of the safety check ("Pregunta 1 de 3")
class CheckInStep extends WorkoutStep {
  const CheckInStep(this.question, {required this.number, required this.total});

  final CheckInQuestion question;
  final int number;
  final int total;
}

/// One set of an exercise ("Ejercicio 2 de 6 · Serie 1 de 3")
class SetStep extends WorkoutStep {
  const SetStep(
    this.line, {
    required this.exerciseNumber,
    required this.exerciseCount,
    required this.set,
  });

  final RoutineExercise line;
  final int exerciseNumber;
  final int exerciseCount;

  /// 1-based: 1 … line.sets
  final int set;
}

/// A rest with a countdown, between sets or exercises
class RestStep extends WorkoutStep {
  const RestStep(this.seconds, {required this.next});

  final int seconds;

  /// What comes after the rest (shown as "Después: …")
  final SetStep next;
}

enum EffortQuestion { effort, breathlessness }

/// The 0–10 scale at the end of the session
class EffortStep extends WorkoutStep {
  const EffortStep(this.question);

  final EffortQuestion question;
}

/// "¡Muy bien!"
class DoneStep extends WorkoutStep {
  const DoneStep();
}

/// The session for [routine]: safety check → every set of every exercise with
/// its rests → effort and breathlessness → done.
List<WorkoutStep> buildWorkoutSteps(
  Routine routine, {
  List<CheckInQuestion> checkIn = checkInQuestions,
}) {
  final lines = routine.exercises;
  final sets = [
    for (final (i, line) in lines.indexed)
      for (var set = 1; set <= line.sets; set++)
        SetStep(
          line,
          exerciseNumber: i + 1,
          exerciseCount: lines.length,
          set: set,
        ),
  ];

  return [
    for (final (i, question) in checkIn.indexed)
      CheckInStep(question, number: i + 1, total: checkIn.length),
    for (final (i, set) in sets.indexed) ...[
      set,
      // Rest after every set except the very last one
      if (i < sets.length - 1 && set.line.restSec > 0)
        RestStep(set.line.restSec, next: sets[i + 1]),
    ],
    const EffortStep(EffortQuestion.effort),
    const EffortStep(EffortQuestion.breathlessness),
    const DoneStep(),
  ];
}

/// "No he podido" on the set at [index]: the index of the next exercise's first
/// set, skipping the rest of the current exercise (or the end-of-session
/// questions if it was the last one).
int nextExerciseIndex(List<WorkoutStep> steps, int index) {
  final current = steps[index] as SetStep;
  for (var i = index + 1; i < steps.length; i++) {
    final step = steps[i];
    if (step is SetStep && step.exerciseNumber != current.exerciseNumber) {
      return i;
    }
    if (step is EffortStep) return i;
  }
  return steps.length - 1;
}
