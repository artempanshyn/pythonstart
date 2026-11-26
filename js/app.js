import { t } from "./i18n.js";
import { loadProgress, markTopicAsCompleted, resetProgress, saveProgress } from "./storage.js";
import { getTopicById, renderTopicsCatalog } from "./topics.js";
import { validateExerciseAnswer } from "./validation.js";
import { createWorkspace } from "./workspace.js";
import { topics } from "../data/topics.js";
import { initApiWidget } from "./apiWidget.js";

export const APP_CONFIG = {
  appName: "PythonStart",
  version: "1.0.0-mvp",
  defaultLocale: "uk",
};

export function initApp(root = document) {
  const feedback = root.querySelector("#feedback-container");
  const counter = root.querySelector("#progress-counter");
  const resetButton = root.querySelector("#reset-progress-btn");
  const resetDialog = root.querySelector("#reset-progress-dialog");
  const resetFeedback = root.querySelector("#progress-reset-feedback");
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
    showLesson(topic, true);
  }

  function showLesson(topic, focus = false) {
    showTopic(topic, focus);
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

  const updateCatalog = renderTopicsCatalog(root.querySelector("#catalog"), selectTopic);
  const showTopic = createWorkspace(root.querySelector("#workspace"), checkAnswer);
  showLesson(getTopicById(progress.activeTopicId));
  refreshProgress();

  resetButton.addEventListener("click", () => {
    resetFeedback.textContent = "";
    resetDialog.showModal();
  });

  resetDialog.querySelector("form").addEventListener("submit", (event) => {
    if (event.submitter?.value !== "reset") return;
    if (!resetProgress()) {
      resetFeedback.textContent = t("progress.resetFailed");
      return;
    }

    progress = loadProgress();
    saved = true;
    refreshProgress();
    showLesson(getTopicById(progress.activeTopicId));
    resetFeedback.textContent = t("progress.resetDone");
  });

  initApiWidget(root.querySelector("#api-explorer"));
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => initApp());
