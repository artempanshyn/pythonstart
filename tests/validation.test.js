import assert from "node:assert/strict";
import { test } from "node:test";
import { topics } from "../data/topics.js";
import { t } from "../js/i18n.js";
import { diagnoseStudentMistake, validateExerciseAnswer } from "../js/validation.js";

const expectedKeys = {
  empty: "exercise.emptyWarning",
  success: "exercise.correct",
  error: "exercise.incorrect",
};

const cases = [
  ["порожній рядок", "", "x = 5", "empty"],
  ["лише пробіли і переноси", " \t\n ", "x = 5", "empty"],
  ["відповідь відсутня", undefined, "x = 5", "empty"],
  ["еталонне присвоєння", "x = 5", "x = 5", "success"],
  ["пробіли та табуляція біля =", "  x\t=    5  ", "x = 5", "success"],
  ["присвоєння без пробілів", "x=5", "x = 5", "success"],
  ["інший регістр імені", "X = 5", "x = 5", "error"],
  ["хибне число", "x = 4", "x = 5", "error"],
  ["перенос усередині виразу", "x\n= 5", "x = 5", "error"],
  ["внутрішній пробіл у числі", "x = 1 5", "x = 15", "error"],
  ["відповідь до умови", " : ", ":", "success"],
  ["виклик range із пробілами", "range ( 5 )", "range(5)", "success"],
  ["хибна межа range", "range(4)", "range(5)", "error"],
];

for (const [name, input, expected, status] of cases) {
  test(name, () => {
    const messageKey = expectedKeys[status];
    assert.deepEqual(validateExerciseAnswer(input, expected), {
      status,
      isCorrect: status === "success",
      messageKey,
    });
    assert.notEqual(t(messageKey), messageKey);
  });
}

test("чотири теми мають окремі ідентифікатори й перевірювані еталони", () => {
  assert.deepEqual(topics.map(({ id }) => id), ["variables", "conditions", "loops", "lists"]);
  for (const topic of topics) {
    for (const field of ["stepLabel", "title", "description", "theory", "codeExample", "tip", "task", "hint", "correctAnswer"]) {
      assert.ok(topic[field].trim(), `${topic.id}: ${field}`);
    }
    assert.equal(validateExerciseAnswer(topic.correctAnswer, topic.correctAnswer).status, "success");
  }
});

const diagnostics = [
  ["команда print замість результату", " print(15) ", "15", "print"],
  ["порожня команда без еталона", "print()", "", null],
  ["зайві парні лапки", '"15"', "15", "extraQuotes"],
  ["пропущені парні лапки", "Привіт", "'Привіт'", "missingQuotes"],
  ["різний регістр", "PRINT", "print", "case"],
  ["одиниця менше", "14", "15", "offByOne"],
  ["одиниця більше", "+16", "15", "offByOne"],
  ["великі сусідні цілі", "9007199254740993", "9007199254740992", "offByOne"],
  ["великі числа з більшою різницею", "9007199254740995", "9007199254740992", null],
  ["нормалізована правильна відповідь", "range ( 5 )", "range(5)", null],
  ["невідома відповідь", "12.5", "15", null],
  ["відсутні або порожні значення", null, undefined, null],
];

for (const [name, input, expected, hint] of diagnostics) {
  test(`діагностика: ${name}`, () => {
    const key = hint && `exercise.diagnostic.${hint}`;
    assert.equal(diagnoseStudentMistake(input, expected), key);
    if (key) {
      assert.notEqual(t(key), key);
      assert.equal(validateExerciseAnswer(input, expected).isCorrect, false);
    }
  });
}

test("невідомий ключ і успадкована властивість лишаються ключами", () => {
  assert.equal(t("exercise.unknown"), "exercise.unknown");
  assert.equal(t("constructor"), "constructor");
});
