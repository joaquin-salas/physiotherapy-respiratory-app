import 'dart:async';

import 'package:flutter/material.dart';

/// A big countdown ("1:30") with a progress bar. Counts while [running] is true
/// and calls [onFinished] once when it reaches zero.
class Countdown extends StatefulWidget {
  const Countdown({
    super.key,
    required this.seconds,
    required this.running,
    required this.onFinished,
  });

  final int seconds;
  final bool running;
  final VoidCallback onFinished;

  @override
  State<Countdown> createState() => _CountdownState();
}

class _CountdownState extends State<Countdown> {
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
    if (widget.running && !old.running) _start();
  }

  void _start() {
    _timer ??= Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _left--);
      if (_left <= 0) {
        timer.cancel();
        widget.onFinished();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final minutes = _left ~/ 60;
    final seconds = (_left % 60).toString().padLeft(2, '0');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '$minutes:$seconds',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.displayLarge?.copyWith(
            fontWeight: FontWeight.bold,
            // Equal-width digits, so the numbers don't jump as they change
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
        const SizedBox(height: 12),
        LinearProgressIndicator(
          value: 1 - _left / widget.seconds,
          minHeight: 12,
          borderRadius: BorderRadius.circular(6),
        ),
      ],
    );
  }
}
