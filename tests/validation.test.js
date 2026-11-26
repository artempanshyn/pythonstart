import { describe, expect, it } from "vitest";
import { diagnoseStudentMistake, normalizeAnswer, validateExerciseAnswer } from "../js/validation.js";

describe("normalizeAnswer", () => {
  it.each([
    ["  15  ", "15"],
    ["  Зараховано  ", "Зараховано"],
    [null, ""],
    [undefined, ""],
    ["x\t=    5", "x=5"],
    ["range ( 5 )", "range(5)"],
    ["x\n= 5", "x\n= 5"],
    ["x = 1 5", "x = 1 5"],
  ])("нормалізує %j до %j", (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected);
  });
});

describe("validateExerciseAnswer", () => {
  const outcomes = {
    empty: { status: "empty", isCorrect: false, messageKey: "exercise.emptyWarning" },
    success: { status: "success", isCorrect: true, messageKey: "exercise.correct" },
    error: { status: "error", isCorrect: false, messageKey: "exercise.incorrect" },
  };

  it.each([
    ["порожній рядок", "", "x = 5", "empty"],
    ["лише пробіли і переноси", " \t\n ", "x = 5", "empty"],
    ["відсутня відповідь", undefined, "x = 5", "empty"],
    ["відсутній еталон", "x = 5", null, "error"],
    ["точне присвоєння", "x = 5", "x = 5", "success"],
    ["пробіли й табуляція біля =", "  x\t=    5  ", "x = 5", "success"],
    ["присвоєння без пробілів", "x=5", "x = 5", "success"],
    ["інший регістр імені", "X = 5", "x = 5", "error"],
    ["інший регістр функції Python", "PRINT", "print", "error"],
    ["інше число", "x = 4", "x = 5", "error"],
    ["перенос усередині виразу", "x\n= 5", "x = 5", "error"],
    ["пробіл усередині числа", "x = 1 5", "x = 15", "error"],
    ["відповідь до умови", " : ", ":", "success"],
    ["виклик range із пробілами", "range ( 5 )", "range(5)", "success"],
    ["неправильна межа range", "range(4)", "range(5)", "error"],
  ])("%s", (_name, input, expected, status) => {
    const result = validateExerciseAnswer(input, expected);

    expect(result).toEqual(outcomes[status]);
  });
});

describe("diagnoseStudentMistake", () => {
  it.each([
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
    ["довільна помилка", "12.5", "15", null],
    ["відсутні значення", null, undefined, null],
  ])("%s", (_name, input, expected, hint) => {
    const result = diagnoseStudentMistake(input, expected);

    expect(result).toBe(hint === null ? null : `exercise.diagnostic.${hint}`);
  });
});
