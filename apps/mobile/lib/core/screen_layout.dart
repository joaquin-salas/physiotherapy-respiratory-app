import 'package:flutter/material.dart';

/// The layout every simple screen shares: a title, some content, and the
/// buttons at the bottom where thumbs reach them. Scrolls if the system font
/// size is very large, so nothing gets cut off.
class ScreenLayout extends StatelessWidget {
  const ScreenLayout({
    super.key,
    required this.title,
    required this.body,
    this.buttons = const [],
    this.showBack = false,
  });

  final String title;
  final List<Widget> body;
  final List<Widget> buttons;

  /// Shows a "Volver" bar at the top (for screens opened from another one)
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: showBack
          ? AppBar(
              leading: const BackButton(),
              title: const Text('Volver'),
              titleSpacing: 0,
            )
          : null,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: 600, // readable line length on tablets
                  // At least the screen's height, so the buttons sit at the bottom
                  minHeight: constraints.maxHeight - 48,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          title,
                          style: Theme.of(context).textTheme.headlineMedium,
                        ),
                        const SizedBox(height: 24),
                        ...body,
                        const SizedBox(height: 32),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        for (final button in buttons) ...[
                          button,
                          const SizedBox(height: 16),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
