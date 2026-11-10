import 'package:flutter/material.dart';

import '../../../core/app_widgets.dart';
import '../../../core/screen_layout.dart';
import '../../../core/theme.dart';

/// A risky answer in the safety check: no training today. Warm colours, not an
/// alarm. TODO(workout log): the physio isn't alerted yet; the text already says
/// so because the app isn't in production.
class StopTodayView extends StatelessWidget {
  const StopTodayView({super.key, required this.onFinish});

  final VoidCallback onFinish;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return ScreenLayout(
      centered: true,
      body: [
        const Align(
          alignment: Alignment.centerLeft,
          child: IconBadge(
            icon: Icons.favorite_border,
            size: 112,
            background: AppColors.warningBg,
            color: AppColors.warningText,
          ),
        ),
        const SizedBox(height: 24),
        Semantics(
          header: true,
          child: Text('Hoy mejor no entrene', style: textTheme.headlineLarge),
        ),
        const SizedBox(height: 16),
        Text(
          'Por su respuesta, hoy es mejor descansar y cuidarse. '
          'Mañana lo volvemos a mirar.',
          style: textTheme.bodyLarge,
        ),
        const SizedBox(height: 20),
        InfoCard(
          child: Text(
            'Su fisioterapeuta recibirá un aviso.',
            style: textTheme.bodyLarge,
          ),
        ),
        const SizedBox(height: 12),
        InfoCard(
          background: AppColors.warningBg,
          bordered: false,
          child: Text(
            'Si se encuentra muy mal, llame al 112.',
            style: textTheme.bodyLarge?.copyWith(
              color: AppColors.warningText,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
      buttons: [
        FilledButton(onPressed: onFinish, child: const Text('Entendido')),
      ],
    );
  }
}
