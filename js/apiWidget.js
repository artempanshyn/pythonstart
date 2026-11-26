import { loadPythonTipData } from "./api.js";
import { t } from "./i18n.js";

const formatCount = new Intl.NumberFormat("uk-UA");

export function initApiWidget(widget) {
  const badge = widget.querySelector("#api-source-badge");
  const banner = widget.querySelector("#api-error-banner");
  const content = widget.querySelector("#api-tip-content");
  const category = widget.querySelector("#api-tip-category");
  const title = widget.querySelector("#api-tip-title");
  const explanation = widget.querySelector("#api-tip-text");
  const code = widget.querySelector("#api-tip-code");
  const stats = widget.querySelector("#api-repo-stats");
  const repoLink = widget.querySelector("#api-repo-link");
  const next = widget.querySelector("#next-tip-btn");
  const test = widget.querySelector("#simulate-error-btn");
  let result;
  let tipIndex = 0;

  function renderTip() {
    const tip = result.tips[tipIndex];
    category.textContent = tip.category;
    title.textContent = tip.title;
    explanation.textContent = tip.explanation;
    code.textContent = tip.codeSnippet;
  }

  async function refresh(simulateError = false) {
    widget.dataset.state = "loading";
    widget.setAttribute("aria-busy", "true");
    badge.textContent = t("api.loading");
    banner.hidden = true;
    content.hidden = true;
    next.disabled = true;
    test.disabled = true;
    stats.textContent = "";

    result = await loadPythonTipData({ simulateError });
    tipIndex = 0;
    const { ok, sourceLabel, repoStats, errorMessage } = result;
    widget.dataset.state = ok ? (repoStats ? "online" : "partial") : "fallback";
    badge.textContent = sourceLabel;
    banner.textContent = ok ? "" : `${t("api.warning")} ${errorMessage}`;
    banner.hidden = ok;
    stats.textContent = repoStats
      ? `${t("api.stars")} ${formatCount.format(repoStats.stars)} · ${t("api.issues")} ${formatCount.format(repoStats.openIssues)} · ${repoStats.language}`
      : t("api.statsUnavailable");
    if (repoStats) repoLink.href = repoStats.htmlUrl;
    renderTip();
    content.hidden = false;
    next.textContent = t(ok ? "api.next" : "api.retry");
    next.disabled = false;
    test.disabled = false;
    widget.setAttribute("aria-busy", "false");
  }

  next.addEventListener("click", () => {
    if (!result.ok) {
      refresh();
      return;
    }
    tipIndex = (tipIndex + 1) % result.tips.length;
    renderTip();
  });
  test.addEventListener("click", () => refresh(true));
  refresh();
}
