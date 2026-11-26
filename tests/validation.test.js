import assert from "node:assert/strict";
import { test } from "node:test";
import { topics } from "../data/topics.js";
import { t } from "../js/i18n.js";
import { validateExerciseAnswer } from "../js/validation.js";

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

test("три теми мають окремі ідентифікатори й перевірювані еталони", () => {
  assert.deepEqual(topics.map(({ id }) => id), ["variables", "conditions", "loops"]);
  for (const topic of topics) {
    for (const field of ["stepLabel", "title", "description", "theory", "codeExample", "tip", "task", "hint", "correctAnswer"]) {
      assert.ok(topic[field].trim(), `${topic.id}: ${field}`);
    }
    assert.equal(validateExerciseAnswer(topic.correctAnswer, topic.correctAnswer).status, "success");
  }
});

test("невідомий ключ і успадкована властивість лишаються ключами", () => {
  assert.equal(t("exercise.unknown"), "exercise.unknown");
  assert.equal(t("constructor"), "constructor");
});
