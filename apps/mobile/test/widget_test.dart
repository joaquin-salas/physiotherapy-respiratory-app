import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:respira_app/core/theme.dart';
import 'package:respira_app/features/pairing/type_code_screen.dart';
import 'package:respira_app/features/pairing/welcome_screen.dart';

Widget app(Widget home) => MaterialApp(theme: appTheme, home: home);

void main() {
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
