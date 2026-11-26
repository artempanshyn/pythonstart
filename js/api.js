import { t } from "./i18n.js";

const TIPS_URL = "./data/daily-tips.json";
const TEST_URL = "./data/non-existent-404.json";
const REPO_API_URL = "https://api.github.com/repos/python/cpython";
const REPO_PAGE = "https://github.com/python/cpython";
const TIP_FIELDS = ["id", "category", "title", "explanation", "codeSnippet"];

const FALLBACK_TIPS = [
  {
    id: "fallback-pep8",
    category: "Автономна порада · PEP 8",
    title: "Роби відступ у 4 пробіли",
    explanation: "Відступ після двокрапки позначає блок коду. PEP 8 радить використовувати чотири пробіли на кожному рівні.",
    codeSnippet: "for step in range(3):\n    print(step)",
  },
  {
    id: "fallback-type",
    category: "Автономна порада · Типи даних",
    title: "Перевір тип значення через type()",
    explanation: "Передай значення у type(), щоб перевірити його тип. Наприклад, число в лапках має тип str.",
    codeSnippet: "age = '14'\nprint(type(age))  # <class 'str'>",
  },
];

async function fetchJson(url, accept) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: accept },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function fetchDailyTips(url = TIPS_URL) {
  const { tips } = (await fetchJson(url, "application/json")) ?? {};
  if (!Array.isArray(tips) || tips.length === 0 || !tips.every((tip) =>
    TIP_FIELDS.every((field) => typeof tip?.[field] === "string" && tip[field].trim())
  ) || new Set(tips.map(({ id }) => id)).size !== tips.length) {
    throw new Error(t("api.invalidTips"));
  }
  return tips;
}

export async function fetchPythonRepoInfo() {
  const data = await fetchJson(REPO_API_URL, "application/vnd.github+json");
  const { stargazers_count: stars, open_issues_count: openIssues, language, html_url: htmlUrl } = data ?? {};
  if (![stars, openIssues].every((count) => Number.isSafeInteger(count) && count >= 0)
    || typeof language !== "string" || !language.trim() || htmlUrl !== REPO_PAGE) {
    throw new Error(t("api.invalidStats"));
  }
  return { stars, openIssues, language, htmlUrl };
}

export async function loadPythonTipData({ simulateError = false } = {}) {
  try {
    const [tips, repoStats] = await Promise.all([
      fetchDailyTips(simulateError ? TEST_URL : TIPS_URL),
      simulateError ? null : fetchPythonRepoInfo().catch(() => null),
    ]);
    const source = repoStats ? "online" : "partial";
    return { ok: true, sourceLabel: t(`api.source.${source}`), tips, repoStats, errorMessage: null };
  } catch (error) {
    return {
      ok: false,
      sourceLabel: t("api.source.fallback"),
      tips: FALLBACK_TIPS,
      repoStats: null,
      errorMessage: error.message,
    };
  }
}
