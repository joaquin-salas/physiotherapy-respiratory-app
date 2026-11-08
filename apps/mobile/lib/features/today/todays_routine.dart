import 'program.dart';

/// What today looks like for the patient. Plain Dart (no Flutter, no HTTP) so
/// it can be tested quickly.
sealed class Today {
  const Today();
}

/// The physio hasn't assigned a program yet: nothing to do
class NoProgram extends Today {
  const NoProgram();
}

/// There's a program, but no routine on this day of the week
class RestDay extends Today {
  const RestDay(this.nextTrainingDay);

  /// The next day with a routine (within a week), or null if there's none
  final DateTime? nextTrainingDay;
}

/// A routine is scheduled for today
class TrainingDay extends Today {
  const TrainingDay(this.routine);

  final Routine routine;
}

/// Decides what today is, using the phone's date ([now])
Today whatIsToday(Program? program, DateTime now) {
  if (program == null) return const NoProgram();

  final routine = _routineOn(program, now.weekday);
  if (routine != null) return TrainingDay(routine);

  for (var days = 1; days <= 7; days++) {
    final day = now.add(Duration(days: days));
    if (_routineOn(program, day.weekday) != null) return RestDay(day);
  }
  return const RestDay(null);
}

Routine? _routineOn(Program program, int weekday) {
  for (final routine in program.routines) {
    if (routine.weekdays.contains(weekday) && routine.exercises.isNotEmpty) {
      return routine;
    }
  }
  return null;
}
