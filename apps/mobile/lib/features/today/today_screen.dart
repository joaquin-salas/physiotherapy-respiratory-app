import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/app_widgets.dart';
import '../../core/theme.dart';
import '../../core/token_storage.dart';
import '../pairing/welcome_screen.dart';
import '../workout/workout_screen.dart';
import 'program.dart';
import 'program_api.dart';
import 'today_texts.dart';
import 'todays_routine.dart';

/// The home screen: no program yet / rest day / one big "Empezar entreno" button.
class TodayScreen extends StatefulWidget {
  const TodayScreen({
    super.key,
    this.loadProgram = fetchMyProgram,
    this.clock = DateTime.now,
  });

  /// Replaceable in tests, so they don't need the API or a real date
  final Future<Program?> Function() loadProgram;
  final DateTime Function() clock;

  @override
  State<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends State<TodayScreen> {
  Today? _today;
  String? _error;
  late final AppLifecycleListener _lifecycle;

  @override
  void initState() {
    super.initState();
    _load();
    // Android keeps the app in memory: reload when the patient comes back to
    // it, so a new day (or a program the physio just assigned) shows up
    _lifecycle = AppLifecycleListener(onResume: _load);
  }

  @override
  void dispose() {
    _lifecycle.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final program = await widget.loadProgram();
      if (!mounted) return;
      setState(() {
        _today = whatIsToday(program, widget.clock());
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.status == 401) return _disconnected();
      setState(() {
        _error = e.isNetworkError
            ? 'No hay conexión a internet. Compruébela y pulse «Reintentar».'
            : 'No se han podido cargar sus ejercicios. Pulse «Reintentar».';
      });
    }
  }

  /// Disconnected by the physio, follow-up ended, or session expired
  Future<void> _disconnected() async {
    await TokenStorage().delete();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => const WelcomeScreen(
          notice:
              'Esta app se ha desconectado. Necesitará una hoja de '
              'conexión nueva: pídala a su fisioterapeuta.',
        ),
      ),
      (_) => false,
    );
  }

  Future<void> _start(Routine routine) async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => WorkoutScreen(routine: routine)));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final error = _error;
    final today = _today;

    if (error != null) {
      return _HomeLayout(
        now: widget.clock(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(error, style: textTheme.bodyLarge),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () {
                setState(() => _error = null);
                _load();
              },
              child: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    return switch (today) {
      null => const Scaffold(body: Center(child: CircularProgressIndicator())),
      NoProgram() => _HomeLayout(
        now: widget.clock(),
        child: const _Message(
          icon: Icons.assignment_outlined,
          title: 'Aún no hay ejercicios',
          text:
              'Su fisioterapeuta está preparando su plan. '
              'Cuando esté listo, aparecerá aquí.',
        ),
      ),
      RestDay(:final nextTrainingDay) => _HomeLayout(
        now: widget.clock(),
        child: _Message(
          icon: Icons.bedtime_outlined,
          title: 'Hoy toca descansar',
          text: 'Descansar también forma parte del tratamiento.',
          card: nextTrainingDay == null
              ? null
              : Text.rich(
                  TextSpan(
                    text: 'Su próximo entreno es el ',
                    children: [
                      TextSpan(
                        text: weekdayNames[nextTrainingDay.weekday - 1],
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const TextSpan(text: '.'),
                    ],
                  ),
                  style: textTheme.bodyLarge,
                ),
        ),
      ),
      TrainingDay(:final routine) => _HomeLayout(
        now: widget.clock(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _StartButton(onPressed: () => _start(routine)),
            const SizedBox(height: 20),
            Text(
              routineSummary(routine),
              textAlign: TextAlign.center,
              style: textTheme.bodyLarge?.copyWith(color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    };
  }
}

/// Brand, greeting and date at the top; [child] fills the rest, centred.
/// Scrolls when it doesn't fit (very large system font, phone in landscape).
class _HomeLayout extends StatelessWidget {
  const _HomeLayout({required this.now, required this.child});

  final DateTime now;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 640 + 48),
            child: CustomScrollView(
              slivers: [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: BrandMark(),
                        ),
                        const SizedBox(height: 28),
                        Semantics(
                          header: true,
                          child: Text(
                            greetingFor(now),
                            style: textTheme.headlineLarge,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          longDate(now),
                          style: textTheme.bodyLarge?.copyWith(
                            color: AppColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 28),
                        Expanded(child: child),
                      ],
                    ),
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

/// The one big button of the home screen
class _StartButton extends StatelessWidget {
  const _StartButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(280),
        padding: const EdgeInsets.all(24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        textStyle: const TextStyle(
          fontFamily: 'Figtree',
          fontSize: 34,
          fontWeight: FontWeight.w800,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.play_arrow_rounded,
              size: 80,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 24),
          const Text('Empezar entreno', textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

/// Icon, title, text and an optional card: the screens without a button
class _Message extends StatelessWidget {
  const _Message({
    required this.icon,
    required this.title,
    required this.text,
    this.card,
  });

  final IconData icon;
  final String title;
  final String text;
  final Widget? card;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconBadge(icon: icon),
        const SizedBox(height: 28),
        Text(
          title,
          textAlign: TextAlign.center,
          style: textTheme.headlineMedium,
        ),
        const SizedBox(height: 16),
        Text(text, textAlign: TextAlign.center, style: textTheme.bodyLarge),
        if (card != null) ...[
          const SizedBox(height: 24),
          InfoCard(child: card!),
        ],
      ],
    );
  }
}
