import { topics } from "../data/topics.js";
import { initApp } from "./app.js";
import { t } from "./i18n.js";
import { validateExerciseAnswer } from "./validation.js";

const topicLinks = [...document.querySelectorAll("[data-topic]")];
const form = document.querySelector("#exercise-form");
const answer = document.querySelector("#user-answer");
const feedback = document.querySelector("#feedback-container");
const hint = document.querySelector("#exercise-hint");
const hintButton = document.querySelector("#hint-btn");
const heading = document.querySelector("#lesson-heading");
const theory = document.querySelector("#lesson-theory");
const code = document.querySelector("#lesson-code");
const question = document.querySelector("#exercise-question");

let activeTopic = topics[0];

function setHintVisible(visible) {
  hint.hidden = !visible;
  hintButton.setAttribute("aria-expanded", String(visible));
  hintButton.textContent = t(visible ? "exercise.hideHint" : "exercise.showHint");
}

function showTopic(topic) {
  activeTopic = topic;
  heading.textContent = topic.title;
  theory.textContent = topic.theory;
  code.textContent = topic.example;
  question.textContent = topic.task;
  hint.textContent = topic.hint;

  form.reset();
  answer.removeAttribute("aria-invalid");
  feedback.textContent = "";
  delete feedback.dataset.state;
  setHintVisible(false);

  for (const link of topicLinks) {
    if (link.dataset.topic === topic.id) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  }
}

for (const link of topicLinks) {
  const topic = topics.find(({ id }) => id === link.dataset.topic);
  link.addEventListener("click", () => {
    showTopic(topic);
    heading.focus({ preventScroll: true });
  });
}

hintButton.addEventListener("click", () => setHintVisible(hint.hidden));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = validateExerciseAnswer(answer.value, activeTopic.correctAnswer);
  feedback.textContent = t(result.messageKey);
  feedback.dataset.state = result.status;
  answer.setAttribute("aria-invalid", String(!result.isCorrect));
});

showTopic(activeTopic);
initApp();
