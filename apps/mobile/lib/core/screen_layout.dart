import 'package:flutter/material.dart';

/// The layout every simple screen shares: a title, some content, and the
/// buttons at the bottom where thumbs reach them. The buttons stay visible
/// all the time; only the content scrolls if it doesn't fit (long text, very
/// large system font), so nothing gets cut off.
class ScreenLayout extends StatelessWidget {
  const ScreenLayout({
    super.key,
    required this.title,
    required this.body,
    this.buttons = const [],
    this.showBack = false,
    this.onExit,
  });

  final String title;
  final List<Widget> body;
  final List<Widget> buttons;

  /// Shows a "Volver" bar at the top (for screens opened from another one)
  final bool showBack;

  /// Shows a "Salir" bar at the top that calls this (e.g. to leave the workout)
  final VoidCallback? onExit;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: onExit != null
          ? AppBar(
              automaticallyImplyLeading: false,
              titleSpacing: 8,
              title: TextButton.icon(
                icon: const Icon(Icons.close, size: 28),
                label: const Text('Salir', style: TextStyle(fontSize: 22)),
                onPressed: onExit,
              ),
            )
          : showBack
          ? AppBar(
              leading: const BackButton(),
              title: const Text('Volver'),
              titleSpacing: 0,
            )
          : null,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            // Readable line length on tablets
            constraints: const BoxConstraints(maxWidth: 600 + 48),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          title,
                          style: Theme.of(context).textTheme.headlineMedium,
                        ),
                        const SizedBox(height: 24),
                        ...body,
                      ],
                    ),
                  ),
                ),
                if (buttons.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        for (final button in buttons) ...[
                          button,
                          const SizedBox(height: 16),
                        ],
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
