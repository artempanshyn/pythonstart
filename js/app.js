import { t } from "./i18n.js";
import { loadProgress, markTopicAsCompleted, saveProgress } from "./storage.js";
import { getTopicById, renderTopicsCatalog } from "./topics.js";
import { validateExerciseAnswer } from "./validation.js";
import { createWorkspace } from "./workspace.js";
import { topics } from "../data/topics.js";

export const APP_CONFIG = {
  appName: "PythonStart",
  version: "1.0.0-mvp",
  defaultLocale: "uk",
};

export function initApp(root = document) {
  const feedback = root.querySelector("#feedback-container");
  const counter = root.querySelector("#progress-counter");
  let progress = loadProgress();
  let saved = true;

  function refreshProgress() {
    const { completedTopics, totalScore } = progress;
    const status = `${completedTopics.length} / ${topics.length} (${totalScore} ${t("progress.points")})`;
    counter.textContent = saved ? status : `${status} · ${t("progress.unsaved")}`;
    updateCatalog(progress);
  }

  function persist(nextProgress) {
    if (nextProgress === progress && saved) return;
    progress = nextProgress;
    saved = saveProgress(progress);
    refreshProgress();
  }

  function selectTopic(topic) {
    const nextProgress = progress.activeTopicId === topic.id
      ? progress
      : { ...progress, activeTopicId: topic.id };
    persist(nextProgress);
    showTopic(topic, true);
    feedback.textContent = "";
    delete feedback.dataset.state;
  }

  function checkAnswer(value, topic) {
    const result = validateExerciseAnswer(value, topic.correctAnswer);
    feedback.textContent = t(result.messageKey);
    feedback.dataset.state = result.status;
    if (result.isCorrect) persist(markTopicAsCompleted(progress, topic.id));
    return result;
  }

  const updateCatalog = renderTopicsCatalog(root.querySelector("#topics-grid"), selectTopic);
  const showTopic = createWorkspace(root.querySelector("#workspace"), checkAnswer);
  showTopic(getTopicById(progress.activeTopicId));
  refreshProgress();
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => initApp());
