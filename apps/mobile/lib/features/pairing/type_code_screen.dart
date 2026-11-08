import 'package:flutter/material.dart';

import '../../core/screen_layout.dart';
import 'connected_screen.dart';
import 'pairing_api.dart';
import 'pairing_code.dart';

/// Typing the code from the connection sheet, when scanning isn't possible
class TypeCodeScreen extends StatefulWidget {
  const TypeCodeScreen({super.key});

  @override
  State<TypeCodeScreen> createState() => _TypeCodeScreenState();
}

class _TypeCodeScreenState extends State<TypeCodeScreen> {
  final _controller = TextEditingController();
  bool _sending = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _connect() async {
    final code = parsePairingCode(_controller.text);
    if (code == null) {
      setState(() {
        _error =
            'El código tiene 10 letras y números. Revíselo en la hoja '
            '(por ejemplo: K7QM4-XPT9W).';
      });
      return;
    }

    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await pairDevice(code);
      if (mounted) goToConnected(context);
    } catch (e) {
      setState(() {
        _sending = false;
        _error = pairingErrorMessage(e);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return ScreenLayout(
      title: 'Escriba el código',
      showBack: true,
      body: [
        Text(
          'Está en la hoja de conexión, debajo del dibujo cuadrado.',
          style: textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),
        TextField(
          controller: _controller,
          enabled: !_sending,
          autofocus: true,
          textCapitalization: TextCapitalization.characters,
          autocorrect: false,
          enableSuggestions: false,
          maxLength: 11, // 10 characters + the dash
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 34,
            fontFamily: 'monospace',
            fontWeight: FontWeight.bold,
            letterSpacing: 4,
          ),
          decoration: const InputDecoration(
            hintText: 'XXXXX-XXXXX',
            counterText: '',
          ),
          onSubmitted: (_) => _connect(),
        ),
        if (_error != null) ...[
          const SizedBox(height: 16),
          Text(
            _error!,
            style: textTheme.bodyLarge?.copyWith(color: Colors.red.shade900),
          ),
        ],
      ],
      buttons: [
        FilledButton(
          onPressed: _sending ? null : _connect,
          child: _sending
              ? const CircularProgressIndicator()
              : const Text('Conectar'),
        ),
      ],
    );
  }
}
