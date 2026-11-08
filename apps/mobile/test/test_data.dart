import 'package:respira_app/features/today/program.dart';

/// Fake data shaped like `GET /me/program` (also exercises Program.fromJson)

Map<String, dynamic> lineJson(
  int order,
  String name, {
  int sets = 2,
  int? reps = 10,
  int? durationSec,
  int restSec = 60,
}) => {
  'id': 'line-$order',
  'order': order,
  'sets': sets,
  'reps': reps,
  'durationSec': durationSec,
  'restSec': restSec,
  'targetEffortPct': 50,
  'notes': null,
  'exercise': {
    'id': 'ex-$order',
    'name': name,
    'description': 'Descripción de prueba.',
    'videoUrl': null,
    'equipment': <String>[],
  },
};

Program programJson(List<Map<String, dynamic>> routines) => Program.fromJson({
  'id': 'prog-1',
  'name': 'Programa de prueba',
  'startDate': '2026-11-02T00:00:00.000Z',
  'routines': routines,
});

Map<String, dynamic> routineJson(
  String name,
  List<String> days,
  List<Map<String, dynamic>> lines,
) => {'id': 'rut-$name', 'name': name, 'daysOfWeek': days, 'exercises': lines};

/// Rutina A on Mon/Wed/Fri: a reps exercise (2 sets) and a timed one (1 set)
final sampleProgram = programJson([
  routineJson(
    'A',
    ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    [
      lineJson(1, 'Sentarse y levantarse'),
      lineJson(
        2,
        'Respiración',
        sets: 1,
        reps: null,
        durationSec: 3,
        restSec: 30,
      ),
    ],
  ),
  routineJson('B', ['TUESDAY'], [lineJson(1, 'Caminar')]),
]);

// November 2026: the 9th is a Monday
final monday = DateTime(2026, 11, 9);
final tuesday = DateTime(2026, 11, 10);
final wednesday = DateTime(2026, 11, 11);
final saturday = DateTime(2026, 11, 14);
