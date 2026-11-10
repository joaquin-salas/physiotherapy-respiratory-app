import 'package:flutter/material.dart';

/// Brand colours, the same as the physio panel (`apps/web/src/index.css`).
/// Text colours reach at least 7:1 contrast on the background (WCAG AAA);
/// borders and controls at least 3:1. Mockup: https://claude.ai/artifact/Kuuth5AQBy7THCG9Tay717
abstract final class AppColors {
  static const primary = Color(0xFF1E5C61); // dark teal; white on it ≈ 7.6:1
  static const primaryDark = Color(0xFF123E42);
  static const background = Color(0xFFF7F5F0); // warm cream
  static const surface = Color(0xFFFFFFFF);
  static const text = Color(0xFF1C2B2D);
  static const textMuted = Color(0xFF4A5859); // ≈ 6.9:1 on the background
  static const border = Color(0xFFD9D4C8);
  static const accent = Color(0xFFE3EEEC); // light teal: rest screens, notes
  static const videoBox = Color(0xFFDCE6E4);
  static const warningBg = Color(0xFFFBEBD3);
  static const warningText = Color(0xFF5C3A0A);
}

/// Look of the whole app. Patients are mostly over 65: large text (≥ 20),
/// tall buttons with text, strong contrast. Set once here, used by every screen.
/// Sizes follow the phone's font size setting (they grow, they never clip).
final appTheme = () {
  final colors = ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    primary: AppColors.primary,
    onPrimary: Colors.white,
    surface: AppColors.background,
    onSurface: AppColors.text,
    onSurfaceVariant: AppColors.textMuted,
    outline: AppColors.border,
  );
  final mainShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(18),
  );

  return ThemeData(
    colorScheme: colors,
    scaffoldBackgroundColor: AppColors.background,
    fontFamily: 'Figtree',
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 96, fontWeight: FontWeight.w800),
      headlineLarge: TextStyle(
        fontSize: 36,
        height: 1.15,
        fontWeight: FontWeight.w800,
      ),
      headlineMedium: TextStyle(
        fontSize: 32,
        height: 1.15,
        fontWeight: FontWeight.w800,
      ),
      bodyLarge: TextStyle(fontSize: 22, height: 1.4),
      bodyMedium: TextStyle(fontSize: 20, height: 1.4),
    ).apply(bodyColor: AppColors.text, displayColor: AppColors.text),
    // Main action: filled, 80 tall
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(80),
        textStyle: const TextStyle(
          fontFamily: 'Figtree',
          fontSize: 28,
          fontWeight: FontWeight.w700,
        ),
        shape: mainShape,
      ),
    ),
    // Second action: outlined, 64 tall
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(64),
        foregroundColor: AppColors.primary,
        backgroundColor: AppColors.surface,
        textStyle: const TextStyle(
          fontFamily: 'Figtree',
          fontSize: 24,
          fontWeight: FontWeight.w600,
        ),
        shape: mainShape,
        side: const BorderSide(color: AppColors.primary, width: 2),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        minimumSize: const Size(56, 56),
        foregroundColor: AppColors.primary,
        textStyle: const TextStyle(
          fontFamily: 'Figtree',
          fontSize: 22,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(),
      contentPadding: EdgeInsets.all(20),
    ),
  );
}();
