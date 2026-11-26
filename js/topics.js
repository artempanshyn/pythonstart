import { topics } from "../data/topics.js";
import { t } from "./i18n.js";

export function getTopicById(id) {
  return topics.find((topic) => topic.id === id);
}

export function renderTopicsCatalog(container, onSelectTopic) {
  const cards = new Map();
  const document = container.ownerDocument;
  const fragment = document.createDocumentFragment();

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
    cards.set(topic.id, { status, link });
  }

  container.replaceChildren(fragment);

  return function updateTopicStatuses({ activeTopicId, completedTopics }) {
    for (const [id, { status, link }] of cards) {
      status.hidden = !completedTopics.includes(id);
      if (id === activeTopicId) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
  };
}
