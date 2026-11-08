import 'package:flutter_test/flutter_test.dart';
import 'package:respira_app/features/workout/workout_steps.dart';

import 'test_data.dart';

/// A short readable label per step, to compare whole sessions at a glance
String label(WorkoutStep step) => switch (step) {
  CheckInStep s => 'check-in ${s.number}/${s.total}',
  SetStep s => '${s.line.exercise.name} ${s.set}/${s.line.sets}',
  RestStep s => 'rest ${s.seconds}s',
  EffortStep s => s.question.name,
  DoneStep() => 'done',
};

void main() {
  final routineA = sampleProgram.routines[0];

  test('builds check-in → sets with rests → effort → done', () {
    final steps = buildWorkoutSteps(routineA);

    expect(steps.map(label), [
      'check-in 1/3',
      'check-in 2/3',
      'check-in 3/3',
      'Sentarse y levantarse 1/2',
      'rest 60s',
      'Sentarse y levantarse 2/2',
      'rest 60s', // before the next exercise
      'Respiración 1/1', // last set: no rest after it
      'effort',
      'breathlessness',
      'done',
    ]);
  });

  test('numbers the exercises', () {
    final sets = buildWorkoutSteps(routineA).whereType<SetStep>().toList();
    expect(sets.map((s) => s.exerciseNumber), [1, 1, 2]);
    expect(sets.every((s) => s.exerciseCount == 2), isTrue);
  });

  test('no rest step when the rest is 0 seconds', () {
    final program = programJson([
      routineJson('X', ['MONDAY'], [lineJson(1, 'Caminar', restSec: 0)]),
    ]);
    final steps = buildWorkoutSteps(program.routines[0], checkIn: []);
    expect(steps.map(label), [
      'Caminar 1/2',
      'Caminar 2/2',
      'effort',
      'breathlessness',
      'done',
    ]);
  });

  test('"No he podido" skips the rest of the exercise', () {
    final steps = buildWorkoutSteps(routineA);
    final firstSet = steps.indexWhere((s) => s is SetStep);

    final next = nextExerciseIndex(steps, firstSet);
    expect(label(steps[next]), 'Respiración 1/1');

    // On the last exercise it goes to the end-of-session questions
    expect(label(steps[nextExerciseIndex(steps, next)]), 'effort');
  });
}
