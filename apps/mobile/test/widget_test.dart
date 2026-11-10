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

      expect(find.text('Aún no hay ejercicios'), findsOneWidget);
      expect(find.byType(FilledButton), findsNothing);
    });

    testWidgets('on a rest day there is nothing to start', (tester) async {
      await tester.pumpWidget(today(saturday));
      await tester.pumpAndSettle();

      expect(find.text('Hoy toca descansar'), findsOneWidget);
      expect(find.textContaining('el lunes'), findsOneWidget);
      expect(find.byType(FilledButton), findsNothing);
    });

    testWidgets('on a training day there is one big button', (tester) async {
      await tester.pumpWidget(today(wednesday));
      await tester.pumpAndSettle();

      expect(find.text('Miércoles, 11 de noviembre'), findsOneWidget);
      expect(find.text('Empezar entreno'), findsOneWidget);
      expect(find.text('2 ejercicios · unos 4 minutos'), findsOneWidget);
      expect(find.byType(FilledButton), findsOneWidget);
    });

    testWidgets('the home screen still fits with the font at 200 %', (
      tester,
    ) async {
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(
            size: Size(390, 844),
            textScaler: TextScaler.linear(2),
          ),
          child: today(wednesday),
        ),
      );
      await tester.pumpAndSettle();

      // No overflow errors, and the button is still there (scrolling if needed)
      expect(tester.takeException(), isNull);
      expect(find.text('Empezar entreno'), findsOneWidget);
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
      expect(find.text('Serie 1 de 2'), findsOneWidget);
      expect(find.text('10'), findsOneWidget);
      expect(find.text('repeticiones'), findsOneWidget);
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
      await tester.ensureVisible(find.text('5'));
      await tester.tap(find.text('5'));
      await tester.pump();
      expect(find.text('¿Cuánto le ha faltado el aire?'), findsOneWidget);
      await tester.ensureVisible(find.text('3'));
      await tester.tap(find.text('3'));
      await tester.pump();

      expect(find.text('¡Muy bien!'), findsOneWidget);
    });

    testWidgets('"Salir" asks before leaving the session', (tester) async {
      await tester.pumpWidget(workout());

      await tester.tap(find.text('Salir'));
      await tester.pumpAndSettle();

      expect(find.text('¿Quiere dejar el entreno?'), findsOneWidget);
      await tester.tap(find.text('Seguir entrenando'));
      await tester.pumpAndSettle();
      expect(find.text('¿Tiene fiebre hoy?'), findsOneWidget);
    });
  });

  testWidgets('a rest can be made 30 seconds longer', (tester) async {
    await tester.pumpWidget(
      app(WorkoutScreen(routine: sampleProgram.routines[0])),
    );
    for (var i = 0; i < 3; i++) {
      await tester.tap(find.text('No'));
      await tester.pump();
    }
    await tester.tap(find.text('Hecho'));
    await tester.pump();

    expect(find.text('1:00'), findsOneWidget);
    await tester.tap(find.text('30 segundos más'));
    await tester.pump();
    expect(find.text('1:30'), findsOneWidget);

    // After the original 60 s it's still resting
    await tester.pump(const Duration(seconds: 60));
    expect(find.text('Descanse'), findsOneWidget);
  });

  testWidgets('on a tablet in landscape the exercise uses two columns', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1280, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      app(WorkoutScreen(routine: sampleProgram.routines[0])),
    );
    for (var i = 0; i < 3; i++) {
      await tester.tap(find.text('No'));
      await tester.pump();
    }

    // The video (left) sits beside the "Hecho" button (right), not above it
    final video = tester.getRect(find.text('Vídeo próximamente'));
    final done = tester.getRect(find.text('Hecho'));
    expect(done.left, greaterThan(video.right));
    expect(tester.takeException(), isNull);
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
