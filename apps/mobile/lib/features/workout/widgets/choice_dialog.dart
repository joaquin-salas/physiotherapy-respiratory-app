import 'package:flutter/material.dart';

/// A choice in [showChoiceDialog]
class Choice<T> {
  const Choice(this.label, this.value, {this.primary = false});

  final String label;
  final T value;

  /// Drawn as the filled (main) button
  final bool primary;
}

/// A dialog with large stacked buttons (Flutter's standard dialog puts small
/// buttons side by side). Returns the chosen value, or null if dismissed.
Future<T?> showChoiceDialog<T>(
  BuildContext context, {
  required String title,
  String? message,
  required List<Choice<T>> choices,
}) {
  final textTheme = Theme.of(context).textTheme;
  return showDialog<T>(
    context: context,
    builder: (context) => Dialog(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: textTheme.headlineSmall),
            if (message != null) ...[
              const SizedBox(height: 16),
              Text(message, style: textTheme.bodyLarge),
            ],
            const SizedBox(height: 24),
            for (final choice in choices) ...[
              choice.primary
                  ? FilledButton(
                      onPressed: () => Navigator.of(context).pop(choice.value),
                      child: Text(choice.label),
                    )
                  : OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(choice.value),
                      child: Text(choice.label),
                    ),
              const SizedBox(height: 12),
            ],
          ],
        ),
      ),
    ),
  );
}
