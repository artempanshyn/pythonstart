import { topics } from "../data/topics.js";

export const STORAGE_KEY = "pythonstart_progress_v1";
const POINTS_PER_TOPIC = 10;
const topicIds = new Set(topics.map(({ id }) => id));

function normalizeProgress(value) {
  const entries = Array.isArray(value?.completedTopics) ? value.completedTopics : [];
  const completedTopics = [...new Set(entries.filter((id) => topicIds.has(id)))];

  return {
    completedTopics,
    activeTopicId: topicIds.has(value?.activeTopicId) ? value.activeTopicId : topics[0].id,
    totalScore: completedTopics.length * POINTS_PER_TOPIC,
  };
}

export function loadProgress(storage) {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(STORAGE_KEY);
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return normalizeProgress();
  }
}

export function saveProgress(progress, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function markTopicAsCompleted(progress, topicId) {
  if (!topicIds.has(topicId) || progress.completedTopics.includes(topicId)) return progress;

  return {
    ...progress,
    completedTopics: [...progress.completedTopics, topicId],
    totalScore: progress.totalScore + POINTS_PER_TOPIC,
  };
}

export function resetProgress(storage) {
  try {
    (storage ?? globalThis.localStorage).removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
