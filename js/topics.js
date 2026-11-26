import { topics } from "../data/topics.js";
import { t } from "./i18n.js";

export function getTopicById(id) {
  return topics.find((topic) => topic.id === id);
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
    const searchText = `${topic.title} ${topic.description}`.normalize().toLocaleLowerCase("uk");
    cards.set(topic.id, { card, status, link, searchText });
  }

  container.replaceChildren(fragment);

  function refreshCatalog() {
    const { activeTopicId, completedTopics } = progress;
    const query = search.value.trim().normalize().toLocaleLowerCase("uk");
    const filter = filters.querySelector("input:checked").value;
    let visibleCount = 0;

    for (const [id, { card, status, link, searchText }] of cards) {
      const complete = completedTopics.includes(id);
      const matchesStatus = filter === "all" || (filter === "completed" ? complete : !complete);
      card.hidden = !searchText.includes(query) || !matchesStatus;
      if (!card.hidden) visibleCount++;
      status.hidden = !complete;
      if (id === activeTopicId) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    empty.textContent = visibleCount ? "" : t("catalog.noMatches");
  }

  search.addEventListener("input", refreshCatalog);
  filters.addEventListener("change", refreshCatalog);
  return function updateCatalog(nextProgress) {
    progress = nextProgress;
    refreshCatalog();
  };
}
