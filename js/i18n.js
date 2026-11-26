import { messages } from "./messages.uk.js";

export function t(key) {
  return Object.hasOwn(messages, key) ? (messages[key] ?? key) : key;
}
