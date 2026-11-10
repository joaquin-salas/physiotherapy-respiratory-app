import 'package:flutter_test/flutter_test.dart';
import 'package:respira_app/features/today/today_texts.dart';

import 'test_data.dart';

void main() {
  test('the greeting follows Spanish meal times', () {
    expect(greetingFor(DateTime(2026, 11, 10, 9)), 'Buenos días');
    expect(greetingFor(DateTime(2026, 11, 10, 13, 59)), 'Buenos días');
    expect(greetingFor(DateTime(2026, 11, 10, 14)), 'Buenas tardes');
    expect(greetingFor(DateTime(2026, 11, 10, 21)), 'Buenas noches');
    expect(greetingFor(DateTime(2026, 11, 10, 2)), 'Buenas noches');
  });

  test('the date is written out in Spanish', () {
    expect(longDate(tuesday), 'Martes, 10 de noviembre');
    expect(longDate(DateTime(2027, 1, 1)), 'Viernes, 1 de enero');
  });

  test('the session length counts every set and the rests between them', () {
    // 2 × (10 reps × 4 s) + 2 rests of 60 s + one 3 s set = 203 s → 4 min
    expect(estimatedMinutes(sampleProgram.routines[0]), 4);
    expect(
      routineSummary(sampleProgram.routines[0]),
      '2 ejercicios · unos 4 minutos',
    );
  });

  test('a tiny routine is at least one minute', () {
    final tiny = programJson([
      routineJson('A', ['MONDAY'], [lineJson(1, 'Soplar', sets: 1, reps: 2)]),
    ]).routines[0];
    expect(estimatedMinutes(tiny), 1);
    expect(routineSummary(tiny), '1 ejercicio · un minuto');
  });
}
