import 'package:flutter/material.dart';
import 'package:flutter_zxing/flutter_zxing.dart';

import '../../core/api_client.dart';
import 'connected_screen.dart';
import 'pairing_api.dart';
import 'pairing_code.dart';
import 'type_code_screen.dart';

/// Scanning the QR on the connection sheet with the camera.
///
/// This is the only file that uses the scanner library (flutter_zxing: ZXing C++
/// decoding on the phone, nothing sent anywhere). Swapping the library later
/// means changing only this screen.
class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  /// True while a code is being sent to the API: ignore further scans
  bool _sending = false;
  String? _message;
  bool _cameraFailed = false;

  /// The camera keeps reading the same QR several times per second. A code the
  /// API refused is never sent again, and after any other error (no internet,
  /// too many attempts) we wait a little before trying again.
  final _refusedCodes = <String>{};
  DateTime _pausedUntil = DateTime(0);

  Future<void> _onScan(Code result) async {
    if (_sending || !result.isValid || result.text == null) return;
    if (DateTime.now().isBefore(_pausedUntil)) return;
    debugPrint('QR decoded in ${result.duration} ms');

    final code = parsePairingCode(result.text!);
    if (code == null) {
      setState(() => _message = 'Este código no es el de la hoja de conexión.');
      return;
    }
    if (_refusedCodes.contains(code)) return; // its message is already shown

    setState(() {
      _sending = true;
      _message = null;
    });
    try {
      await pairDevice(code);
      if (mounted) goToConnected(context);
    } on ApiException catch (e) {
      if (e.status == 400) {
        _refusedCodes.add(code);
      } else {
        // 429 = the API's limit (5 attempts per minute): retrying sooner would
        // only count as more attempts and keep the patient locked out
        _pausedUntil = DateTime.now().add(
          Duration(seconds: e.status == 429 ? 60 : 3),
        );
      }
      _showError(e);
    } catch (e) {
      _pausedUntil = DateTime.now().add(const Duration(seconds: 3));
      _showError(e);
    }
  }

  void _showError(Object error) {
    if (!mounted) return;
    setState(() {
      _sending = false;
      _message = pairingErrorMessage(error);
    });
  }

  void _onCamera(Object? controller, Exception? error) {
    if (error != null && mounted) {
      debugPrint('Camera error: $error');
      setState(() => _cameraFailed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Volver'),
        titleSpacing: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _cameraFailed
                    ? 'No se puede usar la cámara. Puede escribir el código a mano.'
                    : 'Apunte la cámara al cuadro de la hoja de conexión.',
                style: textTheme.bodyLarge,
              ),
              const SizedBox(height: 16),
              Expanded(
                child: _cameraFailed
                    ? const Icon(Icons.no_photography, size: 120)
                    : ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            // RepaintBoundary: flutter_zxing 3.1.0 draws the scan
                            // box relative to the screen's corner instead of its
                            // own; painting in a separate layer puts it in place.
                            RepaintBoundary(
                              child: ReaderWidget(
                                codeFormat: Format.qrCode,
                                onScan: _onScan,
                                onControllerCreated: _onCamera,
                                cropPercent: 0.8, // big target: easier to aim
                                scanDelay: const Duration(milliseconds: 200),
                                showGallery: false,
                                showToggleCamera: false,
                                showFlashlight: true,
                              ),
                            ),
                            if (_sending)
                              const ColoredBox(
                                color: Colors.black54,
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              ),
                          ],
                        ),
                      ),
              ),
              if (_message != null) ...[
                const SizedBox(height: 16),
                Text(
                  _message!,
                  style: textTheme.bodyLarge?.copyWith(
                    color: Colors.red.shade900,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              OutlinedButton.icon(
                icon: const Icon(Icons.keyboard, size: 32),
                label: const Text('Escribir el código'),
                onPressed: () => Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const TypeCodeScreen()),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
