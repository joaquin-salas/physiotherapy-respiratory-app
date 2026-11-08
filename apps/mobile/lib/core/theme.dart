import 'package:flutter/material.dart';

/// Look of the whole app. Patients are mostly over 65: large text (≥ 20),
/// tall buttons with text, strong contrast. Set once here, used by every screen.
final appTheme = () {
  final colors = ColorScheme.fromSeed(
    seedColor: const Color(0xFF00695C), // dark teal: good contrast with white
  );
  const buttonText = TextStyle(fontSize: 24, fontWeight: FontWeight.w600);
  const buttonSize = Size.fromHeight(72);
  final buttonShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(16),
  );

  return ThemeData(
    colorScheme: colors,
    textTheme: const TextTheme(
      headlineMedium: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
      bodyLarge: TextStyle(fontSize: 24, height: 1.35),
      bodyMedium: TextStyle(fontSize: 20, height: 1.35),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: buttonSize,
        textStyle: buttonText,
        shape: buttonShape,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: buttonSize,
        textStyle: buttonText,
        shape: buttonShape,
        side: BorderSide(color: colors.primary, width: 2),
      ),
    ),
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(),
      contentPadding: EdgeInsets.all(20),
    ),
  );
}();
