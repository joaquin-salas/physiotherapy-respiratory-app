/// Where the API lives. Set at build time:
///   flutter run --dart-define=API_URL=https://api.example.com/api
/// The default reaches the API running on this PC from the Android emulator
/// (10.0.2.2 is the emulator's alias for the host computer's localhost).
const apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:3000/api',
);
