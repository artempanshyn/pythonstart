import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fetchDailyTips, loadPythonTipData } from "../js/api.js";

const payload = JSON.parse(await readFile(new URL("../data/daily-tips.json", import.meta.url), "utf8"));
const repo = {
  stargazers_count: 0,
  open_issues_count: 0,
  language: "Python",
  html_url: "https://github.com/python/cpython",
};

test("запити отримують поради й живі лічильники, включно з нульовими", async ({ mock }) => {
  const fetch = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.method, "GET");
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json(url.startsWith("https:") ? repo : payload);
  });
  const data = await loadPythonTipData();
  assert.equal(fetch.mock.callCount(), 2);
  assert.equal(data.ok, true);
  assert.equal(data.tips.length, 4);
  assert.deepEqual(data.repoStats, { stars: 0, openIssues: 0, language: "Python", htmlUrl: repo.html_url });
});

test("HTTP 404 навмисного запиту перемикає віджет на резервну пораду", async ({ mock }) => {
  const fetch = mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "./data/non-existent-404.json");
    return new Response(null, { status: 404 });
  });
  const data = await loadPythonTipData({ simulateError: true });
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(data.ok, false);
  assert.equal(data.tips[0].id, "fallback-pep8");
  assert.equal(data.repoStats, null);
  assert.equal(data.errorMessage, "HTTP 404");
});

test("розрив мережі повертає поради, вбудовані в модуль", async ({ mock }) => {
  mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  const data = await loadPythonTipData();
  assert.equal(data.ok, false);
  assert.equal(data.tips[0].id, "fallback-pep8");
  assert.equal(data.errorMessage, "Failed to fetch");
});

test("ліміт GitHub не заважає користуватися локальним JSON", async ({ mock }) => {
  mock.method(globalThis, "fetch", async (url) => url.startsWith("https:")
    ? new Response(null, { status: 429 })
    : Response.json(payload));
  const data = await loadPythonTipData();
  assert.equal(data.ok, true);
  assert.deepEqual(data.tips, payload.tips);
  assert.equal(data.repoStats, null);
  assert.match(data.sourceLabel, /статистика недоступна/);
});

test("пошкоджений JSON порад дає резервний набір", async ({ mock }) => {
  mock.method(globalThis, "fetch", async (url) => url.startsWith("https:")
    ? Response.json(repo)
    : new Response("{invalid"));
  const data = await loadPythonTipData();
  assert.equal(data.ok, false);
  assert.equal(data.tips[0].id, "fallback-pep8");
});

test("неповні поради, дублікати та порожній масив відхиляються", async ({ mock }) => {
  let tips;
  mock.method(globalThis, "fetch", async () => Response.json({ tips }));
  for (const invalid of [[], [{ id: "incomplete" }], [payload.tips[0], payload.tips[0]]]) {
    tips = invalid;
    await assert.rejects(fetchDailyTips(), /Некоректний формат порад/);
  }
});
