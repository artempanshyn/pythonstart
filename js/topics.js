import { topics } from "../data/topics.js";
import { t } from "./i18n.js";

export function getTopicById(id) {
  return topics.find((topic) => topic.id === id);
}

function normalizeSearch(text) {
  return text.normalize().toLocaleLowerCase("uk");
}

export function filterTopicsData(items, { filter = "all", searchQuery = "", completedTopics = [] } = {}) {
  if (!Array.isArray(items)) return [];

  const query = typeof searchQuery === "string" ? normalizeSearch(searchQuery.trim()) : "";
  const completed = new Set(completedTopics);
  return items.filter((topic) => {
    const isCompleted = completed.has(topic.id);
    if ((filter === "completed" && !isCompleted) || (filter === "pending" && isCompleted)) return false;
    return normalizeSearch(`${topic.title} ${topic.description}`).includes(query);
  });
}

export function renderTopicsCatalog(section, onSelectTopic) {
  const container = section.querySelector("#topics-grid");
  const search = section.querySelector("#topic-search-input");
  const filters = section.querySelector(".catalog-filters");
  const empty = section.querySelector("#catalog-empty");
  const cards = new Map();
  const document = container.ownerDocument;
  const fragment = document.createDocumentFragment();
  let progress;

  for (const topic of topics) {
    const card = document.createElement("article");
    card.className = "topic-card";

    const step = document.createElement("p");
    step.className = "topic-step";
    step.textContent = topic.stepLabel;

    const title = document.createElement("h3");
    title.textContent = topic.title;

    const description = document.createElement("p");
    description.textContent = topic.description;

    const status = document.createElement("p");
    status.className = "topic-status";
    status.textContent = t("catalog.completed");

    const link = document.createElement("a");
    link.className = "btn btn-primary";
    link.href = "#workspace";
    link.dataset.topic = topic.id;
    link.textContent = t("catalog.openTopic");
    link.setAttribute("aria-label", `${t("catalog.openTopic")} «${topic.title}»`);
    link.addEventListener("click", () => onSelectTopic(topic));

    card.append(step, title, description, status, link);
    fragment.append(card);
    cards.set(topic.id, { card, status, link });
  }

  container.replaceChildren(fragment);

  function refreshCatalog() {
    const { activeTopicId, completedTopics } = progress;
    const visibleTopics = filterTopicsData(topics, {
      filter: filters.querySelector("input:checked").value,
      searchQuery: search.value,
      completedTopics,
    });
    const visibleIds = new Set(visibleTopics.map(({ id }) => id));

    for (const [id, { card, status, link }] of cards) {
      card.hidden = !visibleIds.has(id);
      status.hidden = !completedTopics.includes(id);
      if (id === activeTopicId) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    empty.textContent = visibleIds.size ? "" : t("catalog.noMatches");
  }

  search.addEventListener("input", refreshCatalog);
  filters.addEventListener("change", refreshCatalog);
  return function updateCatalog(nextProgress) {
    progress = nextProgress;
    refreshCatalog();
  };
}
