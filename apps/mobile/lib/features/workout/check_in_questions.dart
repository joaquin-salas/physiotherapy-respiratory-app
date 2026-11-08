/// A yes/no question of the safety check before training. "Sí" is the risky
/// answer: any "Sí" means no training today.
class CheckInQuestion {
  const CheckInQuestion(this.text);

  final String text;
}

/// The daily safety check. Hard-coded for now: like every questionnaire, it will
/// become data (an editable table in the API) so physios can change it.
const checkInQuestions = [
  CheckInQuestion('¿Tiene fiebre hoy?'),
  CheckInQuestion('¿Tiene dolor en el pecho?'),
  CheckInQuestion('¿Le falta el aire más de lo normal?'),
];
