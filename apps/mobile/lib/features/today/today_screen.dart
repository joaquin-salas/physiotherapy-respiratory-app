import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/screen_layout.dart';
import '../../core/token_storage.dart';
import '../pairing/welcome_screen.dart';
import '../workout/workout_screen.dart';
import 'program.dart';
import 'program_api.dart';
import 'todays_routine.dart';

/// The home screen: no program yet / rest day / today's workout with "Empezar".
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
      return ScreenLayout(
        title: 'Hoy',
        body: [Text(error, style: textTheme.bodyLarge)],
        buttons: [
          FilledButton(
            onPressed: () {
              setState(() => _error = null);
              _load();
            },
            child: const Text('Reintentar'),
          ),
        ],
      );
    }

    return switch (today) {
      null => const Scaffold(body: Center(child: CircularProgressIndicator())),
      NoProgram() => ScreenLayout(
        title: 'Hoy',
        body: [
          Text(
            'Su fisioterapeuta todavía está preparando sus ejercicios. '
            'Cuando estén listos, aparecerán aquí.',
            style: textTheme.bodyLarge,
          ),
        ],
      ),
      RestDay(:final nextTrainingDay) => ScreenLayout(
        title: 'Hoy toca descansar',
        body: [
          Icon(
            Icons.spa,
            size: 120,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 24),
          Text(
            'Descansar también forma parte del tratamiento.',
            style: textTheme.bodyLarge,
          ),
          if (nextTrainingDay != null) ...[
            const SizedBox(height: 16),
            Text(
              'Su próximo entreno es el ${_weekdayName(nextTrainingDay)}.',
              style: textTheme.bodyLarge,
            ),
          ],
        ],
      ),
      TrainingDay(:final routine) => ScreenLayout(
        title: 'Su entreno de hoy',
        body: [
          Text(
            '${routine.exercises.length} ejercicios:',
            style: textTheme.bodyLarge,
          ),
          const SizedBox(height: 8),
          for (final line in routine.exercises)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text(
                '•  ${line.exercise.name}',
                style: textTheme.bodyLarge,
              ),
            ),
        ],
        buttons: [
          FilledButton.icon(
            icon: const Icon(Icons.play_arrow, size: 36),
            label: const Text('Empezar'),
            onPressed: () => _start(routine),
          ),
        ],
      ),
    };
  }
}

const _weekdayNames = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];

String _weekdayName(DateTime day) => _weekdayNames[day.weekday - 1];
