import 'package:flutter_test/flutter_test.dart';
import 'package:respira_app/features/today/todays_routine.dart';

import 'test_data.dart';

void main() {
  test('the test dates are the weekdays they claim to be', () {
    expect(monday.weekday, DateTime.monday);
    expect(saturday.weekday, DateTime.saturday);
  });

  test('no program: nothing to do', () {
    expect(whatIsToday(null, wednesday), isA<NoProgram>());
  });

  test("a routine's day: that routine", () {
    final today = whatIsToday(sampleProgram, wednesday);
    expect((today as TrainingDay).routine.name, 'A');
    expect(
      (whatIsToday(sampleProgram, tuesday) as TrainingDay).routine.name,
      'B',
    );
  });

  test('a day without routine: rest, with the next training day', () {
    final today = whatIsToday(sampleProgram, saturday) as RestDay;
    final nextMonday = DateTime(2026, 11, 16);
    expect(today.nextTrainingDay, nextMonday);
  });

  test('parses the API weekdays into Dart weekday numbers', () {
    expect(sampleProgram.routines[0].weekdays, {
      DateTime.monday,
      DateTime.wednesday,
      DateTime.friday,
    });
  });
}
