import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme.dart';

/// How the countdown looks: a ring (timed exercises) or big digits (rests)
enum CountdownStyle { ring, digits }

/// A countdown ("0:45"). Counts while [running] is true (false = paused) and
/// calls [onFinished] once at zero, with a vibration so the patient notices
/// without looking. Raising [seconds] while it runs adds that time ("+30 s").
///
/// Screen readers hear the time left every 10 seconds (every second at the
/// very end), not on every tick.
class Countdown extends StatefulWidget {
  const Countdown({
    super.key,
    required this.seconds,
    required this.running,
    required this.onFinished,
    this.style = CountdownStyle.ring,
  });

  final int seconds;
  final bool running;
  final VoidCallback onFinished;
  final CountdownStyle style;

  @override
  State<Countdown> createState() => _CountdownState();
}

class _CountdownState extends State<Countdown> {
  late int _total = widget.seconds;
  late int _left = widget.seconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (widget.running) _start();
  }

  @override
  void didUpdateWidget(Countdown old) {
    super.didUpdateWidget(old);
    if (widget.seconds > old.seconds) {
      final extra = widget.seconds - old.seconds;
      setState(() {
        _total += extra;
        _left += extra;
      });
    }
    if (widget.running && !old.running) _start();
    if (!widget.running && old.running) _stop();
  }

  void _start() {
    _timer ??= Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _left--);
      if (_left <= 0) {
        _stop();
        HapticFeedback.heavyImpact();
        widget.onFinished();
      }
    });
  }

  void _stop() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  void dispose() {
    _stop();
    super.dispose();
  }

  /// What a screen reader says: rounded up to 10 s, exact in the last 5 s
  String get _spoken {
    final value = _left <= 5 ? _left : (_left / 10).ceil() * 10;
    if (!widget.running && _left < _total) {
      return 'En pausa. Quedan $value segundos';
    }
    return value == 1 ? 'Queda 1 segundo' : 'Quedan $value segundos';
  }

  @override
  Widget build(BuildContext context) {
    final minutes = _left ~/ 60;
    final seconds = (_left % 60).toString().padLeft(2, '0');
    final textTheme = Theme.of(context).textTheme;
    final digits = Text(
      '$minutes:$seconds',
      textAlign: TextAlign.center,
      style: textTheme.displayLarge?.copyWith(
        fontSize: widget.style == CountdownStyle.ring ? 72 : 96,
        height: 1,
        color: widget.style == CountdownStyle.ring
            ? AppColors.text
            : AppColors.primaryDark,
        // Equal-width digits, so the numbers don't jump as they change
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
    );

    return Semantics(
      liveRegion: true,
      label: _spoken,
      child: ExcludeSemantics(
        child: widget.style == CountdownStyle.digits
            ? digits
            : Center(
                child: SizedBox.square(
                  dimension: 260,
                  child: CustomPaint(
                    painter: _RingPainter(
                      progress: _total == 0 ? 1 : 1 - _left / _total,
                    ),
                    child: Center(
                      child: FittedBox(
                        child: Padding(
                          padding: const EdgeInsets.all(40),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              digits,
                              Text(
                                widget.running || _left == _total
                                    ? 'de ${_describe(_total)}'
                                    : 'En pausa',
                                style: textTheme.bodyLarge?.copyWith(
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
      ),
    );
  }
}

/// "1 minuto", "1 min 30 s", "45 segundos"
String _describe(int seconds) {
  final m = seconds ~/ 60;
  final s = seconds % 60;
  if (m == 0) return '$s segundos';
  if (s == 0) return m == 1 ? '1 minuto' : '$m minutos';
  return '$m min $s s';
}

/// White disc with a grey track and a teal arc that grows as time passes
class _RingPainter extends CustomPainter {
  _RingPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 18.0;
    final center = size.center(Offset.zero);
    final radius = size.width / 2 - stroke / 2;
    canvas.drawCircle(center, radius, Paint()..color = AppColors.surface);
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = AppColors.border
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke,
    );
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      Paint()
        ..color = AppColors.primary
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress;
}
