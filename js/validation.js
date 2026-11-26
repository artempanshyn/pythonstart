export function normalizeAnswer(answer) {
  // Дозволяємо горизонтальні пробіли у формах вправ цього набору.
  return String(answer ?? "").trim()
    .replace(/^([A-Za-z_]\w*)[ \t]*=[ \t]*([+-]?\d+)$/, "$1=$2")
    .replace(/^([A-Za-z_]\w*)[ \t]*\([ \t]*([+-]?\d+)[ \t]*\)$/, "$1($2)");
}

export function validateExerciseAnswer(userInput, expectedAnswer) {
  const input = normalizeAnswer(userInput);
  if (input === "") {
    return {
      status: "empty",
      isCorrect: false,
      messageKey: "exercise.emptyWarning",
    };
  }

  const isCorrect = input === normalizeAnswer(expectedAnswer);
  return {
    status: isCorrect ? "success" : "error",
    isCorrect,
    messageKey: isCorrect ? "exercise.correct" : "exercise.incorrect",
  };
}

function withoutQuotes(text) {
  const [first] = text;
  if (text.length < 2 || (first !== '"' && first !== "'") || text.at(-1) !== first) return null;
  return text.slice(1, -1);
}

export function diagnoseStudentMistake(userInput, expectedAnswer) {
  const actual = String(userInput ?? "").trim();
  const expected = String(expectedAnswer ?? "").trim();
  if (!actual || !expected || normalizeAnswer(actual) === normalizeAnswer(expected)) return null;

  const printed = actual.match(/^print[ \t]*\(([^\r\n]*)\)$/)?.[1].trim();
  if (printed === expected || (printed && withoutQuotes(printed) === expected)) {
    return "exercise.diagnostic.print";
  }
  if (withoutQuotes(actual) === expected) return "exercise.diagnostic.extraQuotes";
  if (actual === withoutQuotes(expected)) return "exercise.diagnostic.missingQuotes";
  if (normalizeAnswer(actual.toLowerCase()) === normalizeAnswer(expected.toLowerCase())) {
    return "exercise.diagnostic.case";
  }

  const integer = /^[+-]?\d+$/;
  if (integer.test(actual) && integer.test(expected)) {
    const difference = BigInt(actual) - BigInt(expected);
    if (difference === 1n || difference === -1n) return "exercise.diagnostic.offByOne";
  }
  return null;
}
