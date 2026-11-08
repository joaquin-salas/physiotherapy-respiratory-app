import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:respira_app/core/theme.dart';
import 'package:respira_app/features/pairing/type_code_screen.dart';
import 'package:respira_app/features/pairing/welcome_screen.dart';
import 'package:respira_app/features/today/today_screen.dart';
import 'package:respira_app/features/workout/workout_screen.dart';

import 'test_data.dart';

Widget app(Widget home) => MaterialApp(theme: appTheme, home: home);

void main() {
  group('today screen', () {
    Widget today(DateTime date, {bool withProgram = true}) => app(
      TodayScreen(
        loadProgram: () async => withProgram ? sampleProgram : null,
        clock: () => date,
      ),
    );

    testWidgets('without a program there is nothing to start', (tester) async {
      await tester.pumpWidget(today(wednesday, withProgram: false));
      await tester.pumpAndSettle();

      expect(find.textContaining('todavía está preparando'), findsOneWidget);
      expect(find.byType(FilledButton), findsNothing);
    });

    testWidgets('on a rest day there is nothing to start', (tester) async {
      await tester.pumpWidget(today(saturday));
      await tester.pumpAndSettle();

      expect(find.text('Hoy toca descansar'), findsOneWidget);
      expect(find.textContaining('el lunes'), findsOneWidget);
      expect(find.byType(FilledButton), findsNothing);
    });

    testWidgets("on a training day it lists today's exercises", (tester) async {
      await tester.pumpWidget(today(wednesday));
      await tester.pumpAndSettle();

      expect(find.text('Su entreno de hoy'), findsOneWidget);
      expect(find.textContaining('Sentarse y levantarse'), findsOneWidget);
      expect(find.text('Empezar'), findsOneWidget);
    });
  });

  group('workout', () {
    Widget workout() => app(WorkoutScreen(routine: sampleProgram.routines[0]));

    testWidgets('a risky answer in the safety check stops the session', (
      tester,
    ) async {
      await tester.pumpWidget(workout());
      expect(find.text('¿Tiene fiebre hoy?'), findsOneWidget);

      await tester.tap(find.text('Sí'));
      await tester.pump();

      expect(find.text('Hoy mejor no entrene'), findsOneWidget);
    });

    testWidgets('goes through the whole session', (tester) async {
      await tester.pumpWidget(workout());

      for (var i = 0; i < 3; i++) {
        await tester.tap(find.text('No'));
        await tester.pump();
      }

      // Set 1 → rest (skipped) → set 2 → rest (let it run out)
      expect(find.textContaining('Serie 1 de 2'), findsOneWidget);
      expect(find.text('10 repeticiones'), findsOneWidget);
      await tester.tap(find.text('Hecho'));
      await tester.pump();
      expect(find.text('Descanse'), findsOneWidget);
      await tester.tap(find.text('Seguir ya'));
      await tester.pump();
      await tester.tap(find.text('Hecho'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 60));
      await tester.pump();

      // Timed exercise (3 s): starts with "Empezar", ends by itself
      expect(find.text('Respiración'), findsOneWidget);
      await tester.tap(find.text('Empezar'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 3));
      await tester.pump();

      expect(find.text('¿Cómo de cansado/a se ha quedado?'), findsOneWidget);
      await tester.tap(find.text('5'));
      await tester.pump();
      expect(find.text('¿Cuánto le ha faltado el aire?'), findsOneWidget);
      await tester.tap(find.text('3'));
      await tester.pump();

      expect(find.text('¡Muy bien!'), findsOneWidget);
    });

    testWidgets('"Salir" asks before leaving the session', (tester) async {
      await tester.pumpWidget(workout());

      await tester.tap(find.text('Salir'));
      await tester.pumpAndSettle();

      expect(find.text('¿Quiere dejar el entreno?'), findsOneWidget);
      await tester.tap(find.text('Seguir con el entreno'));
      await tester.pumpAndSettle();
      expect(find.text('¿Tiene fiebre hoy?'), findsOneWidget);
    });
  });

  testWidgets('welcome screen offers scanning and typing the code', (
    tester,
  ) async {
    await tester.pumpWidget(app(const WelcomeScreen()));

    expect(find.text('Escanear código'), findsOneWidget);
    expect(find.text('Escribir el código'), findsOneWidget);

    // Large buttons for older users (≥ 48 px; the theme uses 72)
    final button = tester.getSize(find.byType(FilledButton));
    expect(button.height, greaterThanOrEqualTo(48));
  });

  testWidgets('typing a malformed code explains the format', (tester) async {
    await tester.pumpWidget(app(const TypeCodeScreen()));

    await tester.enterText(find.byType(TextField), '123');
    await tester.tap(find.text('Conectar'));
    await tester.pump();

    expect(find.textContaining('10 letras y números'), findsOneWidget);
  });
}
