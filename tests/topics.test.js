import { describe, expect, it } from "vitest";
import { topics } from "../data/topics.js";
import { filterTopicsData, getCatalogStats, getTopicById } from "../js/topics.js";

const ids = (items) => items.map(({ id }) => id);

describe("filterTopicsData", () => {
  it.each([
    ["списки", "lists"],
    ["   ЦИКЛИ   ", "loops"],
    ["індексом", "lists"],
    ["   УМОВИ   IF   ", "conditions"],
    ["за\t  індексом", "lists"],
    ["і\u0308х", "variables"],
  ])("знаходить тему за запитом %j", (searchQuery, expected) => {
    const found = filterTopicsData(topics, { searchQuery });

    expect(ids(found)).toEqual([expected]);
  });

  it.each(["", "  ", null])("повертає всі теми для запиту %j", (searchQuery) => {
    const found = filterTopicsData(topics, { searchQuery });

    expect(found).toEqual(topics);
  });

  it("об’єднує пошук зі станом опрацювання", () => {
    const completedTopics = ["variables", "conditions"];
    const done = filterTopicsData(topics, { filter: "completed", completedTopics });
    const pending = filterTopicsData(topics, { filter: "pending", completedTopics });
    const match = filterTopicsData(topics, { filter: "completed", searchQuery: "ЗМІННІ", completedTopics });
    const excluded = filterTopicsData(topics, { filter: "pending", searchQuery: "ЗМІННІ", completedTopics });

    expect(ids(done)).toEqual(["variables", "conditions"]);
    expect(ids(pending)).toEqual(["loops", "lists"]);
    expect(ids(match)).toEqual(["variables"]);
    expect(excluded).toEqual([]);
  });

  it("повертає [] без збігів і зберігає вихідні дані", () => {
    const snapshot = structuredClone(topics);
    const found = filterTopicsData(topics, { searchQuery: "<em>запит</em>" });

    expect(found).toEqual([]);
    expect(topics).toEqual(snapshot);
  });

  it("для відсутнього набору повертає порожній масив", () => {
    expect(filterTopicsData(null)).toEqual([]);
  });

  it.each([null, {}, 10, "variables"])("вважає відсутнім список прогресу %j", (completedTopics) => {
    const done = filterTopicsData(topics, { filter: "completed", completedTopics });
    const pending = filterTopicsData(topics, { filter: "pending", completedTopics });

    expect(done).toEqual([]);
    expect(pending).toEqual(topics);
  });
});

describe("getCatalogStats", () => {
  it("рахує лише наявні опрацьовані теми", () => {
    const completedTopics = ["variables", "loops", "loops", "unknown"];

    const stats = getCatalogStats(topics, completedTopics);

    expect(stats).toEqual({ total: 4, completed: 2, remaining: 2, percent: 50 });
  });

  it("повертає нулі для порожнього каталогу", () => {
    const stats = getCatalogStats([], ["variables"]);

    expect(stats).toEqual({ total: 0, completed: 0, remaining: 0, percent: 0 });
  });

  it("обробляє відсутній список прогресу", () => {
    const stats = getCatalogStats(topics, null);

    expect(stats).toEqual({ total: 4, completed: 0, remaining: 4, percent: 0 });
  });
});

describe("getTopicById", () => {
  it("розрізняє наявний і невідомий id", () => {
    expect(getTopicById("lists")?.id).toBe("lists");
    expect(getTopicById("unknown")).toBeUndefined();
  });
});
