import 'package:flutter/material.dart';

import 'theme.dart';

/// Where the patient is in a sequence ("Ejercicio 2 de 6"): the text is read
/// aloud; the segments under it are only a visual aid.
class StepProgress {
  const StepProgress(this.label, {required this.current, required this.total});

  final String label;

  /// 1-based
  final int current;
  final int total;
}

/// The layout every screen shares: optional "Salir" bar with progress, the
/// content, and the buttons at the bottom where thumbs reach them.
///
/// The buttons stay visible all the time and only the content scrolls, so
/// nothing gets cut off with a very large system font. On very short screens
/// (a phone in landscape) the buttons scroll with the content instead, or they
/// would leave no room for it.
class ScreenLayout extends StatelessWidget {
  const ScreenLayout({
    super.key,
    this.title,
    required this.body,
    this.buttons = const [],
    this.showBack = false,
    this.onExit,
    this.progress,
    this.centered = false,
    this.background,
    this.maxWidth = 600,
  });

  /// Big title at the top of the content. Leave it out when the body has its own.
  final String? title;
  final List<Widget> body;
  final List<Widget> buttons;

  /// Shows a "Volver" bar at the top (for screens opened from another one)
  final bool showBack;

  /// Shows "✕ Salir" at the top that calls this (e.g. to leave the workout)
  final VoidCallback? onExit;

  /// Shown next to "Salir"
  final StepProgress? progress;

  /// Centres the content vertically (screens with an icon and a message)
  final bool centered;
  final Color? background;

  /// Readable line length on tablets
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final header = onExit != null || progress != null
        ? _ExitBar(onExit: onExit, progress: progress)
        : null;

    return Scaffold(
      backgroundColor: background,
      appBar: showBack
          ? AppBar(
              backgroundColor: background ?? AppColors.background,
              leading: const BackButton(),
              title: const Text('Volver'),
              titleSpacing: 0,
            )
          : null,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth + 48),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final short = constraints.maxHeight < 480;
                final content = Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisAlignment: centered
                      ? MainAxisAlignment.center
                      : MainAxisAlignment.start,
                  children: [
                    if (title != null) ...[
                      Semantics(
                        header: true,
                        child: Text(
                          title!,
                          style: Theme.of(context).textTheme.headlineMedium,
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    ...body,
                  ],
                );
                final buttonColumn = Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      for (final (i, button) in buttons.indexed) ...[
                        if (i > 0) const SizedBox(height: 14),
                        button,
                      ],
                    ],
                  ),
                );

                if (short) {
                  return SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        ?header,
                        Padding(
                          padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
                          child: content,
                        ),
                        if (buttons.isNotEmpty) buttonColumn,
                      ],
                    ),
                  );
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ?header,
                    Expanded(
                      child: LayoutBuilder(
                        // minHeight = the visible area, so `centered` can centre
                        // short content and long content still scrolls
                        builder: (context, area) => SingleChildScrollView(
                          padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              minHeight: area.maxHeight - 28,
                            ),
                            child: content,
                          ),
                        ),
                      ),
                    ),
                    if (buttons.isNotEmpty) buttonColumn,
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

/// "✕ Salir" on the left, the progress text on the right, segments underneath
class _ExitBar extends StatelessWidget {
  const _ExitBar({required this.onExit, required this.progress});

  final VoidCallback? onExit;
  final StepProgress? progress;

  @override
  Widget build(BuildContext context) {
    final progress = this.progress;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 24, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              if (onExit != null)
                TextButton.icon(
                  icon: const Icon(Icons.close, size: 28),
                  label: const Text('Salir'),
                  onPressed: onExit,
                ),
              const Spacer(),
              if (progress != null)
                Flexible(
                  flex: 3,
                  child: Text(
                    progress.label,
                    textAlign: TextAlign.end,
                    style: Theme.of(context).textTheme.bodyMedium
                        ?.copyWith(color: AppColors.textMuted),
                  ),
                ),
            ],
          ),
          if (progress != null && progress.total > 1)
            Padding(
              padding: const EdgeInsets.only(left: 12, top: 8),
              child: StepSegments(
                current: progress.current,
                total: progress.total,
              ),
            ),
        ],
      ),
    );
  }
}

/// A row of small bars: done and current ones filled. Decorative (the text says it).
class StepSegments extends StatelessWidget {
  const StepSegments({super.key, required this.current, required this.total});

  final int current;
  final int total;

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: Row(
        children: [
          for (var i = 1; i <= total; i++) ...[
            if (i > 1) const SizedBox(width: 6),
            Expanded(
              child: Container(
                height: 8,
                decoration: BoxDecoration(
                  color: i <= current ? AppColors.primary : AppColors.border,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
