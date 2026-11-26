import { describe, expect, it } from "vitest";
import { topics } from "../data/topics.js";
import { t } from "../js/i18n.js";
import { validateExerciseAnswer } from "../js/validation.js";

describe("локалізація", () => {
  it.each([
    ["exercise.correct", "Правильно!"],
    ["catalog.completed", "✓ Опрацьовано"],
    ["progress.resetDone", "Прогрес скинуто."],
  ])("перекладає %s", (key, copy) => {
    expect(t(key)).toBe(copy);
  });

  it.each(["exercise.unknown", "constructor", "__proto__"])("повертає невідомий ключ %s", (key) => {
    expect(t(key)).toBe(key);
  });

  it.each([
    "emptyWarning", "correct", "incorrect", "diagnostic.print", "diagnostic.extraQuotes",
    "diagnostic.missingQuotes", "diagnostic.case", "diagnostic.offByOne",
  ])("містить текст для exercise.%s", (suffix) => {
    const key = `exercise.${suffix}`;

    expect(t(key)).not.toBe(key);
    expect(t(key).trim()).not.toBe("");
  });
});

describe("контракт каталогу", () => {
  const fields = [
    "id", "stepLabel", "title", "description", "theory", "codeExample", "tip", "task", "hint", "correctAnswer",
  ];

  it("містить чотири теми з унікальними ідентифікаторами", () => {
    const ids = topics.map(({ id }) => id);

    expect(ids).toEqual(["variables", "conditions", "loops", "lists"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(topics)("тема $id має непорожні поля й коректний еталон", (topic) => {
    for (const field of fields) {
      expect(topic[field], field).toBeTypeOf("string");
      expect(topic[field].trim(), field).not.toBe("");
    }
    expect(validateExerciseAnswer(topic.correctAnswer, topic.correctAnswer).isCorrect).toBe(true);
  });
});
