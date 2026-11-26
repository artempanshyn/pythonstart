import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadProgress, markTopicAsCompleted, resetProgress, saveProgress, STORAGE_KEY } from "../js/storage.js";

const initial = { completedTopics: [], activeTopicId: "variables", totalScore: 0 };
let storage;

beforeEach(() => {
  const values = new Map();
  storage = {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  };
  vi.stubGlobal("localStorage", storage);
});

afterEach(() => vi.unstubAllGlobals());

describe("loadProgress", () => {
  it("повертає початковий стан для порожнього сховища", () => {
    expect(loadProgress()).toEqual(initial);
    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it("повертає початковий стан після пошкодженого JSON", () => {
    storage.setItem(STORAGE_KEY, "{broken");

    const progress = loadProgress();

    expect(progress).toEqual(initial);
  });

  it("прибирає дублікати й невідомі id та перераховує бали", () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({
      completedTopics: ["loops", "unknown", "loops"],
      activeTopicId: "unknown",
      totalScore: 150,
    }));

    const progress = loadProgress();

    expect(progress).toEqual({ completedTopics: ["loops"], activeTopicId: "variables", totalScore: 10 });
  });

  it("відновлює дані старого запису і останню вибрану тему", () => {
    const saved = { completedTopics: ["variables", "conditions"], activeTopicId: "conditions", totalScore: 20 };

    const written = saveProgress(saved);
    const restored = loadProgress();

    expect(written).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(saved));
    expect(restored).toEqual(saved);
  });
});

describe("markTopicAsCompleted", () => {
  it("нараховує 10 балів за нову тему, зберігаючи вхідний стан", () => {
    const progress = markTopicAsCompleted(initial, "lists");

    expect(progress).toEqual({ ...initial, completedTopics: ["lists"], totalScore: 10 });
    expect(initial.completedTopics).toEqual([]);
  });

  it("зберігає стан для повторної та невідомої тем", () => {
    const first = markTopicAsCompleted(initial, "variables");

    expect(markTopicAsCompleted(first, "variables")).toBe(first);
    expect(markTopicAsCompleted(first, "unknown")).toBe(first);
  });
});

describe("resetProgress", () => {
  it("видаляє лише ключ PythonStart", () => {
    storage.setItem("another-key", "value");
    saveProgress(markTopicAsCompleted(initial, "variables"));

    const reset = resetProgress();

    expect(reset).toBe(true);
    expect(storage.removeItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
    expect(loadProgress()).toEqual(initial);
    expect(storage.getItem("another-key")).toBe("value");
  });

  it("обробляє заборону читання, запису та видалення", () => {
    const denied = () => { throw new Error("Сховище недоступне"); };
    vi.stubGlobal("localStorage", { getItem: denied, setItem: denied, removeItem: denied });

    expect(loadProgress()).toEqual(initial);
    expect(saveProgress(initial)).toBe(false);
    expect(resetProgress()).toBe(false);
  });
});
