import { t } from "./i18n.js";

export function createWorkspace(section, onSubmitAnswer) {
  const heading = section.querySelector("#lesson-heading");
  const theory = section.querySelector("#lesson-theory");
  const example = section.querySelector("#lesson-code");
  const tip = section.querySelector("#lesson-tip");
  const question = section.querySelector("#exercise-question");
  const form = section.querySelector("#exercise-form");
  const answer = section.querySelector("#user-answer");
  const hint = section.querySelector("#exercise-hint");
  const hintButton = section.querySelector("#hint-btn");
  let topic;

  function setHintVisible(visible) {
    hint.hidden = !visible;
    hintButton.setAttribute("aria-expanded", String(visible));
    hintButton.textContent = t(visible ? "exercise.hideHint" : "exercise.showHint");
  }

  hintButton.addEventListener("click", () => setHintVisible(hint.hidden));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = onSubmitAnswer(answer.value, topic);
    answer.setAttribute("aria-invalid", String(!result.isCorrect));
  });

  answer.addEventListener("input", () => answer.removeAttribute("aria-invalid"));

  return function showTopic(nextTopic, focus = false) {
    topic = nextTopic;
    heading.textContent = topic.title;
    theory.textContent = topic.theory;
    example.textContent = topic.codeExample;
    tip.textContent = topic.tip;
    question.textContent = topic.task;
    hint.textContent = topic.hint;
    form.reset();
    answer.removeAttribute("aria-invalid");
    setHintVisible(false);
    if (focus) heading.focus({ preventScroll: true });
  };
}
