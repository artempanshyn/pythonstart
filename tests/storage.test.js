import assert from "node:assert/strict";
import test from "node:test";
import { loadProgress, markTopicAsCompleted, resetProgress, saveProgress, STORAGE_KEY } from "../js/storage.js";

function memoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
}

const initial = { completedTopics: [], activeTopicId: "variables", totalScore: 0 };

test("нове й пошкоджене сховище повертають початковий стан", () => {
  const storage = memoryStorage();
  assert.deepEqual(loadProgress(storage), initial);
  storage.setItem(STORAGE_KEY, "{пошкоджений JSON");
  assert.deepEqual(loadProgress(storage), initial);
});

test("після запису відновлюються дві теми та остання вибрана тема", () => {
  const storage = memoryStorage();
  const first = markTopicAsCompleted(loadProgress(storage), "variables");
  const second = markTopicAsCompleted({ ...first, activeTopicId: "conditions" }, "conditions");
  assert.equal(saveProgress(second, storage), true);
  assert.deepEqual(loadProgress(storage), {
    completedTopics: ["variables", "conditions"], activeTopicId: "conditions", totalScore: 20,
  });
});

test("бали нараховуються один раз і лише за відому тему", () => {
  const first = markTopicAsCompleted(initial, "variables");
  assert.equal(first.totalScore, 10);
  assert.deepEqual(initial.completedTopics, []);
  assert.equal(markTopicAsCompleted(first, "variables"), first);
  assert.equal(markTopicAsCompleted(first, "unknown"), first);
});

test("під час читання прибираються дублікати, а бали перераховуються", () => {
  const storage = memoryStorage();
  saveProgress({ completedTopics: ["loops", "unknown", "loops"], activeTopicId: "unknown", totalScore: 150 }, storage);
  assert.deepEqual(loadProgress(storage), {
    completedTopics: ["loops"], activeTopicId: "variables", totalScore: 10,
  });
});

test("скидання видаляє лише ключ прогресу", () => {
  const storage = memoryStorage();
  storage.setItem("another-key", "value");
  saveProgress(markTopicAsCompleted(initial, "variables"), storage);
  assert.equal(resetProgress(storage), true);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.deepEqual(loadProgress(storage), initial);
  assert.equal(storage.getItem("another-key"), "value");
});

test("вимкнене сховище не перериває читання та перевірку вправи", () => {
  const denied = () => { throw new Error("Сховище недоступне"); };
  const storage = { getItem: denied, setItem: denied, removeItem: denied };
  assert.deepEqual(loadProgress(storage), initial);
  assert.equal(saveProgress(initial, storage), false);
  assert.equal(resetProgress(storage), false);
});
