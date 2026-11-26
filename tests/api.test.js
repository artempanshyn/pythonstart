import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fetchDailyTips, loadPythonTipData } from "../js/api.js";

const payload = JSON.parse(await readFile(new URL("../data/daily-tips.json", import.meta.url), "utf8"));
const repo = {
  stargazers_count: 0,
  open_issues_count: 0,
  language: "Python",
  html_url: "https://github.com/python/cpython",
};
let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

it("отримує поради й живі лічильники, включно з нульовими", async () => {
  fetchMock.mockImplementation(async (url) => Response.json(url.startsWith("https:") ? repo : payload));

  const data = await loadPythonTipData();

  expect(fetchMock).toHaveBeenCalledTimes(2);
  for (const [, options] of fetchMock.mock.calls) {
    expect(options.method).toBe("GET");
    expect(options.signal).toBeInstanceOf(AbortSignal);
  }
  expect(data.ok).toBe(true);
  expect(data.tips).toHaveLength(4);
  expect(data.repoStats).toEqual({ stars: 0, openIssues: 0, language: "Python", htmlUrl: repo.html_url });
});

it("перемикається на резервну пораду після навмисного HTTP 404", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

  const data = await loadPythonTipData({ simulateError: true });

  expect(fetchMock).toHaveBeenCalledExactlyOnceWith("./data/non-existent-404.json", expect.any(Object));
  expect(data.ok).toBe(false);
  expect(data.tips[0].id).toBe("fallback-pep8");
  expect(data.repoStats).toBeNull();
  expect(data.errorMessage).toBe("HTTP 404");
});

it("використовує вбудовані поради при розриві мережі", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

  const data = await loadPythonTipData();

  expect(data.ok).toBe(false);
  expect(data.tips[0].id).toBe("fallback-pep8");
  expect(data.errorMessage).toBe("Failed to fetch");
});

it("зберігає поради з локального JSON при обмеженні GitHub", async () => {
  fetchMock.mockImplementation(async (url) => url.startsWith("https:")
    ? new Response(null, { status: 429 })
    : Response.json(payload));

  const data = await loadPythonTipData();

  expect(data.ok).toBe(true);
  expect(data.tips).toEqual(payload.tips);
  expect(data.repoStats).toBeNull();
  expect(data.sourceLabel).toMatch(/статистика недоступна/);
});

it("повертає резервний набір після пошкодженого JSON порад", async () => {
  fetchMock.mockImplementation(async (url) => url.startsWith("https:")
    ? Response.json(repo)
    : new Response("{invalid"));

  const data = await loadPythonTipData();

  expect(data.ok).toBe(false);
  expect(data.tips[0].id).toBe("fallback-pep8");
});

it("відхиляє неповні поради, дублікати та порожній масив", async () => {
  for (const tips of [[], [{ id: "incomplete" }], [payload.tips[0], payload.tips[0]]]) {
    fetchMock.mockResolvedValueOnce(Response.json({ tips }));

    await expect(fetchDailyTips()).rejects.toThrow(/Некоректний формат порад/);
  }
});
