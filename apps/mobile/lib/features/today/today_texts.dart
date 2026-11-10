import 'program.dart';

/// Texts and numbers for the home screen. Plain Dart (no Flutter, no HTTP) so
/// they can be tested quickly.

const weekdayNames = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

const _monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/// "Buenos días" until 14:00, "Buenas tardes" until 21:00, then "Buenas noches"
/// (Spanish meal times: "tardes" start after lunch)
String greetingFor(DateTime now) {
  if (now.hour >= 6 && now.hour < 14) return 'Buenos días';
  if (now.hour >= 14 && now.hour < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

/// "Martes, 10 de noviembre"
String longDate(DateTime day) {
  final weekday = weekdayNames[day.weekday - 1];
  return '${weekday[0].toUpperCase()}${weekday.substring(1)}, '
      '${day.day} de ${_monthNames[day.month - 1]}';
}

/// Seconds a repetition takes, roughly, to estimate the session length
const secondsPerRep = 4;

/// Rough length of the session in whole minutes (at least 1): every set's
/// work plus the rests between sets, the same steps the workout walks through.
int estimatedMinutes(Routine routine) {
  final sets = [
    for (final line in routine.exercises)
      for (var set = 0; set < line.sets; set++) line,
  ];
  var seconds = 0;
  for (final (i, line) in sets.indexed) {
    seconds += line.durationSec ?? (line.reps ?? 0) * secondsPerRep;
    // Rest after every set except the very last one
    if (i < sets.length - 1) seconds += line.restSec;
  }
  final minutes = (seconds / 60).ceil();
  return minutes < 1 ? 1 : minutes;
}

/// "6 ejercicios · unos 20 minutos"
String routineSummary(Routine routine) {
  final count = routine.exercises.length;
  final minutes = estimatedMinutes(routine);
  final exercises = count == 1 ? '1 ejercicio' : '$count ejercicios';
  final time = minutes == 1 ? 'un minuto' : 'unos $minutes minutos';
  return '$exercises · $time';
}
