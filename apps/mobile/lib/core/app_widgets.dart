import 'package:flutter/material.dart';

import 'theme.dart';

/// "Respira" with the heartbeat line of the logo (same shape as the panel's mark)
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 20});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CustomPaint(
          size: Size.square(size * 1.4),
          painter: _HeartbeatPainter(),
        ),
        SizedBox(width: size / 2),
        Text(
          'Respira',
          style: TextStyle(
            fontSize: size,
            fontWeight: FontWeight.w700,
            color: AppColors.primary,
          ),
        ),
      ],
    );
  }
}

class _HeartbeatPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // The logo's path on a 28×28 grid: flat, up, deep down, up, flat
    final s = size.width / 28;
    final path = Path()
      ..moveTo(2 * s, 14 * s)
      ..lineTo(8 * s, 14 * s)
      ..lineTo(11 * s, 7 * s)
      ..lineTo(17 * s, 21 * s)
      ..lineTo(20 * s, 14 * s)
      ..lineTo(26 * s, 14 * s);
    canvas.drawPath(
      path,
      Paint()
        ..color = AppColors.primary
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5 * s
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_HeartbeatPainter old) => false;
}

/// A big icon in a circle, at the top of the message screens. Decorative.
class IconBadge extends StatelessWidget {
  const IconBadge({
    super.key,
    required this.icon,
    this.size = 160,
    this.background = AppColors.accent,
    this.color = AppColors.primary,
  });

  final IconData icon;
  final double size;
  final Color background;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: Center(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(color: background, shape: BoxShape.circle),
          child: Icon(icon, size: size / 2, color: color),
        ),
      ),
    );
  }
}

/// A white box with a border for a short piece of information
class InfoCard extends StatelessWidget {
  const InfoCard({
    super.key,
    required this.child,
    this.background = AppColors.surface,
    this.bordered = true,
  });

  final Widget child;
  final Color background;
  final bool bordered;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(18),
        border: bordered ? Border.all(color: AppColors.border, width: 2) : null,
      ),
      child: child,
    );
  }
}
