/// The patient's active program, as `GET /me/program` sends it.
/// Plain data: what to show and when is decided by the logic and the screens.
class Program {
  Program({required this.id, required this.name, required this.routines});

  factory Program.fromJson(Map<String, dynamic> json) => Program(
    id: json['id'] as String,
    name: json['name'] as String,
    routines: [
      for (final routine in json['routines'] as List)
        Routine.fromJson(routine as Map<String, dynamic>),
    ],
  );

  final String id;
  final String name;
  final List<Routine> routines;
}

/// A fixed session, repeated on some days of the week
class Routine {
  Routine({
    required this.id,
    required this.name,
    required this.weekdays,
    required this.exercises,
  });

  factory Routine.fromJson(Map<String, dynamic> json) => Routine(
    id: json['id'] as String,
    name: json['name'] as String,
    weekdays: {
      for (final day in json['daysOfWeek'] as List)
        _weekdayNumber(day as String),
    },
    exercises: [
      for (final line in json['exercises'] as List)
        RoutineExercise.fromJson(line as Map<String, dynamic>),
    ],
  );

  final String id;
  final String name;

  /// Days it's done on, as Dart numbers: DateTime.monday (1) … DateTime.sunday (7)
  final Set<int> weekdays;

  /// In the order they're done
  final List<RoutineExercise> exercises;
}

/// One exercise in a routine: the physio's prescription for this patient
class RoutineExercise {
  RoutineExercise({
    required this.id,
    required this.order,
    required this.sets,
    required this.reps,
    required this.durationSec,
    required this.restSec,
    required this.targetEffortPct,
    required this.notes,
    required this.exercise,
  });

  factory RoutineExercise.fromJson(Map<String, dynamic> json) =>
      RoutineExercise(
        id: json['id'] as String,
        order: json['order'] as int,
        sets: json['sets'] as int,
        reps: json['reps'] as int?,
        durationSec: json['durationSec'] as int?,
        restSec: json['restSec'] as int,
        targetEffortPct: json['targetEffortPct'] as int?,
        notes: json['notes'] as String?,
        exercise: Exercise.fromJson(json['exercise'] as Map<String, dynamic>),
      );

  final String id;
  final int order;
  final int sets;

  /// Either [reps] or [durationSec] is set, depending on the exercise
  final int? reps;
  final int? durationSec;

  /// Rest after each set, in seconds
  final int restSec;

  /// Target perceived effort, 0–100 (50 = 5 out of 10)
  final int? targetEffortPct;

  /// The physio's notes for this patient, e.g. "Despacio al bajar"
  final String? notes;

  final Exercise exercise;
}

/// An exercise from the shared library: the same for every patient
class Exercise {
  Exercise({
    required this.id,
    required this.name,
    required this.description,
    required this.videoUrl,
    required this.equipment,
  });

  factory Exercise.fromJson(Map<String, dynamic> json) => Exercise(
    id: json['id'] as String,
    name: json['name'] as String,
    description: json['description'] as String,
    videoUrl: json['videoUrl'] as String?,
    equipment: [for (final item in json['equipment'] as List) item as String],
  );

  final String id;
  final String name;
  final String description;
  final String? videoUrl;

  /// e.g. ["silla"]; empty = no equipment needed
  final List<String> equipment;
}

/// The API's Weekday enum, in Dart's order (Monday = 1)
const _apiWeekdays = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

int _weekdayNumber(String day) => _apiWeekdays.indexOf(day) + 1;
