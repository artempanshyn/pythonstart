function normalizeAnswer(answer) {
  // Дозволяємо горизонтальні пробіли у формах вправ цього набору.
  return answer
    .replace(/^([A-Za-z_]\w*)[ \t]*=[ \t]*([+-]?\d+)$/, "$1=$2")
    .replace(/^([A-Za-z_]\w*)[ \t]*\([ \t]*([+-]?\d+)[ \t]*\)$/, "$1($2)");
}

export function validateExerciseAnswer(userInput, expectedAnswer) {
  const input = String(userInput ?? "").trim();
  if (input === "") {
    return {
      status: "empty",
      isCorrect: false,
      messageKey: "exercise.emptyWarning",
    };
  }

  const expected = String(expectedAnswer ?? "").trim();
  const isCorrect = normalizeAnswer(input) === normalizeAnswer(expected);
  return {
    status: isCorrect ? "success" : "error",
    isCorrect,
    messageKey: isCorrect ? "exercise.correct" : "exercise.incorrect",
  };
}
