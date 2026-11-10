import 'package:flutter/material.dart';

import '../../../core/theme.dart';

/// A choice in [showChoiceDialog]
class Choice<T> {
  const Choice(this.label, this.value, {this.primary = false});

  final String label;
  final T value;

  /// Drawn as the filled (main) button
  final bool primary;
}

/// A sheet from the bottom of the screen with large stacked buttons, where the
/// thumbs are (Flutter's standard dialog puts small buttons side by side).
/// Returns the chosen value, or null if dismissed.
Future<T?> showChoiceDialog<T>(
  BuildContext context, {
  required String title,
  String? message,
  required List<Choice<T>> choices,
}) {
  final textTheme = Theme.of(context).textTheme;
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true, // may grow tall with a large system font
    backgroundColor: AppColors.background,
    barrierColor: AppColors.text.withValues(alpha: 0.6),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (context) => SafeArea(
      child: Center(
        heightFactor: 1,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600 + 48),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Semantics(
                  header: true,
                  child: Text(title, style: textTheme.headlineMedium),
                ),
                if (message != null) ...[
                  const SizedBox(height: 12),
                  Text(message, style: textTheme.bodyLarge),
                ],
                const SizedBox(height: 24),
                for (final (i, choice) in choices.indexed) ...[
                  if (i > 0) const SizedBox(height: 14),
                  choice.primary
                      ? FilledButton(
                          onPressed: () =>
                              Navigator.of(context).pop(choice.value),
                          child: Text(choice.label),
                        )
                      : OutlinedButton(
                          onPressed: () =>
                              Navigator.of(context).pop(choice.value),
                          child: Text(choice.label),
                        ),
                ],
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
