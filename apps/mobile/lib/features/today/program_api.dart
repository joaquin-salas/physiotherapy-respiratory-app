import '../../core/api_client.dart';
import 'program.dart';

/// The patient's active program, or null if the physio hasn't assigned one yet.
/// The API knows who the patient is from the session token.
Future<Program?> fetchMyProgram() async {
  final body = await ApiClient().get('/me/program');
  final program = body['program'];
  return program == null
      ? null
      : Program.fromJson(program as Map<String, dynamic>);
}
